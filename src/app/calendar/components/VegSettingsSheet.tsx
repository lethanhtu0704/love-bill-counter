"use client";

import { useState } from "react";

import BottomSheet from "./BottomSheet";
import Toggle from "./Toggle";
import { CHIP_BASE, CHIP_IDLE, SECTION_LABEL, VEG_CELL, VEG_TEXT } from "./ui";
import { VEG_PRESETS, buildVegIcs, type Ymd } from "@/lib/calendar";
import { ensureFcmToken } from "@/lib/push";
import type { VegSettings } from "@/lib/types";

interface VegSettingsSheetProps {
  settings: VegSettings;
  today: Ymd;
  onClose: () => void;
  onSave: (settings: VegSettings) => Promise<void>;
}

const sameDays = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export default function VegSettingsSheet({
  settings,
  today,
  onClose,
  onSave,
}: VegSettingsSheetProps) {
  const [draft, setDraft] = useState<VegSettings>(settings);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) =>
    setDraft((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }));

  const toggleRemind = () => {
    const next = !draft.remindEvening;
    // Register for push inside the tap (iOS needs a user gesture)
    if (next) void ensureFcmToken().catch(() => null);
    setDraft((prev) => ({ ...prev, remindEvening: next }));
  };

  const exportIcs = () => {
    const ics = buildVegIcs(draft, today);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lich-an-chay.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDone = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const summary = draft.days.length ? draft.days.join(", ") : "chưa chọn";

  return (
    <BottomSheet onClose={onClose}>
      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bill-text-dark">
        Ngày ăn chay
      </h3>
      <p className="mb-4 text-sm text-love-brown/80">
        Chọn theo lịch âm. Đang chọn: {summary}.
      </p>

      <div className="flex flex-wrap gap-2">
        {VEG_PRESETS.map((p) => {
          const active = sameDays(p.days, draft.days);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, days: [...p.days] }))}
              className={`${CHIP_BASE} ${active ? `${VEG_CELL} ${VEG_TEXT}` : CHIP_IDLE}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <p className={`${SECTION_LABEL} mb-2 mt-5`}>Tuỳ chỉnh từng ngày âm</p>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const on = draft.days.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`h-9 rounded-xl text-sm font-semibold transition active:scale-95 ${
                on ? `${VEG_CELL} ${VEG_TEXT}` : "bg-white text-love-brown/80"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-5 divide-y divide-bill-border rounded-2xl bg-white">
        <button
          type="button"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              shiftThirtyToTwentyNine: !prev.shiftThirtyToTwentyNine,
            }))
          }
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-bill-text-dark">
              Tháng thiếu dời 30 → 29
            </span>
            <span className="block text-xs text-love-brown/70">
              Tháng âm chỉ có 29 ngày thì tính ngày cuối
            </span>
          </span>
          <Toggle on={draft.shiftThirtyToTwentyNine} color="green" />
        </button>
        <button
          type="button"
          onClick={toggleRemind}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-bill-text-dark">
              Nhắc lúc 20:00 hôm trước
            </span>
            <span className="block text-xs text-love-brown/70">
              Thông báo để kịp chuẩn bị đồ ăn
            </span>
          </span>
          <Toggle on={draft.remindEvening} color="green" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={exportIcs}
          disabled={draft.days.length === 0}
          className={`rounded-2xl border border-bill-border bg-white py-3 font-semibold ${VEG_TEXT} transition active:scale-[0.98] disabled:opacity-50`}
        >
          Xuất lịch .ics
        </button>
        <button
          type="button"
          onClick={handleDone}
          disabled={saving}
          className={`rounded-2xl py-3 font-semibold shadow-md transition active:scale-[0.98] disabled:opacity-60 ${VEG_CELL} ${VEG_TEXT}`}
        >
          {saving ? "Đang lưu..." : "Xong"}
        </button>
      </div>
    </BottomSheet>
  );
}
