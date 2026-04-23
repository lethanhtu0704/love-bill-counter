"use client";

import type { Bill } from "@/lib/types";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

interface BillCardListProps {
  bills: Bill[];
  onView: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
}

function getPrevMonthBill(bill: Bill, allBills: Bill[]): Bill | null {
  const prevMonth = bill.month === 1 ? 12 : bill.month - 1;
  const prevYear = bill.month === 1 ? bill.year - 1 : bill.year;
  return allBills.find((b) => b.month === prevMonth && b.year === prevYear) ?? null;
}

export default function BillCardList({ bills, onView, onEdit, onDelete }: BillCardListProps) {
  const now = new Date();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {bills.map((bill) => {
        const prevBill = getPrevMonthBill(bill, bills);
        const changePct = prevBill
          ? ((bill.totalAmount - prevBill.totalAmount) / prevBill.totalAmount) * 100
          : null;
        const isCurrentMonth =
          bill.month === now.getMonth() + 1 && bill.year === now.getFullYear();

        return (
          <div
            key={bill.id}
            className="group relative bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Hóa đơn tháng
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-lg font-bold text-gray-900">
                    {formatMonthYear(bill.month, bill.year)}
                  </div>
                  {isCurrentMonth && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 uppercase tracking-wide leading-none">
                      Tháng hiện tại
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(bill)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(bill)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {changePct !== null && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${
                      changePct >= 0
                        ? "text-rose-600 bg-rose-50"
                        : "text-emerald-600 bg-emerald-50"
                    }`}
                  >
                    {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
              <div>
                <div className="text-xs text-gray-500 mb-1">Tổng cộng</div>
                <div className="text-xl font-bold text-bill-primary">
                  {formatCurrency(bill.totalAmount)}
                </div>
              </div>
              <button
                onClick={() => onView(bill)}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Xem chi tiết
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
