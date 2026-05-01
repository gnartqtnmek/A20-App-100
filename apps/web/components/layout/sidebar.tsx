import Link from "next/link";

import { RoleBadge } from "@/components/ui/role-badge";
import { getRoleModules } from "@/lib/navigation";
import { ROLE_LABELS, type ModuleItem, type RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  modules: ModuleItem[];
  activeModuleKey: string;
  onNavigate?: () => void;
};

export function Sidebar({ role, modules, activeModuleKey, onNavigate }: Props) {
  const roleModules = modules.length > 0 ? modules : getRoleModules(role);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white py-8">
      <div className="px-6 pb-10">
        <h2 className="text-lg font-black tracking-tight text-blue-900">AcademicCore</h2>
        <p className="text-xs font-medium tracking-wide text-slate-500">{ROLE_LABELS[role]} Portal</p>
      </div>

      <div className="mb-3 flex items-center justify-between px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
        <RoleBadge role={role} />
      </div>

      <nav className="flex-1 space-y-1">
        {roleModules.map((module) => {
          const isActive = module.key === activeModuleKey;
          return (
            <Link
              key={module.key}
              href={module.route}
              onClick={onNavigate}
              className={`flex items-center gap-3 border-l-4 px-6 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-blue-900 bg-blue-50 text-blue-900"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-blue-800"
              }`}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isActive ? "bg-blue-700" : "bg-slate-300"}`} />
              <span className="truncate">{module.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 px-6 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Support</p>
        <p className="mt-1 text-xs text-slate-400">Stitch shell active</p>
      </div>
    </aside>
  );
}
