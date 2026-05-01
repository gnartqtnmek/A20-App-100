import { type AuthUser, DASHBOARD_FALLBACK, type DashboardPayload, type ModuleItem, type RoleSlug } from "./roles";
import type {
  AdminUserItem,
  AdvisorStudentItem,
  AnnouncementItem,
  Assignment,
  AuditLogItem,
  AttendanceRecord,
  AttendanceSession,
  ConsultationItem,
  CourseItem,
  CourseDetail,
  CourseSummary,
  CurriculumItem,
  DepartmentItem,
  EnrollmentActionResult,
  ExamApprovalItem,
  ForumTopicItem,
  GradeItem,
  GradeApprovalItem,
  Lesson,
  LecturerAssignmentItem,
  MetaPage,
  NotificationItem,
  PermissionItem,
  ProgramItem,
  Quiz,
  QuizAttemptResult,
  QuizQuestion,
  QualitySurveyItem,
  RiskAlertItem,
  RoleItem,
  RoleReport,
  SectionItem,
  SectionStudent,
  SemesterItem,
  StudentProgressItem,
  StudentTrackingItem,
  StudyPlanItem,
  Submission,
  LiveClassSessionItem,
  SupportRequestItem,
  UploadedFileItem
} from "./lms";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type LoginResult = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
};

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    throw new Error("Invalid credentials");
  }
  return (await response.json()) as LoginResult;
}

export async function logoutRequest(accessToken: string): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export async function meRequest(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return (await response.json()) as AuthUser;
}

export function myProfile(accessToken: string) {
  return apiFetch<AdminUserItem>("/api/v1/profile", accessToken);
}

