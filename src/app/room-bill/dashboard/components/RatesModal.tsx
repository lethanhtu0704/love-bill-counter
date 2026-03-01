"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateRates } from "@/lib/services";
import type { Rates, RatesFormData } from "@/lib/types";

interface RatesModalProps {
  rates: Rates;
  onClose: () => void;
  onUpdated: () => void;
}

export default function RatesModal({ rates, onClose, onUpdated }: RatesModalProps) {
  const [formData, setFormData] = useState<RatesFormData>({
    electricPrice: rates.electricPrice,
    waterPrice: rates.waterPrice,
    baseRent: rates.baseRent,
    wifiPrice: rates.wifiPrice,
    garbagePrice: rates.garbagePrice,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateRates(formData);
      onUpdated();
    } catch (err) {
      console.error("Error updating rates:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof RatesFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fields: { key: keyof RatesFormData; label: string; unit: string }[] = [
    { key: "baseRent", label: "Tiền phòng cơ bản", unit: "VND/tháng" },
    { key: "electricPrice", label: "Giá điện", unit: "VND/kWh" },
    { key: "waterPrice", label: "Giá nước", unit: "VND/m³" },
    { key: "wifiPrice", label: "Giá Wifi", unit: "VND/tháng" },
    { key: "garbagePrice", label: "Giá rác", unit: "VND/tháng" },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-8 rounded-2xl w-full max-w-[480px] shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <span className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Cài đặt giá dịch vụ
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 flex gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thay đổi giá sẽ chỉ áp dụng cho hóa đơn mới. Hóa đơn cũ đã tạo vẫn giữ nguyên giá lúc tạo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {fields.map(({ key, label, unit }) => (
            <div key={key} className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 group-focus-within:text-bill-primary transition-colors">
                {label} <span className="text-gray-400 font-normal">({unit})</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData[key]}
                  onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:bg-white focus:border-bill-primary focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-semibold bg-bill-primary text-white hover:bg-bill-primary-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex justify-center items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
