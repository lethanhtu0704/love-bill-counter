"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ensureFcmToken } from "@/lib/push";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
};

function createBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  if (Notification.permission !== "granted") {
    alert("Please enable notification permission first.");
    return;
  }

  // eslint-disable-next-line no-new
  new Notification(title, {
    body,
    icon: "/assets/app-icon.png",
  });
}

export default function NotificationsPage() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [subscribing, setSubscribing] = useState(false);

  const notifications = useMemo<NotificationItem[]>(
    () => [
      {
        id: "meal-plan-reminder",
        title: "Weekly Meal Plan",
        body: "Check and update your meal plan for today.",
        timeLabel: `Today, ${format(new Date(), "HH:mm")}`,
      },
      {
        id: "shopping-reminder",
        title: "Grocery Reminder",
        body: "Review your meals and prepare the shopping list.",
        timeLabel: "Every Sunday",
      },
      {
        id: "love-reminder",
        title: "Love Counter",
        body: "You have milestones worth celebrating this week.",
        timeLabel: "Pinned",
      },
    ],
    []
  );

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }

    setSubscribing(true);
    try {
      const token = await ensureFcmToken();
      if (!token && Notification.permission !== "granted") {
        const nextPermission = await Notification.requestPermission();
        setPermissionState(nextPermission);
      } else {
        setPermissionState(Notification.permission);
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestNotification = () => {
    createBrowserNotification(
      "Meal Planner",
      "Quick reminder: update breakfast, lunch, and dinner for today."
    );
  };

  return (
    <main className="min-h-screen bg-love-paper pb-28 px-4 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-love-brown/15 bg-white/85 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-love-brown font-[family-name:var(--font-playfair)]">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-love-dot/90">
            Manage reminders for your meal planner and milestones.
          </p>
        </header>

        <section className="mb-5 rounded-2xl border border-love-brown/15 bg-love-paper/45 p-4">
          <p className="mb-3 text-sm text-love-dot">
            Permission status: <span className="font-semibold text-love-brown">{permissionState}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={subscribing}
              className="rounded-xl bg-love-pink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {subscribing ? "Enabling..." : "Enable Notifications"}
            </button>
            <button
              type="button"
              onClick={handleTestNotification}
              className="rounded-xl border border-love-brown/20 bg-white px-4 py-2 text-sm font-semibold text-love-brown shadow-sm transition hover:bg-love-paper"
            >
              Send Test Notification
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-love-brown/10 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-love-dot/80">
                {item.timeLabel}
              </p>
              <h2 className="mt-1 text-base font-semibold text-love-brown">{item.title}</h2>
              <p className="mt-1 text-sm text-love-dot">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
