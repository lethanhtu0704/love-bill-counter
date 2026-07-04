"use client";

import { useState, useEffect } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
  differenceInSeconds,
} from "date-fns";
import type { TimeFormat } from "@/lib/constants";

interface TimeCounterProps {
  startDate: Date;
  format: TimeFormat;
}

function getTimeParts(start: Date, now: Date) {
  const years = differenceInYears(now, start);
  const months = differenceInMonths(now, start) % 12;
  const totalDays = differenceInDays(now, start);

  // Calculate remaining days after months
  const afterMonths = new Date(start);
  afterMonths.setFullYear(afterMonths.getFullYear() + years);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  const days = differenceInDays(now, afterMonths);

  const hours = differenceInHours(now, start) % 24;
  const minutes = differenceInMinutes(now, start) % 60;
  const seconds = differenceInSeconds(now, start) % 60;

  return { years, months, days, totalDays, hours, minutes, seconds };
}

export default function TimeCounter({ startDate, format }: TimeCounterProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Only the "full" format displays seconds — the others change at most daily,
    // so a slower tick avoids waking the CPU every second on the phone.
    const ms = format === "full" ? 1000 : 60_000;
    const interval = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(interval);
  }, [format]);

  const parts = getTimeParts(startDate, now);

  const renderCounter = () => {
    switch (format) {
      case "days":
        return (
          <span className="text-5xl md:text-[5rem]">{parts.totalDays} Ngày</span>
        );
      case "months-days":
        return (
          <span className="text-4xl md:text-[4rem]">
            {parts.years * 12 + parts.months} Tháng {parts.days} Ngày
          </span>
        );
      case "full":
      default:
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl md:text-[5rem] leading-tight">
              {parts.totalDays} Ngày
            </span>
            <div className="flex gap-3 text-lg md:text-2xl text-love-pink/80 font-normal">
              {parts.years > 0 && <span>{parts.years} năm</span>}
              {parts.months > 0 && <span>{parts.months} tháng</span>}
              <span>{parts.days} ngày</span>
            </div>
            <div className="flex gap-2 text-base md:text-lg text-love-brown/60 font-normal font-[family-name:var(--font-inter)]">
              <span>{String(parts.hours).padStart(2, "0")}h</span>
              <span>:</span>
              <span>{String(parts.minutes).padStart(2, "0")}m</span>
              <span>:</span>
              <span>{String(parts.seconds).padStart(2, "0")}s</span>
            </div>
          </div>
        );
    }
  };

  return (
    <h1 className="animate-fade-in-up font-[family-name:var(--font-playfair)] font-bold text-love-brown drop-shadow-[2px_2px_4px_rgba(255,255,255,0.5)] dark:drop-shadow-[2px_2px_6px_rgba(0,0,0,0.7)] mb-2.5 z-10">
      {/* key remounts on format change so the entrance animation replays */}
      <div key={format} className="animate-fade-in-scale">
        {renderCounter()}
      </div>
    </h1>
  );
}
