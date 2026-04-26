import { Code2, GraduationCap, Lightbulb, PencilLine } from "lucide-react";
import { useState } from "react";
import { ChatInput } from "./ChatInput";

const QUICK_ACTIONS = [
  { label: "Write", icon: PencilLine, prompt: "Giúp tôi viết " },
  { label: "Learn", icon: GraduationCap, prompt: "Giải thích cho tôi về " },
  { label: "Code", icon: Code2, prompt: "Viết code để " },
  { label: "Ý tưởng", icon: Lightbulb, prompt: "Đề xuất vài ý tưởng về " },
];

interface WelcomeScreenProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
}

export function WelcomeScreen({ onSubmit, disabled }: WelcomeScreenProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-10 text-center font-serif text-4xl font-normal tracking-tight text-[var(--color-ink)] md:text-5xl">
        <span className="mr-3 text-[var(--color-accent)]">✻</span>
        Bắt đầu suy nghĩ cùng nhau
      </h1>

      <ChatInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        disabled={disabled}
        autoFocus
      />

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => setValue(prompt)}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
