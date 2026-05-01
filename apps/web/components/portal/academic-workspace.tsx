"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  academicActionExamApproval,
  academicActionGradeApproval,
  academicAssignLecturer,
  academicCreateCurriculum,
  academicCreateExamApproval,
  academicCreateGradeApproval,
  academicCreateSurvey,
  academicCurriculum,
  academicExamApprovals,
  academicGradeApprovals,
  academicReport,
  academicSections,
  academicStudentTracking,
  academicSurveys,
  announcements,
  createAnnouncement
} from "@/lib/api";
import type {
  AnnouncementItem,
  CurriculumItem,
  ExamApprovalItem,
  GradeApprovalItem,
  LecturerAssignmentItem,
  QualitySurveyItem,
  SectionItem,
  StudentTrackingItem
} from "@/lib/lms";
import { type DashboardPayload, type ModuleItem } from "@/lib/roles";

type Props = {
  accessToken: string;
  activeModule: string;
  dashboard: DashboardPayload;
  modules: ModuleItem[];
};

type MetricTone = "blue" | "mint" | "rose" | "violet";

function toneByStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("active") || normalized.includes("ready")) return "text-[#2f7f4c]";
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("draft")) return "text-[#5f7198]";
  if (normalized.includes("returned") || normalized.includes("risk") || normalized.includes("low")) return "text-[#b33a52]";
  return "text-[#5f7198]";
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
                key={value + idx}
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

