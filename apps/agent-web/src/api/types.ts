export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  context: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, unknown>;
}

export interface ConversationMessageResponse {
  conversation_id: string;
  run_id: string;
  turn_index: number;
  assistant_message: string;
  tool_trace_summary: string[];
}

export type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; content: string }
  | {
      type: "final";
      conversation_id: string;
      run_id: string;
      turn_index: number;
      assistant_message: string;
      tool_trace_summary: string[];
    }
  | { type: "error"; detail: string };
