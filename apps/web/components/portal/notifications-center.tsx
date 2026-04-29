"use client";

import { useCallback, useEffect, useState } from "react";

import { markNotificationRead, notifications } from "@/lib/api";
import type { NotificationItem } from "@/lib/lms";

type Props = {
  accessToken: string;
};

export function NotificationsCenter({ accessToken }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notifications(accessToken, 1, 10);
      setItems(response.items);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleRead(notificationId: string) {
    await markNotificationRead(notificationId, accessToken);
    await loadNotifications();
  }

  return (
    <section className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
      <h3 className="text-lg font-semibold text-brand.night dark:text-white">Notification Center</h3>
      {isLoading ? <p className="mt-3 text-sm text-slate-500">Loading notifications...</p> : null}
      {!isLoading && items.length === 0 ? <p className="mt-3 text-sm text-slate-500">No notifications yet.</p> : null}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
            {!item.is_read ? (
              <button
                onClick={() => void handleRead(item.id)}
                className="mt-2 rounded bg-brand.night px-2 py-1 text-xs font-semibold text-white"
              >
                Mark as read
              </button>
            ) : (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Read</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
