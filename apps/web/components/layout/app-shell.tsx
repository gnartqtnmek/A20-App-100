"use client";

import { type ReactNode, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { type ModuleItem, type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  modules: ModuleItem[];
  fullName: string;
  email: string;
  activeModuleKey: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  tools?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  role,
  modules,
  fullName,
  email,
  activeModuleKey,
  isLoggingOut,
  onLogout,
  tools,
  children
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar role={role} modules={modules} activeModuleKey={activeModuleKey} />
      </div>

      {mobileOpen ? (
        <>
          <button type="button" onClick={closeMobile} className="fixed inset-0 z-30 bg-black/25 lg:hidden" aria-label="Close navigation" />
          <div className="fixed bottom-4 left-4 top-4 z-40 w-[88vw] max-w-[320px] lg:hidden">
            <Sidebar role={role} modules={modules} activeModuleKey={activeModuleKey} onNavigate={closeMobile} />
          </div>
        </>
      ) : null}

      <div className="lg:pl-64">
        <Topbar
          role={role}
          fullName={fullName}
          email={email}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
          onOpenSidebar={() => setMobileOpen(true)}
          tools={tools}
        />
        <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
          <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Brainio Stitch UI Active
          </p>
        </main>
      </div>
    </div>
  );
}
