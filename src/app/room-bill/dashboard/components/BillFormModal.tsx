"use client";

import { useState } from "react";
import { createBill, getLatestBill } from "@/lib/services";
import type { Bill, BillFormData } from "@/lib/types";
import ModalOverlay from "@/components/ModalOverlay";
import BillFormFields from "./BillFormFields";

interface BillFormModalProps {
  bills: Bill[];
  onClose: () => void;
  onCreated: () => void;
}

export default function BillFormModal({ bills, onClose, onCreated }: BillFormModalProps) {
  const now = new Date();
  const [formData, setFormData] = useState<BillFormData>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    billDate: now.toISOString().split("T")[0],
    currentElectric: 0,
    previousElectric: 0,
    currentWater: 0,
    previousWater: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAutoFill = async () => {
    try {
      const latest = await getLatestBill();
      if (latest) {
        setFormData((prev) => ({
          ...prev,
          previousElectric: latest.currentElectric,
          previousWater: latest.currentWater,
        }));
      }
    } catch (err) {
      console.error("Error fetching latest bill:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.currentElectric < formData.previousElectric) {
      setError("Số điện hiện tại phải lớn hơn số cũ");
      return;
    }
    if (formData.currentWater < formData.previousWater) {
      setError("Số nước hiện tại phải lớn hơn số cũ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createBill(formData);
      onCreated();
    } catch (err) {
      console.error("Error creating bill:", err);
      setError("Không thể tạo hóa đơn. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof BillFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="p-2 bg-blue-50 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Tạo hóa đơn mới
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <BillFormFields
          formData={formData}
          onChange={handleChange}
          onAutoFill={handleAutoFill}
          accentColor="blue"
        />

        {error ? (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex gap-2 items-center">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-bold bg-bill-primary text-white hover:bg-bill-primary-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex justify-center items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </>
          ) : (
            "Tạo hóa đơn"
          )}
        </button>
      </form>
    </ModalOverlay>
  );
}
