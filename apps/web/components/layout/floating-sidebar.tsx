import Link from "next/link";

import { ROLE_LABELS, type ModuleItem, type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  modules: ModuleItem[];
};

export function FloatingSidebar({ role, modules }: Props) {
  return (
    <aside className="w-full max-w-xs rounded-soft border border-white/35 bg-white/45 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Brainio Role</p>
      <h2 className="mt-2 text-2xl font-bold text-brand.night dark:text-white">{ROLE_LABELS[role]}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Floating Glass Sidebar</p>

      <nav className="mt-6 space-y-3">
        {modules.map((module) => (
          <Link
            key={module.key}
            href={module.route}
            className="block rounded-xl border border-white/50 bg-white/60 p-3 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70"
          >
            <p className="font-semibold">{module.title}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{module.description}</p>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
