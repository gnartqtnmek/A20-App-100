import { ACCESS_TOKEN_STORAGE_KEY } from "../lib/constants";
import type {
  Conversation,
  ConversationMessageResponse,
  MessagesEnvelope,
  PaginatedResponse,
  StreamEvent,
} from "./types";

const API_BASE = "/api/v1";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init ?? {});
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init?.headers),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function createConversation(input: {
  title?: string | null;
  course_id?: string | null;
}): Promise<Conversation> {
  return jsonRequest<Conversation>(`${API_BASE}/conversations`, {
    method: "POST",
    body: JSON.stringify({
      title: input.title ?? null,
      course_id: input.course_id ?? null,
    }),
  });
}

export async function listConversations(params?: {
  page?: number;
  limit?: number;
}): Promise<Conversation[]> {
  const qs = new URLSearchParams();
  qs.set("page", String(params?.page ?? 1));
  qs.set("limit", String(params?.limit ?? 50));
  const result = await jsonRequest<PaginatedResponse<Conversation>>(
    `${API_BASE}/conversations?${qs.toString()}`,
  );
  return result.items;
}

export async function listMessages(
  conversationId: string,
  params?: { page?: number; limit?: number },
): Promise<MessagesEnvelope> {
  const qs = new URLSearchParams();
  qs.set("page", String(params?.page ?? 1));
  qs.set("limit", String(params?.limit ?? 200));
  return jsonRequest<MessagesEnvelope>(
    `${API_BASE}/conversations/${encodeURIComponent(conversationId)}/messages?${qs.toString()}`,
  );
}

export function sendMessage(input: {
  conversation_id: string;
  content: string;
}): Promise<ConversationMessageResponse> {
  return jsonRequest<ConversationMessageResponse>(
    `${API_BASE}/conversations/${encodeURIComponent(input.conversation_id)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.content,
      }),
    },
  );
}

export async function* streamMessage(input: {
  conversation_id: string;
  content: string;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent, void, unknown> {
  const response = await fetch(
    `${API_BASE}/conversations/${encodeURIComponent(input.conversation_id)}/messages/stream`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ content: input.content }),
      signal: input.signal,
    },
  );

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new Error(`Stream failed: ${response.status} ${response.statusText} ${body}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const parsed = parseSseBlock(raw);
      if (parsed) yield parsed;
    }
  }
}

function parseSseBlock(block: string): StreamEvent | null {
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  const dataText = dataLines.join("\n");
  if (dataText === "[DONE]") return null;

  try {
    return JSON.parse(dataText) as StreamEvent;
  } catch {
    return null;
  }
}

