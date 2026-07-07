import { NextResponse } from "next/server";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { sendPushToAllDevices } from "@/lib/pushServer";
import {
  COLLECTIONS,
  GOLD_PRODUCT_CODE,
  GOLD_PRODUCT_NAME,
  GOLD_UNIT_LABEL,
  PNJ_GOLD_API_URL,
} from "@/lib/constants";
import type { GoldSnapshot } from "@/lib/types";

const numberFmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

// Trend-aware copy for the lock-screen notification: leads with direction +
// today's sell price (the number people scan for first), body gives the
// day-over-day delta. Falls back to a plain readout when there's no
// previous snapshot to compare against (very first run).
function buildGoldNotification(
  snapshot: GoldSnapshot,
  previous: GoldSnapshot | null
): { title: string; body: string } {
  const sell = numberFmt.format(snapshot.sell);
  const buy = numberFmt.format(snapshot.buy);

  if (!previous) {
    return {
      title: `💰 Giá vàng PNJ hôm nay`,
      body: `Mua ${buy}đ · Bán ${sell}đ (${GOLD_UNIT_LABEL})`,
    };
  }

  const diff = snapshot.sell - previous.sell;
  const pct = previous.sell > 0 ? (diff / previous.sell) * 100 : 0;
  const diffAbs = numberFmt.format(Math.abs(diff));
  const pctAbs = Math.abs(pct).toFixed(2);

  if (diff > 0) {
    return {
      title: `📈 Vàng tăng lên ${sell}đ/chỉ`,
      body: `Bán +${diffAbs}đ (+${pctAbs}%) so với hôm qua·`,
    };
  }
  if (diff < 0) {
    return {
      title: `📉 Vàng giảm còn ${sell}đ/chỉ`,
      body: `Bán -${diffAbs}đ (-${pctAbs}%) so với hôm qua.`,
    };
  }
  return {
    title: `Vàng giữ nguyên ${sell}đ/chỉ`,
    body: `Không đổi so với hôm qua·`,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PnjGoldItem = {
  masp: string;
  tensp: string;
  giaban: number | string;
  giamua: number | string;
};

type PnjGoldResponse = {
  data?: PnjGoldItem[];
  updateDate?: string;
};

// Parse "29/04/2026 08:58:42" → epoch (treated as Asia/Ho_Chi_Minh, UTC+7)
function parseUpdateDate(str: string): number {
  const [datePart, timePart = "00:00:00"] = str.trim().split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [h, m, s] = timePart.split(":").map(Number);
  // Build UTC timestamp for the local Vietnam wall-clock time, so it renders
  // consistently regardless of where the server runs.
  return Date.UTC(year, month - 1, day, h - 7, m, s);
}

function isSameUtcDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

async function refresh(): Promise<{
  ok: boolean;
  saved: boolean;
  snapshot: GoldSnapshot | null;
  previous?: GoldSnapshot | null;
  error?: string;
}> {
  const upstream = await fetch(PNJ_GOLD_API_URL, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!upstream.ok) {
    return {
      ok: false,
      saved: false,
      snapshot: null,
      error: `PNJ API responded ${upstream.status}`,
    };
  }

  const json = (await upstream.json()) as PnjGoldResponse;
  const item = json.data?.find((row) => row.masp === GOLD_PRODUCT_CODE);
  if (!item) {
    return {
      ok: false,
      saved: false,
      snapshot: null,
      error: "Product N24K not found in PNJ response",
    };
  }

  const buy = Number(item.giamua);
  const sell = Number(item.giaban);
  if (!Number.isFinite(buy) || !Number.isFinite(sell)) {
    return {
      ok: false,
      saved: false,
      snapshot: null,
      error: "Invalid buy/sell value",
    };
  }

  const sourceUpdatedAt = json.updateDate
    ? parseUpdateDate(json.updateDate)
    : Date.now();
  const now = Date.now();

  const db = getAdminDatabase();
  const historyRef = db.ref(COLLECTIONS.GOLD_HISTORY);
  const historySnap = await historyRef.get();
  const raw =
    (historySnap.val() as Record<string, Omit<GoldSnapshot, "id">> | null) ||
    {};
  const history = Object.entries(raw)
    .map(([id, snap]) => ({ id, ...snap } as GoldSnapshot))
    .sort((a, b) => a.savedAt - b.savedAt);
  const latest = history[history.length - 1] ?? null;

  const valueChanged =
    !latest || latest.buy !== buy || latest.sell !== sell;
  const newDay = !latest || !isSameUtcDay(latest.savedAt, now);
  const shouldSave = valueChanged || newDay;

  if (!shouldSave && latest) {
    await historyRef.child(latest.id).update({ fetchedAt: now });
    return {
      ok: true,
      saved: false,
      snapshot: { ...latest, fetchedAt: now },
    };
  }

  const newSnap: Omit<GoldSnapshot, "id"> = {
    productCode: GOLD_PRODUCT_CODE,
    productName: GOLD_PRODUCT_NAME,
    buy,
    sell,
    sourceUpdatedAt,
    savedAt: now,
    fetchedAt: now,
  };

  const newRef = historyRef.push();
  await newRef.set(newSnap);

  return {
    ok: true,
    saved: true,
    snapshot: { id: newRef.key as string, ...newSnap },
    previous: latest,
  };
}

export async function GET(req: Request) {
  // If a CRON_SECRET is configured, allow:
  //   1. Vercel Cron (sends Authorization: Bearer <CRON_SECRET>)
  //   2. Same-origin browser requests (the manual "Cập nhật giá" button)
  // Reject everything else.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    const isCron = auth === `Bearer ${cronSecret}`;
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const isSameOrigin =
      origin && host ? origin.endsWith(host) : false;

    if (!isCron && !isSameOrigin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const result = await refresh();
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    let push: Awaited<ReturnType<typeof sendPushToAllDevices>> | undefined;
    if (result.saved && result.snapshot) {
      const { title, body } = buildGoldNotification(
        result.snapshot,
        result.previous ?? null
      );
      push = await sendPushToAllDevices({
        title,
        body,
        tag: "gold_price",
        url: "/gold",
        icon: "/assets/pnj-icon.png",
      });
      console.log(
        `gold/refresh push: sent=${push.sent} failed=${push.failed}`,
        push.failed > 0 ? push.errorsByCode : ""
      );
    }

    return NextResponse.json({ ...result, push });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, saved: false, snapshot: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
