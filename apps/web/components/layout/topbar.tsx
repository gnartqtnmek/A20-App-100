import { type ReactNode } from "react";

import { type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  fullName: string;
  email: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onOpenSidebar: () => void;
  tools?: ReactNode;
};

function initialFromName(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "B";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.65 16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V10a6 6 0 10-12 0v4.2a2 2 0 01-.6 1.4L4 17h5" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-4.5A4 4 0 0 1 3 15V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function Topbar({ role, fullName, email, isLoggingOut, onLogout, onOpenSidebar, tools }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 lg:hidden"
          >
            Menu
          </button>
          <h2 className="text-2xl font-semibold text-[#001733]">Dashboard</h2>
        </div>

        <div className="hidden flex-1 lg:block">
          <div className="relative ml-6 max-w-[360px]">
            <input
              placeholder="Search lessons..."
              className="h-10 w-full rounded-xl border border-[#c3c6d0] bg-[#f4f3f8] px-3 pl-9 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-900/20"
            />
            <span className="absolute left-3 top-3 text-slate-400">
              <SearchIcon />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tools}
          <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <BellIcon />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Calendar">
            <CalendarIcon />
          </button>
          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Messages">
            <ChatIcon />
          </button>
          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-[#001733]">{fullName}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{role.replace("_", " ")} account</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 md:inline-flex disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
          <div
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#d5e3ff] bg-blue-600 text-xs font-bold text-white"
            title={email}
          >
            {initialFromName(fullName)}
          </div>
        </div>
      </div>
    </header>
  );
}
