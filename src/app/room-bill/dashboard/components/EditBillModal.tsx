"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateBill } from "@/lib/services";
import type { Bill, BillFormData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface EditBillModalProps {
  bill: Bill;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditBillModal({ bill, onClose, onUpdated }: EditBillModalProps) {
  const [formData, setFormData] = useState<BillFormData>({
    month: bill.month,
    year: bill.year,
    billDate: new Date(bill.billDate).toISOString().split("T")[0],
    currentElectric: bill.currentElectric,
    previousElectric: bill.previousElectric,
    currentWater: bill.currentWater,
    previousWater: bill.previousWater,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      await updateBill(bill.id, formData);
      onUpdated();
    } catch (err) {
      console.error("Error updating bill:", err);
      setError("Không thể cập nhật hóa đơn. Vui lòng thử lại.");
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
        className="bg-white p-6 rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800 leading-tight">Sửa hóa đơn</h2>
                <p className="text-sm text-gray-500">Tháng {bill.month}/{bill.year}</p>
             </div>
          </div>
          <button
            onClick={onClose}
             className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tháng
              </label>
              <div className="relative">
                <select
                  value={formData.month}
                  onChange={(e) => handleChange("month", parseInt(e.target.value))}
                   className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
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
                 className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
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
               className="w-70 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-yellow-500">⚡</span> Chỉ số điện
                </h3>
             </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Số cũ</label>
                <input
                  type="number"
                  value={formData.previousElectric}
                  onChange={(e) => handleChange("previousElectric", parseInt(e.target.value) || 0)}
                   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Số mới</label>
                <input
                  type="number"
                  value={formData.currentElectric}
                  onChange={(e) => handleChange("currentElectric", parseInt(e.target.value) || 0)}
                   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
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
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Số cũ</label>
                <input
                  type="number"
                  value={formData.previousWater}
                  onChange={(e) => handleChange("previousWater", parseInt(e.target.value) || 0)}
                   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Số mới</label>
                <input
                  type="number"
                  value={formData.currentWater}
                  onChange={(e) => handleChange("currentWater", parseInt(e.target.value) || 0)}
                   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all font-medium"
                />
              </div>
            </div>
          </div>

           <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
                <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
               Giá dịch vụ lúc tạo (không thay đổi):
             </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <p>Điện: <span className="font-medium text-gray-900">{formatCurrency(bill.electricPrice)}/kWh</span></p>
                <p>Nước: <span className="font-medium text-gray-900">{formatCurrency(bill.waterPrice)}/m³</span></p>
                <p>Phòng: <span className="font-medium text-gray-900">{formatCurrency(bill.baseRent)}</span></p>
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
            className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl transform active:scale-[0.99] flex justify-center items-center gap-2 mt-2"
          >
            {submitting ? (
                 <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang cập nhật... 
                 </>
              ) : (
                "Cập nhật hóa đơn"
              )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
