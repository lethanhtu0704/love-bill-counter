import { NextResponse } from "next/server";

import { getAdminDatabase, getAdminMessaging } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST() {
  const db = getAdminDatabase();
  const messaging = getAdminMessaging();

  const snapshot = await db.ref("pushTokens").get();
  const tokenRecords = (snapshot.val() || {}) as Record<
    string,
    { token?: string }
  >;
  const tokens = Object.values(tokenRecords)
    .map((r) => r.token)
    .filter((t): t is string => !!t);

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const title = "Love Counter";
  const body = "Một kỷ niệm mới vừa được thêm";

  const multicast = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: {
      title,
      body,
      kind: "milestone_added",
      url: "/love-counter",
    },
    webpush: {
      fcmOptions: {
        link: "/love-counter",
      },
      notification: {
        icon: "/assets/app-icon.png",
      },
    },
  });

  const errorsByCode: Record<string, number> = {};
  const invalidTokens: string[] = [];
  multicast.responses.forEach((resp, idx) => {
    if (resp.success) return;
    const err: any = resp.error;
    const code = err?.errorInfo?.code || err?.code || "unknown";
    errorsByCode[code] = (errorsByCode[code] || 0) + 1;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length > 0) {
    const invalidSet = new Set(invalidTokens);
    const deletes: Promise<void>[] = [];
    for (const [key, rec] of Object.entries(tokenRecords)) {
      if (rec?.token && invalidSet.has(rec.token)) {
        deletes.push(db.ref(`pushTokens/${key}`).remove());
      }
    }
    await Promise.all(deletes);
  }

  const sent = multicast.successCount;
  const failed = multicast.failureCount;
  return NextResponse.json({
    ok: true,
    sent,
    failed,
    errorsByCode,
  });
}
