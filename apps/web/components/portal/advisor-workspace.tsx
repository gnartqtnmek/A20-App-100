"use client";

import { FormEvent, useEffect, useState } from "react";

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
  advisorSupportRequests
} from "@/lib/api";
import type {
  AdvisorStudentItem,
  ConsultationItem,
  RiskAlertItem,
  StudentProgressItem,
  StudyPlanItem,
  SupportRequestItem
} from "@/lib/lms";

type Props = {
  accessToken: string;
};

export function AdvisorWorkspace({ accessToken }: Props) {
  const [students, setStudents] = useState<AdvisorStudentItem[]>([]);
  const [progress, setProgress] = useState<StudentProgressItem | null>(null);
  const [alerts, setAlerts] = useState<RiskAlertItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [supports, setSupports] = useState<SupportRequestItem[]>([]);
  const [report, setReport] = useState<{ key: string; value: string }[]>([]);
  const [error, setError] = useState("");

  const [studentIdInput, setStudentIdInput] = useState("");
  const [riskForm, setRiskForm] = useState({ student_id: "", risk_level: "medium" as "low" | "medium" | "high", reason: "", recommended_action: "" });
  const [consultForm, setConsultForm] = useState({ student_id: "", summary: "", action_plan: "" });
  const [planForm, setPlanForm] = useState({ student_id: "", title: "", goals: "Improve grade,Submit on time" });
  const [supportForm, setSupportForm] = useState({ student_id: "", title: "", description: "" });

  async function loadData() {
    const [studentData, alertData, consultationData, planData, supportData, reportData] = await Promise.all([
      advisorStudents(accessToken),
      advisorRiskAlerts(accessToken),
      advisorConsultations(accessToken),
      advisorStudyPlans(accessToken),
      advisorSupportRequests(accessToken),
      advisorReport(accessToken)
    ]);
    setStudents(studentData.items);
    setAlerts(alertData.items);
    setConsultations(consultationData.items);
    setPlans(planData.items);
    setSupports(supportData.items);
    setReport(reportData.items);

    const firstStudentId = studentData.items[0]?.student_id ?? "";
    if (firstStudentId) {
      const progressData = await advisorStudentProgress(firstStudentId, accessToken);
      setProgress(progressData.item);
      if (!riskForm.student_id) {
        setRiskForm((prev) => ({ ...prev, student_id: firstStudentId }));
        setConsultForm((prev) => ({ ...prev, student_id: firstStudentId }));
        setPlanForm((prev) => ({ ...prev, student_id: firstStudentId }));
        setSupportForm((prev) => ({ ...prev, student_id: firstStudentId }));
      }
    } else {
      setProgress(null);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleAssignStudent(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!studentIdInput) {
      setError("Provide student ID before assigning.");
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
    if (!consultForm.student_id) return;
    await advisorCreateConsultation(consultForm, accessToken);
    setConsultForm((prev) => ({ ...prev, summary: "", action_plan: "" }));
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

  return (
    <section className="mt-8 space-y-5">
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
        <h3 className="text-xl font-semibold text-brand.night dark:text-white">Advisor Portal</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {report.map((item) => (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs uppercase text-slate-500">{item.key}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleAssignStudent} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">My Students</h4>
          <div className="mt-2 flex gap-2">
            <input value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} placeholder="Student ID" className="w-full rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <button type="submit" className="rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Assign</button>
          </div>
          <div className="mt-3 max-h-44 overflow-auto text-sm">
            {students.map((item) => (
              <p key={item.id}>{item.student_id}</p>
            ))}
          </div>
          {progress ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
              <p className="font-semibold">{progress.student_name}</p>
              <p>Average: {progress.average_score}</p>
              <p>Open alerts: {progress.risk_alerts_open}</p>
            </div>
          ) : null}
        </form>

        <form onSubmit={handleCreateRisk} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Risk Alerts</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={riskForm.student_id} onChange={(e) => setRiskForm((p) => ({ ...p, student_id: e.target.value }))} placeholder="Student ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <select value={riskForm.risk_level} onChange={(e) => setRiskForm((p) => ({ ...p, risk_level: e.target.value as "low" | "medium" | "high" }))} className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <input value={riskForm.reason} onChange={(e) => setRiskForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={riskForm.recommended_action} onChange={(e) => setRiskForm((p) => ({ ...p, recommended_action: e.target.value }))} placeholder="Action" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Create Alert</button>
          <div className="mt-3 space-y-2">
            {alerts.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p>{item.student_id} - {item.risk_level} - {item.status}</p>
              </div>
            ))}
          </div>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleCreateConsultation} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Consultation Notes</h4>
          <div className="mt-2 grid gap-2">
            <input value={consultForm.student_id} onChange={(e) => setConsultForm((p) => ({ ...p, student_id: e.target.value }))} placeholder="Student ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={consultForm.summary} onChange={(e) => setConsultForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Summary" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={consultForm.action_plan} onChange={(e) => setConsultForm((p) => ({ ...p, action_plan: e.target.value }))} placeholder="Action plan" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Save Consultation</button>
          <div className="mt-3 max-h-40 overflow-auto text-sm">
            {consultations.map((item) => (
              <p key={item.id}>{item.student_id}: {item.summary}</p>
            ))}
          </div>
        </form>

        <div className="space-y-5">
          <form onSubmit={handleCreatePlan} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
            <h4 className="font-semibold text-brand.night dark:text-white">Study Plans</h4>
            <div className="mt-2 grid gap-2">
              <input value={planForm.student_id} onChange={(e) => setPlanForm((p) => ({ ...p, student_id: e.target.value }))} placeholder="Student ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
              <input value={planForm.title} onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))} placeholder="Plan title" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
              <input value={planForm.goals} onChange={(e) => setPlanForm((p) => ({ ...p, goals: e.target.value }))} placeholder="Goals comma-separated" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            </div>
            <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Create Plan</button>
            <div className="mt-3 max-h-28 overflow-auto text-sm">
              {plans.map((item) => (
                <p key={item.id}>{item.student_id}: {item.title}</p>
              ))}
            </div>
          </form>

          <form onSubmit={handleCreateSupport} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
            <h4 className="font-semibold text-brand.night dark:text-white">Support Requests / Escalation</h4>
            <div className="mt-2 grid gap-2">
              <input value={supportForm.student_id} onChange={(e) => setSupportForm((p) => ({ ...p, student_id: e.target.value }))} placeholder="Student ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
              <input value={supportForm.title} onChange={(e) => setSupportForm((p) => ({ ...p, title: e.target.value }))} placeholder="Request title" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
              <input value={supportForm.description} onChange={(e) => setSupportForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            </div>
            <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">Create Request</button>
            <div className="mt-3 space-y-2">
              {supports.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                  <p>{item.student_id} - {item.status}</p>
                  {item.status === "open" ? (
                    <button
                      onClick={() =>
                        void advisorEscalateSupportRequest(
                          item.id,
                          { status: "escalated", escalation_note: "Escalated for urgent review" },
                          accessToken
                        ).then(loadData)
                      }
                      className="mt-1 rounded bg-rose-600 px-2 py-1 text-xs text-white"
                    >
                      Escalate
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
