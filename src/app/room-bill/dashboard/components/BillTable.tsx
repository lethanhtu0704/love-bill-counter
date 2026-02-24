"use client";

import type { Bill } from "@/lib/types";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

interface BillTableProps {
  bills: Bill[];
  onView: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

export default function BillTable({ bills, onView, onEdit, onDelete }: BillTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Thời gian
              </th>
              <th className="p-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Tổng tiền
              </th>
              <th className="p-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">
                Thao tác
              </th>
              <th className="p-4 px-6 border-b border-gray-100 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-4 px-6">
                  <div className="font-medium text-gray-900">{formatMonthYear(bill.month, bill.year)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">ID: {bill.id.slice(0, 8)}</div>
                </td>
                <td className="p-4 px-6">
                  <span className="font-bold text-bill-primary bg-blue-50 px-2.5 py-1 rounded-md text-sm">
                    {formatCurrency(bill.totalAmount)}
                  </span>
                </td>
                <td className="p-4 px-6">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onEdit(bill)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(bill)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="p-4 px-6 text-right">
                  <button
                    onClick={() => onView(bill)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-bill-primary hover:text-white transition-all shadow-sm"
                  >
                    Chi tiết
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
