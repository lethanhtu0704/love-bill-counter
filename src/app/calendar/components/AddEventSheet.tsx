"use client";

import { useState } from "react";

import BottomSheet from "./BottomSheet";
import Toggle from "./Toggle";
import { CHIP_BASE, CHIP_IDLE, PINK_GRADIENT, SECTION_LABEL } from "./ui";
import { EVENT_TYPES, REMIND_OPTIONS, toKey, type Ymd } from "@/lib/calendar";
import type { LunarDate } from "@/lib/lunar";
import { ensureFcmToken } from "@/lib/push";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";

interface AddEventSheetProps {
  date: Ymd;
  lunar: LunarDate;
  onClose: () => void;
  onSave: (data: Omit<CalendarEvent, "id" | "createdAt">) => Promise<void>;
}

export default function AddEventSheet({
  date,
  lunar,
  onClose,
  onSave,
}: AddEventSheetProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEventType>("personal");
  const [remindDays, setRemindDays] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickType = (value: CalendarEventType) => {
    setType(value);
    // Giỗ is almost always a yearly lunar anniversary
    if (value === "memorial") setYearly(true);
  };

  const pickRemind = (value: number) => {
    setRemindDays(value);
    // Register this device for pushes from the user gesture (iOS requirement)
    if (value > 0) void ensureFcmToken().catch(() => null);
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Nhập tên sự kiện nhé");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: trimmed,
        type,
        date: toKey(date),
        lunarDay: lunar.day,
        lunarMonth: lunar.month,
        lunarLeap: lunar.leap,
        repeat: yearly ? "lunar-yearly" : "none",
        remindDays,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Không lưu được, thử lại nhé");
      setSaving(false);
    }
  };

  return (
    <BottomSheet onClose={onClose}>
      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bill-text-dark">
        Thêm sự kiện
      </h3>
      <p className="mb-4 text-sm text-love-brown/80">
        {date.d}/{date.m}/{date.y} · {lunar.day}/{lunar.month}
        {lunar.leap ? " nhuận" : ""} ÂL
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tên sự kiện"
        autoFocus
        className="w-full rounded-2xl border border-bill-border bg-white px-4 py-3 text-base text-bill-text-dark outline-none placeholder:text-gray-400 focus:border-love-pink/50"
      />

      <p className={`${SECTION_LABEL} mb-2 mt-4`}>Loại sự kiện</p>
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => pickType(t.value)}
              className={`${CHIP_BASE} flex items-center gap-1.5 ${
                active ? PINK_GRADIENT : CHIP_IDLE
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? "#fff" : t.color }}
              />
              {t.label}
            </button>
          );
        })}
      </div>

      <p className={`${SECTION_LABEL} mb-2 mt-4`}>Nhắc trước</p>
      <div className="flex flex-wrap gap-2">
        {REMIND_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => pickRemind(o.value)}
            className={`${CHIP_BASE} ${
              o.value === remindDays ? PINK_GRADIENT : CHIP_IDLE
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setYearly((v) => !v)}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-bill-text-dark">
            Lặp hằng năm (âm lịch)
          </span>
          <span className="block text-xs text-love-brown/70">
            Mỗi năm vào ngày {lunar.day}/{lunar.month} ÂL — hợp cho giỗ, sinh nhật âm
          </span>
        </span>
        <Toggle on={yearly} color="pink" />
      </button>

      <p className={`${SECTION_LABEL} mb-2 mt-4`}>Ghi chú</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú thêm..."
        rows={3}
        className="w-full resize-none rounded-2xl border border-bill-border bg-white px-4 py-3 text-base text-bill-text-dark outline-none placeholder:text-gray-400 focus:border-love-pink/50"
      />

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-5 grid grid-cols-[1fr_1.5fr] gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-bill-border bg-white py-3 font-semibold text-love-brown transition active:scale-[0.98]"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`${PINK_GRADIENT} rounded-2xl py-3 font-semibold shadow-md transition active:scale-[0.98] disabled:opacity-60`}
        >
          {saving ? "Đang lưu..." : "Lưu sự kiện"}
        </button>
      </div>
    </BottomSheet>
  );
}
