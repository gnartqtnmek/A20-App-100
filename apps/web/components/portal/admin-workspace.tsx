"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  academicExamApprovals,
  academicGradeApprovals,
  adminCourses,
  adminCreateCourse,
  adminCreateDepartment,
  adminEnrollmentAction,
  adminCreateProgram,
  adminCreateSemester,
  adminCreateUser,
  adminDepartments,
  adminPermissions,
  adminPrograms,
  adminRoles,
  adminSections,
  adminSemesters,
  adminSystemReport,
  adminUpdateRolePermissions,
  adminUpdateUser,
  adminUsers,
  announcements,
  auditLogs,
  createAnnouncement,
  uploadedFiles
} from "@/lib/api";
import type {
  AdminUserItem,
  AuditLogItem,
  CourseItem,
  DepartmentItem,
  EnrollmentActionResult,
  ExamApprovalItem,
  GradeApprovalItem,
  PermissionItem,
  ProgramItem,
  RoleItem,
  SectionItem,
  SemesterItem,
  UploadedFileItem
} from "@/lib/lms";
import { type DashboardPayload, type ModuleItem, type RoleSlug } from "@/lib/roles";

type Props = {
  accessToken: string;
  activeModule: string;
  dashboard: DashboardPayload;
  modules: ModuleItem[];
};

const roleOptions: RoleSlug[] = ["student", "lecturer", "admin", "academic_staff", "advisor"];

function toneByStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("approved") || normalized.includes("done") || normalized.includes("pass")) {
    return "text-[#2f7f4c]";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("open") || normalized.includes("draft")) {
    return "text-[#5f7198]";
  }
  if (normalized.includes("risk") || normalized.includes("high") || normalized.includes("fail") || normalized.includes("locked")) {
    return "text-[#b33a52]";
  }
  return "text-[#5f7198]";
}

