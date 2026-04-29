import Link from "next/link";

import { type ModuleItem } from "@/lib/roles";

type Props = {
  modules: ModuleItem[];
};

export function ModuleGrid({ modules }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {modules.map((module) => (
        <Link
          key={module.key}
          href={module.route}
          className="group rounded-2xl border border-white/45 bg-white/75 p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/45"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-brand.rose">Module</p>
          <h3 className="mt-2 text-xl font-semibold text-brand.night transition group-hover:text-brand.sky dark:text-white">
            {module.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{module.description}</p>
        </Link>
      ))}
    </section>
  );
}
