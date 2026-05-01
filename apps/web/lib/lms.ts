export type CourseSummary = {
  course_id: string;
  section_id: string;
  course_code: string;
  course_name: string;
  section_code: string;
  semester: string;
  lecturer_name?: string | null;
};

export type CourseDetail = {
  course_id: string;
  section_id: string;
  course_code: string;
  course_name: string;
  description: string;
  credits: number;
  section_code: string;
  semester: string;
  lecturer_name?: string | null;
};

export type Lesson = {
  id: string;
  section_id: string;
  title: string;
  content: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
};

export type Assignment = {
  id: string;
  section_id: string;
  title: string;
  description: string;
  due_at?: string | null;
  max_score: number;
  created_at: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string | null;
  content: string;
  submitted_at: string;
  status: string;
  score?: number | null;
  feedback?: string | null;
};

export type Quiz = {
  id: string;
  section_id: string;
  title: string;
  duration_minutes: number;
  max_score: number;
  is_published: boolean;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  prompt: string;
  options: string[];
  points: number;
  order_index: number;
};

export type QuizAttemptResult = {
  attempt_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  submitted_at: string;
};

export type GradeItem = {
  id: string;
  source_type: string;
  source_id: string;
  source_title: string;
  score: number;
  feedback: string;
  section_id: string;
  student_id: string;
  student_name?: string | null;
  created_at: string;
};

export type AttendanceSession = {
  id: string;
  section_id: string;
  session_date: string;
  title: string;
  lecturer_id?: string | null;
};

export type AttendanceRecord = {
  id: string;
  section_id: string;
  student_id: string;
  student_name?: string | null;
  attendance_date: string;
  status: "present" | "absent" | "late" | string;
  note: string;
};

export type SectionStudent = {
  student_id: string;
  full_name: string;
  email: string;
};

export type MetaPage = {
  page: number;
  limit: number;
  total: number;
};

export type RoleItem = {
  id: string;
  code: "student" | "lecturer" | "admin" | "academic_staff" | "advisor";
  name: string;
  description: string;
};

export type PermissionItem = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
};

export type DepartmentItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
};

export type ProgramItem = {
  id: string;
  code: string;
  name: string;
  department_id?: string | null;
  total_credits: number;
  created_at: string;
};

export type CourseItem = {
  id: string;
  code: string;
  name: string;
  department_id?: string | null;
  credits: number;
  description: string;
  created_at: string;
};

export type SemesterItem = {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

export type SectionItem = {
  id: string;
  course_id: string;
  lecturer_id?: string | null;
  code: string;
  semester: string;
  max_students: number;
  status: string;
  created_at: string;
};

export type CurriculumItem = {
  id: string;
  program_id: string;
  course_id: string;
  semester_no: number;
  is_required: boolean;
  created_at: string;
};

export type LecturerAssignmentItem = {
  id: string;
  section_id: string;
  lecturer_id: string;
  assigned_by?: string | null;
  role: string;
  created_at: string;
};

export type StudentTrackingItem = {
  student_id: string;
  student_name: string;
  student_email: string;
  section_id: string;
  section_code: string;
  average_score: number;
  attendance_present: number;
  attendance_total: number;
};

export type GradeApprovalItem = {
  id: string;
  section_id: string;
  requested_by?: string | null;
  approved_by?: string | null;
  status: string;
  note: string;
  created_at: string;
};

export type ExamApprovalItem = {
  id: string;
  quiz_id: string;
  requested_by?: string | null;
  approved_by?: string | null;
  status: string;
  note: string;
  created_at: string;
};

export type AdvisorStudentItem = {
  id: string;
  advisor_id: string;
  student_id: string;
  created_at: string;
};

export type StudentProgressItem = {
  student_id: string;
  student_name: string;
  student_email: string;
  total_grades: number;
  average_score: number;
  total_attendance: number;
  present_attendance: number;
  risk_alerts_open: number;
};

export type RiskAlertItem = {
  id: string;
  student_id: string;
  advisor_id?: string | null;
  risk_level: string;
  reason: string;
  status: string;
  recommended_action: string;
  created_at: string;
};

export type ConsultationItem = {
  id: string;
  advisor_id?: string | null;
  student_id: string;
  summary: string;
  action_plan: string;
  follow_up_at?: string | null;
  created_at: string;
};

export type StudyPlanItem = {
  id: string;
  student_id: string;
  advisor_id?: string | null;
  title: string;
  goals: string[];
  tasks: { [key: string]: string }[];
  created_at: string;
};

export type SupportRequestItem = {
  id: string;
  student_id: string;
  advisor_id?: string | null;
  title: string;
  description: string;
  status: string;
  escalation_note: string;
  created_at: string;
};

export type ForumTopicItem = {
  id: string;
  section_id: string;
  created_by?: string | null;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  replies_count: number;
  created_at: string;
};

export type LiveClassSessionItem = {
  id: string;
  section_id: string;
  lecturer_id?: string | null;
  title: string;
  scheduled_at: string;
  platform: string;
  meeting_url: string;
  recording_url: string;
  status: string;
  created_at: string;
};

export type EnrollmentActionResult = {
  requested: number;
  success: number;
  skipped: number;
  action_type: string;
  target_section_id: string;
  reason: string;
};

export type QualitySurveyItem = {
  id: string;
  title: string;
  category: string;
  department_id?: string | null;
  status: string;
  responses_count: number;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  channel: string;
  is_read: boolean;
  created_at: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  target_role: string;
  section_id?: string | null;
  department_id?: string | null;
  created_by?: string | null;
  created_at: string;
};

export type AuditLogItem = {
  id: string;
  actor_id?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  detail: Record<string, string>;
  created_at: string;
};

export type UploadedFileItem = {
  id: string;
  owner_id?: string | null;
  module: string;
  original_name: string;
  stored_name: string;
  content_type: string;
  file_size: number;
  path: string;
  created_at: string;
};

export type RoleReport = {
  role: string;
  title: string;
  generated_at: string;
  items: { key: string; value: string }[];
};

export type AdminUserItem = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "lecturer" | "admin" | "academic_staff" | "advisor";
  department_id?: string | null;
  program_id?: string | null;
  is_active: boolean;
};
