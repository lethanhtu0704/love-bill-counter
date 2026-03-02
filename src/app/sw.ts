/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Generic Push API handler (works for FCM payloads without requiring Firebase config in SW)
self.addEventListener("push", (event: PushEvent) => {
  event.waitUntil(
    (async () => {
      if (!event.data) return;

      let payload: any;
      try {
        payload = event.data.json();
      } catch {
        try {
          payload = JSON.parse(event.data.text());
        } catch {
          return;
        }
      }

      const title =
        payload?.notification?.title || payload?.data?.title || "Love Counter";
      const body = payload?.notification?.body || payload?.data?.body || "";
      if (!body) return;

      const url = payload?.fcmOptions?.link || payload?.data?.url || "/love-counter";
      const tag = payload?.data?.kind || "push";

      await self.registration.showNotification(title, {
        body,
        icon: "/assets/app-icon.png",
        badge: "/assets/app-icon.png",
        tag,
        data: { url },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification as any)?.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