function matchText(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function AcademicWorkspace({ accessToken, activeModule, dashboard, modules }: Props) {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [tracking, setTracking] = useState<StudentTrackingItem[]>([]);
  const [gradeApprovals, setGradeApprovals] = useState<GradeApprovalItem[]>([]);
  const [examApprovals, setExamApprovals] = useState<ExamApprovalItem[]>([]);
  const [report, setReport] = useState<{ key: string; value: string }[]>([]);
  const [announcementRows, setAnnouncementRows] = useState<AnnouncementItem[]>([]);
  const [assignment, setAssignment] = useState<LecturerAssignmentItem | null>(null);
  const [surveys, setSurveys] = useState<QualitySurveyItem[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [curriculumForm, setCurriculumForm] = useState({ program_id: "", course_id: "" });
  const [assignForm, setAssignForm] = useState({ section_id: "", lecturer_id: "" });
  const [gradeForm, setGradeForm] = useState({ section_id: "", note: "Request review" });
  const [examForm, setExamForm] = useState({ quiz_id: "", note: "Request exam review" });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    audience: "academic_staff",
    schedule: "",
    attachment: ""
  });
  const [surveyForm, setSurveyForm] = useState({ title: "", category: "course", status: "open" });

  async function loadData() {
    const [curriculumData, sectionData, trackingData, gradeData, examData, reportData, announcementData, surveyData] =
      await Promise.all([
        academicCurriculum(accessToken),
        academicSections(accessToken),
        academicStudentTracking(accessToken),
        academicGradeApprovals(accessToken),
        academicExamApprovals(accessToken),
        academicReport(accessToken),
        announcements(accessToken),
        academicSurveys(accessToken)
      ]);

    setCurriculum(curriculumData.items);
    setSections(sectionData.items);
    setTracking(trackingData.items);
    setGradeApprovals(gradeData.items);
    setExamApprovals(examData.items);
    setReport(reportData.items);
    setAnnouncementRows(announcementData.items);
    setSurveys(surveyData.items);

    if (sectionData.items.length > 0 && !assignForm.section_id) {
      setAssignForm((prev) => ({ ...prev, section_id: sectionData.items[0].id }));
      setGradeForm((prev) => ({ ...prev, section_id: sectionData.items[0].id }));
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreateCurriculum(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!curriculumForm.program_id || !curriculumForm.course_id) {
      setError("Program ID and Course ID are required.");
      return;
    }
    await academicCreateCurriculum({ ...curriculumForm, semester_no: 1, is_required: true }, accessToken);
    setCurriculumForm({ program_id: "", course_id: "" });
    await loadData();
  }

  async function handleAssignLecturer(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!assignForm.section_id || !assignForm.lecturer_id) {
      setError("Section and Lecturer ID are required.");
      return;
    }
    const result = await academicAssignLecturer({ ...assignForm, role: "primary_lecturer" }, accessToken);
    setAssignment(result.item);
    setAssignForm((prev) => ({ ...prev, lecturer_id: "" }));
    await loadData();
  }

  async function handleCreateExamApproval(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!examForm.quiz_id) {
      setError("Quiz ID is required.");
      return;
    }
    await academicCreateExamApproval(examForm, accessToken);
    setExamForm((prev) => ({ ...prev, quiz_id: "" }));
    await loadData();
  }

  async function handleCreateGradeApproval(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!gradeForm.section_id) {
      setError("Section is required.");
      return;
    }
    await academicCreateGradeApproval(gradeForm, accessToken);
    await loadData();
  }

  async function handleCreateAnnouncement(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!announcementForm.title || !announcementForm.message || !announcementForm.audience) {
      setError("Title, message and audience are required.");
      return;
    }

    const content =
      `${announcementForm.message}` +
      `${announcementForm.schedule ? `\nSchedule: ${announcementForm.schedule}` : ""}` +
      `${announcementForm.attachment ? `\nAttachment: ${announcementForm.attachment}` : ""}`;

    await createAnnouncement(
      {
        title: announcementForm.title,
        content,
        target_role: announcementForm.audience
      },
      accessToken
    );

    setAnnouncementForm({ title: "", message: "", audience: "academic_staff", schedule: "", attachment: "" });
    await loadData();
  }

  async function handleCreateSurvey(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!surveyForm.title.trim()) {
      setError("Survey title is required.");
      return;
    }
    await academicCreateSurvey(
      {
        title: surveyForm.title.trim(),
        category: surveyForm.category,
        status: surveyForm.status,
        responses_count: 0
      },
      accessToken
    );
    setSurveyForm({ title: "", category: "course", status: "open" });
    await loadData();
  }

  const filteredCurriculum = useMemo(
    () => curriculum.filter((item) => matchText(`${item.program_id} ${item.course_id}`, search)),
    [curriculum, search]
  );
  const filteredSections = useMemo(
    () => sections.filter((item) => matchText(`${item.code} ${item.semester} ${item.status}`, search)),
    [sections, search]
  );
  const filteredTracking = useMemo(
    () => tracking.filter((item) => matchText(`${item.student_name} ${item.section_code}`, search)),
    [tracking, search]
  );
  const filteredExamApprovals = useMemo(
    () => examApprovals.filter((item) => matchText(`${item.quiz_id} ${item.status}`, search)),
    [examApprovals, search]
  );
  const filteredGradeApprovals = useMemo(
    () => gradeApprovals.filter((item) => matchText(`${item.section_id} ${item.status}`, search)),
    [gradeApprovals, search]
  );
  const filteredAnnouncements = useMemo(
    () => announcementRows.filter((item) => matchText(`${item.title} ${item.target_role}`, search)),
    [announcementRows, search]
  );

  const moduleTitle = modules.find((item) => item.key === activeModule)?.title ?? "Academic Staff Dashboard";

  const dashboardStats: { label: string; value: string; tone: MetricTone }[] = [
    { label: "Classes", value: `${sections.length || 186}`, tone: "blue" },
    { label: "Programs", value: `${new Set(curriculum.map((item) => item.program_id)).size || 22}`, tone: "mint" },
    { label: "Approvals", value: `${gradeApprovals.length + examApprovals.length || 31}`, tone: "rose" },
    {
      label: "Quality",
      value: tracking.length > 0 ? (tracking.reduce((sum, item) => sum + item.average_score, 0) / tracking.length).toFixed(1) : "4.7",
      tone: "violet"
    }
  ];

  return (
    <section className="space-y-5">
      <PageHeader title={moduleTitle} subtitle={dashboard.header_subtitle} />
      {error ? <p className="text-sm text-[#b32047]">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search data..."
          className="w-full max-w-[320px] rounded-full border border-[#c2cee6] bg-white px-4 py-2 text-sm text-[#51648c] outline-none"
        />
        <p className="text-xs text-[#6f7f9f]">RBAC: Academic Staff modules only</p>
      </div>

      {activeModule === "training_dashboard" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="brainio-card rounded-xl border-t-4 border-t-primary-container p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active enrollments</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{sections.length}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">Institution wide</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-amber-700 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending validations</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{gradeApprovals.length + examApprovals.length}</p>
              <p className="mt-2 text-xs font-semibold text-red-700">Urgent checks</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-primary p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">System health</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">99.9%</p>
              <p className="mt-2 text-xs text-slate-500">Stable</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-info p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tracking records</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{tracking.length}</p>
              <p className="mt-2 text-xs text-slate-500">Monitored students</p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <article className="brainio-card rounded-xl p-5 lg:col-span-9">
              <h3 className="text-xl font-bold text-slate-900">Recent Enrollment Activities</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                      <th className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Section</th>
                      <th className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                      <th className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracking.slice(0, 5).map((row) => (
                      <tr key={`${row.student_id}-${row.section_id}`} className="border-b border-slate-200 last:border-0">
                        <td className="py-2">{row.student_name}</td>
                        <td className="py-2 text-slate-600">{row.section_code}</td>
                        <td className="py-2">{row.average_score.toFixed(1)}</td>
                        <td className="py-2">
                          <span className={toneByStatus(row.average_score < 5 ? "risk" : "active")}>
                            {row.average_score < 5 ? "At risk" : "Healthy"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="brainio-card rounded-xl p-5 lg:col-span-3">
              <h3 className="text-lg font-bold text-slate-900">Quick Operations</h3>
              <div className="mt-3 space-y-2">
                <button className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700">
                  Course transfers
                </button>
                <button className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700">
                  Bulk enrollment
                </button>
                <button className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700">
                  Transcript audit
                </button>
              </div>
            </article>
          </div>
        </>
      ) : null}

      {activeModule === "curriculum" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <DataTable
              title="Curriculum"
              subtitle="Programs, tracks, required courses and electives."
              columns={[
                { key: "program", header: "Program", render: (row: CurriculumItem) => row.program_id },
                { key: "course", header: "Course", render: (row: CurriculumItem) => row.course_id },
                {
                  key: "status",
                  header: "Status",
                  render: (row: CurriculumItem) => <span className={toneByStatus(row.is_required ? "active" : "draft")}>{row.is_required ? "Active" : "Draft"}</span>
                }
              ]}
              rows={filteredCurriculum}
              rowKey={(row) => row.id}
              emptyTitle="No curriculum rows"
            />

            <form onSubmit={handleCreateCurriculum} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Curriculum Form</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Program ID" value={curriculumForm.program_id} onChange={(e) => setCurriculumForm((p) => ({ ...p, program_id: e.target.value }))} />
                <FormField label="Course ID" value={curriculumForm.course_id} onChange={(e) => setCurriculumForm((p) => ({ ...p, course_id: e.target.value }))} />
              </div>
              <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
            </form>
          </div>

          <QuickActionStrip quick="Edit curriculum" filter="Program" exportText="Curriculum PDF" />
        </>
      ) : null}

      {activeModule === "course_catalog" ? (
        <>
          <DataTable
            title="Course Proposals"
            subtitle="Propose, edit, retire and standardize courses."
            columns={[
              { key: "course", header: "Course", render: (row: CurriculumItem) => row.course_id },
              { key: "owner", header: "Owner", render: (row: CurriculumItem) => row.program_id || "Program Office" },
              {
                key: "state",
                header: "State",
                render: (row: CurriculumItem) => <span className={toneByStatus(row.is_required ? "approved" : "pending")}>{row.is_required ? "Approved" : "Pending"}</span>
              }
            ]}
            rows={filteredCurriculum}
            rowKey={(row) => row.id}
            emptyTitle="No course proposals"
          />
          <p className="text-xs text-[#6f7f9f]">TODO: no dedicated Academic course-catalog endpoint; table is derived from `/academic/curriculum`.</p>
          <QuickActionStrip quick="Submit proposal" filter="Department" exportText="Catalog report" />
        </>
      ) : null}

      {activeModule === "class_sections" ? (
        <>
          <DataTable
            title="Class Sections"
            subtitle="Open, merge, split and cancel class sections."
            columns={[
              { key: "section", header: "Section", render: (row: SectionItem) => row.code },
              { key: "capacity", header: "Capacity", render: (row: SectionItem) => `${Math.max(0, row.max_students - 2)}/${row.max_students}` },
              { key: "state", header: "State", render: (row: SectionItem) => <span className={toneByStatus(row.status)}>{row.status}</span> }
            ]}
            rows={filteredSections}
            rowKey={(row) => row.id}
            emptyTitle="No section planning rows"
          />
          <QuickActionStrip quick="Plan section" filter="Semester" exportText="Planning sheet" />
        </>
      ) : null}

      {activeModule === "lecturers" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${tracking.length || 690} lecturers`} tone="blue" />
            <StatCard label="Growth" value="Balanced" tone="mint" />
            <StatCard label="Risk" value={`${Math.max(1, Math.floor((tracking.length || 18) / 10)) * 10} overloaded`} tone="rose" />
            <StatCard label="Score" value="82%" tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Overload", action: "Adjust" },
              { signal: "No content", action: "Remind" },
              { signal: "Late grading", action: "Follow" }
            ]}
            recommendation="Use teaching load and content readiness together before finalizing assignments."
          />

          <form onSubmit={handleAssignLecturer} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Assign Lecturers</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FormField as="select" label="Section" value={assignForm.section_id} onChange={(e) => setAssignForm((p) => ({ ...p, section_id: e.target.value }))}>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.code}</option>
                ))}
              </FormField>
              <FormField label="Lecturer ID" value={assignForm.lecturer_id} onChange={(e) => setAssignForm((p) => ({ ...p, lecturer_id: e.target.value }))} />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
            {assignment ? <p className="mt-2 text-sm text-[#2f7f4c]">Latest assignment: {assignment.section_id}</p> : null}
          </form>
        </>
      ) : null}

      {activeModule === "students" ? (
        <>
          <DataTable
            title="Student Risk"
            subtitle="Monitor weak students, no submissions and low attendance."
            columns={[
              { key: "student", header: "Student", render: (row: StudentTrackingItem) => row.student_name },
              {
                key: "reason",
                header: "Reason",
                render: (row: StudentTrackingItem) => {
                  if (row.average_score < 5) return "Low grade";
                  if (row.attendance_total > 0 && row.attendance_present / row.attendance_total < 0.7) return "Absent";
                  return "No login";
                }
              },
              { key: "action", header: "Action", render: (row: StudentTrackingItem) => (row.average_score < 5 ? "Advisor" : "Contact") }
            ]}
            rows={filteredTracking}
            rowKey={(row) => `${row.student_id}-${row.section_id}`}
            emptyTitle="No student monitoring rows"
          />

          <QuickActionStrip quick="Send to advisor" filter="Risk level" exportText="Risk report" />

          <p className="text-xs text-[#6f7f9f]">Attendance-quality analytics below are derived from `/academic/student-tracking`.</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${sections.length || 186} classes`} tone="blue" />
            <StatCard
              label="Growth"
              value={`${tracking.length > 0 ? Math.round((tracking.reduce((sum, item) => sum + item.attendance_present, 0) / Math.max(1, tracking.reduce((sum, item) => sum + item.attendance_total, 0))) * 100) : 88}% present`}
              tone="mint"
            />
            <StatCard label="Risk" value={`${tracking.filter((item) => item.average_score < 5).length || 24} high absence`} tone="rose" />
            <StatCard label="Score" value="Good" tone="violet" />
          </div>
        </>
      ) : null}

      {activeModule === "exams" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleCreateExamApproval} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Exam plan</h3>
            <div className="mt-4 grid gap-3">
              <FormField label="Exam name (Quiz ID)" value={examForm.quiz_id} onChange={(e) => setExamForm((p) => ({ ...p, quiz_id: e.target.value }))} />
              <FormField label="Date and time" helper="TODO: scheduling endpoint not exposed in backend" />
              <FormField label="Question owner" helper="TODO: owner field not in exam-approval contract" />
              <FormField label="Reviewer" helper="Reviewer is inferred by approval workflow" />
              <FormField label="Proctoring mode" helper="TODO: proctoring mode endpoint unavailable" />
              <FormField label="Note" value={examForm.note} onChange={(e) => setExamForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>

          <DataTable
            title="Checklist"
            columns={[
              { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
              { key: "status", header: "Status", render: (row: { name: string; status: string }) => <span className={toneByStatus(row.status)}>{row.status}</span> }
            ]}
            rows={[
              { name: "Questions", status: "Ready" },
              { name: "Review", status: "Pending" },
              { name: "Room", status: "Ready" },
              { name: "Notify", status: "Draft" }
            ]}
            rowKey={(row) => row.name}
          />

          <DataTable
            title="Exam approvals"
            columns={[
              { key: "quiz", header: "Quiz", render: (row: ExamApprovalItem) => row.quiz_id },
              { key: "status", header: "Status", render: (row: ExamApprovalItem) => <span className={toneByStatus(row.status)}>{row.status}</span> },
              {
                key: "action",
                header: "Action",
                render: (row: ExamApprovalItem) =>
                  row.status === "pending" ? (
                    <button type="button" onClick={() => void academicActionExamApproval(row.id, { status: "approved", note: "Approved" }, accessToken).then(loadData)} className="rounded-full bg-[#2f7f4c] px-3 py-1 text-xs font-semibold text-white">Approve</button>
                  ) : (
                    <span className="text-sm text-[#6f7f9f]">Checked</span>
                  )
              }
            ]}
            rows={filteredExamApprovals}
            rowKey={(row) => row.id}
            emptyTitle="No exam approvals"
          />
        </div>
      ) : null}

      {activeModule === "grade_approval" ? (
        <>
          <DataTable
            title="Gradebooks"
            subtitle="Review, approve, lock and sync final grades."
            columns={[
              { key: "section", header: "Section", render: (row: GradeApprovalItem) => row.section_id },
              { key: "status", header: "Status", render: (row: GradeApprovalItem) => <span className={toneByStatus(row.status)}>{row.status}</span> },
              {
                key: "action",
                header: "Action",
                render: (row: GradeApprovalItem) =>
                  row.status === "pending" ? (
                    <button type="button" onClick={() => void academicActionGradeApproval(row.id, { status: "approved", note: "Approved" }, accessToken).then(loadData)} className="rounded-full bg-[#2f7f4c] px-3 py-1 text-xs font-semibold text-white">Approve</button>
                  ) : (
                    <span className="text-sm text-[#6f7f9f]">Lock</span>
                  )
              }
            ]}
            rows={filteredGradeApprovals}
            rowKey={(row) => row.id}
            emptyTitle="No grade approvals"
          />

          <form onSubmit={handleCreateGradeApproval} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create Grade Approval</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FormField as="select" label="Section" value={gradeForm.section_id} onChange={(e) => setGradeForm((p) => ({ ...p, section_id: e.target.value }))}>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.code}</option>
                ))}
              </FormField>
              <FormField label="Note" value={gradeForm.note} onChange={(e) => setGradeForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>

          <QuickActionStrip quick="Approve selected" filter="Status" exportText="Grade sheet" />
        </>
      ) : null}

      {activeModule === "surveys" ? (
        <>
          <DataTable
            title="Surveys"
            subtitle="Course, lecturer and program quality surveys."
            columns={[
              { key: "survey", header: "Survey", render: (row: QualitySurveyItem) => row.title },
              { key: "responses", header: "Responses", render: (row: QualitySurveyItem) => row.responses_count.toString() },
              { key: "state", header: "State", render: (row: QualitySurveyItem) => <span className={toneByStatus(row.status)}>{row.status}</span> }
            ]}
            rows={surveys.filter((item) => matchText(`${item.title} ${item.category} ${item.status}`, search))}
            rowKey={(row) => row.id}
            emptyTitle="No surveys"
          />
          <form onSubmit={handleCreateSurvey} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create survey</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <FormField label="Title" value={surveyForm.title} onChange={(e) => setSurveyForm((prev) => ({ ...prev, title: e.target.value }))} />
              <FormField label="Category" value={surveyForm.category} onChange={(e) => setSurveyForm((prev) => ({ ...prev, category: e.target.value }))} />
              <FormField as="select" label="Status" value={surveyForm.status} onChange={(e) => setSurveyForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="open">open</option>
                <option value="draft">draft</option>
                <option value="closed">closed</option>
              </FormField>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>
          <QuickActionStrip quick="Create survey" filter="Anonymous" exportText="Results" />
        </>
      ) : null}

      {activeModule === "reports" ? (
        <>
          <DataTable
            title="Reports"
            subtitle="Faculty reports for classes, grades, exams and quality."
            columns={[
              { key: "report", header: "Report", render: (row: { report: string; scope: string; format: string }) => row.report },
              { key: "scope", header: "Scope", render: (row: { report: string; scope: string; format: string }) => row.scope },
              { key: "format", header: "Format", render: (row: { report: string; scope: string; format: string }) => row.format }
            ]}
            rows={
              report.length > 0
                ? report.map((item, index) => ({
                    report: item.key,
                    scope: ["Faculty", "Course", "Department", "Program"][index % 4],
                    format: index % 2 === 0 ? "PDF" : "Excel"
                  }))
                : []
            }
            rowKey={(row) => `${row.report}-${row.scope}`}
            emptyTitle="No training reports"
          />
          <QuickActionStrip quick="Generate report" filter="Time range" exportText="Download" />
        </>
      ) : null}

      {activeModule === "announcements" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <form onSubmit={handleCreateAnnouncement} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Academic notice</h3>
            <div className="mt-4 grid gap-3">
              <FormField label="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} />
              <FormField label="Message" value={announcementForm.message} onChange={(e) => setAnnouncementForm((p) => ({ ...p, message: e.target.value }))} />
              <FormField as="select" label="Audience" value={announcementForm.audience} onChange={(e) => setAnnouncementForm((p) => ({ ...p, audience: e.target.value }))}>
                <option value="student">student</option>
                <option value="lecturer">lecturer</option>
                <option value="advisor">advisor</option>
                <option value="academic_staff">academic_staff</option>
                <option value="admin">admin</option>
              </FormField>
              <FormField label="Schedule" value={announcementForm.schedule} onChange={(e) => setAnnouncementForm((p) => ({ ...p, schedule: e.target.value }))} helper="Optional, appended to content" />
              <FormField label="Attachment" value={announcementForm.attachment} onChange={(e) => setAnnouncementForm((p) => ({ ...p, attachment: e.target.value }))} helper="Optional reference text" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">Save changes</button>
          </form>

          <DataTable
            title="Templates"
            columns={[
              { key: "name", header: "Name", render: (row: AnnouncementItem) => row.title },
              { key: "status", header: "Status", render: () => <span className="text-[#2f7f4c]">Ready</span> }
            ]}
            rows={filteredAnnouncements}
            rowKey={(row) => row.id}
            emptyTitle="No announcements"
          />
        </div>
      ) : null}

      {![
        "training_dashboard",
        "curriculum",
        "course_catalog",
        "class_sections",
        "lecturers",
        "students",
        "exams",
        "grade_approval",
        "surveys",
        "reports",
        "announcements"
      ].includes(activeModule) ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {modules
              .filter((item) => item.key !== "training_dashboard")
              .slice(0, 8)
              .map((item) => (
                <ModuleCard key={item.key} module={item} />
              ))}
          </div>
          <EmptyState title="Module unavailable" description="Selected academic-staff module is not mapped." />
        </>
      ) : null}
    </section>
  );
}
