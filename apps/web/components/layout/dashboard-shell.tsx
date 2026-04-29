import { ReactNode } from "react";

import { FloatingSidebar } from "@/components/layout/floating-sidebar";
import { type ModuleItem, type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  modules: ModuleItem[];
  children: ReactNode;
};

export function DashboardShell({ role, modules, children }: Props) {
  return (
    <div className="min-h-screen bg-brainio px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <FloatingSidebar role={role} modules={modules} />
        <main className="rounded-soft border border-white/40 bg-white/55 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
