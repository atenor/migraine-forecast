import webpush from "web-push";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@migraine-forecast.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export { webpush };
export const vapidPublicKey = VAPID_PUBLIC;

// ── In-memory subscription store ─────────────────────────────────────────────
// For production, swap this for a DB-backed store.
// Using a module-level Set means it persists across requests in the same process,
// but is reset on cold start — fine for dev and single-instance deploys.
const subscriptions = new Set<string>(); // JSON-serialised PushSubscription

export function saveSubscription(sub: PushSubscriptionJSON) {
  subscriptions.add(JSON.stringify(sub));
}

export function removeSubscription(sub: PushSubscriptionJSON) {
  subscriptions.delete(JSON.stringify(sub));
}

// ── Notification copy by risk level ──────────────────────────────────────────
const NOTIFY_COPY: Record<string, { title: string; body: string }> = {
  moderate: {
    title: "⚠️ Moderate migraine risk today",
    body:  "Pressure is shifting. Stay hydrated, limit screen time, and keep rescue meds nearby.",
  },
  high: {
    title: "🟠 High migraine risk — heads up",
    body:  "Significant pressure drop detected. Take your preventive medication, rest in a dark room if needed, and avoid triggers today.",
  },
  "very-high": {
    title: "🔴 Very high risk — act now",
    body:  "Barometric pressure is dropping sharply. Take action early: hydrate, dim your environment, use a cold compress, and have rescue meds ready.",
  },
};

export function getNotifyCopy(level: string) {
  return NOTIFY_COPY[level] ?? NOTIFY_COPY["moderate"];
}

// ── Send push to all stored subscribers ──────────────────────────────────────
export async function broadcastPush(payload: object) {
  const dead: string[] = [];
  const jobs = Array.from(subscriptions).map(async (raw) => {
    try {
      await webpush.sendNotification(
        JSON.parse(raw) as webpush.PushSubscription,
        JSON.stringify(payload),
        { TTL: 3600 }
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) dead.push(raw); // expired subscription
    }
  });
  await Promise.allSettled(jobs);
  for (const r of dead) subscriptions.delete(r);
}
