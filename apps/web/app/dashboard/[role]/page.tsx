"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { AcademicWorkspace } from "@/components/portal/academic-workspace";
import { AdminWorkspace } from "@/components/portal/admin-workspace";
import { AdvisorWorkspace } from "@/components/portal/advisor-workspace";
import { LecturerWorkspace } from "@/components/portal/lecturer-workspace";
import { NotificationsCenter } from "@/components/portal/notifications-center";
import { ReportsPanel } from "@/components/portal/reports-panel";
import { StudentWorkspace } from "@/components/portal/student-workspace";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchDashboard, logoutRequest } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { getDefaultModule, getRoleModules } from "@/lib/navigation";
import { pathSegmentToRole, roleToPathSegment } from "@/lib/route-role";
import { DASHBOARD_FALLBACK, type DashboardPayload, type RoleSlug } from "@/lib/roles";

function RoleDashboardContent({
  role,
  roleSegment,
  accessToken,
  fullName,
  email
}: {
  role: RoleSlug;
  roleSegment: string;
  accessToken: string;
  fullName: string;
  email: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canonicalRoleSegment = roleToPathSegment(role);

  const modules = useMemo(() => getRoleModules(role), [role]);
  const moduleParam = searchParams.get("module");

  useEffect(() => {
    if (roleSegment === canonicalRoleSegment) return;
    const query = searchParams.toString();
    router.replace(`/dashboard/${canonicalRoleSegment}${query ? `?${query}` : ""}`);
  }, [canonicalRoleSegment, roleSegment, router, searchParams]);

  useEffect(() => {
    const validModuleKeys = new Set(modules.map((module) => module.key));
    if (!moduleParam || !validModuleKeys.has(moduleParam)) {
      router.replace(`/dashboard/${canonicalRoleSegment}?module=${getDefaultModule(role)}`);
    }
  }, [canonicalRoleSegment, moduleParam, modules, role, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoadingDashboard(true);
      try {
        const data = await fetchDashboard(role, accessToken);
        if (!cancelled) setDashboard(data);
      } catch {
        if (!cancelled) setDashboard(DASHBOARD_FALLBACK[role]);
      } finally {
        if (!cancelled) setIsLoadingDashboard(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessToken, role]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutRequest(accessToken);
    } catch {
      // noop
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  const activeModule = useMemo(() => {
    if (moduleParam && modules.some((item) => item.key === moduleParam)) {
      return moduleParam;
    }
    return getDefaultModule(role);
  }, [moduleParam, modules, role]);

  if (isLoadingDashboard) {
    return <LoadingState label="Loading dashboard data..." />;
  }

  if (!dashboard) {
    return <ErrorState description="Cannot load dashboard right now." />;
  }

  return (
    <AppShell
      role={role}
      modules={modules}
      fullName={fullName}
      email={email}
      activeModuleKey={activeModule}
      isLoggingOut={isLoggingOut}
      onLogout={() => void handleLogout()}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {role === "student" ? (
            <StudentWorkspace accessToken={accessToken} activeModule={activeModule} dashboard={dashboard} modules={modules} />
          ) : null}
          {role === "lecturer" ? (
            <LecturerWorkspace accessToken={accessToken} activeModule={activeModule} dashboard={dashboard} modules={modules} />
          ) : null}
          {role === "admin" ? (
            <AdminWorkspace accessToken={accessToken} activeModule={activeModule} dashboard={dashboard} modules={modules} />
          ) : null}
          {role === "academic_staff" ? (
            <AcademicWorkspace accessToken={accessToken} activeModule={activeModule} dashboard={dashboard} modules={modules} />
          ) : null}
          {role === "advisor" ? (
            <AdvisorWorkspace accessToken={accessToken} activeModule={activeModule} dashboard={dashboard} modules={modules} />
          ) : null}
        </div>

        <aside className="space-y-5">
          <NotificationsCenter accessToken={accessToken} />
          <ReportsPanel role={role} accessToken={accessToken} />
        </aside>
      </div>
    </AppShell>
  );
}

export default function RoleDashboardPage() {
  const params = useParams<{ role: string }>();
  const roleSegment = params.role;
  const roleParam = pathSegmentToRole(roleSegment);

  if (!roleParam) {
    return <ErrorState description="Unsupported role route." />;
  }

  return (
    <ProtectedRoute role={roleParam}>
      {({ user, accessToken }) => (
        <RoleDashboardContent
          role={roleParam}
          roleSegment={roleSegment}
          accessToken={accessToken}
          fullName={user.full_name}
          email={user.email}
        />
      )}
    </ProtectedRoute>
  );
}
