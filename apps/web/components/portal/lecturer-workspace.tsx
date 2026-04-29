"use client";

import { useEffect, useMemo, useState } from "react";

import {
  lecturerAddQuestion,
  lecturerAssignments,
  lecturerAttendanceRecords,
  lecturerAttendanceSessions,
  lecturerCreateAssignment,
  lecturerCreateAttendanceSession,
  lecturerCreateLesson,
  lecturerCreateQuiz,
  lecturerGradeSubmission,
  lecturerGradebook,
  lecturerLessons,
  lecturerMarkAttendance,
  lecturerQuizQuestions,
  lecturerQuizzes,
  lecturerSectionDetail,
  lecturerSectionStudents,
  lecturerSections,
  lecturerSubmissions
} from "@/lib/api";
import type {
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  CourseDetail,
  CourseSummary,
  GradeItem,
  Lesson,
  Quiz,
  QuizQuestion,
  SectionStudent,
  Submission
} from "@/lib/lms";

type Props = {
  accessToken: string;
};

export function LecturerWorkspace({ accessToken }: Props) {
  const [sections, setSections] = useState<CourseSummary[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [students, setStudents] = useState<SectionStudent[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [gradebook, setGradebook] = useState<GradeItem[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestionPrompt, setQuizQuestionPrompt] = useState("");
  const [quizQuestionOptions, setQuizQuestionOptions] = useState("student,lecturer,admin,advisor");
  const [quizQuestionAnswer, setQuizQuestionAnswer] = useState("lecturer");
  const [markStatus, setMarkStatus] = useState<"present" | "absent" | "late">("present");

  useEffect(() => {
    async function loadSections() {
      const data = await lecturerSections(accessToken);
      setSections(data);
      if (data.length > 0) {
        setSelectedSectionId(data[0].section_id);
      }
    }
    void loadSections();
  }, [accessToken]);

  useEffect(() => {
    async function loadSectionScope() {
      if (!selectedSectionId) return;
      const [sectionDetail, studentData, lessonData, assignmentData, quizData, gradeData, sessionData, attendanceData] =
        await Promise.all([
          lecturerSectionDetail(selectedSectionId, accessToken),
          lecturerSectionStudents(selectedSectionId, accessToken),
          lecturerLessons(selectedSectionId, accessToken),
          lecturerAssignments(selectedSectionId, accessToken),
          lecturerQuizzes(selectedSectionId, accessToken),
          lecturerGradebook(selectedSectionId, accessToken),
          lecturerAttendanceSessions(selectedSectionId, accessToken),
          lecturerAttendanceRecords(selectedSectionId, accessToken)
        ]);
      setDetail(sectionDetail);
      setStudents(studentData);
      setLessons(lessonData);
      setAssignments(assignmentData);
      setQuizzes(quizData);
      setGradebook(gradeData);
      setAttendanceSessions(sessionData);
      setAttendanceRecords(attendanceData);
      setSelectedAssignmentId(assignmentData[0]?.id ?? "");
      setSelectedQuizId(quizData[0]?.id ?? "");
      setSelectedSessionId(sessionData[0]?.id ?? "");
    }
    void loadSectionScope();
  }, [selectedSectionId, accessToken]);

  useEffect(() => {
    async function loadSubmissionsAndQuestions() {
      if (selectedAssignmentId) {
        setSubmissions(await lecturerSubmissions(selectedAssignmentId, accessToken));
      } else {
        setSubmissions([]);
      }
      if (selectedQuizId) {
        setQuizQuestions(await lecturerQuizQuestions(selectedQuizId, accessToken));
      } else {
        setQuizQuestions([]);
      }
    }
    void loadSubmissionsAndQuestions();
  }, [selectedAssignmentId, selectedQuizId, accessToken]);

  const sectionTitle = useMemo(() => {
    if (!detail) return "Course Studio";
    return `${detail.course_code} - ${detail.section_code}`;
  }, [detail]);

  async function refreshSectionData() {
    if (!selectedSectionId) return;
    const [lessonData, assignmentData, quizData, gradeData, sessionData, attendanceData] = await Promise.all([
      lecturerLessons(selectedSectionId, accessToken),
      lecturerAssignments(selectedSectionId, accessToken),
      lecturerQuizzes(selectedSectionId, accessToken),
      lecturerGradebook(selectedSectionId, accessToken),
      lecturerAttendanceSessions(selectedSectionId, accessToken),
      lecturerAttendanceRecords(selectedSectionId, accessToken)
    ]);
    setLessons(lessonData);
    setAssignments(assignmentData);
    setQuizzes(quizData);
    setGradebook(gradeData);
    setAttendanceSessions(sessionData);
    setAttendanceRecords(attendanceData);
  }

  async function handleCreateLesson() {
    if (!selectedSectionId || !lessonTitle.trim()) return;
    await lecturerCreateLesson(
      selectedSectionId,
      { title: lessonTitle, content: "Generated from Sprint 5 Course Studio", order_index: lessons.length + 1, is_published: true },
      accessToken
    );
    setLessonTitle("");
    await refreshSectionData();
  }

  async function handleCreateAssignment() {
    if (!selectedSectionId || !assignmentTitle.trim()) return;
    await lecturerCreateAssignment(
      selectedSectionId,
      { title: assignmentTitle, description: "Sprint 5 assignment workflow", max_score: 10 },
      accessToken
    );
    setAssignmentTitle("");
    await refreshSectionData();
  }

  async function handleGradeSubmission(submissionId: string) {
    await lecturerGradeSubmission(submissionId, { score: 8.5, feedback: "Good structure, improve depth." }, accessToken);
    if (selectedAssignmentId) {
      setSubmissions(await lecturerSubmissions(selectedAssignmentId, accessToken));
    }
    setGradebook(await lecturerGradebook(selectedSectionId, accessToken));
  }

  async function handleCreateQuiz() {
    if (!selectedSectionId || !quizTitle.trim()) return;
    await lecturerCreateQuiz(
      selectedSectionId,
      { title: quizTitle, duration_minutes: 20, max_score: 10, is_published: true },
      accessToken
    );
    setQuizTitle("");
    await refreshSectionData();
  }

  async function handleAddQuestion() {
    if (!selectedQuizId || !quizQuestionPrompt.trim()) return;
    const options = quizQuestionOptions
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await lecturerAddQuestion(
      selectedQuizId,
      {
        prompt: quizQuestionPrompt,
        options,
        correct_answer: quizQuestionAnswer,
        points: 1,
        order_index: quizQuestions.length + 1
      },
      accessToken
    );
    setQuizQuestionPrompt("");
    setQuizQuestions(await lecturerQuizQuestions(selectedQuizId, accessToken));
  }

  async function handleCreateAttendanceSession() {
    if (!selectedSectionId) return;
    const now = new Date().toISOString();
    await lecturerCreateAttendanceSession(selectedSectionId, { session_date: now, title: "Weekly Checkpoint" }, accessToken);
    await refreshSectionData();
  }

  async function handleMarkAttendance() {
    if (!selectedSessionId || students.length === 0) return;
    const records = students.map((student) => ({ student_id: student.student_id, status: markStatus, note: "Sprint 5 mark" }));
    await lecturerMarkAttendance(selectedSessionId, records, accessToken);
    setAttendanceRecords(await lecturerAttendanceRecords(selectedSectionId, accessToken));
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lecturer Modules</p>
        <h3 className="mt-1 text-xl font-bold text-brand.night dark:text-white">{sectionTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.section_id}
              onClick={() => setSelectedSectionId(section.section_id)}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                selectedSectionId === section.section_id
                  ? "border-brand.night bg-brand.night text-white"
                  : "border-slate-300 bg-white/90 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {section.section_code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Lessons Manager</h4>
          <div className="mt-3 flex gap-2">
            <input
              value={lessonTitle}
              onChange={(event) => setLessonTitle(event.target.value)}
              placeholder="New lesson title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
            <button onClick={() => void handleCreateLesson()} className="rounded-lg bg-brand.night px-3 py-2 text-xs font-semibold text-white">
              Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                {lesson.title}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Assignment Manager & Grading</h4>
          <div className="mt-3 flex gap-2">
            <input
              value={assignmentTitle}
              onChange={(event) => setAssignmentTitle(event.target.value)}
              placeholder="New assignment title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
            <button onClick={() => void handleCreateAssignment()} className="rounded-lg bg-brand.night px-3 py-2 text-xs font-semibold text-white">
              Add
            </button>
          </div>
          <select
            value={selectedAssignmentId}
            onChange={(event) => setSelectedAssignmentId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">Select assignment</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
          <div className="mt-3 space-y-2">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-medium">{submission.student_name}</p>
                <p className="text-slate-600 dark:text-slate-300">{submission.content}</p>
                <button onClick={() => void handleGradeSubmission(submission.id)} className="mt-2 rounded bg-brand.night px-2 py-1 text-xs font-semibold text-white">
                  Grade 8.5
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Quiz Builder</h4>
          <div className="mt-3 flex gap-2">
            <input
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
              placeholder="New quiz title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
            <button onClick={() => void handleCreateQuiz()} className="rounded-lg bg-brand.night px-3 py-2 text-xs font-semibold text-white">
              Add
            </button>
          </div>
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">Select quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <input
            value={quizQuestionPrompt}
            onChange={(event) => setQuizQuestionPrompt(event.target.value)}
            placeholder="Question prompt"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={quizQuestionOptions}
            onChange={(event) => setQuizQuestionOptions(event.target.value)}
            placeholder="option1,option2,option3"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            value={quizQuestionAnswer}
            onChange={(event) => setQuizQuestionAnswer(event.target.value)}
            placeholder="Correct answer"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <button onClick={() => void handleAddQuestion()} className="mt-2 rounded-lg bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
            Add Question
          </button>
          <div className="mt-3 space-y-2">
            {quizQuestions.map((question) => (
              <div key={question.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                {question.prompt}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Attendance + Gradebook</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void handleCreateAttendanceSession()} className="rounded-lg bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
              Create Session
            </button>
            <select
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">Select session</option>
              {attendanceSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {new Date(session.session_date).toLocaleString()}
                </option>
              ))}
            </select>
            <select
              value={markStatus}
              onChange={(event) => setMarkStatus(event.target.value as "present" | "absent" | "late")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="present">present</option>
              <option value="late">late</option>
              <option value="absent">absent</option>
            </select>
            <button onClick={() => void handleMarkAttendance()} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              Mark All
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {attendanceRecords.slice(0, 6).map((record) => (
              <div key={record.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                {record.student_name}: {record.status}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {gradebook.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                {item.student_name} - {item.source_title}: {item.score}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
