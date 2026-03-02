import { NextResponse } from "next/server";
import crypto from "crypto";

import { getAdminDatabase } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type SubscribeBody = {
  token?: string;
  userAgent?: string;
};

function tokenKey(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  const db = getAdminDatabase();
  const key = tokenKey(token);
  const refPath = `pushTokens/${key}`;

  const now = Date.now();
  await db.ref(refPath).update({
    token,
    userAgent: body.userAgent || "",
    lastSeenAt: now,
    createdAt: now,
  });

  return NextResponse.json({ ok: true });
}
