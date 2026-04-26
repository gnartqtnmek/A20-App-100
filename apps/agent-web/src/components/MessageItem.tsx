import { ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents?: ToolEvent[];
  streaming?: boolean;
}

export interface ToolEvent {
  name: string;
  args?: Record<string, unknown>;
  result?: string;
}

export function MessageItem({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-[var(--color-user-bubble)] px-5 py-3 text-[var(--color-ink)] text-[15px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const visibleContent = message.content
    .replace(/\{[\s\S]*?"type"\s*:\s*"tool_use"[\s\S]*?\}/g, "")
    .trim();

  return (
    <div className="flex flex-col gap-3">
      {message.toolEvents && message.toolEvents.length > 0 && (
        <ToolEventsList events={message.toolEvents} />
      )}
      {(visibleContent || message.streaming) && (
        <div className="whitespace-pre-wrap text-[var(--color-ink)] text-[15px] leading-relaxed">
          {visibleContent}
          {message.streaming && (
            <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-[var(--color-ink)] align-middle" />
          )}
        </div>
      )}
    </div>
  );
}

function ToolEventsList({ events }: { events: ToolEvent[] }) {
  const [open, setOpen] = useState(false);

  const label =
    events.length === 1 ? `Used ${events[0].name}` : `Used ${events.length} tools`;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
      >
        <Wrench className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
        />
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={cn(
                "px-3 py-2.5",
                idx > 0 && "border-t border-[var(--color-border)]",
              )}
            >
              <div className="mb-1.5 font-mono text-sm text-[var(--color-accent)]">
                {event.name}
              </div>
              {event.args && Object.keys(event.args).length > 0 && (
                <pre className="mb-1.5 overflow-x-auto rounded bg-[var(--color-canvas)] p-2 font-mono text-[11px] text-[var(--color-ink-muted)]">
                  {JSON.stringify(event.args, null, 2)}
                </pre>
              )}
              {event.result && (
                <div className="max-h-48 overflow-auto rounded bg-[var(--color-canvas)] p-2 font-mono text-[11px] text-[var(--color-ink-muted)] whitespace-pre-wrap">
                  {event.result}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
