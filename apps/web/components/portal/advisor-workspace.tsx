"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  advisorAssignStudent,
  advisorConsultations,
  advisorCreateConsultation,
  advisorCreateRiskAlert,
  advisorCreateStudyPlan,
  advisorCreateSupportRequest,
  advisorEscalateSupportRequest,
  advisorReport,
  advisorRiskAlerts,
  advisorStudentProgress,
  advisorStudents,
  advisorStudyPlans,
  advisorSupportRequests,
  notifications
} from "@/lib/api";
import type {
  AdvisorStudentItem,
  ConsultationItem,
  NotificationItem,
  RiskAlertItem,
  StudentProgressItem,
  StudyPlanItem,
  SupportRequestItem
} from "@/lib/lms";
import { type DashboardPayload, type ModuleItem } from "@/lib/roles";

type Props = {
  accessToken: string;
  activeModule: string;
  dashboard: DashboardPayload;
  modules: ModuleItem[];
};

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("done") || normalized.includes("resolved") || normalized.includes("approved")) {
    return "text-[#2f7f4c]";
  }
  if (normalized.includes("open") || normalized.includes("pending") || normalized.includes("review")) {
    return "text-[#5c6f95]";
  }
  if (normalized.includes("escalate") || normalized.includes("high")) {
    return "text-[#b33a52]";
  }
  return "text-[#5c6f95]";
}