export function updateMyProfile(payload: { full_name?: string }, accessToken: string) {
  return apiFetch<AdminUserItem>("/api/v1/profile", accessToken, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function fetchModules(role: RoleSlug, accessToken: string): Promise<ModuleItem[]> {
  const response = await fetch(`${API_URL}/api/v1/modules/${role}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Cannot load modules");
  }
  const payload = (await response.json()) as { modules?: ModuleItem[] };
  return payload.modules ?? DASHBOARD_FALLBACK[role].modules;
}

export async function fetchDashboard(role: RoleSlug, accessToken: string): Promise<DashboardPayload> {
  const response = await fetch(`${API_URL}/api/v1/dashboards/${role}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Cannot load dashboard");
  }
  return (await response.json()) as DashboardPayload;
}

export function studentListCourses(accessToken: string) {
  return apiFetch<CourseSummary[]>("/api/v1/student/courses", accessToken);
}

export function studentCourseDetail(sectionId: string, accessToken: string) {
  return apiFetch<CourseDetail>(`/api/v1/student/courses/${sectionId}`, accessToken);
}

export function studentLessons(sectionId: string, accessToken: string) {
  return apiFetch<Lesson[]>(`/api/v1/student/courses/${sectionId}/lessons`, accessToken);
}

export function studentAssignments(sectionId: string, accessToken: string) {
  return apiFetch<Assignment[]>(`/api/v1/student/courses/${sectionId}/assignments`, accessToken);
}

export function studentSubmitAssignment(assignmentId: string, content: string, accessToken: string) {
  return apiFetch<Submission>(`/api/v1/student/assignments/${assignmentId}/submit`, accessToken, {
    method: "POST",
    body: JSON.stringify({ content })
  });
}

export function studentQuizzes(sectionId: string, accessToken: string) {
  return apiFetch<Quiz[]>(`/api/v1/student/courses/${sectionId}/quizzes`, accessToken);
}

export function studentQuizQuestions(quizId: string, accessToken: string) {
  return apiFetch<QuizQuestion[]>(`/api/v1/student/quizzes/${quizId}/questions`, accessToken);
}

export function studentSubmitQuiz(quizId: string, answers: Record<string, string>, accessToken: string) {
  return apiFetch<QuizAttemptResult>(`/api/v1/student/quizzes/${quizId}/submit`, accessToken, {
    method: "POST",
    body: JSON.stringify({ answers })
  });
}

export function studentGrades(accessToken: string) {
  return apiFetch<GradeItem[]>("/api/v1/student/grades", accessToken);
}

export function studentAttendance(accessToken: string, sectionId?: string) {
  const query = sectionId ? `?section_id=${sectionId}` : "";
  return apiFetch<AttendanceRecord[]>(`/api/v1/student/attendance${query}`, accessToken);
}

export function studentCommunityTopics(sectionId: string, accessToken: string) {
  return apiFetch<ForumTopicItem[]>(`/api/v1/student/community/topics?section_id=${encodeURIComponent(sectionId)}`, accessToken);
}

export function studentCreateCommunityTopic(payload: { section_id: string; title: string; content: string }, accessToken: string) {
  return apiFetch<ForumTopicItem>("/api/v1/student/community/topics", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerSections(accessToken: string) {
  return apiFetch<CourseSummary[]>("/api/v1/lecturer/sections", accessToken);
}

export function lecturerSectionDetail(sectionId: string, accessToken: string) {
  return apiFetch<CourseDetail>(`/api/v1/lecturer/sections/${sectionId}`, accessToken);
}

export function lecturerLessons(sectionId: string, accessToken: string) {
  return apiFetch<Lesson[]>(`/api/v1/lecturer/sections/${sectionId}/lessons`, accessToken);
}

export function lecturerCreateLesson(
  sectionId: string,
  payload: { title: string; content: string; order_index: number; is_published: boolean },
  accessToken: string
) {
  return apiFetch<Lesson>(`/api/v1/lecturer/sections/${sectionId}/lessons`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerAssignments(sectionId: string, accessToken: string) {
  return apiFetch<Assignment[]>(`/api/v1/lecturer/sections/${sectionId}/assignments`, accessToken);
}

export function lecturerCreateAssignment(
  sectionId: string,
  payload: { title: string; description: string; max_score: number; due_at?: string },
  accessToken: string
) {
  return apiFetch<Assignment>(`/api/v1/lecturer/sections/${sectionId}/assignments`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerSubmissions(assignmentId: string, accessToken: string) {
  return apiFetch<Submission[]>(`/api/v1/lecturer/assignments/${assignmentId}/submissions`, accessToken);
}

export function lecturerGradeSubmission(
  submissionId: string,
  payload: { score: number; feedback: string },
  accessToken: string
) {
  return apiFetch<Submission>(`/api/v1/lecturer/submissions/${submissionId}/grade`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerQuizzes(sectionId: string, accessToken: string) {
  return apiFetch<Quiz[]>(`/api/v1/lecturer/sections/${sectionId}/quizzes`, accessToken);
}

export function lecturerCreateQuiz(
  sectionId: string,
  payload: { title: string; duration_minutes: number; max_score: number; is_published: boolean },
  accessToken: string
) {
  return apiFetch<Quiz>(`/api/v1/lecturer/sections/${sectionId}/quizzes`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerAddQuestion(
  quizId: string,
  payload: { prompt: string; options: string[]; correct_answer: string; points: number; order_index: number },
  accessToken: string
) {
  return apiFetch<QuizQuestion>(`/api/v1/lecturer/quizzes/${quizId}/questions`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerQuizQuestions(quizId: string, accessToken: string) {
  return apiFetch<QuizQuestion[]>(`/api/v1/lecturer/quizzes/${quizId}/questions`, accessToken);
}

export function lecturerGradebook(sectionId: string, accessToken: string) {
  return apiFetch<GradeItem[]>(`/api/v1/lecturer/sections/${sectionId}/gradebook`, accessToken);
}

export function lecturerSectionStudents(sectionId: string, accessToken: string) {
  return apiFetch<SectionStudent[]>(`/api/v1/lecturer/sections/${sectionId}/students`, accessToken);
}

export function lecturerAttendanceSessions(sectionId: string, accessToken: string) {
  return apiFetch<AttendanceSession[]>(`/api/v1/lecturer/sections/${sectionId}/attendance-sessions`, accessToken);
}

export function lecturerCreateAttendanceSession(
  sectionId: string,
  payload: { session_date: string; title: string },
  accessToken: string
) {
  return apiFetch<AttendanceSession>(`/api/v1/lecturer/sections/${sectionId}/attendance-sessions`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerMarkAttendance(
  sessionId: string,
  records: { student_id: string; status: "present" | "absent" | "late"; note: string }[],
  accessToken: string
) {
  return apiFetch<AttendanceRecord[]>(`/api/v1/lecturer/attendance-sessions/${sessionId}/mark`, accessToken, {
    method: "POST",
    body: JSON.stringify({ records })
  });
}

export function lecturerAttendanceRecords(sectionId: string, accessToken: string) {
  return apiFetch<AttendanceRecord[]>(`/api/v1/lecturer/sections/${sectionId}/attendance`, accessToken);
}

export function lecturerLiveSessions(sectionId: string, accessToken: string) {
  return apiFetch<LiveClassSessionItem[]>(`/api/v1/lecturer/sections/${sectionId}/live-sessions`, accessToken);
}

export function lecturerCreateLiveSession(
  payload: { section_id: string; title: string; scheduled_at: string; platform: string; meeting_url: string; recording_url: string },
  accessToken: string
) {
  return apiFetch<LiveClassSessionItem>("/api/v1/lecturer/live-sessions", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerForumTopics(sectionId: string, accessToken: string) {
  return apiFetch<ForumTopicItem[]>(`/api/v1/lecturer/sections/${sectionId}/forum-topics`, accessToken);
}

export function lecturerCreateForumTopic(payload: { section_id: string; title: string; content: string }, accessToken: string) {
  return apiFetch<ForumTopicItem>("/api/v1/lecturer/forum-topics", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function lecturerModerateForumTopic(
  topicId: string,
  payload: { status?: string; is_pinned?: boolean },
  accessToken: string
) {
  return apiFetch<ForumTopicItem>(`/api/v1/lecturer/forum-topics/${topicId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

type Paged<T> = {
  items: T[];
  meta: MetaPage;
};

export function adminRoles(accessToken: string) {
  return apiFetch<{ items: RoleItem[] }>("/api/v1/admin/roles", accessToken);
}

export function adminPermissions(accessToken: string) {
  return apiFetch<{ items: PermissionItem[] }>("/api/v1/admin/permissions", accessToken);
}

export function adminUpdateRolePermissions(roleCode: string, permissionCodes: string[], accessToken: string) {
  return apiFetch<{ message: string }>(`/api/v1/admin/roles/${roleCode}/permissions`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ permission_codes: permissionCodes })
  });
}

export function adminDepartments(accessToken: string, page = 1, limit = 20, search = "") {
  const query = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return apiFetch<Paged<DepartmentItem>>(`/api/v1/admin/departments${query}`, accessToken);
}

export function adminCreateDepartment(payload: { code: string; name: string; description: string }, accessToken: string) {
  return apiFetch<{ item: DepartmentItem }>("/api/v1/admin/departments", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminPrograms(accessToken: string, page = 1, limit = 20, search = "") {
  const query = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return apiFetch<Paged<ProgramItem>>(`/api/v1/admin/programs${query}`, accessToken);
}

export function adminCreateProgram(
  payload: { code: string; name: string; department_id?: string; total_credits: number },
  accessToken: string
) {
  return apiFetch<{ item: ProgramItem }>("/api/v1/admin/programs", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminCourses(accessToken: string, page = 1, limit = 20, search = "") {
  const query = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return apiFetch<Paged<CourseItem>>(`/api/v1/admin/courses${query}`, accessToken);
}

export function adminCreateCourse(
  payload: { code: string; name: string; department_id?: string; credits: number; description: string },
  accessToken: string
) {
  return apiFetch<{ item: CourseItem }>("/api/v1/admin/courses", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminSemesters(accessToken: string, page = 1, limit = 20) {
  return apiFetch<Paged<SemesterItem>>(`/api/v1/admin/semesters?page=${page}&limit=${limit}`, accessToken);
}

export function adminCreateSemester(
  payload: { code: string; name: string; start_date: string; end_date: string; status: string },
  accessToken: string
) {
  return apiFetch<{ item: SemesterItem }>("/api/v1/admin/semesters", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminSections(accessToken: string, page = 1, limit = 20, search = "") {
  const query = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return apiFetch<Paged<SectionItem>>(`/api/v1/admin/sections${query}`, accessToken);
}

export function adminCreateSection(
  payload: {
    course_id: string;
    lecturer_id?: string;
    code: string;
    semester: string;
    max_students: number;
    status: string;
  },
  accessToken: string
) {
  return apiFetch<{ item: SectionItem }>("/api/v1/admin/sections", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminSystemReport(accessToken: string) {
  return apiFetch<{ items: { key: string; value: string }[] }>("/api/v1/admin/reports/system", accessToken);
}

export function adminEnrollmentAction(
  payload: { student_ids: string[]; target_section_id: string; action_type: "enroll" | "drop" | "move"; reason: string },
  accessToken: string
) {
  return apiFetch<EnrollmentActionResult>("/api/v1/admin/enrollments/actions", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function academicCurriculum(accessToken: string, programId?: string) {
  const query = programId ? `?program_id=${programId}` : "";
  return apiFetch<{ items: CurriculumItem[] }>(`/api/v1/academic/curriculum${query}`, accessToken);
}

export function academicCreateCurriculum(
  payload: { program_id: string; course_id: string; semester_no: number; is_required: boolean },
  accessToken: string
) {
  return apiFetch<{ item: CurriculumItem }>("/api/v1/academic/curriculum", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function academicSections(accessToken: string) {
  return apiFetch<Paged<SectionItem>>("/api/v1/academic/sections?page=1&limit=50", accessToken);
}

export function academicAssignLecturer(
  payload: { section_id: string; lecturer_id: string; role: string },
  accessToken: string
) {
  return apiFetch<{ item: LecturerAssignmentItem }>("/api/v1/academic/lecturer-assignments", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function academicStudentTracking(accessToken: string) {
  return apiFetch<{ items: StudentTrackingItem[] }>("/api/v1/academic/student-tracking", accessToken);
}

export function academicGradeApprovals(accessToken: string) {
  return apiFetch<{ items: GradeApprovalItem[] }>("/api/v1/academic/grade-approvals", accessToken);
}

export function academicCreateGradeApproval(payload: { section_id: string; note: string }, accessToken: string) {
  return apiFetch<{ item: GradeApprovalItem }>("/api/v1/academic/grade-approvals", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function academicActionGradeApproval(
  approvalId: string,
  payload: { status: "approved" | "rejected"; note: string },
  accessToken: string
) {
  return apiFetch<{ item: GradeApprovalItem }>(`/api/v1/academic/grade-approvals/${approvalId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function academicExamApprovals(accessToken: string) {
  return apiFetch<{ items: ExamApprovalItem[] }>("/api/v1/academic/exam-approvals", accessToken);
}

export function academicCreateExamApproval(payload: { quiz_id: string; note: string }, accessToken: string) {
  return apiFetch<{ item: ExamApprovalItem }>("/api/v1/academic/exam-approvals", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function academicActionExamApproval(
  approvalId: string,
  payload: { status: "approved" | "rejected"; note: string },
  accessToken: string
) {
  return apiFetch<{ item: ExamApprovalItem }>(`/api/v1/academic/exam-approvals/${approvalId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function academicReport(accessToken: string) {
  return apiFetch<{ items: { key: string; value: string }[] }>("/api/v1/academic/reports/training", accessToken);
}

export function academicSurveys(accessToken: string) {
  return apiFetch<{ items: QualitySurveyItem[] }>("/api/v1/academic/surveys", accessToken);
}

export function academicCreateSurvey(
  payload: { title: string; category: string; status: string; responses_count: number },
  accessToken: string
) {
  return apiFetch<{ item: QualitySurveyItem }>("/api/v1/academic/surveys", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function advisorStudents(accessToken: string) {
  return apiFetch<{ items: AdvisorStudentItem[] }>("/api/v1/advisor/students", accessToken);
}

export function advisorAssignStudent(studentId: string, accessToken: string) {
  return apiFetch<{ item: AdvisorStudentItem }>("/api/v1/advisor/students", accessToken, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId })
  });
}

export function advisorStudentProgress(studentId: string, accessToken: string) {
  return apiFetch<{ item: StudentProgressItem }>(`/api/v1/advisor/students/${studentId}/progress`, accessToken);
}

export function advisorRiskAlerts(accessToken: string) {
  return apiFetch<{ items: RiskAlertItem[] }>("/api/v1/advisor/risk-alerts", accessToken);
}

export function advisorCreateRiskAlert(
  payload: { student_id: string; risk_level: "low" | "medium" | "high"; reason: string; recommended_action: string },
  accessToken: string
) {
  return apiFetch<{ item: RiskAlertItem }>("/api/v1/advisor/risk-alerts", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function advisorConsultations(accessToken: string) {
  return apiFetch<{ items: ConsultationItem[] }>("/api/v1/advisor/consultations", accessToken);
}

export function advisorCreateConsultation(
  payload: { student_id: string; summary: string; action_plan: string; follow_up_at?: string },
  accessToken: string
) {
  return apiFetch<{ item: ConsultationItem }>("/api/v1/advisor/consultations", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function advisorStudyPlans(accessToken: string) {
  return apiFetch<{ items: StudyPlanItem[] }>("/api/v1/advisor/study-plans", accessToken);
}

export function advisorCreateStudyPlan(
  payload: { student_id: string; title: string; goals: string[]; tasks: { [key: string]: string }[] },
  accessToken: string
) {
  return apiFetch<{ item: StudyPlanItem }>("/api/v1/advisor/study-plans", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function advisorSupportRequests(accessToken: string) {
  return apiFetch<{ items: SupportRequestItem[] }>("/api/v1/advisor/support-requests", accessToken);
}

export function advisorCreateSupportRequest(
  payload: { student_id: string; title: string; description: string },
  accessToken: string
) {
  return apiFetch<{ item: SupportRequestItem }>("/api/v1/advisor/support-requests", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function advisorEscalateSupportRequest(
  supportId: string,
  payload: { status: string; escalation_note: string },
  accessToken: string
) {
  return apiFetch<{ item: SupportRequestItem }>(`/api/v1/advisor/support-requests/${supportId}/escalate`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function advisorReport(accessToken: string) {
  return apiFetch<{ items: { key: string; value: string }[] }>("/api/v1/advisor/reports/summary", accessToken);
}

export function notifications(accessToken: string, page = 1, limit = 20) {
  return apiFetch<{ items: NotificationItem[]; meta: MetaPage }>(
    `/api/v1/notifications?page=${page}&limit=${limit}`,
    accessToken
  );
}

export function markNotificationRead(notificationId: string, accessToken: string) {
  return apiFetch<{ item: NotificationItem }>(`/api/v1/notifications/${notificationId}/read`, accessToken, {
    method: "PATCH"
  });
}

export function createNotification(
  payload: { user_id: string; title: string; message: string; channel: string },
  accessToken: string
) {
  return apiFetch<{ item: NotificationItem }>("/api/v1/notifications", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function announcements(accessToken: string) {
  return apiFetch<{ items: AnnouncementItem[] }>("/api/v1/announcements", accessToken);
}

export function createAnnouncement(
  payload: { title: string; content: string; target_role: string; section_id?: string; department_id?: string },
  accessToken: string
) {
  return apiFetch<{ item: AnnouncementItem }>("/api/v1/announcements", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function auditLogs(accessToken: string, page = 1, limit = 20, action = "") {
  const query = `?page=${page}&limit=${limit}${action ? `&action=${encodeURIComponent(action)}` : ""}`;
  return apiFetch<{ items: AuditLogItem[]; meta: MetaPage }>(`/api/v1/admin/audit-logs${query}`, accessToken);
}

export async function uploadUserFile(
  payload: { module: string; file: File },
  accessToken: string
): Promise<{ item: UploadedFileItem }> {
  const formData = new FormData();
  formData.append("module", payload.module);
  formData.append("file", payload.file);
  const response = await fetch(`${API_URL}/api/v1/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return (await response.json()) as { item: UploadedFileItem };
}

export function uploadedFiles(accessToken: string, page = 1, limit = 20) {
  return apiFetch<{ items: UploadedFileItem[]; meta: MetaPage }>(`/api/v1/files?page=${page}&limit=${limit}`, accessToken);
}

export function roleReport(role: RoleSlug, accessToken: string) {
  return apiFetch<RoleReport>(`/api/v1/reports/${role}`, accessToken);
}

export function adminUsers(accessToken: string, page = 1, limit = 20) {
  return apiFetch<{ items: AdminUserItem[]; total: number; page: number; limit: number }>(
    `/api/v1/users?page=${page}&limit=${limit}`,
    accessToken
  );
}

export function adminCreateUser(
  payload: {
    email: string;
    full_name: string;
    password: string;
    role: RoleSlug;
    department_id?: string;
    program_id?: string;
    is_active: boolean;
  },
  accessToken: string
) {
  return apiFetch<AdminUserItem>("/api/v1/users", accessToken, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminUpdateUser(
  userId: string,
  payload: {
    full_name?: string;
    role?: RoleSlug;
    department_id?: string;
    program_id?: string;
    is_active?: boolean;
    password?: string;
  },
  accessToken: string
) {
  return apiFetch<AdminUserItem>(`/api/v1/users/${userId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function adminDeleteUser(userId: string, accessToken: string) {
  return apiFetch<{ message: string }>(`/api/v1/users/${userId}`, accessToken, {
    method: "DELETE"
  });
}
