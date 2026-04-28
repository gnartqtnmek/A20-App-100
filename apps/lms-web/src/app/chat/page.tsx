"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-storage";
import type { ChatSessionRead } from "@/lib/types";
import { ChatPanel } from "@/components/chat/ChatPanel";

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") ?? undefined;

  const [sessions, setSessions] = useState<ChatSessionRead[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    apiClient
      .listChatSessions()
      .then((data) => {
        setSessions(data);
        if (data.length > 0) setActiveSessionId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleNewSession = async () => {
    const session = await apiClient.createChatSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
  };

  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar — session list */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <span className="text-sm font-semibold text-neutral-700">Lịch sử chat</span>
          <button
            onClick={handleNewSession}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
            title="Tạo cuộc hội thoại mới"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <p className="px-4 py-2 text-xs text-neutral-400">Đang tải...</p>
          ) : sessions.length === 0 ? (
            <p className="px-4 py-4 text-center text-xs text-neutral-400">Chưa có cuộc hội thoại nào.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-neutral-50 ${
                  s.id === activeSessionId ? "bg-blue-50 text-blue-700 font-medium" : "text-neutral-700"
                }`}
              >
                <p className="truncate">{s.title || "Cuộc hội thoại"}</p>
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  {new Date(s.last_active_at).toLocaleDateString("vi-VN")}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <div className="flex flex-1 flex-col">
        {activeSessionId || !loading ? (
          <ChatPanel
            sessionId={activeSessionId}
            courseId={courseId}
            className="flex-1 min-h-0"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-neutral-400">
            <p className="text-sm">Chọn hoặc tạo cuộc hội thoại để bắt đầu.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={<main className="flex h-[calc(100vh-64px)] items-center justify-center text-sm text-neutral-500">Dang tai trang chat...</main>}
    >
      <ChatPageContent />
    </Suspense>
  );
}
