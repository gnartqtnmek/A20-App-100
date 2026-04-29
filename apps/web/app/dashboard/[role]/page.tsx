"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { HeroCard } from "@/components/dashboard/hero-card";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ModuleGrid } from "@/components/dashboard/module-grid";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AcademicWorkspace } from "@/components/portal/academic-workspace";
import { AdminWorkspace } from "@/components/portal/admin-workspace";
import { AdvisorWorkspace } from "@/components/portal/advisor-workspace";
import { LecturerWorkspace } from "@/components/portal/lecturer-workspace";
import { NotificationsCenter } from "@/components/portal/notifications-center";
import { ReportsPanel } from "@/components/portal/reports-panel";
import { StudentWorkspace } from "@/components/portal/student-workspace";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { clearSession, readAccessToken, readStoredUser } from "@/lib/auth";
import { fetchDashboard, fetchModules, logoutRequest, meRequest } from "@/lib/api";
import { ROLE_LABELS, type AuthUser, type DashboardPayload, type ModuleItem, type RoleSlug } from "@/lib/roles";

const validRoles: RoleSlug[] = ["student", "lecturer", "admin", "academic_staff", "advisor"];

function isValidRole(role: string): role is RoleSlug {
  return validRoles.includes(role as RoleSlug);
}

export default function RoleDashboardPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const roleParam = params.role;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(readStoredUser());
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const accessToken = readAccessToken();

  const role = useMemo(() => {
    if (!roleParam || !isValidRole(roleParam)) return null;
    return roleParam;
  }, [roleParam]);

  useEffect(() => {
    let cancelled = false;
    async function loadProtectedData() {
      if (!role) {
        router.replace("/login");
        return;
      }
      const accessToken = readAccessToken();
      if (!accessToken) {
        clearSession();
        router.replace("/login");
        return;
      }

      try {
        const me = await meRequest(accessToken);
        if (cancelled) return;

        if (me.role !== "admin" && me.role !== role) {
          router.replace(`/dashboard/${me.role}`);
          return;
        }

        const [dashboardPayload, modulePayload] = await Promise.all([
          fetchDashboard(role, accessToken),
          fetchModules(role, accessToken)
        ]);
        if (cancelled) return;
        setCurrentUser(me);
        setDashboard(dashboardPayload);
        setModules(modulePayload);
      } catch {
        clearSession();
        router.replace("/login");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadProtectedData();
    return () => {
      cancelled = true;
    };
  }, [role, router]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const accessToken = readAccessToken();
      if (accessToken) {
        await logoutRequest(accessToken);
      }
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  if (isLoading || !role) {
    return (
      <main className="min-h-screen bg-brainio px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-soft border border-white/45 bg-white/75 p-6 text-slate-700 shadow-glass dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          Loading role workspace...
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen bg-brainio px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-soft border border-white/45 bg-white/75 p-6 text-rose-600 shadow-glass dark:border-white/10 dark:bg-slate-900/50 dark:text-rose-400">
          {error || "Cannot load dashboard right now."}
        </div>
      </main>
    );
  }

  return (
    <DashboardShell role={role} modules={modules}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Brainio Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-brand.night dark:text-white sm:text-4xl">
            {ROLE_LABELS[role]} Workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dashboard.header_subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/45 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <p className="font-semibold">{currentUser?.full_name ?? "Brainio User"}</p>
          <p className="text-xs">{currentUser?.email}</p>
          <div className="mt-2">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 rounded-lg bg-brand.night px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-70"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="space-y-5">
        <MetricsGrid metrics={dashboard.metrics} />
        <HeroCard
          title={dashboard.hero.title}
          subtitle={dashboard.hero.subtitle}
          ctaLabel={dashboard.hero.cta_label}
          ctaRoute={dashboard.hero.cta_route}
        />
        <section>
          <h2 className="mb-3 text-xl font-bold text-brand.night dark:text-white">Role Modules</h2>
          <ModuleGrid modules={dashboard.modules} />
        </section>
        {accessToken ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <NotificationsCenter accessToken={accessToken} />
            <ReportsPanel role={role} accessToken={accessToken} />
          </div>
        ) : null}
        {role === "student" && accessToken ? <StudentWorkspace accessToken={accessToken} /> : null}
        {role === "lecturer" && accessToken ? <LecturerWorkspace accessToken={accessToken} /> : null}
        {role === "admin" && accessToken ? <AdminWorkspace accessToken={accessToken} /> : null}
        {role === "academic_staff" && accessToken ? <AcademicWorkspace accessToken={accessToken} /> : null}
        {role === "advisor" && accessToken ? <AdvisorWorkspace accessToken={accessToken} /> : null}
      </div>
    </DashboardShell>
  );
}
