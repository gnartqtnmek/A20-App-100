import type {
  Conversation,
  ConversationMessageResponse,
  MessageRow,
  StreamEvent,
} from "./types";

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return (await response.json()) as T;
}

export function createConversation(input: {
  user_id: string;
  title?: string | null;
}): Promise<Conversation> {
  return jsonRequest<Conversation>("/v1/conversations", {
    method: "POST",
    body: JSON.stringify({
      user_id: input.user_id,
      title: input.title ?? null,
      context: {},
    }),
  });
}

export function listConversations(userId: string): Promise<Conversation[]> {
  return jsonRequest<Conversation[]>(
    `/v1/users/${encodeURIComponent(userId)}/conversations`,
  );
}

export function listMessages(
  conversationId: string,
  userId: string,
): Promise<MessageRow[]> {
  const qs = new URLSearchParams({ user_id: userId, limit: "200" });
  return jsonRequest<MessageRow[]>(
    `/v1/conversations/${encodeURIComponent(conversationId)}/messages?${qs}`,
  );
}

export function sendMessage(input: {
  conversation_id: string;
  user_id: string;
  content: string;
}): Promise<ConversationMessageResponse> {
  return jsonRequest<ConversationMessageResponse>(
    `/v1/conversations/${encodeURIComponent(input.conversation_id)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        user_id: input.user_id,
        content: input.content,
      }),
    },
  );
}

export async function* streamMessage(input: {
  conversation_id: string;
  user_id: string;
  content: string;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent, void, unknown> {
  const response = await fetch(
    `/v1/conversations/${encodeURIComponent(input.conversation_id)}/messages/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: input.user_id,
        content: input.content,
      }),
      signal: input.signal,
    },
  );

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Stream failed: ${response.status} ${response.statusText} ${body}`,
    );
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
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }
  return { type: eventName, ...payload } as StreamEvent;
}
