"use client";
import { useEffect, useRef } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const NOTIF_COOLDOWN_KEY = "mf-notif-last";
const NOTIF_COOLDOWN_MS  = 6 * 60 * 60 * 1000; // don't re-notify within 6 hours

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

async function getOrCreateSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  try {
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  } catch {
    return null;
  }
}

async function sendSubscriptionToServer(sub: PushSubscription) {
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
}

function isCoolingDown(): boolean {
  try {
    const last = localStorage.getItem(NOTIF_COOLDOWN_KEY);
    if (!last) return false;
    return Date.now() - parseInt(last, 10) < NOTIF_COOLDOWN_MS;
  } catch { return false; }
}

function markNotified() {
  try { localStorage.setItem(NOTIF_COOLDOWN_KEY, String(Date.now())); } catch { /* */ }
}

// ── The hook ─────────────────────────────────────────────────────────────────
// Call with the current risk level; it will:
//   1. Register the service worker
//   2. Ask for notification permission
//   3. When risk >= 50 (moderate/high/very-high), show a local notification
//      and ping the server to push to all subscribers
export function useNotifications(level: "low" | "moderate" | "high" | "very-high" | null) {
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register service worker once
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      regRef.current = reg;
    }).catch(() => { /* SW blocked in some environments */ });
  }, []);

  // Trigger notification when level changes to a risk level
  useEffect(() => {
    if (!level || level === "low") return;
    if (isCoolingDown()) return;
    if (!("Notification" in window)) return;

    const fire = async () => {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return;

      markNotified();

      const COPY: Record<string, { title: string; body: string }> = {
        moderate: {
          title: "⚠️ Moderate migraine risk today",
          body:  "Pressure is shifting. Stay hydrated, limit screen time, and keep rescue meds nearby.",
        },
        high: {
          title: "🟠 High risk — conditions are shifting",
          body:  "Pressure is dropping. Take preventive meds now, avoid bright lights, and rest if possible.",
        },
        "very-high": {
          title: "🔴 Very high risk — act now",
          body:  "Significant pressure drop detected. Hydrate, dim your environment, use a cold compress, have rescue meds ready.",
        },
      };

      const copy = COPY[level] ?? COPY["moderate"];

      // Show notification via SW (works even if tab is backgrounded)
      const reg = regRef.current ?? (await navigator.serviceWorker.ready.catch(() => null));
      if (reg) {
        reg.showNotification(copy.title, {
          body:     copy.body,
          icon:     "/icon-192.png",
          badge:    "/badge-72.png",
          tag:      "migraine-risk",
          renotify: true,
          vibrate:  [200, 100, 200],
          data:     { url: "/" },
          actions:  [
            { action: "view",    title: "See forecast" },
            { action: "dismiss", title: "Dismiss"      },
          ],
        } as NotificationOptions);
      } else {
        // Fallback: plain Notification API
        new Notification(copy.title, { body: copy.body, icon: "/icon-192.png" });
      }

      // Also ask server to push to any other subscribed devices
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      }).catch(() => { /* silently fail */ });
    };

    fire();
  }, [level]);

  // Subscribe for background push (separate from notification permission)
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await getOrCreateSubscription(reg);
      if (sub) sendSubscriptionToServer(sub).catch(() => { /* ok */ });
    }).catch(() => { /* ok */ });
  }, []);
}
