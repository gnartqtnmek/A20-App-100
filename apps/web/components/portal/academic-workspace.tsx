"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  academicActionExamApproval,
  academicActionGradeApproval,
  academicAssignLecturer,
  academicCreateCurriculum,
  academicCreateExamApproval,
  academicCreateGradeApproval,
  academicCurriculum,
  academicExamApprovals,
  academicGradeApprovals,
  academicReport,
  academicSections,
  academicStudentTracking
} from "@/lib/api";
import type {
  CurriculumItem,
  ExamApprovalItem,
  GradeApprovalItem,
  LecturerAssignmentItem,
  SectionItem,
  StudentTrackingItem
} from "@/lib/lms";

type Props = {
  accessToken: string;
};

export function AcademicWorkspace({ accessToken }: Props) {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [tracking, setTracking] = useState<StudentTrackingItem[]>([]);
  const [gradeApprovals, setGradeApprovals] = useState<GradeApprovalItem[]>([]);
  const [examApprovals, setExamApprovals] = useState<ExamApprovalItem[]>([]);
  const [report, setReport] = useState<{ key: string; value: string }[]>([]);
  const [assignment, setAssignment] = useState<LecturerAssignmentItem | null>(null);
  const [error, setError] = useState("");

  const [curriculumForm, setCurriculumForm] = useState({ program_id: "", course_id: "" });
  const [assignForm, setAssignForm] = useState({ section_id: "", lecturer_id: "" });
  const [gradeForm, setGradeForm] = useState({ section_id: "", note: "Request review" });
  const [examForm, setExamForm] = useState({ quiz_id: "", note: "Request exam review" });

  async function loadData() {
    const [curriculumData, sectionData, trackingData, gradeData, examData, reportData] = await Promise.all([
      academicCurriculum(accessToken),
      academicSections(accessToken),
      academicStudentTracking(accessToken),
      academicGradeApprovals(accessToken),
      academicExamApprovals(accessToken),
      academicReport(accessToken)
    ]);
    setCurriculum(curriculumData.items);
    setSections(sectionData.items);
    setTracking(trackingData.items);
    setGradeApprovals(gradeData.items);
    setExamApprovals(examData.items);
    setReport(reportData.items);
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
      setError("Curriculum form requires program_id and course_id.");
      return;
    }
    await academicCreateCurriculum(
      {
        ...curriculumForm,
        semester_no: 1,
        is_required: true
      },
      accessToken
    );
    setCurriculumForm({ program_id: "", course_id: "" });
    await loadData();
  }

  async function handleAssignLecturer(event: FormEvent) {
    event.preventDefault();
    if (!assignForm.section_id || !assignForm.lecturer_id) return;
    const result = await academicAssignLecturer({ ...assignForm, role: "primary_lecturer" }, accessToken);
    setAssignment(result.item);
    setAssignForm((prev) => ({ ...prev, lecturer_id: "" }));
    await loadData();
  }

  async function handleCreateGradeApproval(event: FormEvent) {
    event.preventDefault();
    if (!gradeForm.section_id) return;
    await academicCreateGradeApproval(gradeForm, accessToken);
    await loadData();
  }

  async function handleCreateExamApproval(event: FormEvent) {
    event.preventDefault();
    if (!examForm.quiz_id) return;
    await academicCreateExamApproval(examForm, accessToken);
    setExamForm((prev) => ({ ...prev, quiz_id: "" }));
    await loadData();
  }

  return (
    <section className="mt-8 space-y-5">
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
        <h3 className="text-xl font-semibold text-brand.night dark:text-white">Academic Staff Portal</h3>
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
        <form onSubmit={handleCreateCurriculum} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Curriculum Management</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={curriculumForm.program_id} onChange={(e) => setCurriculumForm((p) => ({ ...p, program_id: e.target.value }))} placeholder="Program ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={curriculumForm.course_id} onChange={(e) => setCurriculumForm((p) => ({ ...p, course_id: e.target.value }))} placeholder="Course ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Add Curriculum Entry
          </button>
          <div className="mt-3 max-h-48 overflow-auto text-sm">
            {curriculum.map((item) => (
              <p key={item.id}>
                Program {item.program_id} to Course {item.course_id}
              </p>
            ))}
          </div>
        </form>

        <form onSubmit={handleAssignLecturer} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Class Sections & Lecturer Assignment</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select value={assignForm.section_id} onChange={(e) => setAssignForm((p) => ({ ...p, section_id: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900">
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </select>
            <input value={assignForm.lecturer_id} onChange={(e) => setAssignForm((p) => ({ ...p, lecturer_id: e.target.value }))} placeholder="Lecturer ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Assign Lecturer
          </button>
          {assignment ? <p className="mt-2 text-sm text-emerald-600">Assigned: {assignment.section_id}</p> : null}
          <div className="mt-3 max-h-48 overflow-auto text-sm">
            {tracking.slice(0, 10).map((item) => (
              <p key={`${item.student_id}-${item.section_id}`}>
                {item.student_name} | {item.section_code} | {item.average_score}
              </p>
            ))}
          </div>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleCreateGradeApproval} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Grade Approval Workflow</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select value={gradeForm.section_id} onChange={(e) => setGradeForm((p) => ({ ...p, section_id: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900">
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </select>
            <input value={gradeForm.note} onChange={(e) => setGradeForm((p) => ({ ...p, note: e.target.value }))} placeholder="Note" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Create Grade Approval
          </button>
          <div className="mt-3 space-y-2">
            {gradeApprovals.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p>{item.section_id} - {item.status}</p>
                {item.status === "pending" ? (
                  <button
                    onClick={() => void academicActionGradeApproval(item.id, { status: "approved", note: "Approved" }, accessToken).then(loadData)}
                    className="mt-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </form>

        <form onSubmit={handleCreateExamApproval} className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="font-semibold text-brand.night dark:text-white">Exam Approval Foundation</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={examForm.quiz_id} onChange={(e) => setExamForm((p) => ({ ...p, quiz_id: e.target.value }))} placeholder="Quiz ID" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
            <input value={examForm.note} onChange={(e) => setExamForm((p) => ({ ...p, note: e.target.value }))} placeholder="Note" className="rounded-lg border px-2 py-1.5 text-sm dark:bg-slate-900" />
          </div>
          <button type="submit" className="mt-2 rounded bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Create Exam Approval
          </button>
          <div className="mt-3 space-y-2">
            {examApprovals.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p>{item.quiz_id} - {item.status}</p>
                {item.status === "pending" ? (
                  <button
                    onClick={() => void academicActionExamApproval(item.id, { status: "approved", note: "Approved" }, accessToken).then(loadData)}
                    className="mt-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
