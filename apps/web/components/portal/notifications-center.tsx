"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
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
    <section className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
      <h3 className="text-2xl font-bold text-[#151b2d]">Notifications</h3>
      {isLoading ? <p className="mt-3 text-sm text-[#6f7f9f]">Loading notifications...</p> : null}
      {!isLoading && items.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No notifications" description="System and role announcements will appear here." />
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-[18px] border border-[#d3dbee] bg-[#f7f9fe] px-3 py-2">
            <p className="text-sm font-semibold text-[#18203a]">{item.title}</p>
            <p className="mt-1 text-xs text-[#5f7097]">{item.message}</p>
            {!item.is_read ? (
              <button onClick={() => void handleRead(item.id)} className="mt-2 rounded-full bg-[#3864e7] px-3 py-1 text-xs font-semibold text-white">
                Mark as read
              </button>
            ) : (
              <p className="mt-2 text-xs text-[#2f7f4c]">Read</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
