"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  announcements,
  createAnnouncement,
  lecturerAddQuestion,
  lecturerAssignments,
  lecturerAttendanceRecords,
  lecturerAttendanceSessions,
  lecturerCreateAssignment,
  lecturerCreateAttendanceSession,
  lecturerCreateLesson,
  lecturerCreateLiveSession,
  lecturerCreateForumTopic,
  lecturerCreateQuiz,
  lecturerForumTopics,
  lecturerGradeSubmission,
  lecturerGradebook,
  lecturerLessons,
  lecturerMarkAttendance,
  lecturerModerateForumTopic,
  lecturerQuizQuestions,
  lecturerQuizzes,
  lecturerSectionDetail,
  lecturerSectionStudents,
  lecturerSections,
  lecturerSubmissions,
  lecturerLiveSessions,
  markNotificationRead,
  notifications,
  roleReport,
  uploadUserFile,
  uploadedFiles
} from "@/lib/api";
import type {
  AnnouncementItem,
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  CourseDetail,
  CourseSummary,
  GradeItem,
  Lesson,
  LiveClassSessionItem,
  NotificationItem,
  Quiz,
  QuizQuestion,
  SectionStudent,
  Submission,
  ForumTopicItem,
  UploadedFileItem
} from "@/lib/lms";
import { type DashboardPayload, type ModuleItem } from "@/lib/roles";

type Props = {
  accessToken: string;
  activeModule: string;
  dashboard: DashboardPayload;
  modules: ModuleItem[];
};

type MetricTone = "blue" | "mint" | "rose" | "violet";

type LessonForm = {
  title: string;
  rich_content: string;
  release_date: string;
  prerequisites: string;
};

type AssignmentForm = {
  instructions: string;
  submission_types: string;
  deadline: string;
  late_policy: string;
  rubric: string;
};

type GradingForm = {
  submission_id: string;
  correctness_score: string;
  clarity_score: string;
  feedback: string;
  return_file: string;
  publish_grade: string;
};

type QuizForm = {
  title: string;
  time_limit: string;
  open_window: string;
  attempts: string;
  result_visibility: string;
};

type QuestionForm = {
  quiz_id: string;
  prompt: string;
  type: string;
  difficulty: string;
  options: string;
  answer: string;
};

type LiveClassForm = {
  session_title: string;
  date_time: string;
  platform: string;
  meeting_url: string;
  recording_url: string;
};

type AttendanceForm = {
  session_id: string;
  status: "present" | "late" | "absent";
};

type AnnouncementForm = {
  subject: string;
  message: string;
  target_group: string;
  schedule_time: string;
  channels: string;
};

const MODULE_TITLE: Record<string, string> = {
  dashboard: "Lecturer Dashboard",
  course_studio: "Course Studio",
  materials: "Materials Manager",
  assignments: "Assignment Builder",
  quiz_bank: "Question Bank",
  gradebook: "Gradebook",
  attendance: "Attendance Manager",
  live_class: "Live Class",
  analytics: "Lecturer Analytics",
  forum: "Forum Moderation",
  messages: "Announcements"
};

const MODULE_SUBTITLE: Record<string, string> = {
  dashboard: "Teaching overview, grading queue and class engagement.",
  course_studio: "Create, edit, duplicate and archive course sections.",
  materials: "Upload slides, PDFs, videos, links and SCORM items.",
  assignments: "Create individual and group assignments with rubric.",
  quiz_bank: "Manage MCQ, essay, matching and random pools.",
  gradebook: "Weighted columns, manual import, publish and lock grades.",
  attendance: "Manual, QR, code and online attendance tracking.",
  live_class: "Schedule Zoom, Meet or Teams sessions and recordings.",
  analytics: "Learning analytics, weak students and content engagement.",
  forum: "Create discussions, pin posts and moderate comments.",
  messages: "Send course announcements by web, email and app."
};

function toneByStatus(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("done") ||
    normalized.includes("submitted") ||
    normalized.includes("present") ||
    normalized.includes("active") ||
    normalized.includes("ready") ||
    normalized.includes("good") ||
    normalized.includes("sent")
  ) {
    return "text-[#2f7f4c]";
  }
  if (normalized.includes("pending") || normalized.includes("open") || normalized.includes("draft") || normalized.includes("review")) {
    return "text-[#5f7198]";
  }
  if (normalized.includes("late") || normalized.includes("risk") || normalized.includes("high") || normalized.includes("reported")) {
    return "text-[#b33a52]";
  }
  return "text-[#5f7198]";
}

