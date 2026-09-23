import "server-only";

// Shared auth for cron-triggered routes (gold refresh, calendar reminders).
//
// When CRON_SECRET is set, accepts:
//   1. Vercel Cron — sends `Authorization: Bearer <CRON_SECRET>`
//   2. (opt-in) same-origin browser requests, e.g. the manual "Cập nhật giá"
//      button on /gold
// When CRON_SECRET is not set (local dev), everything is allowed.
export function isAuthorizedCronRequest(
  req: Request,
  { allowSameOrigin = false }: { allowSameOrigin?: boolean } = {}
): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  if (req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;

  if (allowSameOrigin) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && origin.endsWith(host)) return true;
  }
  return false;
}
