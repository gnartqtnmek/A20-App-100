export interface Conversation {
  id: string;
  user_id: string;
  course_id?: string | null;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  message_count?: number;
}

export interface MessageRow {
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MessagesEnvelope {
  conversation: Conversation;
  messages: MessageRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ConversationMessageResponse {
  conversation_id: string;
  run_id: string;
  turn_index: number;
  assistant_message: string;
  tool_trace_summary: string[];
}

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_call_start"; tool_name: string; display_message?: string }
  | { type: "tool_result"; tool_name: string; summary?: string }
  | { type: "tool_call_end"; tool_name: string }
  | { type: "done"; message_id: string; tokens_used?: number; model_used?: string }
  | { type: "error"; error_code?: string; message: string };
