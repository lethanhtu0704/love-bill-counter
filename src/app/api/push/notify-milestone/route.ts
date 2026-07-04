import { NextResponse } from "next/server";

import { sendPushToAllDevices } from "@/lib/pushServer";

export const runtime = "nodejs";

export async function POST() {
  const result = await sendPushToAllDevices({
    title: "Love Counter",
    body: "Một kỷ niệm mới vừa được thêm",
    tag: "milestone_added",
    url: "/love-counter",
  });

  console.log(
    `notify-milestone: sent=${result.sent} failed=${result.failed}`,
    result.failed > 0 ? result.errorsByCode : ""
  );

  return NextResponse.json({ ok: true, ...result });
}
