"use client";

import type { BillFormData } from "@/lib/types";

interface BillFormFieldsProps {
  formData: BillFormData;
  onChange: (field: keyof BillFormData, value: string | number) => void;
  onAutoFill?: () => void;
  accentColor?: "blue" | "purple";
}

export default function BillFormFields({
  formData,
  onChange,
  onAutoFill,
  accentColor = "blue",
}: BillFormFieldsProps) {
  const focusRing =
    accentColor === "purple"
      ? "focus:border-purple-500 focus:ring-4 focus:ring-purple-50"
      : "focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tháng
          </label>
          <div className="relative">
            <select
              value={formData.month}
              onChange={(e) => onChange("month", parseInt(e.target.value))}
              className={`w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:bg-white transition-all font-medium ${focusRing}`}
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
            onChange={(e) => onChange("year", parseInt(e.target.value))}
            className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
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
          onChange={(e) => onChange("billDate", e.target.value)}
          className={`w-70 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-yellow-500">⚡</span> Chỉ số điện
          </h3>
          {onAutoFill ? (
            <button
              type="button"
              onClick={onAutoFill}
              className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              Tự động điền số cũ
            </button>
          ) : null}
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
              onChange={(e) => onChange("previousElectric", e.target.value === "" ? "" as unknown as number : Number(e.target.value))}
              className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
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
              onChange={(e) => onChange("currentElectric", e.target.value === "" ? "" as unknown as number : Number(e.target.value))}
              className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
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
              value={formData.previousWater}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onChange("previousWater", e.target.value === "" ? "" as unknown as number : Number(e.target.value))}
              className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
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
              onChange={(e) => onChange("currentWater", e.target.value === "" ? "" as unknown as number : Number(e.target.value))}
              className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white transition-all font-medium ${focusRing}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
