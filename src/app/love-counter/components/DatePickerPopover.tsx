"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
  isToday,
} from "date-fns";
import { vi } from "date-fns/locale";

interface DatePickerPopoverProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export default function DatePickerPopover({
  currentDate,
  onSelect,
  onClose,
}: DatePickerPopoverProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start so Sunday=0 aligns
  const startDayOfWeek = getDay(monthStart); // 0=Sun
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="absolute z-50 top-full mt-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-pink-100 p-5 w-[320px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-love-pink transition-colors cursor-pointer"
          >
            ←
          </button>
          <h4 className="font-semibold text-love-brown">
            {format(viewDate, "MMMM yyyy", { locale: vi })}
          </h4>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-love-pink transition-colors cursor-pointer"
          >
            →
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-love-brown/50 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const selected = isSameDay(day, currentDate);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelect(day)}
                className={`w-9 h-9 rounded-full text-sm flex items-center justify-center transition-all cursor-pointer
                  ${
                    selected
                      ? "bg-love-pink text-white font-bold shadow-md"
                      : today
                      ? "bg-pink-50 text-love-pink font-semibold"
                      : "text-love-brown hover:bg-pink-50"
                  }
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-full bg-pink-50 text-love-pink text-sm font-medium hover:bg-pink-100 transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </motion.div>
    </>
  );
}