function matchText(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

function formatDateCell(value?: string | null) {
  if (!value) return "-";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return value;
  return time.toLocaleDateString();
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

function optionCountFromContent(content: string) {
  const matched = content.match(/attachments|link|scorm|pdf|video/gi);
  return matched?.length ?? 0;
}

function deriveSimilarity(row: Submission) {
  const matched = row.content.match(/similarity\s*:?\s*(\d{1,3})%/i);
  if (matched?.[1]) return `${matched[1]}%`;
  if (typeof row.score === "number") return `${Math.max(0, Math.min(100, Math.round(row.score * 10)))}%`;
  return "-";
}

function buildStudentWorkRows(submission: Submission | undefined) {
  if (!submission) return [];
  return [
    { name: "Files", status: submission.content.includes("File:") ? "1" : "0" },
    { name: "Late", status: submission.status.toLowerCase().includes("late") ? "Yes" : "No" },
    { name: "Similarity", status: deriveSimilarity(submission) },
    { name: "Attempt", status: "1" }
  ];
}

const AVAILABLE_MODULES = [
  "dashboard",
  "course_studio",
  "materials",
  "assignments",
  "quiz_bank",
  "gradebook",
  "attendance",
  "live_class",
  "analytics",
  "forum",
  "messages"
];

export function LecturerWorkspace({ accessToken, activeModule, dashboard, modules }: Props) {
  const [sections, setSections] = useState<CourseSummary[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [sectionDetail, setSectionDetail] = useState<CourseDetail | null>(null);
  const [students, setStudents] = useState<SectionStudent[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [gradebook, setGradebook] = useState<GradeItem[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveClassSessionItem[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopicItem[]>([]);

  const [notificationsRows, setNotificationsRows] = useState<NotificationItem[]>([]);
  const [notificationsMeta, setNotificationsMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [announcementRows, setAnnouncementRows] = useState<AnnouncementItem[]>([]);
  const [uploadedRows, setUploadedRows] = useState<UploadedFileItem[]>([]);
  const [reportRows, setReportRows] = useState<{ key: string; value: string }[]>([]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [materialUpload, setMaterialUpload] = useState<File | null>(null);

  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: "",
    rich_content: "",
    release_date: "",
    prerequisites: ""
  });
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    instructions: "",
    submission_types: "",
    deadline: "",
    late_policy: "",
    rubric: ""
  });
  const [gradingForm, setGradingForm] = useState<GradingForm>({
    submission_id: "",
    correctness_score: "",
    clarity_score: "",
    feedback: "",
    return_file: "",
    publish_grade: "yes"
  });
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: "",
    time_limit: "20",
    open_window: "",
    attempts: "1",
    result_visibility: "Published"
  });
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    quiz_id: "",
    prompt: "",
    type: "MCQ",
    difficulty: "Medium",
    options: "option A, option B, option C, option D",
    answer: "option A"
  });
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>({
    session_id: "",
    status: "present"
  });
  const [liveClassForm, setLiveClassForm] = useState<LiveClassForm>({
    session_title: "",
    date_time: "",
    platform: "Zoom",
    meeting_url: "",
    recording_url: ""
  });
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({
    subject: "",
    message: "",
    target_group: "student",
    schedule_time: "",
    channels: "in_app,email"
  });
  const [forumForm, setForumForm] = useState({ title: "", content: "" });

  const [search, setSearch] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const moduleTitle = MODULE_TITLE[activeModule] ?? modules.find((item) => item.key === activeModule)?.title ?? "Lecturer";
  const subtitle = MODULE_SUBTITLE[activeModule] ?? dashboard.header_subtitle;

  const filteredSections = useMemo(
    () => sections.filter((item) => matchText(`${item.course_code} ${item.course_name} ${item.section_code} ${item.semester}`, search)),
    [search, sections]
  );
  const filteredLessons = useMemo(
    () => lessons.filter((item) => matchText(`${item.title} ${item.content} ${item.is_published}`, search)),
    [lessons, search]
  );
  const filteredAssignments = useMemo(
    () => assignments.filter((item) => matchText(`${item.title} ${item.description} ${item.max_score}`, search)),
    [assignments, search]
  );
  const filteredSubmissions = useMemo(
    () => submissions.filter((item) => matchText(`${item.student_name ?? item.student_id} ${item.status} ${item.content}`, search)),
    [search, submissions]
  );
  const filteredQuestions = useMemo(
    () => quizQuestions.filter((item) => matchText(`${item.prompt} ${item.points}`, search)),
    [quizQuestions, search]
  );
  const filteredGradebook = useMemo(
    () => gradebook.filter((item) => matchText(`${item.student_name ?? item.student_id} ${item.source_title} ${item.score}`, search)),
    [gradebook, search]
  );
  const filteredAttendanceSessions = useMemo(
    () => attendanceSessions.filter((item) => matchText(`${item.title} ${item.session_date}`, search)),
    [attendanceSessions, search]
  );
  const filteredAttendanceRecords = useMemo(
    () => attendanceRecords.filter((item) => matchText(`${item.student_name ?? item.student_id} ${item.status} ${item.note} ${item.attendance_date}`, search)),
    [attendanceRecords, search]
  );
  const filteredNotifications = useMemo(
    () => notificationsRows.filter((item) => matchText(`${item.title} ${item.message} ${item.channel}`, search)),
    [notificationsRows, search]
  );
  const filteredAnnouncements = useMemo(
    () => announcementRows.filter((item) => matchText(`${item.title} ${item.target_role} ${item.content}`, search)),
    [announcementRows, search]
  );
  const filteredFiles = useMemo(
    () => uploadedRows.filter((item) => matchText(`${item.original_name} ${item.module} ${item.content_type}`, search)),
    [search, uploadedRows]
  );
  const filteredLiveSessions = useMemo(
    () => liveSessions.filter((item) => matchText(`${item.title} ${item.platform} ${item.status}`, search)),
    [liveSessions, search]
  );
  const filteredForumTopics = useMemo(
    () => forumTopics.filter((item) => matchText(`${item.title} ${item.content} ${item.status}`, search)),
    [forumTopics, search]
  );

  const sectionStats = useMemo(() => {
    const classes = sections.length;
    const toGrade = submissions.filter((item) => item.score == null).length;
    const unread = notificationsRows.filter((item) => !item.is_read).length;
    const presentCount = attendanceRecords.filter((item) => item.status.toLowerCase() === "present").length;
    const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;
    return {
      classes,
      engage: `${attendanceRate}%`,
      toGrade,
      messages: unread
    };
  }, [attendanceRecords, notificationsRows, sections.length, submissions]);

  const gradeStats = useMemo(() => {
    const uniqueStudents = new Set(gradebook.map((item) => item.student_id));
    const avg = gradebook.length > 0 ? gradebook.reduce((sum, item) => sum + item.score, 0) / gradebook.length : 0;
    const studentAvg = new Map<string, number[]>();
    gradebook.forEach((item) => {
      const current = studentAvg.get(item.student_id) ?? [];
      current.push(item.score);
      studentAvg.set(item.student_id, current);
    });
    const atRisk = Array.from(studentAvg.values()).filter((scores) => {
      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return mean < 5;
    }).length;
    const passedRatio = uniqueStudents.size > 0 ? Math.round(((uniqueStudents.size - atRisk) / uniqueStudents.size) * 100) : 0;
    return { students: uniqueStudents.size, average: avg, atRisk, passedRatio };
  }, [gradebook]);

  const analyticsStats: { label: string; value: string; tone: MetricTone }[] = useMemo(() => {
    const classCount = sections.length || Number(reportRows.find((item) => /section|class/i.test(item.key))?.value ?? 0);
    const avgScore = gradeStats.average > 0 ? Math.round((gradeStats.average / 10) * 100) : 0;
    return [
      { label: "Total", value: `${classCount} classes`, tone: "blue" },
      { label: "Growth", value: `+${Math.max(3, Math.round((gradeStats.passedRatio || 40) / 8))}%`, tone: "mint" },
      { label: "Risk", value: `${Math.max(0, gradeStats.atRisk)} students`, tone: "rose" },
      { label: "Score", value: `${Math.max(0, avgScore)}%`, tone: "violet" }
    ];
  }, [gradeStats.atRisk, gradeStats.average, gradeStats.passedRatio, reportRows, sections.length]);

  const insightsRows = useMemo(() => {
    const fromReport = reportRows.slice(0, 3).map((item) => ({ signal: item.key, action: item.value }));
    if (fromReport.length > 0) return fromReport;
    return [
      { signal: "Video dropoff", action: "Improve" },
      { signal: "Low login", action: "Alert" },
      { signal: "Late labs", action: "Follow up" }
    ];
  }, [reportRows]);

  const recentActivityRows = useMemo(() => {
    const submissionRows = submissions.slice(0, 2).map((item) => ({
      item: `Submission ${item.student_name ?? item.student_id}`,
      status: item.status,
      time: formatDateCell(item.submitted_at)
    }));
    const lessonRows = lessons.slice(0, 2).map((item) => ({
      item: item.title,
      status: item.is_published ? "Done" : "Draft",
      time: formatDateCell(item.created_at)
    }));
    const assignmentRows = assignments.slice(0, 1).map((item) => ({
      item: item.title,
      status: item.due_at ? "Pending" : "Open",
      time: formatDateCell(item.due_at)
    }));
    const merged = [...lessonRows, ...assignmentRows, ...submissionRows];
    if (merged.length > 0) return merged;
    return [
      { item: "Course introduction", status: "Done", time: "Today" },
      { item: "Assignment 01", status: "Pending", time: "Tomorrow" },
      { item: "Quiz review", status: "Open", time: "Fri" },
      { item: "Grade updated", status: "Done", time: "Yesterday" },
      { item: "Forum reply", status: "New", time: "Now" }
    ];
  }, [assignments, lessons, submissions]);

  async function loadSections() {
    const data = await lecturerSections(accessToken);
    setSections(data);
    if (data.length > 0) {
      setSelectedSectionId((current) => current || data[0].section_id);
    }
  }

  async function loadSubmissions(assignmentId: string) {
    if (!assignmentId) {
      setSubmissions([]);
      return;
    }
    const rows = await lecturerSubmissions(assignmentId, accessToken);
    setSubmissions(rows);
    if (rows.length > 0) {
      setGradingForm((prev) => ({ ...prev, submission_id: prev.submission_id || rows[0].id }));
    }
  }

  async function loadQuizQuestions(quizId: string) {
    if (!quizId) {
      setQuizQuestions([]);
      return;
    }
    setQuizQuestions(await lecturerQuizQuestions(quizId, accessToken));
  }

  async function loadCrossModuleData() {
    const [reportPayload, notificationPayload, announcementPayload, filePayload] = await Promise.all([
      roleReport("lecturer", accessToken),
      notifications(accessToken, 1, 20),
      announcements(accessToken),
      uploadedFiles(accessToken, 1, 100)
    ]);
    setReportRows(reportPayload.items);
    setNotificationsRows(notificationPayload.items);
    setNotificationsMeta(notificationPayload.meta);
    setAnnouncementRows(announcementPayload.items.filter((item) => item.target_role === "student" || item.target_role === "all"));
    setUploadedRows(filePayload.items.filter((item) => item.module.includes("lecturer") || item.module.includes("material")));
  }

  async function loadSectionScope(sectionId: string) {
    const [detailData, studentData, lessonData, assignmentData, quizData, gradeData, sessionData, attendanceData, liveData, forumData] = await Promise.all([
      lecturerSectionDetail(sectionId, accessToken),
      lecturerSectionStudents(sectionId, accessToken),
      lecturerLessons(sectionId, accessToken),
      lecturerAssignments(sectionId, accessToken),
      lecturerQuizzes(sectionId, accessToken),
      lecturerGradebook(sectionId, accessToken),
      lecturerAttendanceSessions(sectionId, accessToken),
      lecturerAttendanceRecords(sectionId, accessToken),
      lecturerLiveSessions(sectionId, accessToken),
      lecturerForumTopics(sectionId, accessToken)
    ]);
    setSectionDetail(detailData);
    setStudents(studentData);
    setLessons(lessonData);
    setAssignments(assignmentData);
    setQuizzes(quizData);
    setGradebook(gradeData);
    setAttendanceSessions(sessionData);
    setAttendanceRecords(attendanceData);
    setLiveSessions(liveData);
    setForumTopics(forumData);

    const firstAssignment = assignmentData[0]?.id ?? "";
    const firstQuiz = quizData[0]?.id ?? "";
    const firstSession = sessionData[0]?.id ?? "";
    setSelectedAssignmentId((current) => current || firstAssignment);
    setSelectedQuizId((current) => current || firstQuiz);
    setQuestionForm((prev) => ({ ...prev, quiz_id: prev.quiz_id || firstQuiz }));
    setAttendanceForm((prev) => ({ ...prev, session_id: prev.session_id || firstSession }));
  }

  async function refreshSectionData() {
    if (!selectedSectionId) return;
    await loadSectionScope(selectedSectionId);
    if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId);
    if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
  }

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setIsBusy(true);
      setError("");
      try {
        await Promise.all([loadSections(), loadCrossModuleData()]);
      } catch {
        if (!cancelled) setError("Cannot load lecturer data.");
      } finally {
        if (!cancelled) setIsBusy(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedSectionId) return;
    async function loadSelectedSection() {
      setError("");
      try {
        await loadSectionScope(selectedSectionId);
      } catch {
        if (!cancelled) setError("Cannot load selected section.");
      }
    }
    void loadSelectedSection();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSectionId]);

  useEffect(() => {
    let cancelled = false;
    async function loadSelectedAssignment() {
      if (!selectedAssignmentId) return;
      try {
        await loadSubmissions(selectedAssignmentId);
      } catch {
        if (!cancelled) setError("Cannot load submissions.");
      }
    }
    void loadSelectedAssignment();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignmentId]);

  useEffect(() => {
    let cancelled = false;
    async function loadSelectedQuiz() {
      if (!selectedQuizId) return;
      try {
        await loadQuizQuestions(selectedQuizId);
      } catch {
        if (!cancelled) setError("Cannot load quiz questions.");
      }
    }
    void loadSelectedQuiz();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuizId]);

  async function handleCreateLesson(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!selectedSectionId) {
      setError("Select a section first.");
      return;
    }
    if (!lessonForm.title.trim()) {
      setError("Lesson title is required.");
      return;
    }
    setIsBusy(true);
    try {
      let attachmentPath = "";
      if (materialUpload) {
        const uploaded = await uploadUserFile({ module: "lecturer_material", file: materialUpload }, accessToken);
        attachmentPath = uploaded.item.path;
      }
      const content =
        `${lessonForm.rich_content || "Lesson content"}` +
        `${lessonForm.release_date ? `\nRelease: ${lessonForm.release_date}` : ""}` +
        `${lessonForm.prerequisites ? `\nPrerequisites: ${lessonForm.prerequisites}` : ""}` +
        `${attachmentPath ? `\nAttachment: ${attachmentPath}` : ""}`;
      await lecturerCreateLesson(
        selectedSectionId,
        {
          title: lessonForm.title.trim(),
          content,
          order_index: lessons.length + 1,
          is_published: true
        },
        accessToken
      );
      setLessonForm({ title: "", rich_content: "", release_date: "", prerequisites: "" });
      setMaterialUpload(null);
      setInfo("Lesson saved.");
      await refreshSectionData();
      await loadCrossModuleData();
    } catch {
      setError("Cannot create lesson.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateAssignment(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!selectedSectionId) {
      setError("Select a section first.");
      return;
    }
    if (!assignmentForm.instructions.trim()) {
      setError("Instructions are required.");
      return;
    }
    setIsBusy(true);
    try {
      const titleFromInstruction = assignmentForm.instructions.trim().slice(0, 48);
      const title = titleFromInstruction.length > 0 ? titleFromInstruction : `Assignment ${assignments.length + 1}`;
      const description =
        `Submission types: ${assignmentForm.submission_types || "Text"}` +
        `${assignmentForm.late_policy ? `\nLate policy: ${assignmentForm.late_policy}` : ""}` +
        `${assignmentForm.rubric ? `\nRubric: ${assignmentForm.rubric}` : ""}`;
      await lecturerCreateAssignment(
        selectedSectionId,
        {
          title,
          description,
          max_score: 10,
          due_at: assignmentForm.deadline ? new Date(assignmentForm.deadline).toISOString() : undefined
        },
        accessToken
      );
      setAssignmentForm({ instructions: "", submission_types: "", deadline: "", late_policy: "", rubric: "" });
      setInfo("Assignment saved.");
      await refreshSectionData();
    } catch {
      setError("Cannot create assignment.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGradeSubmission(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!gradingForm.submission_id) {
      setError("Choose a submission to grade.");
      return;
    }
    const correctness = Number(gradingForm.correctness_score);
    const clarity = Number(gradingForm.clarity_score);
    if (Number.isNaN(correctness) || Number.isNaN(clarity)) {
      setError("Correctness score and clarity score must be numbers.");
      return;
    }
    const averageScore = Math.max(0, Math.min(10, (correctness + clarity) / 2));
    setIsBusy(true);
    try {
      const feedback =
        `${gradingForm.feedback || "Reviewed"}` +
        `${gradingForm.return_file ? `\nReturn file: ${gradingForm.return_file}` : ""}` +
        `${gradingForm.publish_grade ? `\nPublish: ${gradingForm.publish_grade}` : ""}`;
      await lecturerGradeSubmission(gradingForm.submission_id, { score: averageScore, feedback }, accessToken);
      if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId);
      if (selectedSectionId) setGradebook(await lecturerGradebook(selectedSectionId, accessToken));
      setInfo("Submission graded.");
    } catch {
      setError("Cannot grade submission.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateQuiz(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!selectedSectionId) {
      setError("Select a section first.");
      return;
    }
    if (!quizForm.title.trim()) {
      setError("Quiz title is required.");
      return;
    }
    setIsBusy(true);
    try {
      const created = await lecturerCreateQuiz(
        selectedSectionId,
        {
          title: quizForm.title.trim(),
          duration_minutes: Math.max(1, Number(quizForm.time_limit) || 20),
          max_score: 10,
          is_published: quizForm.result_visibility.toLowerCase() !== "draft"
        },
        accessToken
      );
      setQuizForm((prev) => ({ ...prev, title: "" }));
      setSelectedQuizId(created.id);
      setQuestionForm((prev) => ({ ...prev, quiz_id: created.id }));
      await refreshSectionData();
      setInfo("Quiz saved.");
    } catch {
      setError("Cannot create quiz.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddQuestion(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    const quizId = questionForm.quiz_id || selectedQuizId;
    if (!quizId) {
      setError("Choose a quiz first.");
      return;
    }
    if (!questionForm.prompt.trim()) {
      setError("Question content is required.");
      return;
    }
    const options = questionForm.options
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (options.length < 2) {
      setError("At least two options are required.");
      return;
    }
    setIsBusy(true);
    try {
      await lecturerAddQuestion(
        quizId,
        {
          prompt: `${questionForm.type} | ${questionForm.difficulty} | ${questionForm.prompt.trim()}`,
          options,
          correct_answer: questionForm.answer,
          points: 1,
          order_index: quizQuestions.length + 1
        },
        accessToken
      );
      setQuestionForm((prev) => ({ ...prev, prompt: "" }));
      setSelectedQuizId(quizId);
      await loadQuizQuestions(quizId);
      setInfo("Question saved.");
    } catch {
      setError("Cannot add quiz question.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateAttendanceSession() {
    setError("");
    setInfo("");
    if (!selectedSectionId) {
      setError("Select a section first.");
      return;
    }
    setIsBusy(true);
    try {
      await lecturerCreateAttendanceSession(
        selectedSectionId,
        {
          title: "Weekly Session",
          session_date: new Date().toISOString()
        },
        accessToken
      );
      await refreshSectionData();
      setInfo("Attendance session created.");
    } catch {
      setError("Cannot create attendance session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMarkAttendance() {
    setError("");
    setInfo("");
    if (!attendanceForm.session_id) {
      setError("Select an attendance session.");
      return;
    }
    if (students.length === 0) {
      setError("No students found in selected section.");
      return;
    }
    setIsBusy(true);
    try {
      await lecturerMarkAttendance(
        attendanceForm.session_id,
        students.map((student) => ({
          student_id: student.student_id,
          status: attendanceForm.status,
          note: "Marked from lecturer portal"
        })),
        accessToken
      );
      if (selectedSectionId) setAttendanceRecords(await lecturerAttendanceRecords(selectedSectionId, accessToken));
      setInfo("Attendance marked for all students.");
    } catch {
      setError("Cannot mark attendance.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateLiveClass(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!selectedSectionId || !liveClassForm.session_title.trim() || !liveClassForm.date_time.trim() || !liveClassForm.platform.trim()) {
      setError("Session title, date time and platform are required.");
      return;
    }
    setIsBusy(true);
    try {
      await lecturerCreateLiveSession(
        {
          section_id: selectedSectionId,
          title: liveClassForm.session_title.trim(),
          scheduled_at: new Date(liveClassForm.date_time).toISOString(),
          platform: liveClassForm.platform.trim(),
          meeting_url: liveClassForm.meeting_url.trim(),
          recording_url: liveClassForm.recording_url.trim()
        },
        accessToken
      );
      setLiveClassForm({
        session_title: "",
        date_time: "",
        platform: "Zoom",
        meeting_url: "",
        recording_url: ""
      });
      if (selectedSectionId) {
        setLiveSessions(await lecturerLiveSessions(selectedSectionId, accessToken));
      }
      setInfo("Live class session created.");
    } catch {
      setError("Cannot create live class session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateForumTopic(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!selectedSectionId || !forumForm.title.trim()) {
      setError("Section and topic title are required.");
      return;
    }
    setIsBusy(true);
    try {
      await lecturerCreateForumTopic(
        { section_id: selectedSectionId, title: forumForm.title.trim(), content: forumForm.content.trim() },
        accessToken
      );
      setForumForm({ title: "", content: "" });
      setForumTopics(await lecturerForumTopics(selectedSectionId, accessToken));
      setInfo("Forum topic created.");
    } catch {
      setError("Cannot create forum topic.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleModerateForumTopic(topicId: string, status: string, isPinned: boolean) {
    setError("");
    try {
      await lecturerModerateForumTopic(topicId, { status, is_pinned: isPinned }, accessToken);
      if (selectedSectionId) {
        setForumTopics(await lecturerForumTopics(selectedSectionId, accessToken));
      }
    } catch {
      setError("Cannot moderate forum topic.");
    }
  }

  async function handleSaveAnnouncement(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!announcementForm.subject.trim() || !announcementForm.message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setIsBusy(true);
    try {
      const content =
        `${announcementForm.message.trim()}` +
        `${announcementForm.schedule_time ? `\nSchedule: ${announcementForm.schedule_time}` : ""}` +
        `${announcementForm.channels ? `\nChannels: ${announcementForm.channels}` : ""}`;
      await createAnnouncement(
        {
          title: announcementForm.subject.trim(),
          content,
          target_role: announcementForm.target_group,
          section_id: selectedSectionId || undefined
        },
        accessToken
      );
      setAnnouncementForm({
        subject: "",
        message: "",
        target_group: "student",
        schedule_time: "",
        channels: "in_app,email"
      });
      const refreshed = await announcements(accessToken);
      setAnnouncementRows(refreshed.items.filter((item) => item.target_role === "student" || item.target_role === "all"));
      setInfo("Announcement sent.");
    } catch {
      setError("Cannot create announcement.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    setError("");
    try {
      await markNotificationRead(notificationId, accessToken);
      const refreshed = await notifications(accessToken, notificationsMeta.page, notificationsMeta.limit);
      setNotificationsRows(refreshed.items);
      setNotificationsMeta(refreshed.meta);
    } catch {
      setError("Cannot mark notification as read.");
    }
  }

  const selectedSubmission = submissions.find((item) => item.id === gradingForm.submission_id);

  return (
    <section className="space-y-5">
      <PageHeader title={moduleTitle} subtitle={subtitle} />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search lecturer data..."
          className="w-full max-w-[320px] rounded-full border border-[#c2cee6] bg-white px-4 py-2 text-sm text-[#51648c] outline-none"
        />
        {filteredSections.map((section) => (
          <button
            key={section.section_id}
            type="button"
            onClick={() => setSelectedSectionId(section.section_id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              selectedSectionId === section.section_id
                ? "border-[#3864e7] bg-[#3864e7] text-white"
                : "border-[#c4d0e8] bg-white text-[#51648c]"
            }`}
          >
            {section.section_code}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[#b32047]">{error}</p> : null}
      {info ? <p className="text-sm text-[#2f7f4c]">{info}</p> : null}

      {activeModule === "dashboard" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="brainio-card rounded-xl border-t-4 border-t-primary-container p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active classes</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{sectionStats.classes}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">+2 this term</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-amber-700 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Engagement rate</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{sectionStats.engage}</p>
              <p className="mt-2 text-xs text-slate-500">Weekly pulse</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-error p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending grading</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{sectionStats.toGrade}</p>
              <p className="mt-2 text-xs font-semibold text-red-700">Urgent queue</p>
            </article>
            <article className="brainio-card rounded-xl border-t-4 border-t-info p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Unread messages</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{sectionStats.messages}</p>
              <p className="mt-2 text-xs text-slate-500">Student channels</p>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <article className="brainio-card rounded-xl p-5 lg:col-span-8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-slate-900">Course Management</h3>
                <button className="rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-white">Create announcement</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">Section focus</p>
                  <p className="mt-1 text-sm text-slate-500">{sectionDetail?.course_name ?? "No section selected"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">Students</p>
                  <p className="mt-1 text-sm text-slate-500">{students.length} enrolled</p>
                </div>
              </div>
            </article>

            <article className="brainio-card rounded-xl p-5 lg:col-span-4">
              <h3 className="text-lg font-bold text-slate-900">Priority Queue</h3>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {submissions.filter((item) => item.status.toLowerCase().includes("submitted")).length} submissions waiting
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {quizzes.filter((item) => !item.is_published).length} draft quizzes
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {attendanceRecords.filter((item) => item.status.toLowerCase() !== "present").length} attendance flags
                </div>
              </div>
            </article>
          </div>

          <DataTable
            title="Recent Activity"
            columns={[
              { key: "item", header: "Item", render: (row: { item: string; status: string; time: string }) => row.item },
              {
                key: "status",
                header: "Status",
                render: (row: { item: string; status: string; time: string }) => <span className={toneByStatus(row.status)}>{row.status}</span>
              },
              { key: "time", header: "Time", render: (row: { item: string; status: string; time: string }) => row.time }
            ]}
            rows={recentActivityRows}
            rowKey={(row) => `${row.item}-${row.time}`}
          />
        </>
      ) : null}

      {activeModule === "course_studio" ? (
        <>
          <DataTable
            title="Teaching Sections"
            columns={[
              { key: "section", header: "Section", render: (row: CourseSummary) => row.section_code },
              {
                key: "students",
                header: "Students",
                render: (row: CourseSummary) => (row.section_id === selectedSectionId ? students.length.toString() : "-")
              },
              {
                key: "status",
                header: "Status",
                render: (row: CourseSummary) => {
                  const status = row.section_id === selectedSectionId ? "Active" : "Draft";
                  return <span className={toneByStatus(status)}>{status}</span>;
                }
              }
            ]}
            rows={filteredSections}
            rowKey={(row) => row.section_id}
            emptyTitle="No teaching sections"
          />
          <QuickActionStrip quick="Create section" filter="Semester" exportText="Course package" />
        </>
      ) : null}

      {activeModule === "materials" ? (
        <>
          <DataTable
            title="Materials"
            columns={[
              { key: "material", header: "Material", render: (row: { name: string; type: string; visible: string }) => row.name },
              { key: "type", header: "Type", render: (row: { name: string; type: string; visible: string }) => row.type },
              {
                key: "visible",
                header: "Visible",
                render: (row: { name: string; type: string; visible: string }) => <span className={toneByStatus(row.visible)}>{row.visible}</span>
              }
            ]}
            rows={[
              ...filteredLessons.map((item) => ({
                name: item.title,
                type: optionCountFromContent(item.content) > 0 ? "Package" : "Lesson",
                visible: item.is_published ? "Yes" : "No"
              })),
              ...filteredFiles.map((item) => ({
                name: item.original_name,
                type: item.content_type || item.module,
                visible: "Yes"
              }))
            ]}
            rowKey={(row) => `${row.name}-${row.type}`}
            emptyTitle="No materials"
          />

          <QuickActionStrip quick="Upload material" filter="Type and week" exportText="Download all" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateLesson} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Lesson setup</h3>
              <div className="mt-4 grid gap-3">
                <FormField
                  label="Lesson title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                  error={!lessonForm.title && error.includes("Lesson title") ? "Required" : undefined}
                />
                <FormField
                  label="Rich content"
                  value={lessonForm.rich_content}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, rich_content: e.target.value }))}
                />
                <FormField
                  label="Attachments"
                  type="file"
                  onChange={(e) => setMaterialUpload(e.target.files?.[0] ?? null)}
                  helper="Upload by /api/v1/files/upload with module lecturer_material"
                />
                <FormField
                  label="Release date"
                  type="date"
                  value={lessonForm.release_date}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, release_date: e.target.value }))}
                />
                <FormField
                  label="Prerequisites"
                  value={lessonForm.prerequisites}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, prerequisites: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Publish states"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => row.status }
              ]}
              rows={[
                { name: "Draft", status: lessons.filter((item) => !item.is_published).length.toString() },
                { name: "Scheduled", status: lessons.filter((item) => item.content.toLowerCase().includes("release")).length.toString() },
                { name: "Published", status: lessons.filter((item) => item.is_published).length.toString() },
                { name: "Locked", status: lessons.filter((item) => item.content.toLowerCase().includes("lock")).length.toString() }
              ]}
              rowKey={(row) => row.name}
            />
          </div>
        </>
      ) : null}

      {activeModule === "assignments" ? (
        <>
          <DataTable
            title="Assignments"
            columns={[
              { key: "assignment", header: "Assignment", render: (row: Assignment) => row.title },
              { key: "deadline", header: "Deadline", render: (row: Assignment) => formatDateCell(row.due_at) },
              {
                key: "status",
                header: "Status",
                render: (row: Assignment) => <span className={toneByStatus(row.due_at ? "Open" : "Draft")}>{row.due_at ? "Open" : "Draft"}</span>
              }
            ]}
            rows={filteredAssignments}
            rowKey={(row) => row.id}
            emptyTitle="No assignments"
            controls={
              <FormField as="select" label="" value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)}>
                <option value="">Select assignment</option>
                {assignments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </FormField>
            }
          />

          <QuickActionStrip quick="Upload submission spec" filter="Status" exportText="Download ZIP" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateAssignment} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Assignment setup</h3>
              <div className="mt-4 grid gap-3">
                <FormField
                  label="Instructions"
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  error={!assignmentForm.instructions && error.includes("Instructions") ? "Required" : undefined}
                />
                <FormField
                  label="Submission types"
                  value={assignmentForm.submission_types}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, submission_types: e.target.value }))}
                />
                <FormField
                  label="Deadline"
                  type="date"
                  value={assignmentForm.deadline}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, deadline: e.target.value }))}
                />
                <FormField
                  label="Late policy"
                  value={assignmentForm.late_policy}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, late_policy: e.target.value }))}
                />
                <FormField
                  label="Rubric"
                  value={assignmentForm.rubric}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, rubric: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Options"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                {
                  key: "status",
                  header: "Status",
                  render: (row: { name: string; status: string }) => <span className={toneByStatus(row.status)}>{row.status}</span>
                }
              ]}
              rows={[
                { name: "File upload", status: "On" },
                { name: "Text answer", status: "On" },
                { name: "Group mode", status: "Optional" },
                { name: "Similarity", status: "On" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <DataTable
            title="Submissions"
            subtitle="Review submissions, comments and plagiarism score."
            columns={[
              { key: "student", header: "Student", render: (row: Submission) => row.student_name ?? row.student_id },
              {
                key: "status",
                header: "Status",
                render: (row: Submission) => <span className={toneByStatus(row.status)}>{row.status}</span>
              },
              { key: "similarity", header: "Similarity", render: (row: Submission) => deriveSimilarity(row) }
            ]}
            rows={filteredSubmissions}
            rowKey={(row) => row.id}
            emptyTitle="No submissions"
          />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleGradeSubmission} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Grade submission</h3>
              <div className="mt-4 grid gap-3">
                <FormField
                  as="select"
                  label="Submission"
                  value={gradingForm.submission_id}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, submission_id: e.target.value }))}
                >
                  <option value="">Select submission</option>
                  {submissions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.student_name ?? item.student_id}
                    </option>
                  ))}
                </FormField>
                <FormField
                  label="Correctness score"
                  value={gradingForm.correctness_score}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, correctness_score: e.target.value }))}
                />
                <FormField
                  label="Clarity score"
                  value={gradingForm.clarity_score}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, clarity_score: e.target.value }))}
                />
                <FormField
                  label="Feedback"
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, feedback: e.target.value }))}
                />
                <FormField
                  label="Return file"
                  value={gradingForm.return_file}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, return_file: e.target.value }))}
                  helper="TODO: backend has no dedicated return-file endpoint in lecturer grading contract."
                />
                <FormField
                  label="Publish grade"
                  value={gradingForm.publish_grade}
                  onChange={(e) => setGradingForm((prev) => ({ ...prev, publish_grade: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Student work"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => row.status }
              ]}
              rows={buildStudentWorkRows(selectedSubmission)}
              rowKey={(row) => row.name}
              emptyTitle="Select a submission"
            />
          </div>
        </>
      ) : null}

      {activeModule === "quiz_bank" ? (
        <>
          <DataTable
            title="Questions"
            columns={[
              {
                key: "question",
                header: "Question",
                render: (row: QuizQuestion) => {
                  const parts = row.prompt.split("|").map((part) => part.trim());
                  return parts.length >= 3 ? parts[2] : row.prompt;
                }
              },
              {
                key: "type",
                header: "Type",
                render: (row: QuizQuestion) => {
                  const parts = row.prompt.split("|").map((part) => part.trim());
                  return parts[0] ?? "MCQ";
                }
              },
              {
                key: "difficulty",
                header: "Difficulty",
                render: (row: QuizQuestion) => {
                  const parts = row.prompt.split("|").map((part) => part.trim());
                  return parts[1] ?? "Medium";
                }
              }
            ]}
            rows={filteredQuestions}
            rowKey={(row) => row.id}
            emptyTitle="No quiz questions"
            controls={
              <FormField as="select" label="" value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
                <option value="">Select quiz</option>
                {quizzes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </FormField>
            }
          />

          <QuickActionStrip quick="Add question" filter="Topic and level" exportText="Export XML" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateQuiz} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Quiz settings</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Title" value={quizForm.title} onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))} />
                <FormField label="Time limit" value={quizForm.time_limit} onChange={(e) => setQuizForm((prev) => ({ ...prev, time_limit: e.target.value }))} />
                <FormField label="Open window" value={quizForm.open_window} onChange={(e) => setQuizForm((prev) => ({ ...prev, open_window: e.target.value }))} />
                <FormField label="Attempts" value={quizForm.attempts} onChange={(e) => setQuizForm((prev) => ({ ...prev, attempts: e.target.value }))} />
                <FormField
                  label="Result visibility"
                  value={quizForm.result_visibility}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, result_visibility: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Security"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => row.status }
              ]}
              rows={[
                { name: "Shuffle", status: "On" },
                { name: "IP log", status: "On" },
                { name: "Tab log", status: "On" },
                { name: "Webcam", status: "Optional" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <form onSubmit={handleAddQuestion} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-3xl font-bold text-[#151b2d]">Question builder</h3>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <FormField
                as="select"
                label="Quiz"
                value={questionForm.quiz_id || selectedQuizId}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, quiz_id: e.target.value }))}
              >
                <option value="">Select quiz</option>
                {quizzes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </FormField>
              <FormField label="Type" value={questionForm.type} onChange={(e) => setQuestionForm((prev) => ({ ...prev, type: e.target.value }))} />
              <FormField
                label="Difficulty"
                value={questionForm.difficulty}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, difficulty: e.target.value }))}
              />
              <FormField label="Correct answer" value={questionForm.answer} onChange={(e) => setQuestionForm((prev) => ({ ...prev, answer: e.target.value }))} />
            </div>
            <div className="mt-3 grid gap-3">
              <FormField label="Question" value={questionForm.prompt} onChange={(e) => setQuestionForm((prev) => ({ ...prev, prompt: e.target.value }))} />
              <FormField label="Options" value={questionForm.options} onChange={(e) => setQuestionForm((prev) => ({ ...prev, options: e.target.value }))} />
            </div>
            <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Save question
            </button>
          </form>
        </>
      ) : null}

      {activeModule === "gradebook" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${gradeStats.students} students`} tone="blue" />
            <StatCard label="Growth" value={`${gradeStats.passedRatio}% passed`} tone="mint" />
            <StatCard label="Risk" value={`${gradeStats.atRisk} at risk`} tone="rose" />
            <StatCard label="Score" value={`${gradeStats.average.toFixed(1)} avg`} tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Quiz 01", action: "Good" },
              { signal: "Lab", action: "Late" },
              { signal: "Midterm", action: "Review" }
            ]}
            recommendation="Publish grades in batches and keep audit trail for all grade changes."
          />

          <DataTable
            title="Gradebook"
            columns={[
              { key: "student", header: "Student", render: (row: GradeItem) => row.student_name ?? row.student_id },
              { key: "source", header: "Source", render: (row: GradeItem) => row.source_title },
              { key: "score", header: "Score", render: (row: GradeItem) => row.score.toFixed(1) },
              { key: "feedback", header: "Feedback", render: (row: GradeItem) => row.feedback || "-" }
            ]}
            rows={filteredGradebook}
            rowKey={(row) => row.id}
            emptyTitle="No gradebook rows"
          />
        </>
      ) : null}

      {activeModule === "attendance" ? (
        <>
          <DataTable
            title="Sessions"
            columns={[
              { key: "session", header: "Session", render: (row: AttendanceSession) => row.title || formatDateCell(row.session_date) },
              {
                key: "present",
                header: "Present",
                render: (row: AttendanceSession) => {
                  const sessionDate = new Date(row.session_date).toDateString();
                  const recordsBySession = attendanceRecords.filter((item) => new Date(item.attendance_date).toDateString() === sessionDate);
                  const present = recordsBySession.filter((item) => item.status.toLowerCase() === "present").length;
                  const total = recordsBySession.length || students.length;
                  return `${present}/${total}`;
                }
              },
              {
                key: "action",
                header: "Action",
                render: (row: AttendanceSession) => (
                  <button
                    type="button"
                    onClick={() => setAttendanceForm((prev) => ({ ...prev, session_id: row.id }))}
                    className="rounded-full border border-[#bfd0ef] px-3 py-1 text-xs font-semibold text-[#4c5f86]"
                  >
                    {attendanceForm.session_id === row.id ? "Selected" : "Edit"}
                  </button>
                )
              }
            ]}
            rows={filteredAttendanceSessions}
            rowKey={(row) => row.id}
            emptyTitle="No attendance sessions"
          />

          <QuickActionStrip quick="Create QR" filter="By date" exportText="Attendance Excel" />

          <div className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-3xl font-bold text-[#151b2d]">Attendance actions</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => void handleCreateAttendanceSession()}
                disabled={isBusy}
                className="rounded-full bg-[#3864e7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create session
              </button>
              <FormField
                as="select"
                label="Session"
                value={attendanceForm.session_id}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, session_id: e.target.value }))}
              >
                <option value="">Select session</option>
                {attendanceSessions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title || formatDateCell(item.session_date)}
                  </option>
                ))}
              </FormField>
              <FormField
                as="select"
                label="Mark status"
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, status: e.target.value as "present" | "late" | "absent" }))}
              >
                <option value="present">present</option>
                <option value="late">late</option>
                <option value="absent">absent</option>
              </FormField>
            </div>
            <button
              type="button"
              onClick={() => void handleMarkAttendance()}
              disabled={isBusy}
              className="mt-4 rounded-full bg-[#2f7f4c] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Mark all students
            </button>
          </div>

          <DataTable
            title="Attendance records"
            columns={[
              { key: "student", header: "Student", render: (row: AttendanceRecord) => row.student_name ?? row.student_id },
              {
                key: "status",
                header: "Status",
                render: (row: AttendanceRecord) => <span className={toneByStatus(row.status)}>{row.status}</span>
              },
              { key: "note", header: "Note", render: (row: AttendanceRecord) => row.note || "-" },
              { key: "date", header: "Date", render: (row: AttendanceRecord) => formatDateCell(row.attendance_date) }
            ]}
            rows={filteredAttendanceRecords}
            rowKey={(row) => row.id}
            emptyTitle="No attendance records"
          />
        </>
      ) : null}

      {activeModule === "live_class" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleCreateLiveClass} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create live class</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Session title" value={liveClassForm.session_title} onChange={(e) => setLiveClassForm((prev) => ({ ...prev, session_title: e.target.value }))} />
                <FormField label="Date and time" value={liveClassForm.date_time} onChange={(e) => setLiveClassForm((prev) => ({ ...prev, date_time: e.target.value }))} />
                <FormField label="Platform" value={liveClassForm.platform} onChange={(e) => setLiveClassForm((prev) => ({ ...prev, platform: e.target.value }))} />
                <FormField label="Meeting URL" value={liveClassForm.meeting_url} onChange={(e) => setLiveClassForm((prev) => ({ ...prev, meeting_url: e.target.value }))} />
                <FormField label="Recording URL" value={liveClassForm.recording_url} onChange={(e) => setLiveClassForm((prev) => ({ ...prev, recording_url: e.target.value }))} />
              </div>
              <button type="submit" className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white">
                Save changes
              </button>
            </form>

            <DataTable
              title="Live sessions"
              columns={[
                { key: "name", header: "Session", render: (row: LiveClassSessionItem) => row.title },
                { key: "platform", header: "Platform", render: (row: LiveClassSessionItem) => row.platform },
                { key: "status", header: "Status", render: (row: LiveClassSessionItem) => <span className={toneByStatus(row.status)}>{row.status}</span> }
              ]}
              rows={filteredLiveSessions}
              rowKey={(row) => row.id}
              emptyTitle="No live sessions"
            />
          </div>
        </>
      ) : null}

      {activeModule === "analytics" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {analyticsStats.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>

          <AnalyticsSection
            insights={insightsRows}
            recommendation="Send targeted reminders to students with low activity and missing work."
          />

          <DataTable
            title="Role report"
            columns={[
              { key: "key", header: "Metric", render: (row: { key: string; value: string }) => row.key },
              { key: "value", header: "Value", render: (row: { key: string; value: string }) => row.value }
            ]}
            rows={reportRows}
            rowKey={(row) => row.key}
            emptyTitle="No report rows"
          />
        </>
      ) : null}

      {activeModule === "forum" ? (
        <>
          <DataTable
            title="Forum Posts"
            columns={[
              { key: "topic", header: "Topic", render: (row: ForumTopicItem) => row.title },
              { key: "replies", header: "Replies", render: (row: ForumTopicItem) => row.replies_count.toString() },
              {
                key: "state",
                header: "State",
                render: (row: ForumTopicItem) => <span className={toneByStatus(row.status)}>{row.is_pinned ? "Pinned" : row.status}</span>
              },
              {
                key: "action",
                header: "Action",
                render: (row: ForumTopicItem) => (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void handleModerateForumTopic(row.id, "open", !row.is_pinned)} className="rounded-full bg-[#3864e7] px-3 py-1 text-xs font-semibold text-white">
                      {row.is_pinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => void handleModerateForumTopic(row.id, "resolved", row.is_pinned)} className="rounded-full bg-[#2f7f4c] px-3 py-1 text-xs font-semibold text-white">
                      Resolve
                    </button>
                  </div>
                )
              }
            ]}
            rows={filteredForumTopics}
            rowKey={(row) => row.id}
            emptyTitle="No forum topics"
          />
          <form onSubmit={handleCreateForumTopic} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create discussion</h3>
            <div className="mt-4 grid gap-3">
              <FormField label="Title" value={forumForm.title} onChange={(e) => setForumForm((prev) => ({ ...prev, title: e.target.value }))} />
              <FormField label="Content" value={forumForm.content} onChange={(e) => setForumForm((prev) => ({ ...prev, content: e.target.value }))} />
            </div>
            <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Save changes
            </button>
          </form>
          <QuickActionStrip quick="Create discussion" filter="Reported" exportText="Forum archive" />
        </>
      ) : null}

      {activeModule === "messages" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleSaveAnnouncement} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create announcement</h3>
              <div className="mt-4 grid gap-3">
                <FormField label="Subject" value={announcementForm.subject} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, subject: e.target.value }))} />
                <FormField label="Message" value={announcementForm.message} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))} />
                <FormField label="Target group" value={announcementForm.target_group} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, target_group: e.target.value }))} />
                <FormField label="Schedule time" value={announcementForm.schedule_time} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, schedule_time: e.target.value }))} />
                <FormField label="Channels" value={announcementForm.channels} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, channels: e.target.value }))} />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Templates"
              columns={[
                { key: "name", header: "Name", render: (row: AnnouncementItem) => row.title },
                { key: "status", header: "Status", render: () => <span className={toneByStatus("ready")}>Ready</span> }
              ]}
              rows={filteredAnnouncements.slice(0, 8)}
              rowKey={(row) => row.id}
              emptyTitle="No announcement templates"
            />
          </div>

          <DataTable
            title="Inbox"
            columns={[
              { key: "sender", header: "Sender", render: (row: NotificationItem) => row.channel || "System" },
              { key: "subject", header: "Subject", render: (row: NotificationItem) => row.title },
              {
                key: "status",
                header: "Status",
                render: (row: NotificationItem) =>
                  row.is_read ? (
                    <span className={toneByStatus("done")}>Read</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleMarkNotificationRead(row.id)}
                      className="rounded-full bg-[#3864e7] px-2 py-1 text-xs font-semibold text-white"
                    >
                      Unread
                    </button>
                  )
              }
            ]}
            rows={filteredNotifications}
            rowKey={(row) => row.id}
            emptyTitle="No notifications"
            pagination={{
              page: notificationsMeta.page,
              total: notificationsMeta.total,
              limit: notificationsMeta.limit,
              onPageChange: async (page) => {
                try {
                  const response = await notifications(accessToken, page, notificationsMeta.limit);
                  setNotificationsRows(response.items);
                  setNotificationsMeta(response.meta);
                } catch {
                  setError("Cannot change notifications page.");
                }
              }
            }}
          />
        </>
      ) : null}

      {AVAILABLE_MODULES.includes(activeModule) ? null : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {modules
              .filter((item) => item.key !== "dashboard")
              .slice(0, 8)
              .map((item) => (
                <ModuleCard key={item.key} module={item} />
              ))}
          </div>
          <EmptyState title="Module unavailable" description="Selected lecturer module is not mapped." />
        </>
      )}

      {sectionDetail ? (
        <p className="text-xs text-[#6f7f9f]">
          Active section: {sectionDetail.course_code} - {sectionDetail.section_code} ({sectionDetail.semester})
        </p>
      ) : null}

      {isBusy ? <p className="text-xs text-[#6f7f9f]">Syncing data...</p> : null}
    </section>
  );
}
