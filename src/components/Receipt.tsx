"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Bill } from "@/lib/types";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

interface ReceiptProps {
  bill: Bill;
}

export default function Receipt({ bill }: ReceiptProps) {
  const billDate = new Date(bill.billDate);

  return (
    <div
      className="relative"
    >
      <div className="p-6 font-[family-name:var(--font-inter)] text-sm text-[#333]" style={{ fontFamily: "'Roboto Mono', monospace" }}>
        <div className="flex flex-col gap-2">
          {/* Title */}
          <h3 className="text-center font-medium mb-2 text-base">
            Hóa Đơn Tiền Phòng
          </h3>

          <div className="text-center text-[#aaa] tracking-[-2px] overflow-hidden whitespace-nowrap">
            --------------------------------
          </div>

          {/* Month / Date */}
          <div className="flex justify-between">
            <span>Tháng:</span>
            <span>{formatMonthYear(bill.month, bill.year)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ngày:</span>
            <span>{format(billDate, "dd/MM/yyyy", { locale: vi })}</span>
          </div>

          <div className="text-center text-[#aaa] tracking-[-2px] overflow-hidden whitespace-nowrap">
            --------------------------------
          </div>

          {/* Base Rent */}
          <div className="flex justify-between font-semibold">
            <span>Tiền phòng:</span>
            <span>{formatCurrency(bill.baseRent)}</span>
          </div>

          {/* Electric */}
          <div className="my-2">
            <div className="font-medium">Điện:</div>
            <div className="flex justify-between mt-1">
              <span>
                ({bill.currentElectric} - {bill.previousElectric}) × {bill.electricPrice.toLocaleString()}
              </span>
              <span>{formatCurrency(bill.electricTotal)}</span>
            </div>
          </div>

          {/* Water */}
          <div className="my-2">
            <div className="font-medium">Nước:</div>
            <div className="flex justify-between mt-1">
              <span>
                ({bill.currentWater} - {bill.previousWater}) × {bill.waterPrice.toLocaleString()}
              </span>
              <span>{formatCurrency(bill.waterTotal)}</span>
            </div>
          </div>

          {/* Wifi */}
          <div className="my-2">
            <div className="font-medium">Wifi:</div>
            <div className="flex justify-between mt-1">
              <span>Cố định</span>
              <span>{formatCurrency(bill.wifiPrice)}</span>
            </div>
          </div>

          {/* Garbage */}
          <div className="my-2">
            <div className="font-medium">Rác:</div>
            <div className="flex justify-between mt-1">
              <span>Cố định</span>
              <span>{formatCurrency(bill.garbagePrice)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between font-bold text-base mt-2 border-t border-dashed border-[#ccc] pt-2">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(bill.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
