export type UserRole = "student" | "lecturer" | "admin";

export type UserRead = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type TokenPairRead = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
};

export type AuthResponse = {
  user: UserRead;
  tokens: TokenPairRead;
};

export type CourseRead = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  syllabus_md: string | null;
  lecturer_id: string;
  semester: string | null;
  is_published: boolean;
  invite_code: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type EnrollmentRead = {
  id: string;
  course_id: string;
  student_id: string;
  status: "active" | "dropped" | "completed";
  enrolled_at: string;
};

export type ModuleRead = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type LessonRead = {
  id: string;
  module_id: string;
  title: string;
  content_md: string | null;
  video_url: string | null;
  attachments: Array<{ name: string; url: string; size?: number; mime?: string }>;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentType = "essay" | "file" | "quiz";

export type AssignmentRead = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  type: AssignmentType;
  due_at: string | null;
  max_score: number;
  weight: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SubmissionStatus = "draft" | "submitted" | "late" | "graded";

export type SubmissionRead = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
};

export type GradeRead = {
  id: string;
  student_id: string;
  course_id: string;
  assignment_id: string;
  score: number;
  max_score: number;
  weight: number;
  recorded_at: string;
};

export type NotificationRead = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata_: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};
