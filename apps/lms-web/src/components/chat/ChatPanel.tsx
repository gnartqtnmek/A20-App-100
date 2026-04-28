"use client";

import { useEffect, useRef, useState } from "react";

import { useChat } from "@/hooks/useChat";
import { MessageBubble, StreamingBubble } from "./MessageBubble";

type Props = {
  courseId?: string;
  sessionId?: string;
  className?: string;
};

export function ChatPanel({ courseId, sessionId, className = "" }: Props) {
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    initSession,
    stopStreaming,
    clearError,
  } = useChat(courseId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initSession(sessionId);
    return () => stopStreaming();
  }, [initSession, sessionId, stopStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await sendMessage(trimmed);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className={`flex flex-col bg-neutral-50 ${className}`}>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center text-center text-neutral-400">
            <svg className="mb-3 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">Tro ly AI hoc tap</p>
            <p className="mt-1 text-xs">Hoi bat cu dieu gi ve bai hoc, bai tap hoac mon hoc.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && <StreamingBubble content={streamingContent} />}

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              x
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhap cau hoi... (Enter de gui, Shift+Enter xuong dong)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Gui"
          >
            <svg className="h-4 w-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
          {isStreaming && (
            <button
              type="button"
              onClick={stopStreaming}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              Dung
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
