"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createBill, getLatestBill } from "@/lib/services";
import type { Bill, BillFormData } from "@/lib/types";

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
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-6 rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tháng
              </label>
              <div className="relative">
                <select
                  value={formData.month}
                  onChange={(e) => handleChange("month", parseInt(e.target.value))}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Năm
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ngày lập hóa đơn
            </label>
            <input
              type="date"
              value={formData.billDate}
              onChange={(e) => handleChange("billDate", e.target.value)}
              className="w-70 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-yellow-500">⚡</span> Chỉ số điện
              </h3>
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                Tự động điền số cũ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Số cũ
                </label>
                <input
                  type="number"
                  value={formData.previousElectric}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleChange("previousElectric", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Số mới
                </label>
                <input
                  type="number"
                  value={formData.currentElectric}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleChange("currentElectric", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-blue-500">💧</span> Chỉ số nước
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Số cũ
                </label>
                <input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  value={formData.previousWater}
                  onChange={(e) => handleChange("previousWater", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Số mới
                </label>
                <input
                  type="number"
                  value={formData.currentWater}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleChange("currentWater", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex gap-2 items-center">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl transform active:scale-[0.99] mt-2 flex justify-center items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              "Tạo hóa đơn"
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
