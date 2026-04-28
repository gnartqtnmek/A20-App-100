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
import { ACCESS_TOKEN_STORAGE_KEY } from "./lib/constants";

const TYPEWRITER_CHARS_PER_FRAME = 2;
const TYPEWRITER_FRAME_SKIP = 1;

function resolveUserLabel(): string {
  if (typeof window === "undefined") return "Unauthenticated";
  const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!token) return "Unauthenticated";
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized));
    return String(parsed.sub ?? parsed.email ?? "Authenticated");
  } catch {
    return "Authenticated";
  }
}

export default function App() {
  const [userLabel] = useState<string>(resolveUserLabel);
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
      const rows = await listConversations({ page: 1, limit: 50 });
      setConversations(rows);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setError(null);
    try {
      const envelope = await listMessages(id, { page: 1, limit: 200 });
      const rows = envelope.messages;
      const ui: UIMessage[] = [];
      let pending: ToolEvent[] = [];

      for (const row of rows) {
        if (row.role === "user") {
          ui.push({ id: `user-${ui.length}`, role: "user", content: row.content });
          pending = [];
        } else if (row.role === "assistant") {
          const toolCalls = (row.metadata?.tool_calls ?? []) as Array<{
            name: string;
            args: Record<string, unknown>;
          }>;
          if (toolCalls.length > 0) {
            for (const tc of toolCalls) {
              pending.push({ name: tc.name, args: tc.args });
            }
          } else {
            ui.push({
              id: `assistant-${ui.length}`,
              role: "assistant",
              content: row.content,
              toolEvents: pending.length > 0 ? [...pending] : undefined,
            });
            pending = [];
          }
        } else if (row.role === "tool") {
          const toolName = (row.metadata?.tool_name as string) ?? "unknown";
          const match = pending.find((e) => e.name === toolName && e.result === undefined);
          if (match) match.result = row.content;
        }
      }
      setMessages(ui);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (sending) return;
      setSending(true);
      setError(null);

      let conversationId = activeId;
      try {
        if (!conversationId) {
          const firstLine = content.split("\n")[0].slice(0, 60);
          const created = await createConversation({ title: firstLine });
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
        for await (const event of streamMessage({ conversation_id: conversationId!, content })) {
          if (event.type === "token") {
            typewriterQueue.current += event.content;
            startTypewriter(assistantMsgId);
          } else if (event.type === "tool_call_start") {
            pendingToolEvents.current.push({
              name: event.tool_name,
              result: event.display_message,
            });
            const snapshot = [...pendingToolEvents.current];
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, toolEvents: snapshot } : m)),
            );
          } else if (event.type === "tool_result") {
            const match = [...pendingToolEvents.current]
              .reverse()
              .find((e) => e.name === event.tool_name);
            if (match && event.summary) match.result = event.summary;
            const snapshot = [...pendingToolEvents.current];
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, toolEvents: snapshot } : m)),
            );
          } else if (event.type === "tool_call_end") {
            pendingToolEvents.current = pendingToolEvents.current.map((e) =>
              e.name === event.tool_name ? { ...e, result: e.result ?? "Done" } : e,
            );
            const snapshot = [...pendingToolEvents.current];
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, toolEvents: snapshot } : m)),
            );
          } else if (event.type === "done") {
            const waitForTypewriter = () => {
              if (typewriterQueue.current.length > 0 || typewriterFrame.current !== null) {
                setTimeout(waitForTypewriter, 50);
              } else {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)),
                );
              }
            };
            waitForTypewriter();
          } else if (event.type === "error") {
            throw new Error(event.message);
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
          prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)),
        );
      } finally {
        setSending(false);
      }
    },
    [activeId, refreshConversations, sending, startTypewriter],
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        userId={userLabel}
        conversations={conversations}
        activeConversationId={activeId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />
      <main className="flex flex-1 flex-col">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2 text-sm text-[var(--color-text-dim)]">
          Authenticated as: {userLabel}
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

