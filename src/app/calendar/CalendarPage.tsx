"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import MonthGrid from "./components/MonthGrid";
import { CARD, PINK_GRADIENT, VEG_TEXT } from "./components/ui";
import { LeafIcon, SwapIcon, XIcon } from "@/components/icons";
import {
  DEFAULT_VEG_SETTINGS,
  EVENT_TYPE_MAP,
  WEEKDAY_NAMES,
  eventsOn,
  holidayOf,
  isVegDay,
  localToday,
  lunarOf,
  nextVegDay,
  toKey,
  weekday,
  type Ymd,
} from "@/lib/calendar";
import { dayCanChi } from "@/lib/lunar";
import {
  addCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  getVegSettings,
  saveVegSettings,
} from "@/lib/services";
import type { CalendarEvent, VegSettings } from "@/lib/types";

// Sheets are only downloaded when opened
const AddEventSheet = dynamic(() => import("./components/AddEventSheet"), { ssr: false });
const ConvertSheet = dynamic(() => import("./components/ConvertSheet"), { ssr: false });
const VegSettingsSheet = dynamic(() => import("./components/VegSettingsSheet"), { ssr: false });

type Sheet = null | "add" | "convert" | "veg";

export default function CalendarPage() {
  const [today] = useState<Ymd>(() => localToday());
  const [view, setView] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<Ymd>(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [veg, setVeg] = useState<VegSettings>(DEFAULT_VEG_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCalendarEvents(), getVegSettings()])
      .then(([ev, settings]) => {
        setEvents(ev);
        setVeg(settings);
      })
      .catch((err) => {
        console.error("Failed to load calendar:", err);
        setError("Không tải được dữ liệu lịch");
      })
      .finally(() => setLoading(false));
  }, []);

  const todayLunar = useMemo(() => lunarOf(today), [today]);
  const selectedLunar = useMemo(() => lunarOf(selected), [selected]);
  const nextVeg = useMemo(() => nextVegDay(today, veg), [today, veg]);
  const selectedEvents = useMemo(
    () => eventsOn(events, selected, selectedLunar),
    [events, selected, selectedLunar]
  );
  const selectedHoliday = holidayOf(selected, selectedLunar);
  const selectedIsVeg = isVegDay(selectedLunar, veg);

  const goMonth = useCallback((delta: number) => {
    setView((v) => {
      const idx = v.y * 12 + (v.m - 1) + delta;
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    });
  }, []);
  const goPrev = useCallback(() => goMonth(-1), [goMonth]);
  const goNext = useCallback(() => goMonth(1), [goMonth]);

  const selectDate = useCallback((date: Ymd) => {
    setSelected(date);
    setView({ y: date.y, m: date.m });
    setConfirmDelete(null);
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

  const handleAdd = useCallback(
    async (data: Omit<CalendarEvent, "id" | "createdAt">) => {
      const created = await addCalendarEvent(data);
      setEvents((prev) => [...prev, created]);
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirmDelete !== id) {
        setConfirmDelete(id);
        return;
      }
      setConfirmDelete(null);
      const prev = events;
      setEvents((list) => list.filter((e) => e.id !== id));
      try {
        await deleteCalendarEvent(id);
      } catch (err) {
        console.error(err);
        setEvents(prev);
        setError("Không xoá được sự kiện");
      }
    },
    [confirmDelete, events]
  );

  const handleSaveVeg = useCallback(async (settings: VegSettings) => {
    await saveVegSettings(settings);
    setVeg(settings);
  }, []);

  const isViewingToday = view.y === today.y && view.m === today.m && toKey(selected) === toKey(today);

  return (
    <main className="min-h-screen bg-love-paper px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-love-brown/80">
              Lịch Việt Nam
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-love-brown">
              Âm lịch
            </h1>
            <p className="text-sm text-love-brown/80">
              Hôm nay, {today.d} tháng {today.m}, {today.y}
            </p>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setSheet("convert")}
              aria-label="Đổi ngày"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-love-pink shadow-sm transition active:scale-90"
            >
              <SwapIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSheet("veg")}
              aria-label="Cài đặt ngày ăn chay"
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#d8ecd2] shadow-sm transition active:scale-90 dark:bg-[#23361f] ${VEG_TEXT}`}
            >
              <LeafIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Today */}
        <section className={`${CARD} relative overflow-hidden bg-linear-to-br from-white to-[#fdf0f4] dark:from-[#2d2421] p-5 dark:to-[#3a262d]`}>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#f6c9d6]/50 blur-xl dark:bg-[#a23d69]/25" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-love-pink">
            {WEEKDAY_NAMES[weekday(today)]}
          </p>
          <div className="relative mt-2 grid grid-cols-2">
            <div className="pr-4">
              <p className="text-xs text-love-brown/80">Dương lịch</p>
              <p className="font-[family-name:var(--font-playfair)] text-6xl font-bold leading-tight text-bill-text-dark">
                {today.d}
              </p>
              <p className="text-sm text-love-brown">
                Tháng {today.m}, {today.y}
              </p>
            </div>
            <div className="border-l border-bill-border pl-4">
              <p className="text-xs text-love-brown/80">Âm lịch</p>
              <p className="font-[family-name:var(--font-playfair)] text-6xl font-bold leading-tight text-love-pink">
                {todayLunar.day}
              </p>
              <p className="text-sm text-love-brown">
                Tháng {todayLunar.month}
                {todayLunar.leap ? " nhuận" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* Next veg day */}
        {nextVeg && (
          <button
            type="button"
            onClick={() => selectDate(nextVeg.date)}
            className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.99]`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d8ecd2] dark:bg-[#23361f] ${VEG_TEXT}`}>
              <LeafIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-love-brown/80">Ngày ăn chay kế tiếp</span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-bill-text-dark">
                  {nextVeg.lunar.day}/{nextVeg.lunar.month}
                </span>
                <span className="rounded-md bg-love-pink/10 px-1.5 py-0.5 text-[10px] font-semibold text-love-pink">
                  ÂL
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-sm text-love-brown">
                {WEEKDAY_NAMES[weekday(nextVeg.date)]}, {nextVeg.date.d}/{nextVeg.date.m}
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  DL
                </span>
              </span>
            </span>
            <span className={`font-[family-name:var(--font-playfair)] text-2xl font-bold ${VEG_TEXT}`}>
              {nextVeg.inDays === 0
                ? "Hôm nay"
                : nextVeg.inDays === 1
                  ? "Ngày mai"
                  : `${nextVeg.inDays} ngày`}
            </span>
          </button>
        )}

        {/* Month */}
        <MonthGrid
          year={view.y}
          month={view.m}
          today={today}
          selected={selected}
          events={events}
          veg={veg}
          onSelect={selectDate}
          onPrev={goPrev}
          onNext={goNext}
        />

        {!isViewingToday && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-love-pink shadow-sm transition active:scale-95"
            >
              Về hôm nay
            </button>
          </div>
        )}

        {/* Selected day */}
        <section className="pt-2">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bill-text-dark">
                {WEEKDAY_NAMES[weekday(selected)]}, {selected.d}/{selected.m}/{selected.y}
              </h2>
              <p className="text-sm text-love-brown/80">
                {selectedLunar.day}/{selectedLunar.month}
                {selectedLunar.leap ? " nhuận" : ""} ÂL · ngày{" "}
                {dayCanChi(selected.d, selected.m, selected.y)}
              </p>
              {(selectedHoliday || selectedIsVeg) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedHoliday && (
                    <span className="rounded-full bg-[#f6e7d3] px-2.5 py-0.5 text-xs font-semibold text-[#a86a22] dark:bg-[#3a2e1e] dark:text-[#e3b574]">
                      {selectedHoliday}
                    </span>
                  )}
                  {selectedIsVeg && (
                    <span className={`rounded-full bg-[#d8ecd2] px-2.5 py-0.5 text-xs font-semibold dark:bg-[#23361f] ${VEG_TEXT}`}>
                      🌿 Ngày ăn chay
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSheet("add")}
              className={`${PINK_GRADIENT} shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition active:scale-95`}
            >
              + Sự kiện
            </button>
          </div>

          {loading ? (
            <div className={`${CARD} h-16 animate-pulse`} />
          ) : selectedEvents.length === 0 ? (
            <p className={`${CARD} px-4 py-5 text-center text-sm text-love-brown/70`}>
              Chưa có sự kiện nào
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedEvents.map((ev) => {
                const meta = EVENT_TYPE_MAP[ev.type];
                const confirming = confirmDelete === ev.id;
                return (
                  <li key={ev.id} className={`${CARD} flex gap-3 p-4`}>
                    <span
                      className="w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: meta?.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-bill-text-dark">{ev.title}</p>
                      <p className="text-sm text-love-brown/80">
                        {meta?.label}
                        {ev.repeat === "lunar-yearly" && ` · hằng năm ${ev.lunarDay}/${ev.lunarMonth} ÂL`}
                        {ev.remindDays > 0 && ` · nhắc trước ${ev.remindDays} ngày`}
                      </p>
                      {ev.note && (
                        <p className="mt-2 border-t border-dashed border-bill-border pt-2 text-sm text-love-brown">
                          {ev.note}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id)}
                      aria-label="Xoá sự kiện"
                      className={`flex h-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition ${
                        confirming
                          ? "bg-rose-50 px-2 text-rose-600"
                          : "w-7 bg-love-pink/10 text-love-brown"
                      }`}
                    >
                      {confirming ? "Xoá?" : <XIcon className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {sheet === "add" && (
        <AddEventSheet
          date={selected}
          lunar={selectedLunar}
          onClose={closeSheet}
          onSave={handleAdd}
        />
      )}
      {sheet === "convert" && (
        <ConvertSheet initial={selected} onClose={closeSheet} onJump={selectDate} />
      )}
      {sheet === "veg" && (
        <VegSettingsSheet
          settings={veg}
          today={today}
          onClose={closeSheet}
          onSave={handleSaveVeg}
        />
      )}
    </main>
  );
}