function matchText(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

function QuickActionStrip({ quick, filter, exportText }: { quick: string; filter: string; exportText: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Quick action</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{quick}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Filter</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{filter}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#c8e4de]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Export</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{exportText}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function AnalyticsSection({
  insights,
  recommendation
}: {
  insights: { signal: string; action: string }[];
  recommendation: string;
}) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
          <p className="text-4xl font-bold leading-none text-[#151b2d]">Analytics chart area</p>
          <div className="mt-6 flex h-44 items-end gap-5">
            {[38, 66, 49, 82, 60, 88, 71].map((value, idx) => (
              <div
                key={`${value}-${idx}`}
                className={`w-10 rounded-t-2xl ${idx % 2 === 0 ? "bg-[#8443df]" : "bg-[#3864e7]"}`}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </article>

        <DataTable
          title="Insights"
          columns={[
            { key: "signal", header: "Signal", render: (row: { signal: string; action: string }) => row.signal },
            { key: "action", header: "Action", render: (row: { signal: string; action: string }) => row.action }
          ]}
          rows={insights}
          rowKey={(row) => `${row.signal}-${row.action}`}
          emptyTitle="No insights"
        />
      </div>

      <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
        <div className="flex gap-3">
          <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ede5ce]" />
          <div>
            <p className="text-2xl font-bold text-[#151b2d]">Recommendation</p>
            <p className="text-sm text-[#6f7f9f]">{recommendation}</p>
          </div>
        </div>
      </article>
    </>
  );
}

export function AdminWorkspace({ accessToken, activeModule, dashboard, modules }: Props) {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userMeta, setUserMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [activeUserId, setActiveUserId] = useState("");

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logsMeta, setLogsMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [reportItems, setReportItems] = useState<{ key: string; value: string }[]>([]);
  const [uploadedRows, setUploadedRows] = useState<UploadedFileItem[]>([]);
  const [examApprovals, setExamApprovals] = useState<ExamApprovalItem[]>([]);
  const [gradeApprovals, setGradeApprovals] = useState<GradeApprovalItem[]>([]);
  const [announcementRows, setAnnouncementRows] = useState<{ id: string; title: string; target_role: string }[]>([]);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "Brainio@123",
    role: "student" as RoleSlug
  });

  const [profileDraft, setProfileDraft] = useState({
    full_name: "",
    email: "",
    role: "student" as RoleSlug,
    department_id: "",
    account_status: "active"
  });

  const [departmentForm, setDepartmentForm] = useState({ code: "", name: "", description: "" });
  const [programForm, setProgramForm] = useState({ code: "", name: "", total_credits: "120" });
  const [courseForm, setCourseForm] = useState({ code: "", name: "", credits: "3", description: "" });
  const [semesterForm, setSemesterForm] = useState({
    academic_year: "2026-2027",
    semester_name: "Semester 1",
    start_date: "",
    end_date: "",
    exam_period: "Week 16"
  });
  const [enrollmentForm, setEnrollmentForm] = useState({
    student_list: "",
    target_section: "",
    action_type: "move",
    reason: "",
    effective_date: ""
  });
  const [enrollmentResult, setEnrollmentResult] = useState<EnrollmentActionResult | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    message: "",
    audience: "student",
    schedule: "",
    channels: "in_app"
  });
  const [integrationForm, setIntegrationForm] = useState({
    provider: "",
    api_key: "",
    webhook_url: "",
    sync_frequency: "",
    error_policy: ""
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [permissionInput, setPermissionInput] = useState("");

  const selectedUser = useMemo(() => users.find((item) => item.id === activeUserId) ?? null, [users, activeUserId]);

  const filteredUsers = useMemo(
    () => users.filter((item) => matchText(`${item.full_name} ${item.email} ${item.role}`, search)),
    [users, search]
  );

  const filteredCourses = useMemo(
    () => courses.filter((item) => matchText(`${item.code} ${item.name} ${item.credits}`, search)),
    [courses, search]
  );

  const filteredSections = useMemo(
    () => sections.filter((item) => matchText(`${item.code} ${item.semester} ${item.status}`, search)),
    [sections, search]
  );

  const filteredDepartments = useMemo(
    () => departments.filter((item) => matchText(`${item.code} ${item.name}`, search)),
    [departments, search]
  );

  const filteredPrograms = useMemo(
    () => programs.filter((item) => matchText(`${item.code} ${item.name}`, search)),
    [programs, search]
  );

  async function loadUsers(page = userMeta.page) {
    const payload = await adminUsers(accessToken, page, userMeta.limit);
    setUsers(payload.items);
    setUserMeta({ page: payload.page, limit: payload.limit, total: payload.total });
    if (payload.items.length > 0 && !activeUserId) {
      setActiveUserId(payload.items[0].id);
    }
  }

  async function loadLogs(page = 1, action = "") {
    const payload = await auditLogs(accessToken, page, logsMeta.limit, action);
    setLogs(payload.items);
    setLogsMeta(payload.meta);
  }

  async function loadCoreData() {
    const [roleData, permissionData, departmentData, programData, courseData, sectionData, semesterData, systemData, fileData, examData, gradeData, announcementData] =
      await Promise.all([
        adminRoles(accessToken),
        adminPermissions(accessToken),
        adminDepartments(accessToken, 1, 100),
        adminPrograms(accessToken, 1, 100),
        adminCourses(accessToken, 1, 100),
        adminSections(accessToken, 1, 100),
        adminSemesters(accessToken, 1, 100),
        adminSystemReport(accessToken),
        uploadedFiles(accessToken, 1, 100),
        academicExamApprovals(accessToken),
        academicGradeApprovals(accessToken),
        announcements(accessToken)
      ]);

    setRoles(roleData.items);
    setPermissions(permissionData.items);
    setDepartments(departmentData.items);
    setPrograms(programData.items);
    setCourses(courseData.items);
    setSections(sectionData.items);
    setSemesters(semesterData.items);
    setReportItems(systemData.items);
    setUploadedRows(fileData.items);
    setExamApprovals(examData.items);
    setGradeApprovals(gradeData.items);
    setAnnouncementRows(announcementData.items.map((item) => ({ id: item.id, title: item.title, target_role: item.target_role })));

    if (!selectedRole && roleData.items.length > 0) {
      setSelectedRole(roleData.items[0].code);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setIsBusy(true);
      setError("");
      try {
        await Promise.all([loadUsers(1), loadLogs(1, ""), loadCoreData()]);
      } catch {
        if (!cancelled) {
          setError("Failed to load admin data.");
        }
      } finally {
        if (!cancelled) {
          setIsBusy(false);
        }
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!selectedUser) return;
    setProfileDraft({
      full_name: selectedUser.full_name,
      email: selectedUser.email,
      role: selectedUser.role,
      department_id: selectedUser.department_id ?? "",
      account_status: selectedUser.is_active ? "active" : "locked"
    });
  }, [selectedUser]);

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!newUser.email || !newUser.full_name || !newUser.password) {
      setError("Email, full name and password are required.");
      return;
    }
    setIsBusy(true);
    try {
      await adminCreateUser({ ...newUser, is_active: true }, accessToken);
      setNewUser({ email: "", full_name: "", password: "Brainio@123", role: "student" });
      await loadUsers(1);
    } catch {
      setError("Cannot create user.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpdateSelectedUser(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setIsBusy(true);
    setError("");
    try {
      await adminUpdateUser(
        selectedUser.id,
        {
          full_name: profileDraft.full_name,
          role: profileDraft.role,
          department_id: profileDraft.department_id || undefined,
          is_active: profileDraft.account_status === "active"
        },
        accessToken
      );
      await loadUsers(userMeta.page);
    } catch {
      setError("Cannot update user profile.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpdateRolePermissions(event: FormEvent) {
    event.preventDefault();
    if (!selectedRole) return;
    const codes = permissionInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setIsBusy(true);
    setError("");
    try {
      await adminUpdateRolePermissions(selectedRole, codes, accessToken);
      setPermissionInput("");
      await loadCoreData();
    } catch {
      setError("Cannot update role permissions.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateDepartment(event: FormEvent) {
    event.preventDefault();
    if (!departmentForm.code || !departmentForm.name) {
      setError("Department code and name are required.");
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      await adminCreateDepartment(departmentForm, accessToken);
      setDepartmentForm({ code: "", name: "", description: "" });
      await loadCoreData();
    } catch {
      setError("Cannot create department.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateProgram(event: FormEvent) {
    event.preventDefault();
    if (!programForm.code || !programForm.name) {
      setError("Program code and name are required.");
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      await adminCreateProgram(
        {
          code: programForm.code,
          name: programForm.name,
          total_credits: Number(programForm.total_credits) || 120,
          department_id: departments[0]?.id
        },
        accessToken
      );
      setProgramForm({ code: "", name: "", total_credits: "120" });
      await loadCoreData();
    } catch {
      setError("Cannot create program.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateCourse(event: FormEvent) {
    event.preventDefault();
    if (!courseForm.code || !courseForm.name) {
      setError("Course code and name are required.");
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      await adminCreateCourse(
        {
          code: courseForm.code,
          name: courseForm.name,
          credits: Number(courseForm.credits) || 0,
          description: courseForm.description,
          department_id: departments[0]?.id
        },
        accessToken
      );
      setCourseForm({ code: "", name: "", credits: "3", description: "" });
      await loadCoreData();
    } catch {
      setError("Cannot create course.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateSemester(event: FormEvent) {
    event.preventDefault();
    if (!semesterForm.academic_year || !semesterForm.semester_name || !semesterForm.start_date || !semesterForm.end_date) {
      setError("Academic year, semester name, start date and end date are required.");
      return;
    }

    const code = `${semesterForm.academic_year.replace(/\s+/g, "")}-${semesterForm.semester_name.replace(/\s+/g, "")}`;

    setIsBusy(true);
    setError("");
    try {
      await adminCreateSemester(
        {
          code,
          name: semesterForm.semester_name,
          start_date: new Date(semesterForm.start_date).toISOString(),
          end_date: new Date(semesterForm.end_date).toISOString(),
          status: "planned"
        },
        accessToken
      );
      setSemesterForm((prev) => ({ ...prev, semester_name: "Semester 1", start_date: "", end_date: "", exam_period: "Week 16" }));
      await loadCoreData();
    } catch {
      setError("Cannot create semester.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateBroadcast(event: FormEvent) {
    event.preventDefault();
    if (!broadcastForm.subject || !broadcastForm.message || !broadcastForm.audience) {
      setError("Subject, message and audience are required.");
      return;
    }

    setIsBusy(true);
    setError("");
    try {
      const content =
        `${broadcastForm.message}` +
        `${broadcastForm.schedule ? `\nSchedule: ${broadcastForm.schedule}` : ""}` +
        `${broadcastForm.channels ? `\nChannels: ${broadcastForm.channels}` : ""}`;

      await createAnnouncement(
        {
          title: broadcastForm.subject,
          content,
          target_role: broadcastForm.audience
        },
        accessToken
      );
      setBroadcastForm({ subject: "", message: "", audience: "student", schedule: "", channels: "in_app" });
      await loadCoreData();
    } catch {
      setError("Cannot create broadcast message.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEnrollmentAction(event: FormEvent) {
    event.preventDefault();
    if (!enrollmentForm.student_list || !enrollmentForm.target_section || !enrollmentForm.action_type || !enrollmentForm.reason) {
      setError("Student list, target section, action type and reason are required.");
      return;
    }
    const studentIds = enrollmentForm.student_list
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (studentIds.length === 0) {
      setError("At least one student ID is required.");
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      const result = await adminEnrollmentAction(
        {
          student_ids: studentIds,
          target_section_id: enrollmentForm.target_section.trim(),
          action_type: enrollmentForm.action_type as "enroll" | "drop" | "move",
          reason: `${enrollmentForm.reason}${enrollmentForm.effective_date ? ` (effective ${enrollmentForm.effective_date})` : ""}`
        },
        accessToken
      );
      setEnrollmentResult(result);
      await loadCoreData();
    } catch {
      setError("Cannot execute enrollment action.");
    } finally {
      setIsBusy(false);
    }
  }

  const moduleTitle = modules.find((item) => item.key === activeModule)?.title ?? "Admin";

  const audienceRows = roleOptions.map((role) => ({
    name: role.replace("_", " ").replace(/\b\w/g, (value) => value.toUpperCase()),
    count: users.filter((user) => user.role === role).length.toString()
  }));

  const securityStats = [
    { label: "Users", value: `${userMeta.total || 0}`, tone: "blue" as const },
    {
      label: "Uptime",
      value: reportItems.find((item) => item.key.toLowerCase().includes("uptime"))?.value ?? "99.98%",
      tone: "mint" as const
    },
    { label: "Alerts", value: `${logs.length}`, tone: "rose" as const },
    {
      label: "Storage",
      value: reportItems.find((item) => item.key.toLowerCase().includes("storage"))?.value ?? "72%",
      tone: "violet" as const
    }
  ];

  const overviewRows = [
    { item: "Course introduction", status: "Done", time: "Today" },
    { item: "Assignment 01", status: "Pending", time: "Tomorrow" },
    { item: "Quiz review", status: "Open", time: "Fri" },
    { item: "Grade updated", status: "Done", time: "Yesterday" },
    { item: "Forum reply", status: "New", time: "Now" }
  ];

  return (
    <section className="space-y-5">
      <PageHeader title={moduleTitle === "Overview" ? "Admin Overview" : moduleTitle} subtitle={dashboard.header_subtitle} />

      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search data..."
          className="w-full max-w-[320px] rounded-full border border-[#c2cee6] bg-white px-4 py-2 text-sm text-[#51648c] outline-none"
        />
        <p className="text-xs text-[#6f7f9f]">RBAC: Admin modules with full scope</p>
      </div>

      {error ? <p className="text-sm text-[#b32047]">{error}</p> : null}

      {activeModule === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="brainio-card rounded-xl border-t-4 border-t-primary-container p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total users</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{userMeta.total || 0}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">+{Math.min(12, userMeta.total || 0)} this month</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-success p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">System uptime</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{securityStats.find((i) => i.label === "Uptime")?.value ?? "99.98%"}</p>
              <p className="mt-2 text-xs text-slate-500">Stable operations</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-info p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Storage usage</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{securityStats.find((i) => i.label === "Storage")?.value ?? "72%"}</p>
              <p className="mt-2 text-xs text-slate-500">Of total allocation</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-error p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Critical alerts</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{logs.length}</p>
              <p className="mt-2 text-xs font-semibold text-red-700">Needs review</p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <article className="brainio-card rounded-xl p-5 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">System Overview</h3>
                <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Refresh data</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Open sections</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{sections.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Audit logs</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{logs.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Announcements</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{announcementRows.length}</p>
                </div>
              </div>
            </article>

            <article className="brainio-card rounded-xl p-5 lg:col-span-4">
              <h3 className="text-lg font-bold text-slate-900">Security Snapshot</h3>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {logs.filter((item) => item.action.toLowerCase().includes("failed")).length} failed actions
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {permissions.length} permission codes
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {roles.length} configured roles
                </div>
              </div>
            </article>
          </div>

          <DataTable
            title="Recent activity"
            columns={[
              { key: "item", header: "Item", render: (row: { item: string; status: string; time: string }) => row.item },
              {
                key: "status",
                header: "Status",
                render: (row: { item: string; status: string; time: string }) => <span className={toneByStatus(row.status)}>{row.status}</span>
              },
              { key: "time", header: "Time", render: (row: { item: string; status: string; time: string }) => row.time }
            ]}
            rows={overviewRows}
            rowKey={(row) => `${row.item}-${row.time}`}
          />
        </>
      ) : null}

      {activeModule === "users" ? (
        <>
          <DataTable
            title="Users"
            columns={[
              { key: "user", header: "User", render: (row: AdminUserItem) => row.full_name },
              { key: "role", header: "Role", render: (row: AdminUserItem) => row.role.replace("_", " ") },
              {
                key: "status",
                header: "Status",
                render: (row: AdminUserItem) => <span className={toneByStatus(row.is_active ? "active" : "locked")}>{row.is_active ? "Active" : "Locked"}</span>
              }
            ]}
            rows={filteredUsers}
            rowKey={(row) => row.id}
            controls={
              <button
                type="button"
                className="rounded-full border border-[#b7c4e2] px-3 py-1.5 text-sm font-semibold text-[#4b5d84]"
                onClick={() => void loadUsers(userMeta.page)}
                disabled={isBusy}
              >
                Refresh
              </button>
            }
            pagination={{
              page: userMeta.page,
              total: userMeta.total,
              limit: userMeta.limit,
              onPageChange: (page) => void loadUsers(page)
            }}
          />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateUser} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">User Management</h3>
              <p className="mt-2 text-sm text-[#6f7f9f]">Create, import, lock, reset and export all users.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <FormField label="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} />
                <FormField label="Full name" value={newUser.full_name} onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))} />
                <FormField label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} />
                <FormField as="select" label="Role" value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as RoleSlug }))}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </FormField>
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <form onSubmit={handleUpdateSelectedUser} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">User profile</h3>
              <div className="mt-4 grid gap-3">
                <FormField as="select" label="User" value={activeUserId} onChange={(e) => setActiveUserId(e.target.value)}>
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </FormField>
                <FormField label="Full name" value={profileDraft.full_name} onChange={(e) => setProfileDraft((prev) => ({ ...prev, full_name: e.target.value }))} />
                <FormField label="Email" value={profileDraft.email} onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))} disabled />
                <FormField as="select" label="Primary role" value={profileDraft.role} onChange={(e) => setProfileDraft((prev) => ({ ...prev, role: e.target.value as RoleSlug }))}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </FormField>
                <FormField label="Department" value={profileDraft.department_id} onChange={(e) => setProfileDraft((prev) => ({ ...prev, department_id: e.target.value }))} />
                <FormField
                  as="select"
                  label="Account status"
                  value={profileDraft.account_status}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, account_status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="locked">locked</option>
                </FormField>
              </div>
              <button type="submit" disabled={isBusy || !selectedUser} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>
          </div>

          <QuickActionStrip quick="Import users" filter="Role and faculty" exportText="Export CSV" />
        </>
      ) : null}

      {activeModule === "roles_rbac" ? (
        <>
          <DataTable
            title="Roles"
            subtitle="Configure roles, permissions and data scopes."
            columns={[
              { key: "role", header: "Role", render: (row: RoleItem) => row.name },
              {
                key: "users",
                header: "Users",
                render: (row: RoleItem) => users.filter((item) => item.role === row.code).length.toString()
              },
              { key: "scope", header: "Scope", render: (row: RoleItem) => row.description }
            ]}
            rows={roles}
            rowKey={(row) => row.id}
          />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleUpdateRolePermissions} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Permission Matrix</h3>
              <p className="mt-2 text-sm text-[#6f7f9f]">CRUD permissions by module and role.</p>
              <div className="mt-4 grid gap-3">
                <FormField as="select" label="Role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  {roles.map((item) => (
                    <option key={item.id} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </FormField>
                <FormField
                  label="Permission codes"
                  value={permissionInput}
                  onChange={(e) => setPermissionInput(e.target.value)}
                  helper="Comma separated. Example: user.read,user.update,report.export"
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Audit"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: "Changed by", state: "Admin" },
                { name: "Time", state: "Now" },
                { name: "Reason", state: "Policy" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <DataTable
            title="Module Permissions"
            columns={[
              { key: "code", header: "Code", render: (row: PermissionItem) => row.code },
              { key: "module", header: "Module", render: (row: PermissionItem) => row.module },
              { key: "name", header: "Name", render: (row: PermissionItem) => row.name }
            ]}
            rows={permissions}
            rowKey={(row) => row.id}
          />

          <QuickActionStrip quick="Create role" filter="Permission matrix" exportText="RBAC report" />
        </>
      ) : null}

      {activeModule === "departments" ? (
        <>
          <DataTable
            title="Organizations"
            subtitle="Manage campuses, faculties, departments and classes."
            columns={[
              { key: "unit", header: "Unit", render: (row: { unit: string; type: string; manager: string }) => row.unit },
              { key: "type", header: "Type", render: (row: { unit: string; type: string; manager: string }) => row.type },
              { key: "manager", header: "Manager", render: (row: { unit: string; type: string; manager: string }) => row.manager }
            ]}
            rows={[
              ...filteredDepartments.map((item) => ({ unit: item.name, type: "Department", manager: item.code })),
              ...filteredPrograms.map((item) => ({ unit: item.name, type: "Program", manager: item.code }))
            ]}
            rowKey={(row) => `${row.type}-${row.unit}`}
            emptyTitle="No organization data"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={handleCreateDepartment} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-3xl font-bold text-[#151b2d]">Create Department</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Code" value={departmentForm.code} onChange={(e) => setDepartmentForm((prev) => ({ ...prev, code: e.target.value }))} />
                <FormField label="Name" value={departmentForm.name} onChange={(e) => setDepartmentForm((prev) => ({ ...prev, name: e.target.value }))} />
                <FormField label="Description" value={departmentForm.description} onChange={(e) => setDepartmentForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <form onSubmit={handleCreateProgram} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-3xl font-bold text-[#151b2d]">Create Program</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Code" value={programForm.code} onChange={(e) => setProgramForm((prev) => ({ ...prev, code: e.target.value }))} />
                <FormField label="Name" value={programForm.name} onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))} />
                <FormField
                  label="Total credits"
                  type="number"
                  value={programForm.total_credits}
                  onChange={(e) => setProgramForm((prev) => ({ ...prev, total_credits: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>
          </div>

          <QuickActionStrip quick="Create unit" filter="Type" exportText="Org chart" />
        </>
      ) : null}

      {activeModule === "semesters" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleCreateSemester} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Semester setup</h3>
            <div className="mt-4 grid gap-3">
              <FormField
                label="Academic year"
                value={semesterForm.academic_year}
                onChange={(e) => setSemesterForm((prev) => ({ ...prev, academic_year: e.target.value }))}
              />
              <FormField
                label="Semester name"
                value={semesterForm.semester_name}
                onChange={(e) => setSemesterForm((prev) => ({ ...prev, semester_name: e.target.value }))}
              />
              <FormField
                label="Start date"
                type="date"
                value={semesterForm.start_date}
                onChange={(e) => setSemesterForm((prev) => ({ ...prev, start_date: e.target.value }))}
              />
              <FormField
                label="End date"
                type="date"
                value={semesterForm.end_date}
                onChange={(e) => setSemesterForm((prev) => ({ ...prev, end_date: e.target.value }))}
              />
              <FormField
                label="Exam period"
                value={semesterForm.exam_period}
                onChange={(e) => setSemesterForm((prev) => ({ ...prev, exam_period: e.target.value }))}
                helper="Stored as planning note in frontend."
              />
            </div>
            <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Save changes
            </button>
          </form>

          <DataTable
            title="Milestones"
            columns={[
              { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
              {
                key: "status",
                header: "Status",
                render: (row: { name: string; status: string }) => <span className={toneByStatus(row.status)}>{row.status}</span>
              }
            ]}
            rows={
              semesters.length > 0
                ? semesters.slice(0, 4).map((item, index) => ({
                    name: item.name,
                    status: index === 0 ? "Open" : index === 1 ? "Week 8" : index === 2 ? "Week 16" : "Planned"
                  }))
                : []
            }
            rowKey={(row) => row.name}
            emptyTitle="No semester milestones"
          />
        </div>
      ) : null}

      {activeModule === "courses" ? (
        <>
          <DataTable
            title="Courses"
            subtitle="Create subjects, credits, prerequisites and programs."
            columns={[
              { key: "code", header: "Code", render: (row: CourseItem) => row.code },
              { key: "course", header: "Course", render: (row: CourseItem) => row.name },
              { key: "credits", header: "Credits", render: (row: CourseItem) => row.credits.toString() }
            ]}
            rows={filteredCourses}
            rowKey={(row) => row.id}
            emptyTitle="No courses"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={handleCreateCourse} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-3xl font-bold text-[#151b2d]">Create Course</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Code" value={courseForm.code} onChange={(e) => setCourseForm((prev) => ({ ...prev, code: e.target.value }))} />
                <FormField label="Course" value={courseForm.name} onChange={(e) => setCourseForm((prev) => ({ ...prev, name: e.target.value }))} />
                <FormField label="Credits" type="number" value={courseForm.credits} onChange={(e) => setCourseForm((prev) => ({ ...prev, credits: e.target.value }))} />
                <FormField label="Description" value={courseForm.description} onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Sections"
              subtitle="Open sections, assign lecturers and enroll students."
              columns={[
                { key: "section", header: "Section", render: (row: SectionItem) => row.code },
                { key: "lecturer", header: "Lecturer", render: (row: SectionItem) => row.lecturer_id ?? "Unassigned" },
                { key: "students", header: "Students", render: (row: SectionItem) => row.max_students.toString() }
              ]}
              rows={filteredSections}
              rowKey={(row) => row.id}
              emptyTitle="No sections"
            />
          </div>

          <QuickActionStrip quick="Create course" filter="Faculty" exportText="Catalog" />
        </>
      ) : null}

      {activeModule === "enrollments" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleEnrollmentAction} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Enrollment action</h3>
            <div className="mt-4 grid gap-3">
              <FormField
                label="Student list"
                value={enrollmentForm.student_list}
                onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, student_list: e.target.value }))}
              />
              <FormField
                label="Target section"
                value={enrollmentForm.target_section}
                onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, target_section: e.target.value }))}
              />
              <FormField
                label="Action type"
                value={enrollmentForm.action_type}
                onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, action_type: e.target.value }))}
              />
              <FormField label="Reason" value={enrollmentForm.reason} onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, reason: e.target.value }))} />
              <FormField
                label="Effective date"
                type="date"
                value={enrollmentForm.effective_date}
                onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, effective_date: e.target.value }))}
              />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">
              Save changes
            </button>
          </form>

          <DataTable
            title="Validation"
            columns={[
              { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
              {
                key: "status",
                header: "Status",
                render: (row: { name: string; status: string }) => <span className={toneByStatus(row.status)}>{row.status}</span>
              }
            ]}
            rows={
              enrollmentResult
                ? [
                    { name: "Requested", status: String(enrollmentResult.requested) },
                    { name: "Success", status: String(enrollmentResult.success) },
                    { name: "Skipped", status: String(enrollmentResult.skipped) },
                    { name: "Action", status: enrollmentResult.action_type }
                  ]
                : [
                    { name: "Prerequisite", status: "Pass" },
                    { name: "Capacity", status: "Available" },
                    { name: "Conflict", status: "None" },
                    { name: "Audit", status: "Ready" }
                  ]
            }
            rowKey={(row) => row.name}
          />
        </div>
      ) : null}

      {activeModule === "content" ? (
        <>
          <DataTable
            title="Moderation Queue"
            subtitle="Review courses, files, comments and reported content."
            columns={[
              { key: "item", header: "Item", render: (row: UploadedFileItem) => row.original_name },
              { key: "type", header: "Type", render: (row: UploadedFileItem) => row.content_type || row.module },
              { key: "status", header: "Status", render: () => "Review" }
            ]}
            rows={uploadedRows.filter((item) => matchText(`${item.original_name} ${item.module}`, search))}
            rowKey={(row) => row.id}
            emptyTitle="No moderation rows"
          />
          <p className="text-xs text-[#6f7f9f]">
            TODO: dedicated moderation endpoint for comment/report workflow is not exposed. This queue currently uses `/api/v1/files`.
          </p>
          <QuickActionStrip quick="Review item" filter="Severity" exportText="Moderation log" />
        </>
      ) : null}

      {activeModule === "exams" ? (
        <>
          <DataTable
            title="Exam Logs"
            subtitle="Exam policies, logs, incident handling and reopen attempts."
            columns={[
              { key: "exam", header: "Exam", render: (row: ExamApprovalItem) => row.quiz_id },
              { key: "issue", header: "Issue", render: (row: ExamApprovalItem) => row.note || "No issue" },
              {
                key: "action",
                header: "Action",
                render: (row: ExamApprovalItem) => <span className={toneByStatus(row.status)}>{row.status}</span>
              }
            ]}
            rows={examApprovals.filter((item) => matchText(`${item.quiz_id} ${item.status} ${item.note}`, search))}
            rowKey={(row) => row.id}
            emptyTitle="No exam approval logs"
          />
          <QuickActionStrip quick="Resolve incident" filter="Exam" exportText="Incident report" />
        </>
      ) : null}

      {activeModule === "grades" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${sections.length || 0} sections`} tone="blue" />
            <StatCard
              label="Growth"
              value={`${sections.length > 0 ? Math.round(((sections.length - gradeApprovals.length) / sections.length) * 100) : 0}% locked`}
              tone="mint"
            />
            <StatCard label="Risk" value={`${gradeApprovals.filter((item) => item.status !== "approved").length} pending`} tone="rose" />
            <StatCard label="Score" value="Ready" tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Grade lock", action: "Monitor" },
              { signal: "SIS sync", action: "Run" },
              { signal: "Audit", action: "Review" }
            ]}
            recommendation="Only unlock gradebooks with approved reason and keep immutable audit trails."
          />

          <DataTable
            title="Gradebooks"
            columns={[
              { key: "section", header: "Section", render: (row: GradeApprovalItem) => row.section_id },
              { key: "status", header: "Status", render: (row: GradeApprovalItem) => <span className={toneByStatus(row.status)}>{row.status}</span> },
              { key: "note", header: "Action", render: (row: GradeApprovalItem) => row.note || "Review" }
            ]}
            rows={gradeApprovals.filter((item) => matchText(`${item.section_id} ${item.status} ${item.note}`, search))}
            rowKey={(row) => row.id}
            emptyTitle="No grade approval rows"
          />
        </>
      ) : null}

      {activeModule === "security" ? (
        <>
          <DataTable
            title="Security Events"
            subtitle="Login anomaly, device sessions and permission changes."
            controls={
              <div className="flex items-center gap-2">
                <input
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  placeholder="Action filter"
                  className="rounded-full border border-[#c8d2e8] bg-[#f2f5fc] px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => void loadLogs(1, actionFilter)} className="rounded-full bg-[#3864e7] px-3 py-2 text-xs font-semibold text-white">
                  Apply
                </button>
              </div>
            }
            columns={[
              { key: "event", header: "Event", render: (row: AuditLogItem) => row.action },
              { key: "user", header: "User", render: (row: AuditLogItem) => row.actor_id ?? "system" },
              {
                key: "risk",
                header: "Risk",
                render: (row: AuditLogItem) => {
                  const risk = row.action.toLowerCase().includes("delete") || row.action.toLowerCase().includes("permission") ? "High" : "Medium";
                  return <span className={toneByStatus(risk)}>{risk}</span>;
                }
              }
            ]}
            rows={logs}
            rowKey={(row) => row.id}
            emptyTitle="No security logs"
            pagination={{
              page: logsMeta.page,
              total: logsMeta.total,
              limit: logsMeta.limit,
              onPageChange: (page) => void loadLogs(page, actionFilter)
            }}
          />

          <QuickActionStrip quick="Investigate" filter="Risk level" exportText="Audit log" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateBroadcast} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Broadcast message</h3>
              <p className="mt-2 text-sm text-[#6f7f9f]">Broadcast notifications by role, faculty and channel.</p>
              <div className="mt-4 grid gap-3">
                <FormField label="Subject" value={broadcastForm.subject} onChange={(e) => setBroadcastForm((prev) => ({ ...prev, subject: e.target.value }))} />
                <FormField label="Message" value={broadcastForm.message} onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))} />
                <FormField as="select" label="Audience" value={broadcastForm.audience} onChange={(e) => setBroadcastForm((prev) => ({ ...prev, audience: e.target.value }))}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </FormField>
                <FormField label="Schedule" value={broadcastForm.schedule} onChange={(e) => setBroadcastForm((prev) => ({ ...prev, schedule: e.target.value }))} />
                <FormField label="Channels" value={broadcastForm.channels} onChange={(e) => setBroadcastForm((prev) => ({ ...prev, channels: e.target.value }))} />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Audience"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; count: string }) => row.name },
                { key: "count", header: "Status", render: (row: { name: string; count: string }) => row.count }
              ]}
              rows={audienceRows}
              rowKey={(row) => row.name}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!integrationForm.provider || !integrationForm.api_key || !integrationForm.webhook_url) {
                  setError("Provider, API key and webhook URL are required.");
                  return;
                }
                setError("TODO: integration settings endpoint is not exposed in backend API.");
              }}
              className="rounded-[28px] border border-[#c8d2e8] bg-white p-5"
            >
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Integration config</h3>
              <div className="mt-4 grid gap-3">
                <FormField
                  label="Provider"
                  value={integrationForm.provider}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, provider: e.target.value }))}
                />
                <FormField label="API key" value={integrationForm.api_key} onChange={(e) => setIntegrationForm((prev) => ({ ...prev, api_key: e.target.value }))} />
                <FormField
                  label="Webhook URL"
                  value={integrationForm.webhook_url}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, webhook_url: e.target.value }))}
                />
                <FormField
                  label="Sync frequency"
                  value={integrationForm.sync_frequency}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, sync_frequency: e.target.value }))}
                />
                <FormField
                  label="Error policy"
                  value={integrationForm.error_policy}
                  onChange={(e) => setIntegrationForm((prev) => ({ ...prev, error_policy: e.target.value }))}
                />
              </div>
              <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">
                Save changes
              </button>
            </form>

            <DataTable
              title="Status"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => <span className={toneByStatus(row.status)}>{row.status}</span> }
              ]}
              rows={[
                { name: "SSO", status: "Connected" },
                { name: "SMTP", status: "Connected" },
                { name: "SIS", status: "Warning" },
                { name: "Storage", status: "Connected" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <DataTable
            title="Reports"
            subtitle="Users, courses, activity, storage and learning reports."
            columns={[
              { key: "report", header: "Report", render: (row: { report: string; frequency: string; format: string }) => row.report },
              { key: "frequency", header: "Frequency", render: (row: { report: string; frequency: string; format: string }) => row.frequency },
              { key: "format", header: "Format", render: (row: { report: string; frequency: string; format: string }) => row.format }
            ]}
            rows={
              reportItems.length > 0
                ? reportItems.map((item, index) => ({
                    report: item.key,
                    frequency: ["Daily", "Weekly", "Monthly", "Daily"][index % 4],
                    format: index % 2 === 0 ? "CSV" : "PDF"
                  }))
                : []
            }
            rowKey={(row) => `${row.report}-${row.frequency}`}
            emptyTitle="No system reports"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value="Daily" tone="blue" />
            <StatCard label="Growth" value="Healthy" tone="mint" />
            <StatCard label="Risk" value={`${logs.filter((item) => item.action.toLowerCase().includes("failed")).length || 1} failed job`} tone="rose" />
            <StatCard label="Score" value="99.98%" tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Backup", action: "Passed" },
              { signal: "Queue", action: "Retry" },
              { signal: "Cache", action: "Warm" }
            ]}
            recommendation="Keep production restore procedure tested and documented before every semester start."
          />

          <DataTable
            title="Announcement templates"
            columns={[
              { key: "title", header: "Name", render: (row: { id: string; title: string; target_role: string }) => row.title },
              {
                key: "target_role",
                header: "Status",
                render: (row: { id: string; title: string; target_role: string }) => row.target_role
              }
            ]}
            rows={announcementRows}
            rowKey={(row) => row.id}
            emptyTitle="No announcements"
          />
        </>
      ) : null}

      {[
        "overview",
        "users",
        "roles_rbac",
        "departments",
        "semesters",
        "courses",
        "enrollments",
        "content",
        "exams",
        "grades",
        "security"
      ].includes(activeModule) ? null : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {modules
              .filter((item) => item.key !== "overview")
              .slice(0, 8)
              .map((item) => (
                <ModuleCard key={item.key} module={item} />
              ))}
          </div>
          <EmptyState title="Module unavailable" description="Selected admin module is not mapped." />
        </>
      )}

      {isBusy ? <p className="text-xs text-[#6f7f9f]">Syncing data...</p> : null}
    </section>
  );
}
