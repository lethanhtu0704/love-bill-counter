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

  const results = await Promise.allSettled(
    tokens.map((token) =>
      messaging.send({
        token,
        notification: {
          title,
          body,
        },
        data: {
          title,
          body,
          kind: "milestone_added",
        },
      })
    )
  );

  // Best-effort cleanup for invalid tokens
  const invalidTokens: string[] = [];
  results.forEach((r, idx) => {
    if (r.status === "fulfilled") return;
    const err: any = r.reason;
    const code = err?.errorInfo?.code || err?.code;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length > 0) {
    const snap2 = await db.ref("pushTokens").get();
    const tokenRecords2 = (snap2.val() || {}) as Record<
      string,
      { token?: string }
    >;
    const deletes: Promise<void>[] = [];
    for (const [key, rec] of Object.entries(tokenRecords2)) {
      if (rec?.token && invalidTokens.includes(rec.token)) {
        deletes.push(db.ref(`pushTokens/${key}`).remove());
      }
    }
    await Promise.all(deletes);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  return NextResponse.json({ ok: true, sent, failed });
}
