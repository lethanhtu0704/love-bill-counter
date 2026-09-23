import { NextResponse } from "next/server";

import {
  DEFAULT_VEG_SETTINGS,
  addDays,
  eventsOn,
  fromKey,
  isVegDay,
  lunarOf,
  toKey,
  vietnamToday,
  type Ymd,
} from "@/lib/calendar";
import { COLLECTIONS } from "@/lib/constants";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { sendPushToAllDevices } from "@/lib/pushServer";
import type { CalendarEvent, VegSettings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Runs daily at 20:00 Asia/Ho_Chi_Minh (vercel.json: `0 13 * * *` UTC) and
// sends ONE push summarising what's coming:
//   - tomorrow is a veg day (if "Nhắc lúc 20:00 hôm trước" is on)
//   - events tomorrow that have a reminder (any remindDays > 0)
//   - events exactly N days out whose remindDays === N (3 / 7 days)
// A per-day log (calendar_reminder_log/{yyyy-MM-dd}) makes cron retries
// idempotent.
//
// Query params (still require auth): ?dryRun=1 builds the message without
// sending/logging; ?date=yyyy-MM-dd overrides "today" (for testing).

type Reminder = { title: string; body: string } | null;

function buildReminder(
  today: Ymd,
  events: CalendarEvent[],
  veg: VegSettings
): Reminder {
  const tomorrow = addDays(today, 1);
  const tl = lunarOf(tomorrow);
  const vegTomorrow = veg.remindEvening && isVegDay(tl, veg);
  const tomorrowEvents = eventsOn(events, tomorrow, tl).filter(
    (e) => e.remindDays > 0
  );

  const upcoming: string[] = [];
  for (const n of [3, 7]) {
    const date = addDays(today, n);
    const names = eventsOn(events, date)
      .filter((e) => e.remindDays === n)
      .map((e) => e.title);
    if (names.length) upcoming.push(`Còn ${n} ngày: ${names.join(", ")}`);
  }

  if (!vegTomorrow && tomorrowEvents.length === 0 && upcoming.length === 0) {
    return null;
  }

  const dateLabel = `${tomorrow.d}/${tomorrow.m} (${tl.day}/${tl.month} ÂL)`;
  const parts: string[] = [];
  if (tomorrowEvents.length) {
    parts.push(`Mai ${dateLabel}: ${tomorrowEvents.map((e) => e.title).join(", ")}`);
    if (vegTomorrow) parts.push("🌿 nhớ ăn chay");
  } else if (vegTomorrow) {
    parts.push(`Mai ${dateLabel} — nhớ chuẩn bị đồ chay nha`);
  }
  parts.push(...upcoming);

  const title = vegTomorrow
    ? "🌿 Mai ăn chay nhé"
    : tomorrowEvents.length
      ? "📅 Nhắc lịch ngày mai"
      : "📅 Sự kiện sắp tới";

  return { title, body: parts.join(" · ") };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  if (!isAuthorizedCronRequest(req, { allowSameOrigin: dryRun })) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateParam = url.searchParams.get("date");
    const today =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? fromKey(dateParam)
        : vietnamToday();
    const todayKey = toKey(today);

    const db = getAdminDatabase();
    const [eventsSnap, vegSnap, logSnap] = await Promise.all([
      db.ref(COLLECTIONS.CALENDAR_EVENTS).get(),
      db.ref(`${COLLECTIONS.CALENDAR_SETTINGS}/veg`).get(),
      db.ref(`${COLLECTIONS.CALENDAR_REMINDER_LOG}/${todayKey}`).get(),
    ]);

    const rawEvents =
      (eventsSnap.val() as Record<string, Omit<CalendarEvent, "id">> | null) || {};
    const events = Object.entries(rawEvents).map(([id, e]) => ({ id, ...e }));
    const veg: VegSettings = {
      ...DEFAULT_VEG_SETTINGS,
      ...((vegSnap.val() as Partial<VegSettings> | null) || {}),
    };

    const reminder = buildReminder(today, events, veg);

    if (!reminder) {
      return NextResponse.json({ ok: true, date: todayKey, sent: false, reason: "nothing" });
    }
    if (dryRun) {
      return NextResponse.json({ ok: true, date: todayKey, dryRun: true, reminder });
    }
    if (logSnap.exists()) {
      return NextResponse.json({ ok: true, date: todayKey, sent: false, reason: "already-sent" });
    }

    const push = await sendPushToAllDevices({
      title: reminder.title,
      body: reminder.body,
      tag: "calendar_reminder",
      url: "/calendar",
    });
    console.log(
      `calendar/remind push: sent=${push.sent} failed=${push.failed}`,
      push.failed > 0 ? push.errorsByCode : ""
    );

    await db.ref(`${COLLECTIONS.CALENDAR_REMINDER_LOG}/${todayKey}`).set({
      ...reminder,
      sent: push.sent,
      failed: push.failed,
      at: Date.now(),
    });

    return NextResponse.json({ ok: true, date: todayKey, sent: true, reminder, push });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("calendar/remind failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
