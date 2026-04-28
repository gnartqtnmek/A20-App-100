import type { ChatMessageRead } from "@/lib/types";

type Props = {
  message: ChatMessageRead;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="mr-2 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-blue-600 text-white"
            : "rounded-tl-sm bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${isUser ? "text-blue-200" : "text-neutral-400"}`}>
          {new Date(message.created_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="mb-3 flex justify-start">
      <div className="mr-2 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        AI
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ring-neutral-200">
        {content ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <span className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
}
