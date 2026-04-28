"use client";

import { useCallback, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { ChatMessageRead, ChatSessionRead } from "@/lib/types";

type ChatState = {
  session: ChatSessionRead | null;
  messages: ChatMessageRead[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
};

function buildFallbackSession(sessionId: string, previous: ChatSessionRead | null): ChatSessionRead {
  const now = new Date().toISOString();
  return {
    id: sessionId,
    user_id: previous?.user_id ?? "",
    title: previous?.title ?? null,
    last_active_at: previous?.last_active_at ?? now,
    summarised_at: previous?.summarised_at ?? null,
    created_at: previous?.created_at ?? now,
    updated_at: previous?.updated_at ?? now,
  };
}

export function useChat(courseId?: string) {
  const [state, setState] = useState<ChatState>({
    session: null,
    messages: [],
    streamingContent: "",
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const initSession = useCallback(async (existingSessionId?: string) => {
    try {
      if (existingSessionId) {
        const messages = await apiClient.getChatMessages(existingSessionId);
        setState((current) => ({
          ...current,
          session:
            current.session?.id === existingSessionId
              ? current.session
              : buildFallbackSession(existingSessionId, current.session),
          messages,
        }));
        return;
      }

      const session = await apiClient.createChatSession();
      setState((current) => ({ ...current, session, messages: [] }));
    } catch (err) {
      setState((current) => ({
        ...current,
        error: err instanceof Error ? err.message : "Khong the khoi tao chat.",
      }));
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isStreaming) return;

      let sessionId = state.session?.id;
      if (!sessionId) {
        const session = await apiClient.createChatSession();
        setState((current) => ({ ...current, session }));
        sessionId = session.id;
      }

      const tempUserMsg: ChatMessageRead = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content,
        tool_name: null,
        extra: null,
        tokens_used: null,
        created_at: new Date().toISOString(),
      };

      setState((current) => ({
        ...current,
        messages: [...current.messages, tempUserMsg],
        streamingContent: "",
        isStreaming: true,
        error: null,
      }));

      abortRef.current = new AbortController();

      try {
        const response = await apiClient.streamChatMessage(
          sessionId,
          content,
          courseId,
          abortRef.current.signal,
        );

        if (!response.ok) {
          throw new Error(`Yeu cau chat that bai (${response.status}).`);
        }

        if (!response.body) {
          throw new Error("No response body for stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const payload = JSON.parse(line.slice(6)) as { delta?: string };
              if (!payload.delta) continue;

              accumulated += payload.delta;
              setState((current) => ({ ...current, streamingContent: accumulated }));
            } catch {
              // Ignore malformed SSE payloads.
            }
          }
        }

        const finalMsg: ChatMessageRead = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: accumulated,
          tool_name: null,
          extra: null,
          tokens_used: null,
          created_at: new Date().toISOString(),
        };

        setState((current) => ({
          ...current,
          messages: [...current.messages, finalMsg],
          streamingContent: "",
          isStreaming: false,
        }));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setState((current) => ({
          ...current,
          isStreaming: false,
          streamingContent: "",
          error: err instanceof Error ? err.message : "Loi ket noi.",
        }));
      } finally {
        abortRef.current = null;
      }
    },
    [courseId, state.isStreaming, state.session?.id],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((current) => ({ ...current, isStreaming: false, streamingContent: "" }));
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return { ...state, initSession, sendMessage, stopStreaming, clearError };
}