function BottomActionCards({ quick, filter, exportText }: { quick: string; filter: string; exportText: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
          <div>
            <p className="text-[34px] font-bold leading-none text-[#151b2d]">Quick action</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{quick}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
          <div>
            <p className="text-[34px] font-bold leading-none text-[#151b2d]">Filter</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{filter}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#c8e4de]" />
          <div>
            <p className="text-[34px] font-bold leading-none text-[#151b2d]">Export</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{exportText}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

export function AdvisorWorkspace({ accessToken, activeModule, dashboard, modules }: Props) {
  const searchParams = useSearchParams();
  const studentIdFromQuery = searchParams.get("studentId") ?? "";

  const [students, setStudents] = useState<AdvisorStudentItem[]>([]);
  const [progress, setProgress] = useState<StudentProgressItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [alerts, setAlerts] = useState<RiskAlertItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [supports, setSupports] = useState<SupportRequestItem[]>([]);
  const [report, setReport] = useState<{ key: string; value: string }[]>([]);
  const [messageRows, setMessageRows] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");

  const [studentIdInput, setStudentIdInput] = useState("");
  const [riskForm, setRiskForm] = useState({ student_id: "", risk_level: "medium" as "low" | "medium" | "high", reason: "", recommended_action: "" });
  const [consultForm, setConsultForm] = useState({ student_id: "", summary: "", action_plan: "", follow_up_at: "" });
  const [planForm, setPlanForm] = useState({ student_id: "", title: "", goals: "Improve grade,Submit on time" });
  const [supportForm, setSupportForm] = useState({ student_id: "", title: "", description: "" });

  async function loadData() {
    const [studentData, alertData, consultationData, planData, supportData, reportData, notificationData] = await Promise.all([
      advisorStudents(accessToken),
      advisorRiskAlerts(accessToken),
      advisorConsultations(accessToken),
      advisorStudyPlans(accessToken),
      advisorSupportRequests(accessToken),
      advisorReport(accessToken),
      notifications(accessToken, 1, 20)
    ]);

    setStudents(studentData.items);
    setAlerts(alertData.items);
    setConsultations(consultationData.items);
    setPlans(planData.items);
    setSupports(supportData.items);
    setReport(reportData.items);
    setMessageRows(notificationData.items);

    const studentIds = studentData.items.map((item) => item.student_id);
    if (studentIds.length > 0) {
      const progressItems = await Promise.all(studentIds.map(async (studentId) => (await advisorStudentProgress(studentId, accessToken)).item));
      setProgress(progressItems);
      const preferredStudentId = studentIdFromQuery && studentIds.includes(studentIdFromQuery) ? studentIdFromQuery : studentIds[0];
      setSelectedStudentId(preferredStudentId);
      setRiskForm((prev) => ({ ...prev, student_id: prev.student_id || preferredStudentId }));
      setConsultForm((prev) => ({ ...prev, student_id: prev.student_id || preferredStudentId }));
      setPlanForm((prev) => ({ ...prev, student_id: prev.student_id || preferredStudentId }));
      setSupportForm((prev) => ({ ...prev, student_id: prev.student_id || preferredStudentId }));
    } else {
      setProgress([]);
      setSelectedStudentId("");
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentIdFromQuery]);

  const selectedProfile = useMemo(() => {
    if (!progress.length) return null;
    if (selectedStudentId) {
      return progress.find((item) => item.student_id === selectedStudentId) ?? progress[0];
    }
    return progress[0];
  }, [progress, selectedStudentId]);

  async function handleAssignStudent(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!studentIdInput) {
      setError("Student ID is required.");
      return;
    }
    await advisorAssignStudent(studentIdInput, accessToken);
    setStudentIdInput("");
    await loadData();
  }

  async function handleCreateRisk(event: FormEvent) {
    event.preventDefault();
    if (!riskForm.student_id || !riskForm.reason) return;
    await advisorCreateRiskAlert(riskForm, accessToken);
    setRiskForm((prev) => ({ ...prev, reason: "", recommended_action: "" }));
    await loadData();
  }

  async function handleCreateConsultation(event: FormEvent) {
    event.preventDefault();
    if (!consultForm.student_id || !consultForm.summary) return;
    await advisorCreateConsultation(consultForm, accessToken);
    setConsultForm((prev) => ({ ...prev, summary: "", action_plan: "", follow_up_at: "" }));
    await loadData();
  }

  async function handleCreatePlan(event: FormEvent) {
    event.preventDefault();
    if (!planForm.student_id || !planForm.title) return;
    await advisorCreateStudyPlan(
      {
        student_id: planForm.student_id,
        title: planForm.title,
        goals: planForm.goals.split(",").map((item) => item.trim()).filter(Boolean),
        tasks: [{ title: "Weekly review", due_date: new Date().toISOString().slice(0, 10) }]
      },
      accessToken
    );
    setPlanForm((prev) => ({ ...prev, title: "" }));
    await loadData();
  }

  async function handleCreateSupport(event: FormEvent) {
    event.preventDefault();
    if (!supportForm.student_id || !supportForm.title) return;
    await advisorCreateSupportRequest(supportForm, accessToken);
    setSupportForm((prev) => ({ ...prev, title: "", description: "" }));
    await loadData();
  }

  const moduleTitle = modules.find((item) => item.key === activeModule)?.title ?? "Advisor Success Dashboard";

  const summaryMetrics = [
    { label: "Students", value: `${progress.length || students.length}`, trend: "Assigned cohort", tone: "blue" as const },
    {
      label: "Improved",
      value: `${progress.filter((item) => item.average_score >= 7).length}`,
      trend: "Average score >= 7",
      tone: "mint" as const
    },
    {
      label: "At risk",
      value: `${alerts.filter((item) => ["high", "escalated", "open"].includes(item.risk_level) || item.status === "escalated").length}`,
      trend: "Priority alerts",
      tone: "rose" as const
    },
    {
      label: "Meetings",
      value: `${consultations.length}`,
      trend: "Consultation records",
      tone: "violet" as const
    }
  ];

  return (
    <section className="space-y-5">
      <PageHeader title={moduleTitle} subtitle={dashboard.header_subtitle} />
      {error ? <p className="text-sm text-[#b32047]">{error}</p> : null}

      {activeModule === "success_dashboard" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="brainio-card rounded-xl border-t-4 border-t-primary-container p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total students</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{progress.length}</p>
              <p className="mt-2 text-xs text-slate-500">In advisory scope</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-error p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Students at risk</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{alerts.filter((item) => item.risk_level === "high").length}</p>
              <p className="mt-2 text-xs font-semibold text-red-700">Action required</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-success p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Graduation clearance</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">
                {progress.length ? Math.round((progress.filter((item) => item.average_score >= 5).length / progress.length) * 100) : 0}%
              </p>
              <p className="mt-2 text-xs text-slate-500">Eligible students</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-info p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Appointments</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{consultations.length}</p>
              <p className="mt-2 text-xs text-slate-500">Logged sessions</p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <article className="brainio-card rounded-xl p-5 lg:col-span-8">
              <h3 className="text-xl font-bold text-slate-900">Caseload Overview</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total students</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{progress.length}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-red-700">Students at risk</p>
                  <p className="mt-1 text-lg font-semibold text-red-700">{alerts.filter((item) => item.risk_level === "high").length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Plans active</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{plans.length}</p>
                </div>
              </div>
            </article>

            <article className="brainio-card rounded-xl p-5 lg:col-span-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Alerts</h3>
              <div className="mt-3 space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{alert.student_id}</p>
                    <p className="text-xs text-slate-500">{alert.reason}</p>
                  </div>
                ))}
                {alerts.length === 0 ? <p className="text-sm text-slate-500">No active alerts.</p> : null}
              </div>
            </article>
          </div>

          <DataTable
            title="Recent Activity"
            columns={[
              { key: "item", header: "Item", render: (row: ConsultationItem) => row.summary },
              { key: "status", header: "Status", render: (row: ConsultationItem) => <span className={statusTone("done")}>Done</span> },
              {
                key: "time",
                header: "Time",
                render: (row: ConsultationItem) => new Date(row.created_at).toLocaleDateString()
              }
            ]}
            rows={consultations.slice(0, 5)}
            rowKey={(row) => row.id}
            emptyTitle="No recent consultation"
          />
        </>
      ) : null}

      {activeModule === "my_students" ? (
        <>
          <DataTable
            title="Assigned Students"
            subtitle="Assigned students with progress, GPA and attendance."
            columns={[
              {
                key: "student",
                header: "Student",
                render: (row: StudentProgressItem) => row.student_name
              },
              {
                key: "risk",
                header: "Risk",
                render: (row: StudentProgressItem) => {
                  const level = row.risk_alerts_open >= 2 ? "High" : row.risk_alerts_open === 1 ? "Medium" : "Low";
                  return <span className={statusTone(level)}>{level}</span>;
                }
              },
              {
                key: "progress",
                header: "Progress",
                render: (row: StudentProgressItem) => `${Math.min(100, Math.round((row.average_score / 10) * 100))}%`
              }
            ]}
            rows={progress}
            rowKey={(row) => row.student_id}
            emptyTitle="No assigned students"
          />
          <BottomActionCards quick="Open profile" filter="Risk and class" exportText="Student list" />
        </>
      ) : null}

      {activeModule === "student_profile" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <div className="flex gap-3">
              <span className="mt-1 h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
              <div>
                <p className="text-2xl font-bold text-[#151b2d]">Academic Snapshot</p>
                <p className="text-sm text-[#6f7f9f]">Courses, GPA, missing work and attendance.</p>
              </div>
            </div>
            {selectedProfile ? (
              <div className="mt-4 grid gap-2 text-sm text-[#34466f]">
                <p>
                  <span className="font-semibold">Student:</span> {selectedProfile.student_name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {selectedProfile.student_email}
                </p>
                <p>
                  <span className="font-semibold">Average score:</span> {selectedProfile.average_score.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Attendance:</span> {selectedProfile.present_attendance}/{selectedProfile.total_attendance}
                </p>
                <p>
                  <span className="font-semibold">Open alerts:</span> {selectedProfile.risk_alerts_open}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6f7f9f]">No profile data available.</p>
            )}
          </article>

          <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <div className="flex gap-3">
              <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
              <div>
                <p className="text-2xl font-bold text-[#151b2d]">Advisor Notes</p>
                <p className="text-sm text-[#6f7f9f]">Private consultation history and tasks.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#475c89]">
              {consultations.slice(0, 4).map((item) => (
                <p key={item.id}>{item.summary}</p>
              ))}
              {consultations.length === 0 ? <p>No notes yet.</p> : null}
            </div>
          </article>

          <DataTable
            title="Courses"
            columns={[
              {
                key: "name",
                header: "Name",
                render: (row: StudentProgressItem) => row.student_name
              },
              {
                key: "state",
                header: "State",
                render: (row: StudentProgressItem) => {
                  if (row.average_score < 5) return <span className="text-[#b33a52]">At risk</span>;
                  if (row.average_score < 7) return <span className="text-[#5c6f95]">Late</span>;
                  return <span className="text-[#2f7f4c]">Good</span>;
                }
              }
            ]}
            rows={progress.slice(0, 4)}
            rowKey={(row) => row.student_id}
            emptyTitle="No student progress"
          />

          <DataTable
            title="Notes"
            columns={[
              { key: "name", header: "Name", render: (row: ConsultationItem) => row.summary },
              { key: "state", header: "State", render: (row: ConsultationItem) => <span className="text-[#5c6f95]">Open</span> }
            ]}
            rows={consultations.slice(0, 4)}
            rowKey={(row) => row.id}
            emptyTitle="No notes"
          />
        </div>
      ) : null}

      {activeModule === "risk_alerts" ? (
        <>
          <DataTable
            title="Alerts"
            subtitle="Automatic warnings by grade, absence, login and submissions."
            columns={[
              { key: "student", header: "Student", render: (row: RiskAlertItem) => row.student_id },
              { key: "trigger", header: "Trigger", render: (row: RiskAlertItem) => row.reason },
              {
                key: "status",
                header: "Status",
                render: (row: RiskAlertItem) => <span className={statusTone(row.status)}>{row.status}</span>
              }
            ]}
            rows={alerts}
            rowKey={(row) => row.id}
            emptyTitle="No risk alerts"
          />

          <form onSubmit={handleCreateRisk} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-2xl font-bold text-[#12182d]">Create Risk Alert</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <FormField label="Student ID" value={riskForm.student_id} onChange={(e) => setRiskForm((p) => ({ ...p, student_id: e.target.value }))} />
              <FormField as="select" label="Risk level" value={riskForm.risk_level} onChange={(e) => setRiskForm((p) => ({ ...p, risk_level: e.target.value as "low" | "medium" | "high" }))}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </FormField>
              <FormField label="Reason" value={riskForm.reason} onChange={(e) => setRiskForm((p) => ({ ...p, reason: e.target.value }))} />
              <FormField label="Recommended action" value={riskForm.recommended_action} onChange={(e) => setRiskForm((p) => ({ ...p, recommended_action: e.target.value }))} />
            </div>
            <button type="submit" className="mt-3 rounded-full bg-[#3864e7] px-4 py-2 text-sm font-semibold text-white">Create Alert</button>
          </form>

          <BottomActionCards quick="Contact student" filter="Severity" exportText="Alert report" />
        </>
      ) : null}

      {activeModule === "progress_tracking" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${progress.length} students`} trend="Active profile" tone="blue" />
            <StatCard label="Growth" value={`+${progress.filter((item) => item.average_score >= 7).length} improved`} trend="Weekly" tone="mint" />
            <StatCard label="Risk" value={`${alerts.filter((item) => item.risk_level === "high").length} high risk`} trend="Priority" tone="rose" />
            <StatCard label="Score" value={`${progress.length ? Math.round(progress.reduce((sum, item) => sum + item.average_score, 0) / progress.length * 10) : 0}% avg`} trend="Cohort" tone="violet" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <p className="text-2xl font-bold text-[#151b2d]">Analytics chart area</p>
              <div className="mt-6 flex h-48 items-end gap-5">
                {[38, 66, 49, 82, 60, 88, 71].map((value, idx) => (
                  <div key={value + idx} className={`w-10 rounded-t-2xl ${idx % 2 === 0 ? "bg-[#8443df]" : "bg-[#3864e7]"}`} style={{ height: `${value}%` }} />
                ))}
              </div>
            </article>
            <DataTable
              title="Insights"
              columns={[
                { key: "signal", header: "Signal", render: (row: RiskAlertItem) => row.reason },
                { key: "action", header: "Action", render: () => "Contact" }
              ]}
              rows={alerts.slice(0, 3)}
              rowKey={(row) => row.id}
              emptyTitle="No insights"
            />
          </div>

          <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <div className="flex gap-3">
              <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ede5ce]" />
              <div>
                <p className="text-2xl font-bold text-[#151b2d]">Recommendation</p>
                <p className="text-sm text-[#6f7f9f]">Use supportive language and small achievable actions to reduce student anxiety.</p>
              </div>
            </div>
          </article>
        </>
      ) : null}

      {activeModule === "consultations" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleCreateConsultation} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-2xl font-bold text-[#12182d]">Counseling note</h3>
            <div className="mt-3 grid gap-3">
              <FormField label="Student ID" value={consultForm.student_id} onChange={(e) => setConsultForm((p) => ({ ...p, student_id: e.target.value }))} />
              <FormField label="Main issue" value={consultForm.summary} onChange={(e) => setConsultForm((p) => ({ ...p, summary: e.target.value }))} />
              <FormField label="Advice given" value={consultForm.action_plan} onChange={(e) => setConsultForm((p) => ({ ...p, action_plan: e.target.value }))} />
              <FormField label="Follow-up date" type="datetime-local" value={consultForm.follow_up_at} onChange={(e) => setConsultForm((p) => ({ ...p, follow_up_at: e.target.value }))} />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>

          <DataTable
            title="History"
            columns={[
              { key: "name", header: "Name", render: (row: ConsultationItem) => row.summary },
              { key: "status", header: "Status", render: () => <span className="text-[#5c6f95]">Done</span> }
            ]}
            rows={consultations}
            rowKey={(row) => row.id}
            emptyTitle="No history"
          />
        </div>
      ) : null}

      {activeModule === "study_plans" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleCreatePlan} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-2xl font-bold text-[#12182d]">Study plan</h3>
            <div className="mt-3 grid gap-3">
              <FormField label="Student ID" value={planForm.student_id} onChange={(e) => setPlanForm((p) => ({ ...p, student_id: e.target.value }))} />
              <FormField label="Goal" value={planForm.title} onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))} />
              <FormField label="Courses to focus" value={planForm.goals} onChange={(e) => setPlanForm((p) => ({ ...p, goals: e.target.value }))} helper="Comma separated goals" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>

          <DataTable
            title="Plan status"
            columns={[
              { key: "name", header: "Name", render: (row: StudyPlanItem) => row.title },
              { key: "status", header: "Status", render: () => <span className="text-[#5c6f95]">Open</span> }
            ]}
            rows={plans}
            rowKey={(row) => row.id}
            emptyTitle="No plans"
          />
        </div>
      ) : null}

      {activeModule === "attendance" ? (
        <>
          <DataTable
            title="Attendance Cases"
            subtitle="Track absences, reasons and intervention status."
            columns={[
              { key: "student", header: "Student", render: (row: StudentProgressItem) => row.student_name },
              { key: "absence", header: "Absence", render: (row: StudentProgressItem) => `${Math.max(0, row.total_attendance - row.present_attendance)} sessions` },
              {
                key: "action",
                header: "Action",
                render: (row: StudentProgressItem) =>
                  row.total_attendance - row.present_attendance >= 5
                    ? "Escalate"
                    : row.total_attendance - row.present_attendance >= 3
                      ? "Message"
                      : "Watch"
              }
            ]}
            rows={progress}
            rowKey={(row) => row.student_id}
            emptyTitle="No attendance follow-up"
          />
          <BottomActionCards quick="Send reminder" filter="Course" exportText="Attendance cases" />
        </>
      ) : null}

      {activeModule === "support_requests" ? (
        <>
          <DataTable
            title="Requests"
            subtitle="Support tickets, grade review and LMS issue routing."
            columns={[
              { key: "request", header: "Request", render: (row: SupportRequestItem) => row.title },
              { key: "owner", header: "Owner", render: (row: SupportRequestItem) => row.advisor_id ?? "Advisor" },
              { key: "state", header: "State", render: (row: SupportRequestItem) => <span className={statusTone(row.status)}>{row.status}</span> }
            ]}
            rows={supports}
            rowKey={(row) => row.id}
            emptyTitle="No support requests"
          />

          <form onSubmit={handleCreateSupport} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-2xl font-bold text-[#12182d]">Create Support Request</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <FormField label="Student ID" value={supportForm.student_id} onChange={(e) => setSupportForm((p) => ({ ...p, student_id: e.target.value }))} />
              <FormField label="Title" value={supportForm.title} onChange={(e) => setSupportForm((p) => ({ ...p, title: e.target.value }))} />
              <div className="md:col-span-2">
                <FormField label="Description" as="textarea" value={supportForm.description} onChange={(e) => setSupportForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="mt-3 rounded-full bg-[#3864e7] px-4 py-2 text-sm font-semibold text-white">Create Request</button>
          </form>

          <div className="grid gap-3">
            {supports.filter((item) => item.status === "open").map((item) => (
              <article key={item.id} className="rounded-[20px] border border-[#d3dbee] bg-[#f7f9fe] p-4">
                <p className="font-semibold text-[#1a223a]">{item.title}</p>
                <p className="mt-1 text-sm text-[#5d6f95]">{item.description}</p>
                <button
                  onClick={() => void advisorEscalateSupportRequest(item.id, { status: "escalated", escalation_note: "Escalated for urgent review" }, accessToken).then(loadData)}
                  className="mt-3 rounded-full bg-[#b33a52] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Escalate
                </button>
              </article>
            ))}
          </div>

          <BottomActionCards quick="Route request" filter="SLA" exportText="Request log" />
        </>
      ) : null}

      {activeModule === "messages" ? (
        <>
          <DataTable
            title="Messages"
            subtitle="Message students, groups and academic staff."
            columns={[
              { key: "to", header: "To", render: (row: NotificationItem) => row.user_id },
              { key: "subject", header: "Subject", render: (row: NotificationItem) => row.title },
              { key: "status", header: "Status", render: (row: NotificationItem) => <span className={statusTone(row.is_read ? "sent" : "open")}>{row.is_read ? "Sent" : "Open"}</span> }
            ]}
            rows={messageRows}
            rowKey={(row) => row.id}
            emptyTitle="No messages"
          />
          <p className="text-xs text-[#6f7f9f]">TODO: dedicated advisor messaging endpoint is not available; using `/notifications` feed as current backend source.</p>
          <BottomActionCards quick="Compose" filter="Unread" exportText="Message log" />
        </>
      ) : null}

      {activeModule === "reports" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${progress.length} students`} trend="Advisory scope" tone="blue" />
            <StatCard label="Growth" value={`${progress.filter((item) => item.average_score >= 7).length} improved`} trend="Post intervention" tone="mint" />
            <StatCard label="Risk" value={`${alerts.filter((item) => item.risk_level === "high").length} at risk`} trend="Current" tone="rose" />
            <StatCard label="Score" value={progress.length ? "Good" : "N/A"} trend="Overall" tone="violet" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <p className="text-2xl font-bold text-[#151b2d]">Analytics chart area</p>
              <div className="mt-6 flex h-48 items-end gap-5">
                {[38, 66, 49, 82, 60, 88, 71].map((value, idx) => (
                  <div key={value + idx} className={`w-10 rounded-t-2xl ${idx % 2 === 0 ? "bg-[#8443df]" : "bg-[#3864e7]"}`} style={{ height: `${value}%` }} />
                ))}
              </div>
            </article>

            <DataTable
              title="Insights"
              columns={[
                { key: "signal", header: "Signal", render: (row: { key: string; value: string }) => row.key },
                { key: "action", header: "Action", render: () => "Share" }
              ]}
              rows={report.slice(0, 3)}
              rowKey={(row) => row.key}
              emptyTitle="No insights"
            />
          </div>

          <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <div className="flex gap-3">
              <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ede5ce]" />
              <div>
                <p className="text-2xl font-bold text-[#151b2d]">Recommendation</p>
                <p className="text-sm text-[#6f7f9f]">Report should focus on intervention outcomes, not just raw warning counts.</p>
              </div>
            </div>
          </article>
        </>
      ) : null}

      {activeModule === "success_dashboard" ? null : null}

      {![
        "success_dashboard",
        "my_students",
        "student_profile",
        "risk_alerts",
        "progress_tracking",
        "consultations",
        "study_plans",
        "attendance",
        "support_requests",
        "messages",
        "reports"
      ].includes(activeModule) ? (
        <EmptyState title="Module unavailable" description="Selected advisor module is not mapped." />
      ) : null}

      {activeModule === "my_students" ? (
        <form onSubmit={handleAssignStudent} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
          <h3 className="text-2xl font-bold text-[#12182d]">Assign Student</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <FormField label="Student ID" value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} />
            <button type="submit" className="mt-7 h-11 rounded-full bg-[#3864e7] px-5 text-sm font-semibold text-white">Assign</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
