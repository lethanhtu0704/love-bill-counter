"use client";

import { memo, useMemo } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import {
  EVENT_TYPE_MAP,
  addDays,
  eventsOn,
  holidayOf,
  isVegDay,
  lunarOf,
  toKey,
  weekday,
  type Ymd,
} from "@/lib/calendar";
import { yearCanChi } from "@/lib/lunar";
import type { CalendarEvent, VegSettings } from "@/lib/types";

import { CARD, PINK_GRADIENT, VEG_CELL, VEG_TEXT } from "./ui";

const HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

interface MonthGridProps {
  year: number;
  month: number; // 1-12
  today: Ymd;
  selected: Ymd;
  events: CalendarEvent[];
  veg: VegSettings;
  onSelect: (date: Ymd) => void;
  onPrev: () => void;
  onNext: () => void;
}

function MonthGrid({
  year,
  month,
  today,
  selected,
  events,
  veg,
  onSelect,
  onPrev,
  onNext,
}: MonthGridProps) {
  const cells = useMemo(() => {
    const first: Ymd = { y: year, m: month, d: 1 };
    const offset = (weekday(first) + 6) % 7; // Monday-first
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i);
      const lunar = lunarOf(date);
      return {
        date,
        key: toKey(date),
        lunar,
        inMonth: date.m === month,
        veg: isVegDay(lunar, veg),
        holiday: holidayOf(date, lunar),
        dots: eventsOn(events, date, lunar)
          .slice(0, 3)
          .map((e) => EVENT_TYPE_MAP[e.type]?.color ?? "#999"),
      };
    });
  }, [year, month, events, veg]);

  const midLunar = lunarOf({ y: year, m: month, d: 15 });
  const todayKey = toKey(today);
  const selectedKey = toKey(selected);

  return (
    <section className={`${CARD} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Tháng trước"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-love-pink/10 text-love-pink transition active:scale-90"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bill-text-dark">
            Tháng {month} {year}
          </h2>
          <p className="text-xs text-love-brown/80">
            Tháng {midLunar.month}
            {midLunar.leap ? " nhuận" : ""} năm {yearCanChi(midLunar.year)}
          </p>
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label="Tháng sau"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-love-pink/10 text-love-pink transition active:scale-90"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {HEADERS.map((h) => (
          <div
            key={h}
            className={`py-1 text-[11px] font-semibold ${
              h === "CN" ? "text-love-pink" : "text-love-brown/70"
            }`}
          >
            {h}
          </div>
        ))}

        {cells.map((c) => {
          const isSelected = c.key === selectedKey;
          const isToday = c.key === todayKey;
          const lunarLabel =
            c.lunar.day === 1
              ? `1/${c.lunar.month}${c.lunar.leap ? "N" : ""}`
              : String(c.lunar.day);

          let box = "border border-transparent";
          if (isSelected) box = `${PINK_GRADIENT} shadow-md shadow-[#8e2452]/30`;
          else if (c.veg && c.inMonth) box = VEG_CELL;
          else if (isToday) box = "border border-love-pink/60";

          let solarColor = "text-bill-text-dark";
          if (isSelected) solarColor = "text-white";
          else if (!c.inMonth) solarColor = "text-gray-300";
          else if (c.holiday) solarColor = "text-[#c07a2c]";

          let lunarColor = "text-love-brown/70";
          if (isSelected) lunarColor = "text-white/85";
          else if (!c.inMonth) lunarColor = "text-gray-300";
          else if (c.veg) lunarColor = VEG_TEXT;

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.date)}
              title={c.holiday ?? undefined}
              className={`relative flex h-12 flex-col items-center justify-center rounded-xl transition active:scale-95 ${box}`}
            >
              <span className={`text-[15px] font-semibold leading-none ${solarColor}`}>
                {c.date.d}
              </span>
              <span className={`mt-1 text-[10px] leading-none ${lunarColor}`}>
                {lunarLabel}
              </span>
              {c.dots.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {c.dots.map((color, i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: isSelected ? "#fff" : color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(MonthGrid);
