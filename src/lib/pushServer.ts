import "server-only";

import { getAdminDatabase, getAdminMessaging } from "@/lib/firebaseAdmin";

type SendPushInput = {
  title: string;
  body: string;
  tag: string;
  url: string;
  icon?: string;
};

type SendPushResult = {
  sent: number;
  failed: number;
  errorsByCode: Record<string, number>;
};

// Shared by every push send site (milestone alerts, gold price alerts, ...):
// reads subscribed tokens, multicasts, and prunes tokens FCM reports as dead.
export async function sendPushToAllDevices({
  title,
  body,
  tag,
  url,
  icon = "/assets/app-icon.png",
}: SendPushInput): Promise<SendPushResult> {
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
    return { sent: 0, failed: 0, errorsByCode: {} };
  }

  const multicast = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { title, body, kind: tag, url },
    webpush: {
      fcmOptions: { link: url },
      notification: { icon },
    },
  });

  const errorsByCode: Record<string, number> = {};
  const invalidTokens: string[] = [];
  multicast.responses.forEach((resp, idx) => {
    if (resp.success) return;
    const code = resp.error?.code || "unknown";
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

  return {
    sent: multicast.successCount,
    failed: multicast.failureCount,
    errorsByCode,
  };
}
