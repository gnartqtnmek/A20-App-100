import { useCallback, useEffect, useRef, useState } from "react";
import {
  createConversation,
  listConversations,
  listMessages,
  streamMessage,
} from "./api/client";
import type { Conversation } from "./api/types";
import { ChatScreen } from "./components/ChatScreen";
import { Sidebar } from "./components/Sidebar";
import type { ToolEvent, UIMessage } from "./components/MessageItem";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { USER_ID_STORAGE_KEY } from "./lib/constants";

const TYPEWRITER_CHARS_PER_FRAME = 2;
const TYPEWRITER_FRAME_SKIP = 1; // render mỗi N+1 frames (~30fps)

export default function App() {
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "local-user";
    const fromQuery = new URLSearchParams(window.location.search).get("user_id");
    const fromStorage = window.localStorage.getItem(USER_ID_STORAGE_KEY);
    const resolved = (fromQuery ?? fromStorage ?? `user-${crypto.randomUUID()}`).trim();
    window.localStorage.setItem(USER_ID_STORAGE_KEY, resolved);
    return resolved;
  });
  const [userIdInput, setUserIdInput] = useState(userId);
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingToolEvents = useRef<ToolEvent[]>([]);
  const typewriterQueue = useRef<string>("");
  const typewriterFrame = useRef<number | null>(null);

  const startTypewriter = useCallback((msgId: string) => {
    let skipped = 0;
    const tick = () => {
      if (typewriterQueue.current.length === 0) {
        typewriterFrame.current = null;
        return;
      }
      if (skipped < TYPEWRITER_FRAME_SKIP) {
        skipped++;
        typewriterFrame.current = requestAnimationFrame(tick);
        return;
      }
      skipped = 0;
      const chars = typewriterQueue.current.slice(0, TYPEWRITER_CHARS_PER_FRAME);
      typewriterQueue.current = typewriterQueue.current.slice(TYPEWRITER_CHARS_PER_FRAME);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: m.content + chars } : m)),
      );
      typewriterFrame.current = requestAnimationFrame(tick);
    };
    if (!typewriterFrame.current) {
      typewriterFrame.current = requestAnimationFrame(tick);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const rows = await listConversations(userId);
      setConversations(rows);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    setConversations([]);
    setMessages([]);
    setActiveId(null);
    setError(null);
    setUserIdInput(userId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    }
  }, [userId]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setError(null);
    try {
      const rows = await listMessages(id, userId);
      const ui: UIMessage[] = [];
      let pendingToolEvents: ToolEvent[] = [];

      for (const r of rows) {
        if (r.role === "user") {
          ui.push({ id: `user-${ui.length}`, role: "user", content: r.content });
          pendingToolEvents = [];
        } else if (r.role === "assistant") {
          const toolCalls = (r.metadata?.tool_calls ?? []) as Array<{
            name: string;
            args: Record<string, unknown>;
          }>;
          if (toolCalls.length > 0) {
            // Intermediate assistant message — collect tool calls, skip empty text
            for (const tc of toolCalls) {
              pendingToolEvents.push({ name: tc.name, args: tc.args });
            }
          } else {
            // Final assistant message with actual text content
            ui.push({
              id: `assistant-${ui.length}`,
              role: "assistant",
              content: r.content,
              toolEvents: pendingToolEvents.length > 0 ? [...pendingToolEvents] : undefined,
            });
            pendingToolEvents = [];
          }
        } else if (r.role === "tool") {
          const toolName = (r.metadata?.tool_name as string) ?? "unknown";
          const match = pendingToolEvents.find((e) => e.name === toolName && e.result === undefined);
          if (match) {
            match.result = r.content;
          }
        }
      }

      setMessages(ui);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [userId]);

  const handleApplyUserId = useCallback(() => {
    const next = userIdInput.trim();
    if (!next || next === userId) return;
    setUserId(next);
  }, [userId, userIdInput]);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (sending) return;
      setSending(true);
      setError(null);

      let conversationId = activeId;
      try {
        if (!conversationId) {
          const firstLine = content.split("\n")[0].slice(0, 60);
          const created = await createConversation({
            user_id: userId,
            title: firstLine,
          });
          conversationId = created.id;
          setActiveId(created.id);
          setConversations((prev) => [created, ...prev]);
        }
      } catch (err) {
        setSending(false);
        setError(err instanceof Error ? err.message : String(err));
        return;
      }

      const userMsgId = `u-${Date.now()}`;
      const assistantMsgId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content },
        { id: assistantMsgId, role: "assistant", content: "", streaming: true },
      ]);

      pendingToolEvents.current = [];
      typewriterQueue.current = "";
      if (typewriterFrame.current) {
        cancelAnimationFrame(typewriterFrame.current);
        typewriterFrame.current = null;
      }

      try {
        for await (const event of streamMessage({
          conversation_id: conversationId!,
          user_id: userId,
          content,
        })) {
          if (event.type === "chunk") {
            typewriterQueue.current += event.text;
            startTypewriter(assistantMsgId);
          } else if (event.type === "tool_call") {
            pendingToolEvents.current.push({
              name: event.name,
              args: event.args,
            });
            const snapshot = [...pendingToolEvents.current];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, toolEvents: snapshot } : m,
              ),
            );
          } else if (event.type === "tool_result") {
            const events = pendingToolEvents.current;
            const lastMatch = [...events]
              .reverse()
              .find((e) => e.name === event.name && e.result === undefined);
            if (lastMatch) lastMatch.result = event.content;
            const snapshot = [...events];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, toolEvents: snapshot } : m,
              ),
            );
          } else if (event.type === "final") {
            // Wait for typewriter to finish, then mark as complete
            const waitForTypewriter = () => {
              if (typewriterQueue.current.length > 0 || typewriterFrame.current !== null) {
                setTimeout(waitForTypewriter, 50);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, streaming: false } : m,
                  ),
                );
              }
            };
            waitForTypewriter();
          } else if (event.type === "error") {
            throw new Error(event.detail);
          }
        }

        await refreshConversations();
      } catch (err) {
        if (typewriterFrame.current) {
          cancelAnimationFrame(typewriterFrame.current);
          typewriterFrame.current = null;
        }
        typewriterQueue.current = "";
        setError(err instanceof Error ? err.message : String(err));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, streaming: false } : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [activeId, sending, refreshConversations, startTypewriter, userId],
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        userId={userId}
        conversations={conversations}
        activeConversationId={activeId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />
      <main className="flex flex-1 flex-col">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-[var(--color-text-dim)]">User ID</span>
            <input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onBlur={handleApplyUserId}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyUserId();
                }
              }}
              className="w-full max-w-xs rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              placeholder="Nhập user id để tách trí nhớ"
            />
            <button
              onClick={handleApplyUserId}
              className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-surface-soft)]"
              type="button"
            >
              Áp dụng
            </button>
          </div>
        </div>
        {error && (
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2 text-sm text-[var(--color-accent)]">
            {error}
          </div>
        )}
        {activeId === null && messages.length === 0 ? (
          <WelcomeScreen onSubmit={handleSubmit} disabled={sending} />
        ) : (
          <ChatScreen
            messages={messages}
            onSubmit={handleSubmit}
            disabled={sending}
            title={conversations.find((c) => c.id === activeId)?.title ?? undefined}
          />
        )}
      </main>
    </div>
  );
}
