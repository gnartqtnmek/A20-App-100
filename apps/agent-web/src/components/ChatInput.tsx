import { ArrowUp, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { DEFAULT_MODEL_LABEL } from "../lib/constants";
import { cn } from "../lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "How can I help you today?",
  autoFocus,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim().length > 0) onSubmit();
    }
  }

  const canSubmit = !disabled && value.trim().length > 0;

  return (
    <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow focus-within:shadow-md">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className={cn(
          "w-full resize-none bg-transparent px-5 pt-4 pb-2 text-base text-[var(--color-ink)] outline-none",
          "placeholder:text-[var(--color-ink-subtle)]",
        )}
      />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <button
          type="button"
          disabled
          className="rounded-full p-2 text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Đính kèm"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-hover)] disabled:cursor-default"
          >
            {DEFAULT_MODEL_LABEL}
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              canSubmit
                ? "bg-[var(--color-ink)] text-[var(--color-canvas)] hover:bg-[var(--color-ink-muted)]"
                : "bg-[var(--color-border)] text-[var(--color-ink-subtle)]",
            )}
            aria-label="Gửi"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
