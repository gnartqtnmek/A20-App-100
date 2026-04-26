import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageItem, type UIMessage } from "./MessageItem";

interface ChatScreenProps {
  messages: UIMessage[];
  onSubmit: (content: string) => void;
  disabled?: boolean;
  title?: string;
}

export function ChatScreen({ messages, onSubmit, disabled, title }: ChatScreenProps) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {title && (
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-canvas)] px-6 py-3">
          <span className="truncate text-sm font-medium text-[var(--color-ink)]">{title}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 bg-[var(--color-canvas)] px-6 pb-2 pt-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            disabled={disabled}
            placeholder="Reply..."
            autoFocus
          />
          <p className="mt-2 text-center text-xs text-[var(--color-ink-subtle)]">
            Agent có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  );
}
