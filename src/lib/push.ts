"use client";

import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import app from "@/lib/firebase";

let foregroundListenerAttached = false;
let tokenRegisteredThisSession = false;

async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  // Wait until the Serwist SW is active
  const reg = await navigator.serviceWorker.ready;
  return reg || null;
}

async function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await getSwRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: "/assets/app-icon.png",
        badge: "/assets/app-icon.png",
        tag: "milestone_added",
      });
      return;
    }
  } catch {
    // Fall back to direct Notification below
  }

  try {
    // Some platforms allow this in foreground
    // eslint-disable-next-line no-new
    new Notification(title, {
      body,
      icon: "/assets/app-icon.png",
      tag: "milestone_added",
    });
  } catch {
    // Ignore
  }
}

export async function notifyMilestoneAddedLocal() {
  await showBrowserNotification(
    "Love Counter",
    "Một kỷ niệm mới vừa được thêm"
  );
}

export async function ensureFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return null;
  if (!("Notification" in window)) return null;

  // Already fetched + registered during this page session — nothing to do.
  if (tokenRegisteredThisSession && Notification.permission === "granted") {
    return null;
  }

  // IMPORTANT (Chrome / iOS): request permission without any prior `await`
  // so it's still considered a user gesture.
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }

  if (Notification.permission !== "granted") return null;

  const supported = await isSupported();
  if (!supported) return null;

  const reg = await getSwRegistration();
  if (!reg) return null;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: reg,
  });

  if (!token) return null;

  // Always (re-)register the current token: FCM rotates tokens, and the
  // server prunes tokens it believes are dead — a device that never
  // re-registers becomes silently unreachable.
  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, userAgent: navigator.userAgent }),
    });
    if (res.ok) {
      tokenRegisteredThisSession = true;
    } else {
      console.error("FCM subscribe failed:", res.status);
    }
  } catch {
    // Ignore subscribe failures — retried on next call
  }

  return token;
}

export async function attachFcmForegroundListener() {
  if (typeof window === "undefined") return;
  if (foregroundListenerAttached) return;

  const supported = await isSupported();
  if (!supported) return;

  foregroundListenerAttached = true;

  const messaging = getMessaging(app);
  onMessage(messaging, async (payload) => {
    const title =
      payload.data?.title || payload.notification?.title || "Love Counter";
    const body = payload.data?.body || payload.notification?.body || "";
    if (!body) return;
    await showBrowserNotification(title, body);
  });
}
