"use client";

import { useMemo, useState } from "react";

import BottomSheet from "./BottomSheet";
import Toggle from "./Toggle";
import { CARD, PINK_GRADIENT } from "./ui";
import { WEEKDAY_NAMES, lunarOf, weekday, type Ymd } from "@/lib/calendar";
import { dayCanChi, getLeapMonth, lunarToSolar, yearCanChi } from "@/lib/lunar";

type Mode = "solar" | "lunar";

interface ConvertSheetProps {
  initial: Ymd;
  onClose: () => void;
  onJump: (date: Ymd) => void;
}

function isValidSolar(d: number, m: number, y: number): boolean {
  if (!d || !m || !y || y < 1900 || y > 2199 || m < 1 || m > 12 || d < 1) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCDate() === d && t.getUTCMonth() === m - 1;
}

export default function ConvertSheet({ initial, onClose, onJump }: ConvertSheetProps) {
  const [mode, setMode] = useState<Mode>("solar");
  const [day, setDay] = useState(String(initial.d));
  const [month, setMonth] = useState(String(initial.m));
  const [year, setYear] = useState(String(initial.y));
  const [leap, setLeap] = useState(false);

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  const leapMonth = useMemo(
    () => (mode === "lunar" && y >= 1900 && y <= 2199 ? getLeapMonth(y) : 0),
    [mode, y]
  );
  const canLeap = leapMonth > 0 && leapMonth === m;

  const result = useMemo(() => {
    if (mode === "solar") {
      if (!isValidSolar(d, m, y)) return null;
      const lunar = lunarOf({ y, m, d });
      return {
        caption: `Ngày ${d}/${m}/${y} dương lịch là`,
        main: `${lunar.day} tháng ${lunar.month}${lunar.leap ? " nhuận" : ""} ÂL`,
        sub: `Năm ${yearCanChi(lunar.year)} · ngày ${dayCanChi(d, m, y)}`,
        solar: { y, m, d } as Ymd,
      };
    }
    if (!d || !m || !y || y < 1900 || y > 2199 || m < 1 || m > 12 || d < 1 || d > 30) return null;
    const s = lunarToSolar(d, m, y, canLeap && leap);
    if (!s) return null;
    const solar: Ymd = { y: s.year, m: s.month, d: s.day };
    return {
      caption: `Ngày ${d}/${m}${canLeap && leap ? " nhuận" : ""}/${y} âm lịch là`,
      main: `${WEEKDAY_NAMES[weekday(solar)]}, ${s.day}/${s.month}/${s.year}`,
      sub: `Năm ${yearCanChi(y)} · ngày ${dayCanChi(s.day, s.month, s.year)}`,
      solar,
    };
  }, [mode, d, m, y, leap, canLeap]);

  const fields: { value: string; set: (v: string) => void; label: string; max: number }[] = [
    { value: day, set: setDay, label: "Ngày", max: 31 },
    { value: month, set: setMonth, label: "Tháng", max: 12 },
    { value: year, set: setYear, label: "Năm", max: 2199 },
  ];

  return (
    <BottomSheet onClose={onClose}>
      <h3 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-bold text-bill-text-dark">
        Đổi ngày nhanh
      </h3>

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-love-pink/10 p-1">
        {(
          [
            ["solar", "Dương → Âm"],
            ["lunar", "Âm → Dương"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-xl py-2 text-sm font-medium transition ${
              mode === value
                ? "bg-white text-love-pink shadow-sm"
                : "text-love-brown/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
        {fields.map((f) => (
          <label key={f.label} className="text-center">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={f.max}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-bill-border bg-white py-3 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] text-base font-semibold text-bill-text-dark outline-none focus:border-love-pink/50"
            />
            <span className="mt-1 block text-xs text-love-brown/70">{f.label}</span>
          </label>
        ))}
      </div>

      {canLeap && (
        <button
          type="button"
          onClick={() => setLeap((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-bill-text-dark">
            Tháng {leapMonth} nhuận
          </span>
          <Toggle on={leap} color="pink" />
        </button>
      )}

      <div
        className={`${CARD} mt-4 bg-linear-to-br from-white to-[#fdf0f4] dark:from-[#2d2421] px-4 py-5 text-center dark:to-[#3a262d]`}
      >
        {result ? (
          <>
            <p className="text-xs text-love-brown/80">{result.caption}</p>
            <p className="my-1 font-[family-name:var(--font-playfair)] text-2xl font-bold text-love-pink">
              {result.main}
            </p>
            <p className="text-sm text-love-brown">{result.sub}</p>
            <button
              type="button"
              onClick={() => {
                onJump(result.solar);
                onClose();
              }}
              className="mt-2 text-xs font-semibold text-love-pink underline-offset-2 hover:underline"
            >
              Xem trên lịch →
            </button>
          </>
        ) : (
          <p className="py-3 text-sm text-love-brown/80">Ngày không hợp lệ</p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className={`${PINK_GRADIENT} mt-4 w-full rounded-2xl py-3 font-semibold shadow-md transition active:scale-[0.98]`}
      >
        Đóng
      </button>
    </BottomSheet>
  );
}
