import Link from "next/link";

import { type ModuleItem } from "@/lib/roles";

type Props = {
  module: ModuleItem;
};

export function ModuleCard({ module }: Props) {
  return (
    <Link
      href={module.route}
      className="brainio-card group rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_26px_rgba(37,99,235,0.16)]"
    >
      <p className="text-sm font-semibold text-slate-900">{module.title}</p>
      <p className="mt-1 text-sm text-slate-600">{module.description}</p>
      <span className="mt-3 inline-flex text-xs font-semibold text-blue-600 group-hover:text-blue-700">Open module</span>
    </Link>
  );
}
