import { PanelLeft, Plus, Search, Settings2, User } from "lucide-react";
import type { Conversation } from "../api/types";
import { DEFAULT_USER_ID } from "../lib/constants";
import { cn } from "../lib/utils";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  collapsed,
  onToggleCollapse,
  onNewChat,
  onSelectConversation,
}: SidebarProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-2 border-r border-[var(--color-border)] bg-[var(--color-canvas)] py-4">
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-hover)]"
          aria-label="Mở sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onNewChat}
          className="rounded-md p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-hover)]"
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-canvas)]">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-serif text-xl tracking-tight">Agent</span>
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-hover)]"
          aria-label="Thu gọn sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        <SidebarButton icon={<Plus className="h-4 w-4" />} onClick={onNewChat}>
          New chat
        </SidebarButton>
        <SidebarButton icon={<Search className="h-4 w-4" />} disabled>
          Search
        </SidebarButton>
        <SidebarButton icon={<Settings2 className="h-4 w-4" />} disabled>
          Customize
        </SidebarButton>
      </nav>

      <div className="mt-4 flex-1 overflow-y-auto px-2 pb-2">
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
          Recents
        </div>
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-[var(--color-ink-subtle)]">
            Chưa có cuộc trò chuyện nào
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelectConversation(c.id)}
                  className={cn(
                    "w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeConversationId === c.id
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-ink)]"
                      : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]",
                  )}
                  title={c.title ?? "Cuộc trò chuyện không tên"}
                >
                  {c.title?.trim() || "Cuộc trò chuyện mới"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-[var(--color-border)] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm text-[var(--color-canvas)]">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{DEFAULT_USER_ID}</div>
          <div className="text-xs text-[var(--color-ink-subtle)]">Free plan</div>
        </div>
      </div>
    </aside>
  );
}

function SidebarButton({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--color-ink-muted)] transition-colors",
        "hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
      )}
    >
      <span className="text-[var(--color-ink-subtle)]">{icon}</span>
      {children}
    </button>
  );
}
