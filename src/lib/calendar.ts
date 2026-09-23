// Shared (client + cron) calendar domain logic: veg-day rules, event
// occurrence, holidays, date keys. Pure — no Firebase, no DOM.

import { solarToLunar, type LunarDate } from "./lunar";
import type {
  CalendarEvent,
  CalendarEventType,
  VegSettings,
} from "./types";

// ===== Date keys (yyyy-MM-dd, calendar-local, no timezone) =====

export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number;
}

export function toKey({ y, m, d }: Ymd): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function fromKey(key: string): Ymd {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

export function addDays({ y, m, d }: Ymd, days: number): Ymd {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function diffDays(a: Ymd, b: Ymd): number {
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000
  );
}

/** 0 = Sunday … 6 = Saturday */
export function weekday({ y, m, d }: Ymd): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function localToday(): Ymd {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}

/** "Today" in Vietnam regardless of server timezone (Vercel runs in UTC). */
export function vietnamToday(now = Date.now()): Ymd {
  const t = new Date(now + 7 * 3600 * 1000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function lunarOf(date: Ymd): LunarDate {
  return solarToLunar(date.d, date.m, date.y);
}

export const WEEKDAY_NAMES = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

// ===== Veg days =====

export const VEG_PRESETS: { label: string; days: number[] }[] = [
  { label: "Nhị trai (2)", days: [1, 15] },
  { label: "Tứ trai (4)", days: [1, 14, 15, 30] },
  { label: "Lục trai (6)", days: [8, 14, 15, 23, 29, 30] },
  { label: "Thập trai (10)", days: [1, 8, 14, 15, 18, 23, 24, 28, 29, 30] },
];

export const DEFAULT_VEG_SETTINGS: VegSettings = {
  days: [14, 15, 29, 30],
  shiftThirtyToTwentyNine: true,
  remindEvening: true,
};

export function isVegDay(lunar: LunarDate, settings: VegSettings): boolean {
  const days = settings.days ?? [];
  if (days.includes(lunar.day)) return true;
  // "Tháng thiếu": the lunar month only has 29 days → day 30 moves to 29.
  return (
    settings.shiftThirtyToTwentyNine &&
    lunar.monthLength === 29 &&
    lunar.day === 29 &&
    days.includes(30)
  );
}

/** Next veg day on/after `from` (searches ~2 lunar months). */
export function nextVegDay(
  from: Ymd,
  settings: VegSettings
): { date: Ymd; lunar: LunarDate; inDays: number } | null {
  if (!settings.days?.length) return null;
  for (let i = 0; i < 62; i++) {
    const date = addDays(from, i);
    const lunar = lunarOf(date);
    if (isVegDay(lunar, settings)) return { date, lunar, inDays: i };
  }
  return null;
}

// ===== Events =====

export const EVENT_TYPES: {
  value: CalendarEventType;
  label: string;
  color: string;
}[] = [
  { value: "personal", label: "Cá nhân", color: "#d0708f" },
  { value: "family", label: "Gia đình", color: "#9b2c5a" },
  { value: "work", label: "Công việc", color: "#6b8cae" },
  { value: "memorial", label: "Giỗ / Lễ", color: "#b08a3e" },
  { value: "health", label: "Sức khoẻ", color: "#6aa384" },
];

export const EVENT_TYPE_MAP = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t])
) as Record<CalendarEventType, (typeof EVENT_TYPES)[number]>;

export const REMIND_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Không nhắc" },
  { value: 1, label: "1 ngày" },
  { value: 3, label: "3 ngày" },
  { value: 7, label: "7 ngày" },
];

/** Does `event` happen on `date` (whose lunar date is `lunar`)? */
export function occursOn(
  event: CalendarEvent,
  date: Ymd,
  lunar: LunarDate
): boolean {
  const key = toKey(date);
  if (event.repeat !== "lunar-yearly") return event.date === key;
  if (key < event.date) return false;
  // Yearly lunar repeats land in the regular (non-leap) month.
  if (lunar.leap || lunar.month !== event.lunarMonth) return false;
  if (lunar.day === event.lunarDay) return true;
  // Event on the 30th, but this year's month only has 29 days.
  return event.lunarDay === 30 && lunar.monthLength === 29 && lunar.day === 29;
}

export function eventsOn(
  events: CalendarEvent[],
  date: Ymd,
  lunar: LunarDate = lunarOf(date)
): CalendarEvent[] {
  return events.filter((e) => occursOn(e, date, lunar));
}

// ===== Holidays =====

const SOLAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Dương lịch",
  "14-2": "Lễ Tình nhân",
  "8-3": "Quốc tế Phụ nữ",
  "30-4": "Giải phóng miền Nam",
  "1-5": "Quốc tế Lao động",
  "2-9": "Quốc khánh",
  "20-10": "Phụ nữ Việt Nam",
  "20-11": "Nhà giáo Việt Nam",
  "24-12": "Giáng sinh",
};

const LUNAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Nguyên Đán",
  "2-1": "Mùng 2 Tết",
  "3-1": "Mùng 3 Tết",
  "15-1": "Rằm tháng Giêng",
  "10-3": "Giỗ Tổ Hùng Vương",
  "15-4": "Lễ Phật Đản",
  "5-5": "Tết Đoan Ngọ",
  "15-7": "Vu Lan",
  "15-8": "Tết Trung Thu",
  "23-12": "Ông Công Ông Táo",
};

export function holidayOf(date: Ymd, lunar: LunarDate): string | null {
  const solar = SOLAR_HOLIDAYS[`${date.d}-${date.m}`];
  if (solar) return solar;
  if (lunar.leap) return null;
  const lunarName = LUNAR_HOLIDAYS[`${lunar.day}-${lunar.month}`];
  if (lunarName) return lunarName;
  // Giao thừa = last day of lunar month 12
  if (lunar.month === 12 && lunar.day === lunar.monthLength) return "Giao thừa";
  return null;
}

// ===== .ics export (veg days) =====

export function buildVegIcs(
  settings: VegSettings,
  from: Ymd,
  days = 366
): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const compact = (d: Ymd) => toKey(d).replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tu & Ngan//Lich Am//VI",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Ngày ăn chay",
  ];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const lunar = lunarOf(date);
    if (!isVegDay(lunar, settings)) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:veg-${compact(date)}@tu-ngan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
      `SUMMARY:🌿 Ăn chay · ${lunar.day}/${lunar.month} ÂL`,
      "TRANSP:TRANSPARENT"
    );
    if (settings.remindEvening) {
      // All-day events start at 00:00 → 4h before = 20:00 the evening before
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Mai ăn chay",
        "TRIGGER:-PT4H",
        "END:VALARM"
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
