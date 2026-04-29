# ERD — Entity-Relationship Diagram & Database Design
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 3.0 | **Ngày:** 2026-04-29 | **Database:** PostgreSQL 15 + pgvector

> **Mục đích:** Backend dev đọc tài liệu này để tạo đúng schema, đúng constraints, đúng indexes. Mọi thay đổi schema phải tạo Alembic migration mới.

---

Tài liệu này mô tả thiết kế cơ sở dữ liệu chi tiết cho hệ thống LMS dành cho 5 nhóm người dùng:

1. Sinh viên
2. Giảng viên
3. Quản trị viên hệ thống
4. Khoa / Bộ môn / Phòng đào tạo
5. Cố vấn học tập

## 1. Tổng quan số lượng bảng

Thiết kế đầy đủ nên có khoảng **75 bảng chính**. Có thể rút gọn khi làm đồ án, nhưng nếu muốn bao phủ đầy đủ chức năng LMS đại học thì nên chia thành các nhóm bảng sau:

| Nhóm module | Số bảng đề xuất | Mục đích |
|---|---:|---|
| Người dùng, phân quyền, tổ chức | 15 | User, role, khoa, bộ môn, ngành, lớp hành chính |
| Học kỳ, môn học, lớp học phần, ghi danh | 12 | Năm học, học kỳ, môn học, lớp học phần, đăng ký học |
| Nội dung học tập | 10 | Chương, bài học, tài liệu, video, tiến độ học |
| Bài tập, nộp bài, rubric | 9 | Giao bài, nộp bài, chấm bài, bài tập nhóm |
| Quiz, ngân hàng câu hỏi, thi online | 13 | Câu hỏi, đề thi, lượt làm bài, đáp án, log thi |
| Điểm số, điểm danh, phúc khảo | 9 | Bảng điểm, trọng số, điểm danh, phúc khảo |
| Giao tiếp, thông báo, diễn đàn | 9 | Thông báo, tin nhắn, forum, bình luận |
| Cố vấn học tập, cảnh báo, hỗ trợ | 8 | Cảnh báo học vụ, tư vấn, ticket hỗ trợ |
| Khảo sát, đánh giá chất lượng | 6 | Khảo sát môn học, đánh giá giảng viên |
| Tích hợp, bảo mật, vận hành | 8 | Audit log, file, backup, API integration |

Tổng cộng: **99 bảng nếu làm rất đầy đủ**. Trong tài liệu này đang đề xuất **75 bảng lõi + mở rộng**, đủ để đáp ứng toàn bộ chức năng đã liệt kê.

---

# 2. Quy ước thiết kế

## 2.1. Kiểu dữ liệu

| Kiểu | Ý nghĩa |
|---|---|
| `BIGINT` | Khóa chính tăng tự động |
| `NVARCHAR(n)` | Chuỗi Unicode |
| `TEXT` hoặc `NVARCHAR(MAX)` | Nội dung dài |
| `DATETIME` | Ngày giờ |
| `DATE` | Ngày |
| `BIT` | True/False |
| `DECIMAL(5,2)` | Điểm số, phần trăm |
| `INT` | Số nguyên |
| `UUID` hoặc `UNIQUEIDENTIFIER` | Mã định danh công khai nếu cần |

## 2.2. Trường chuẩn nên có ở hầu hết bảng

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | BIGINT PK | Khóa chính |
| `created_at` | DATETIME | Ngày tạo |
| `updated_at` | DATETIME | Ngày cập nhật |
| `created_by` | BIGINT FK -> users.id | Người tạo |
| `updated_by` | BIGINT FK -> users.id | Người cập nhật |
| `is_deleted` | BIT | Xóa mềm |

---

# 3. Nhóm bảng người dùng, phân quyền, tổ chức

## 3.1. `users` — Người dùng hệ thống

Lưu thông tin tài khoản chung cho tất cả vai trò: sinh viên, giảng viên, admin, nhân sự khoa, cố vấn.

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã người dùng |
| `username` | NVARCHAR(100) | UNIQUE, NOT NULL | Tên đăng nhập |
| `email` | NVARCHAR(255) | UNIQUE, NOT NULL | Email |
| `password_hash` | NVARCHAR(MAX) | NULL nếu SSO | Mật khẩu đã mã hóa |
| `full_name` | NVARCHAR(255) | NOT NULL | Họ tên |
| `avatar_url` | NVARCHAR(500) | NULL | Ảnh đại diện |
| `phone` | NVARCHAR(20) | NULL | Số điện thoại |
| `gender` | NVARCHAR(20) | NULL | Giới tính |
| `date_of_birth` | DATE | NULL | Ngày sinh |
| `status` | NVARCHAR(30) | NOT NULL | active, inactive, locked |
| `last_login_at` | DATETIME | NULL | Lần đăng nhập gần nhất |
| `is_email_verified` | BIT | DEFAULT 0 | Đã xác thực email chưa |
| `two_factor_enabled` | BIT | DEFAULT 0 | Bật xác thực 2 lớp |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `updated_at` | DATETIME | NULL | Ngày cập nhật |
| `is_deleted` | BIT | DEFAULT 0 | Xóa mềm |

Quan hệ:

- 1 user có thể có nhiều role qua `user_roles`.
- 1 user có thể là sinh viên qua `student_profiles`.
- 1 user có thể là giảng viên qua `lecturer_profiles`.
- 1 user có thể là nhân sự khoa/phòng qua `staff_profiles`.

---

## 3.2. `roles` — Vai trò

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã vai trò |
| `code` | NVARCHAR(50) | UNIQUE | STUDENT, LECTURER, ADMIN, ACADEMIC_STAFF, ADVISOR |
| `name` | NVARCHAR(100) | NOT NULL | Tên vai trò |
| `description` | NVARCHAR(500) | NULL | Mô tả |
| `is_system_role` | BIT | DEFAULT 0 | Role hệ thống mặc định |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `updated_at` | DATETIME | NULL | Ngày cập nhật |

---

## 3.3. `permissions` — Quyền chức năng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã quyền |
| `code` | NVARCHAR(100) | UNIQUE | Ví dụ: COURSE_CREATE, GRADE_VIEW |
| `module` | NVARCHAR(100) | NOT NULL | Module: Course, Grade, Assignment |
| `action` | NVARCHAR(50) | NOT NULL | View, Create, Update, Delete, Approve |
| `description` | NVARCHAR(500) | NULL | Mô tả quyền |

---

## 3.4. `role_permissions` — Gán quyền cho vai trò

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `role_id` | BIGINT | FK -> roles.id | Vai trò |
| `permission_id` | BIGINT | FK -> permissions.id | Quyền |
| `created_at` | DATETIME | NOT NULL | Ngày gán |

Unique: (`role_id`, `permission_id`).

---

## 3.5. `user_roles` — Gán vai trò cho người dùng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `user_id` | BIGINT | FK -> users.id | Người dùng |
| `role_id` | BIGINT | FK -> roles.id | Vai trò |
| `scope_type` | NVARCHAR(50) | NULL | GLOBAL, FACULTY, DEPARTMENT, COURSE_SECTION |
| `scope_id` | BIGINT | NULL | ID phạm vi áp dụng |
| `assigned_by` | BIGINT | FK -> users.id | Người gán |
| `assigned_at` | DATETIME | NOT NULL | Ngày gán |
| `expires_at` | DATETIME | NULL | Ngày hết hạn quyền |

Dùng để phân quyền theo phạm vi. Ví dụ một nhân sự phòng đào tạo có quyền trong toàn trường, còn trưởng bộ môn chỉ có quyền trong bộ môn.

---

## 3.6. `faculties` — Khoa

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã khoa |
| `code` | NVARCHAR(50) | UNIQUE | Mã khoa |
| `name` | NVARCHAR(255) | NOT NULL | Tên khoa |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `dean_user_id` | BIGINT | FK -> users.id | Trưởng khoa |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 3.7. `departments` — Bộ môn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bộ môn |
| `faculty_id` | BIGINT | FK -> faculties.id | Thuộc khoa |
| `code` | NVARCHAR(50) | UNIQUE | Mã bộ môn |
| `name` | NVARCHAR(255) | NOT NULL | Tên bộ môn |
| `head_user_id` | BIGINT | FK -> users.id | Trưởng bộ môn |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 3.8. `academic_programs` — Ngành/chương trình đào tạo

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ngành |
| `faculty_id` | BIGINT | FK -> faculties.id | Khoa quản lý |
| `code` | NVARCHAR(50) | UNIQUE | Mã ngành |
| `name` | NVARCHAR(255) | NOT NULL | Tên ngành |
| `degree_level` | NVARCHAR(50) | NOT NULL | Đại học, cao học... |
| `duration_years` | INT | NULL | Thời gian đào tạo |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 3.9. `specializations` — Chuyên ngành

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã chuyên ngành |
| `program_id` | BIGINT | FK -> academic_programs.id | Ngành cha |
| `code` | NVARCHAR(50) | UNIQUE | Mã chuyên ngành |
| `name` | NVARCHAR(255) | NOT NULL | Tên chuyên ngành |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |

---

## 3.10. `student_profiles` — Hồ sơ sinh viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã hồ sơ |
| `user_id` | BIGINT | FK -> users.id, UNIQUE | Tài khoản người dùng |
| `student_code` | NVARCHAR(50) | UNIQUE | Mã sinh viên |
| `faculty_id` | BIGINT | FK -> faculties.id | Khoa |
| `program_id` | BIGINT | FK -> academic_programs.id | Ngành |
| `specialization_id` | BIGINT | FK -> specializations.id | Chuyên ngành |
| `cohort_year` | INT | NOT NULL | Khóa nhập học |
| `academic_class_id` | BIGINT | FK -> academic_classes.id | Lớp hành chính |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn học tập |
| `status` | NVARCHAR(50) | NOT NULL | studying, graduated, suspended |
| `gpa` | DECIMAL(4,2) | NULL | GPA hiện tại |
| `credits_accumulated` | INT | DEFAULT 0 | Số tín chỉ tích lũy |

---

## 3.11. `lecturer_profiles` — Hồ sơ giảng viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã hồ sơ |
| `user_id` | BIGINT | FK -> users.id, UNIQUE | Tài khoản |
| `lecturer_code` | NVARCHAR(50) | UNIQUE | Mã giảng viên |
| `faculty_id` | BIGINT | FK -> faculties.id | Khoa |
| `department_id` | BIGINT | FK -> departments.id | Bộ môn |
| `academic_title` | NVARCHAR(100) | NULL | Học hàm |
| `degree` | NVARCHAR(100) | NULL | Học vị |
| `office_location` | NVARCHAR(255) | NULL | Văn phòng |
| `bio` | NVARCHAR(MAX) | NULL | Giới thiệu |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 3.12. `staff_profiles` — Hồ sơ nhân sự khoa/phòng đào tạo/admin

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã hồ sơ |
| `user_id` | BIGINT | FK -> users.id, UNIQUE | Tài khoản |
| `staff_code` | NVARCHAR(50) | UNIQUE | Mã nhân sự |
| `faculty_id` | BIGINT | FK -> faculties.id, NULL | Nếu thuộc khoa |
| `department_id` | BIGINT | FK -> departments.id, NULL | Nếu thuộc bộ môn |
| `office_name` | NVARCHAR(255) | NULL | Phòng đào tạo/khảo thí... |
| `position` | NVARCHAR(255) | NULL | Chức vụ |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 3.13. `academic_classes` — Lớp hành chính

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã lớp hành chính |
| `code` | NVARCHAR(50) | UNIQUE | Ví dụ: K18-CNTT-A |
| `name` | NVARCHAR(255) | NOT NULL | Tên lớp |
| `faculty_id` | BIGINT | FK -> faculties.id | Khoa |
| `program_id` | BIGINT | FK -> academic_programs.id | Ngành |
| `cohort_year` | INT | NOT NULL | Khóa |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn phụ trách |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 3.14. `user_sessions` — Phiên đăng nhập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã phiên |
| `user_id` | BIGINT | FK -> users.id | Người dùng |
| `session_token_hash` | NVARCHAR(500) | NOT NULL | Token đã hash |
| `ip_address` | NVARCHAR(50) | NULL | IP |
| `user_agent` | NVARCHAR(500) | NULL | Thiết bị/trình duyệt |
| `login_at` | DATETIME | NOT NULL | Thời điểm đăng nhập |
| `logout_at` | DATETIME | NULL | Thời điểm đăng xuất |
| `expires_at` | DATETIME | NOT NULL | Hết hạn |
| `is_revoked` | BIT | DEFAULT 0 | Đã thu hồi phiên chưa |

---

## 3.15. `password_reset_tokens` — Token khôi phục mật khẩu

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã token |
| `user_id` | BIGINT | FK -> users.id | Người dùng |
| `token_hash` | NVARCHAR(500) | NOT NULL | Token hash |
| `expires_at` | DATETIME | NOT NULL | Hết hạn |
| `used_at` | DATETIME | NULL | Đã dùng lúc nào |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

# 4. Nhóm bảng học kỳ, môn học, lớp học phần, ghi danh

## 4.1. `academic_years` — Năm học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã năm học |
| `code` | NVARCHAR(20) | UNIQUE | 2025-2026 |
| `name` | NVARCHAR(100) | NOT NULL | Năm học 2025-2026 |
| `start_date` | DATE | NOT NULL | Ngày bắt đầu |
| `end_date` | DATE | NOT NULL | Ngày kết thúc |
| `status` | NVARCHAR(30) | NOT NULL | active/closed |

---

## 4.2. `semesters` — Học kỳ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã học kỳ |
| `academic_year_id` | BIGINT | FK -> academic_years.id | Năm học |
| `code` | NVARCHAR(50) | UNIQUE | 2025-HK1 |
| `name` | NVARCHAR(100) | NOT NULL | Học kỳ 1 |
| `start_date` | DATE | NOT NULL | Ngày bắt đầu |
| `end_date` | DATE | NOT NULL | Ngày kết thúc |
| `registration_start` | DATETIME | NULL | Mở đăng ký |
| `registration_end` | DATETIME | NULL | Đóng đăng ký |
| `status` | NVARCHAR(30) | NOT NULL | planning, active, closed |

---

## 4.3. `semester_weeks` — Tuần học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tuần |
| `semester_id` | BIGINT | FK -> semesters.id | Học kỳ |
| `week_number` | INT | NOT NULL | Tuần số |
| `start_date` | DATE | NOT NULL | Bắt đầu |
| `end_date` | DATE | NOT NULL | Kết thúc |
| `note` | NVARCHAR(255) | NULL | Ghi chú |

---

## 4.4. `courses` — Môn học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã môn |
| `code` | NVARCHAR(50) | UNIQUE | IT101 |
| `name` | NVARCHAR(255) | NOT NULL | Tên môn học |
| `credits` | INT | NOT NULL | Số tín chỉ |
| `theory_hours` | INT | DEFAULT 0 | Số tiết lý thuyết |
| `practice_hours` | INT | DEFAULT 0 | Số tiết thực hành |
| `faculty_id` | BIGINT | FK -> faculties.id | Khoa quản lý |
| `department_id` | BIGINT | FK -> departments.id | Bộ môn quản lý |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 4.5. `course_prerequisites` — Môn tiên quyết

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `course_id` | BIGINT | FK -> courses.id | Môn học |
| `prerequisite_course_id` | BIGINT | FK -> courses.id | Môn tiên quyết |
| `minimum_grade` | DECIMAL(4,2) | NULL | Điểm tối thiểu |
| `type` | NVARCHAR(50) | NOT NULL | prerequisite/co-requisite |

---

## 4.6. `program_courses` — Môn trong chương trình đào tạo

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `program_id` | BIGINT | FK -> academic_programs.id | Ngành |
| `course_id` | BIGINT | FK -> courses.id | Môn học |
| `semester_suggested` | INT | NULL | Kỳ học gợi ý |
| `is_required` | BIT | DEFAULT 1 | Bắt buộc/tự chọn |
| `group_name` | NVARCHAR(255) | NULL | Nhóm tự chọn |

---

## 4.7. `course_learning_outcomes` — Chuẩn đầu ra môn học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã CLO |
| `course_id` | BIGINT | FK -> courses.id | Môn học |
| `code` | NVARCHAR(50) | NOT NULL | CLO1, CLO2 |
| `description` | NVARCHAR(MAX) | NOT NULL | Nội dung chuẩn đầu ra |
| `order_index` | INT | DEFAULT 0 | Thứ tự |

---

## 4.8. `program_learning_outcomes` — Chuẩn đầu ra chương trình

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã PLO |
| `program_id` | BIGINT | FK -> academic_programs.id | Chương trình |
| `code` | NVARCHAR(50) | NOT NULL | PLO1 |
| `description` | NVARCHAR(MAX) | NOT NULL | Nội dung |

---

## 4.9. `clo_plo_mappings` — Mapping CLO-PLO

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã mapping |
| `clo_id` | BIGINT | FK -> course_learning_outcomes.id | CLO |
| `plo_id` | BIGINT | FK -> program_learning_outcomes.id | PLO |
| `level` | NVARCHAR(20) | NULL | I, R, M hoặc low/medium/high |

---

## 4.10. `course_sections` — Lớp học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã lớp học phần |
| `course_id` | BIGINT | FK -> courses.id | Môn học |
| `semester_id` | BIGINT | FK -> semesters.id | Học kỳ |
| `section_code` | NVARCHAR(50) | UNIQUE | IT101-01 |
| `title` | NVARCHAR(255) | NOT NULL | Tên lớp học phần |
| `main_lecturer_id` | BIGINT | FK -> users.id | Giảng viên chính |
| `max_students` | INT | NULL | Sĩ số tối đa |
| `min_students` | INT | NULL | Sĩ số tối thiểu |
| `start_date` | DATE | NULL | Ngày bắt đầu |
| `end_date` | DATE | NULL | Ngày kết thúc |
| `status` | NVARCHAR(30) | NOT NULL | draft, open, active, completed, cancelled |
| `is_visible` | BIT | DEFAULT 1 | Có hiển thị cho sinh viên không |
| `description` | NVARCHAR(MAX) | NULL | Mô tả lớp |

---

## 4.11. `section_lecturers` — Giảng viên/trợ giảng trong lớp học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `user_id` | BIGINT | FK -> users.id | Giảng viên/trợ giảng |
| `role_in_section` | NVARCHAR(50) | NOT NULL | main, co_lecturer, teaching_assistant |
| `assigned_at` | DATETIME | NOT NULL | Ngày phân công |

---

## 4.12. `enrollments` — Ghi danh sinh viên vào lớp học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ghi danh |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `enrolled_at` | DATETIME | NOT NULL | Ngày ghi danh |
| `enrollment_type` | NVARCHAR(50) | NOT NULL | official, manual, self_enroll |
| `status` | NVARCHAR(30) | NOT NULL | enrolled, dropped, completed |
| `final_status` | NVARCHAR(30) | NULL | passed, failed, incomplete |
| `completed_at` | DATETIME | NULL | Hoàn thành lúc nào |

Unique: (`section_id`, `student_user_id`).

---

# 5. Nhóm bảng nội dung học tập

## 5.1. `course_syllabi` — Đề cương lớp học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã đề cương |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `objectives` | NVARCHAR(MAX) | NULL | Mục tiêu môn học |
| `description` | NVARCHAR(MAX) | NULL | Mô tả học phần |
| `assessment_policy` | NVARCHAR(MAX) | NULL | Quy định đánh giá |
| `attendance_policy` | NVARCHAR(MAX) | NULL | Quy định điểm danh |
| `materials` | NVARCHAR(MAX) | NULL | Giáo trình/tài liệu |
| `approved_by` | BIGINT | FK -> users.id, NULL | Người duyệt |
| `approved_at` | DATETIME | NULL | Ngày duyệt |
| `status` | NVARCHAR(30) | NOT NULL | draft, submitted, approved, rejected |

---

## 5.2. `course_modules` — Chương/chủ đề/tuần học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã module |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `title` | NVARCHAR(255) | NOT NULL | Tên chương/chủ đề |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `week_number` | INT | NULL | Tuần học |
| `order_index` | INT | NOT NULL | Thứ tự |
| `visible_from` | DATETIME | NULL | Thời điểm mở |
| `visible_until` | DATETIME | NULL | Thời điểm đóng |
| `is_visible` | BIT | DEFAULT 1 | Hiển thị |

---

## 5.3. `lessons` — Bài học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bài học |
| `module_id` | BIGINT | FK -> course_modules.id | Chương/chủ đề |
| `title` | NVARCHAR(255) | NOT NULL | Tên bài |
| `content` | NVARCHAR(MAX) | NULL | Nội dung text/HTML |
| `lesson_type` | NVARCHAR(50) | NOT NULL | text, video, file, scorm, link |
| `estimated_minutes` | INT | NULL | Thời lượng ước tính |
| `order_index` | INT | NOT NULL | Thứ tự |
| `is_required` | BIT | DEFAULT 1 | Bắt buộc hoàn thành |
| `is_visible` | BIT | DEFAULT 1 | Hiển thị |
| `visible_from` | DATETIME | NULL | Thời gian mở |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 5.4. `learning_resources` — Tài nguyên học tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tài nguyên |
| `lesson_id` | BIGINT | FK -> lessons.id, NULL | Gắn với bài học |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `title` | NVARCHAR(255) | NOT NULL | Tên tài nguyên |
| `resource_type` | NVARCHAR(50) | NOT NULL | file, url, video, book |
| `file_id` | BIGINT | FK -> files.id, NULL | File nếu có |
| `url` | NVARCHAR(1000) | NULL | Link ngoài |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `is_downloadable` | BIT | DEFAULT 1 | Cho tải xuống |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 5.5. `lesson_prerequisites` — Điều kiện mở bài học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã điều kiện |
| `lesson_id` | BIGINT | FK -> lessons.id | Bài học cần mở |
| `required_lesson_id` | BIGINT | FK -> lessons.id | Bài cần hoàn thành trước |
| `condition_type` | NVARCHAR(50) | NOT NULL | viewed, completed, score_min |
| `minimum_score` | DECIMAL(5,2) | NULL | Điểm tối thiểu nếu có |

---

## 5.6. `lesson_progress` — Tiến độ học bài

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tiến độ |
| `lesson_id` | BIGINT | FK -> lessons.id | Bài học |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `status` | NVARCHAR(30) | NOT NULL | not_started, in_progress, completed |
| `progress_percent` | DECIMAL(5,2) | DEFAULT 0 | % hoàn thành |
| `last_position_seconds` | INT | NULL | Vị trí video gần nhất |
| `first_accessed_at` | DATETIME | NULL | Lần đầu truy cập |
| `last_accessed_at` | DATETIME | NULL | Lần gần nhất |
| `completed_at` | DATETIME | NULL | Ngày hoàn thành |

Unique: (`lesson_id`, `student_user_id`).

---

## 5.7. `student_notes` — Ghi chú cá nhân của sinh viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ghi chú |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `lesson_id` | BIGINT | FK -> lessons.id | Bài học |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung ghi chú |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `updated_at` | DATETIME | NULL | Ngày sửa |

---

## 5.8. `bookmarks` — Đánh dấu bài học/tài nguyên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bookmark |
| `user_id` | BIGINT | FK -> users.id | Người đánh dấu |
| `target_type` | NVARCHAR(50) | NOT NULL | lesson, resource, discussion |
| `target_id` | BIGINT | NOT NULL | ID đối tượng |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 5.9. `content_views` — Lịch sử xem nội dung

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log |
| `user_id` | BIGINT | FK -> users.id | Người xem |
| `target_type` | NVARCHAR(50) | NOT NULL | lesson, file, video, resource |
| `target_id` | BIGINT | NOT NULL | ID nội dung |
| `viewed_at` | DATETIME | NOT NULL | Thời gian xem |
| `duration_seconds` | INT | NULL | Thời lượng xem |
| `ip_address` | NVARCHAR(50) | NULL | IP |

---

## 5.10. `section_completion_rules` — Điều kiện hoàn thành lớp học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã quy tắc |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `require_all_lessons` | BIT | DEFAULT 0 | Phải học hết bài |
| `minimum_progress_percent` | DECIMAL(5,2) | NULL | % tối thiểu |
| `minimum_final_score` | DECIMAL(5,2) | NULL | Điểm tổng kết tối thiểu |
| `minimum_attendance_percent` | DECIMAL(5,2) | NULL | Chuyên cần tối thiểu |
| `require_all_assignments` | BIT | DEFAULT 0 | Phải nộp đủ bài |

---

# 6. Nhóm bảng bài tập, nộp bài, rubric

## 6.1. `assignments` — Bài tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bài tập |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `module_id` | BIGINT | FK -> course_modules.id, NULL | Chương/tuần |
| `title` | NVARCHAR(255) | NOT NULL | Tên bài tập |
| `description` | NVARCHAR(MAX) | NULL | Yêu cầu bài tập |
| `assignment_type` | NVARCHAR(50) | NOT NULL | individual, group |
| `submission_type` | NVARCHAR(100) | NOT NULL | file, text, link, code, mixed |
| `max_score` | DECIMAL(6,2) | NOT NULL | Điểm tối đa |
| `open_at` | DATETIME | NULL | Thời điểm mở |
| `due_at` | DATETIME | NULL | Hạn nộp |
| `close_at` | DATETIME | NULL | Thời điểm đóng |
| `allow_late_submission` | BIT | DEFAULT 0 | Cho nộp muộn |
| `late_penalty_percent` | DECIMAL(5,2) | NULL | Trừ điểm nộp muộn |
| `allow_resubmission` | BIT | DEFAULT 0 | Cho nộp lại |
| `max_attempts` | INT | NULL | Số lần nộp tối đa |
| `status` | NVARCHAR(30) | NOT NULL | draft, published, closed |
| `created_by` | BIGINT | FK -> users.id | Giảng viên tạo |

---

## 6.2. `assignment_files` — File đính kèm bài tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã file bài tập |
| `assignment_id` | BIGINT | FK -> assignments.id | Bài tập |
| `file_id` | BIGINT | FK -> files.id | File đính kèm |
| `uploaded_by` | BIGINT | FK -> users.id | Người upload |

---

## 6.3. `assignment_groups` — Nhóm làm bài tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã nhóm |
| `assignment_id` | BIGINT | FK -> assignments.id | Bài tập |
| `name` | NVARCHAR(255) | NOT NULL | Tên nhóm |
| `leader_user_id` | BIGINT | FK -> users.id, NULL | Trưởng nhóm |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 6.4. `assignment_group_members` — Thành viên nhóm bài tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `group_id` | BIGINT | FK -> assignment_groups.id | Nhóm |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `joined_at` | DATETIME | NOT NULL | Ngày vào nhóm |
| `role_in_group` | NVARCHAR(50) | NULL | leader/member |

Unique: (`group_id`, `student_user_id`).

---

## 6.5. `assignment_submissions` — Bài nộp

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bài nộp |
| `assignment_id` | BIGINT | FK -> assignments.id | Bài tập |
| `student_user_id` | BIGINT | FK -> users.id, NULL | Sinh viên nếu bài cá nhân |
| `group_id` | BIGINT | FK -> assignment_groups.id, NULL | Nhóm nếu bài nhóm |
| `attempt_no` | INT | NOT NULL | Lần nộp |
| `text_answer` | NVARCHAR(MAX) | NULL | Nội dung text |
| `link_url` | NVARCHAR(1000) | NULL | Link nộp bài |
| `submitted_at` | DATETIME | NOT NULL | Thời điểm nộp |
| `is_late` | BIT | DEFAULT 0 | Có trễ hạn không |
| `status` | NVARCHAR(30) | NOT NULL | submitted, graded, returned |

---

## 6.6. `submission_files` — File trong bài nộp

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã file nộp |
| `submission_id` | BIGINT | FK -> assignment_submissions.id | Bài nộp |
| `file_id` | BIGINT | FK -> files.id | File |
| `uploaded_at` | DATETIME | NOT NULL | Ngày upload |

---

## 6.7. `rubrics` — Rubric chấm điểm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã rubric |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `assignment_id` | BIGINT | FK -> assignments.id, NULL | Bài tập áp dụng |
| `name` | NVARCHAR(255) | NOT NULL | Tên rubric |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `total_points` | DECIMAL(6,2) | NOT NULL | Tổng điểm |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 6.8. `rubric_criteria` — Tiêu chí rubric

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tiêu chí |
| `rubric_id` | BIGINT | FK -> rubrics.id | Rubric |
| `criterion_name` | NVARCHAR(255) | NOT NULL | Tên tiêu chí |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `max_points` | DECIMAL(6,2) | NOT NULL | Điểm tối đa |
| `order_index` | INT | NOT NULL | Thứ tự |

---

## 6.9. `assignment_grades` — Điểm bài tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã điểm |
| `submission_id` | BIGINT | FK -> assignment_submissions.id | Bài nộp |
| `grader_user_id` | BIGINT | FK -> users.id | Người chấm |
| `score` | DECIMAL(6,2) | NOT NULL | Điểm |
| `feedback` | NVARCHAR(MAX) | NULL | Nhận xét |
| `feedback_file_id` | BIGINT | FK -> files.id, NULL | File phản hồi |
| `graded_at` | DATETIME | NOT NULL | Ngày chấm |
| `published_at` | DATETIME | NULL | Ngày công bố |
| `status` | NVARCHAR(30) | NOT NULL | draft, published |

---

# 7. Nhóm bảng quiz, ngân hàng câu hỏi, thi online

## 7.1. `question_banks` — Ngân hàng câu hỏi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ngân hàng |
| `course_id` | BIGINT | FK -> courses.id, NULL | Theo môn |
| `section_id` | BIGINT | FK -> course_sections.id, NULL | Theo lớp học phần |
| `name` | NVARCHAR(255) | NOT NULL | Tên ngân hàng |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `visibility` | NVARCHAR(50) | NOT NULL | private, department, faculty, global |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 7.2. `question_categories` — Danh mục câu hỏi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã danh mục |
| `bank_id` | BIGINT | FK -> question_banks.id | Ngân hàng |
| `parent_id` | BIGINT | FK -> question_categories.id, NULL | Danh mục cha |
| `name` | NVARCHAR(255) | NOT NULL | Tên danh mục |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |

---

## 7.3. `questions` — Câu hỏi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã câu hỏi |
| `bank_id` | BIGINT | FK -> question_banks.id | Ngân hàng |
| `category_id` | BIGINT | FK -> question_categories.id, NULL | Danh mục |
| `question_type` | NVARCHAR(50) | NOT NULL | single_choice, multiple_choice, true_false, essay, fill_blank, matching, ordering, numeric |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung câu hỏi |
| `explanation` | NVARCHAR(MAX) | NULL | Giải thích đáp án |
| `default_score` | DECIMAL(6,2) | NOT NULL | Điểm mặc định |
| `difficulty` | NVARCHAR(30) | NULL | easy, medium, hard |
| `clo_id` | BIGINT | FK -> course_learning_outcomes.id, NULL | Chuẩn đầu ra liên quan |
| `created_by` | BIGINT | FK -> users.id | Người tạo |
| `status` | NVARCHAR(30) | NOT NULL | draft, approved, archived |

---

## 7.4. `question_options` — Đáp án lựa chọn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã đáp án |
| `question_id` | BIGINT | FK -> questions.id | Câu hỏi |
| `option_text` | NVARCHAR(MAX) | NOT NULL | Nội dung đáp án |
| `is_correct` | BIT | DEFAULT 0 | Đáp án đúng? |
| `score_percent` | DECIMAL(5,2) | NULL | % điểm cho đáp án |
| `order_index` | INT | NOT NULL | Thứ tự |

---

## 7.5. `quizzes` — Bài quiz/bài thi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã quiz |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `module_id` | BIGINT | FK -> course_modules.id, NULL | Chương/tuần |
| `title` | NVARCHAR(255) | NOT NULL | Tên bài quiz/thi |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `quiz_type` | NVARCHAR(50) | NOT NULL | practice, quiz, midterm, final |
| `open_at` | DATETIME | NULL | Mở bài |
| `close_at` | DATETIME | NULL | Đóng bài |
| `duration_minutes` | INT | NULL | Thời gian làm bài |
| `max_attempts` | INT | DEFAULT 1 | Số lần làm |
| `grading_method` | NVARCHAR(50) | NOT NULL | highest, latest, average |
| `shuffle_questions` | BIT | DEFAULT 0 | Trộn câu hỏi |
| `shuffle_options` | BIT | DEFAULT 0 | Trộn đáp án |
| `show_result_mode` | NVARCHAR(50) | NOT NULL | immediate, after_close, never |
| `require_proctoring` | BIT | DEFAULT 0 | Cần giám sát không |
| `status` | NVARCHAR(30) | NOT NULL | draft, published, closed |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 7.6. `quiz_questions` — Câu hỏi trong quiz

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `quiz_id` | BIGINT | FK -> quizzes.id | Quiz |
| `question_id` | BIGINT | FK -> questions.id | Câu hỏi |
| `score` | DECIMAL(6,2) | NOT NULL | Điểm câu hỏi trong quiz |
| `order_index` | INT | NOT NULL | Thứ tự |
| `is_required` | BIT | DEFAULT 1 | Bắt buộc |

---

## 7.7. `quiz_random_rules` — Quy tắc sinh đề ngẫu nhiên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã quy tắc |
| `quiz_id` | BIGINT | FK -> quizzes.id | Quiz |
| `category_id` | BIGINT | FK -> question_categories.id | Danh mục câu hỏi |
| `difficulty` | NVARCHAR(30) | NULL | Mức độ |
| `number_of_questions` | INT | NOT NULL | Số câu lấy ngẫu nhiên |
| `score_each` | DECIMAL(6,2) | NOT NULL | Điểm mỗi câu |

---

## 7.8. `quiz_attempts` — Lượt làm bài

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã lượt làm |
| `quiz_id` | BIGINT | FK -> quizzes.id | Quiz |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `attempt_no` | INT | NOT NULL | Lần làm |
| `started_at` | DATETIME | NOT NULL | Bắt đầu |
| `submitted_at` | DATETIME | NULL | Nộp bài |
| `auto_submitted` | BIT | DEFAULT 0 | Tự động nộp |
| `score` | DECIMAL(6,2) | NULL | Điểm |
| `status` | NVARCHAR(30) | NOT NULL | in_progress, submitted, graded, cancelled |
| `ip_address` | NVARCHAR(50) | NULL | IP |
| `user_agent` | NVARCHAR(500) | NULL | Thiết bị |

---

## 7.9. `quiz_attempt_questions` — Câu hỏi cụ thể trong lượt làm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `attempt_id` | BIGINT | FK -> quiz_attempts.id | Lượt làm |
| `question_id` | BIGINT | FK -> questions.id | Câu hỏi |
| `order_index` | INT | NOT NULL | Thứ tự đã random |
| `score` | DECIMAL(6,2) | NOT NULL | Điểm câu hỏi |
| `earned_score` | DECIMAL(6,2) | NULL | Điểm đạt được |
| `is_marked_for_review` | BIT | DEFAULT 0 | Đánh dấu xem lại |

---

## 7.10. `quiz_answers` — Câu trả lời của sinh viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã câu trả lời |
| `attempt_question_id` | BIGINT | FK -> quiz_attempt_questions.id | Câu trong lượt làm |
| `selected_option_id` | BIGINT | FK -> question_options.id, NULL | Đáp án chọn |
| `answer_text` | NVARCHAR(MAX) | NULL | Trả lời tự luận/điền khuyết |
| `answer_number` | DECIMAL(18,4) | NULL | Đáp án số |
| `file_id` | BIGINT | FK -> files.id, NULL | File tự luận nếu có |
| `is_correct` | BIT | NULL | Đúng/sai |
| `earned_score` | DECIMAL(6,2) | NULL | Điểm câu trả lời |
| `answered_at` | DATETIME | NULL | Thời gian trả lời |

---

## 7.11. `quiz_manual_grades` — Chấm tự luận thủ công

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã chấm thủ công |
| `quiz_answer_id` | BIGINT | FK -> quiz_answers.id | Câu trả lời |
| `grader_user_id` | BIGINT | FK -> users.id | Người chấm |
| `score` | DECIMAL(6,2) | NOT NULL | Điểm |
| `feedback` | NVARCHAR(MAX) | NULL | Nhận xét |
| `graded_at` | DATETIME | NOT NULL | Ngày chấm |

---

## 7.12. `quiz_proctoring_logs` — Log giám sát thi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log |
| `attempt_id` | BIGINT | FK -> quiz_attempts.id | Lượt làm |
| `event_type` | NVARCHAR(100) | NOT NULL | tab_switch, face_missing, copy_paste, network_lost |
| `event_time` | DATETIME | NOT NULL | Thời điểm |
| `severity` | NVARCHAR(30) | NULL | low, medium, high |
| `details` | NVARCHAR(MAX) | NULL | Chi tiết |
| `screenshot_file_id` | BIGINT | FK -> files.id, NULL | Ảnh minh chứng nếu có |

---

## 7.13. `exam_incidents` — Sự cố bài thi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã sự cố |
| `quiz_id` | BIGINT | FK -> quizzes.id | Bài thi |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `attempt_id` | BIGINT | FK -> quiz_attempts.id, NULL | Lượt làm liên quan |
| `incident_type` | NVARCHAR(100) | NOT NULL | network, system_error, proctoring, other |
| `description` | NVARCHAR(MAX) | NOT NULL | Mô tả sự cố |
| `status` | NVARCHAR(30) | NOT NULL | pending, approved, rejected, resolved |
| `resolved_by` | BIGINT | FK -> users.id, NULL | Người xử lý |
| `resolved_at` | DATETIME | NULL | Ngày xử lý |
| `resolution_note` | NVARCHAR(MAX) | NULL | Hướng xử lý |

---

# 8. Nhóm bảng điểm số, điểm danh, phúc khảo

## 8.1. `grade_categories` — Loại điểm/thành phần điểm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã loại điểm |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `name` | NVARCHAR(255) | NOT NULL | Chuyên cần, bài tập, giữa kỳ, cuối kỳ |
| `weight_percent` | DECIMAL(5,2) | NOT NULL | Trọng số |
| `drop_lowest` | INT | DEFAULT 0 | Bỏ mấy điểm thấp nhất |
| `order_index` | INT | NOT NULL | Thứ tự |

---

## 8.2. `grade_items` — Cột điểm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã cột điểm |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `category_id` | BIGINT | FK -> grade_categories.id | Loại điểm |
| `source_type` | NVARCHAR(50) | NOT NULL | manual, assignment, quiz, attendance |
| `source_id` | BIGINT | NULL | ID bài tập/quiz nếu có |
| `name` | NVARCHAR(255) | NOT NULL | Tên cột điểm |
| `max_score` | DECIMAL(6,2) | NOT NULL | Điểm tối đa |
| `weight_override` | DECIMAL(5,2) | NULL | Trọng số riêng nếu có |
| `is_published` | BIT | DEFAULT 0 | Công bố cho sinh viên |

---

## 8.3. `student_grades` — Điểm sinh viên theo từng cột

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã điểm |
| `grade_item_id` | BIGINT | FK -> grade_items.id | Cột điểm |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `score` | DECIMAL(6,2) | NULL | Điểm |
| `normalized_score` | DECIMAL(6,2) | NULL | Điểm quy đổi |
| `feedback` | NVARCHAR(MAX) | NULL | Nhận xét |
| `graded_by` | BIGINT | FK -> users.id, NULL | Người nhập/chấm |
| `graded_at` | DATETIME | NULL | Ngày chấm |
| `published_at` | DATETIME | NULL | Ngày công bố |
| `is_exempted` | BIT | DEFAULT 0 | Miễn tính điểm |

Unique: (`grade_item_id`, `student_user_id`).

---

## 8.4. `final_grades` — Điểm tổng kết học phần

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã điểm tổng kết |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `final_score` | DECIMAL(6,2) | NULL | Điểm tổng kết thang 10 |
| `letter_grade` | NVARCHAR(10) | NULL | A, B, C... |
| `grade_point` | DECIMAL(3,2) | NULL | Thang 4 |
| `result_status` | NVARCHAR(30) | NULL | passed, failed, incomplete |
| `calculated_at` | DATETIME | NULL | Ngày tính |
| `approved_by` | BIGINT | FK -> users.id, NULL | Người duyệt |
| `approved_at` | DATETIME | NULL | Ngày duyệt |
| `locked_at` | DATETIME | NULL | Ngày khóa điểm |

---

## 8.5. `grade_change_logs` — Lịch sử sửa điểm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log |
| `student_grade_id` | BIGINT | FK -> student_grades.id, NULL | Điểm thành phần |
| `final_grade_id` | BIGINT | FK -> final_grades.id, NULL | Điểm tổng kết |
| `old_score` | DECIMAL(6,2) | NULL | Điểm cũ |
| `new_score` | DECIMAL(6,2) | NULL | Điểm mới |
| `changed_by` | BIGINT | FK -> users.id | Người sửa |
| `changed_at` | DATETIME | NOT NULL | Ngày sửa |
| `reason` | NVARCHAR(MAX) | NULL | Lý do sửa |

---

## 8.6. `attendance_sessions` — Buổi điểm danh

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã buổi điểm danh |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `title` | NVARCHAR(255) | NOT NULL | Buổi học |
| `session_date` | DATE | NOT NULL | Ngày học |
| `start_time` | DATETIME | NULL | Bắt đầu |
| `end_time` | DATETIME | NULL | Kết thúc |
| `attendance_method` | NVARCHAR(50) | NOT NULL | manual, qr, code, online |
| `qr_code` | NVARCHAR(255) | NULL | Mã QR nếu có |
| `attendance_code` | NVARCHAR(50) | NULL | Mã điểm danh |
| `code_expires_at` | DATETIME | NULL | Hết hạn mã |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 8.7. `attendance_records` — Kết quả điểm danh

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã điểm danh |
| `attendance_session_id` | BIGINT | FK -> attendance_sessions.id | Buổi điểm danh |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `status` | NVARCHAR(30) | NOT NULL | present, absent, late, excused |
| `checked_in_at` | DATETIME | NULL | Thời điểm check-in |
| `checked_out_at` | DATETIME | NULL | Thời điểm check-out |
| `method_used` | NVARCHAR(50) | NULL | qr, code, manual, online |
| `note` | NVARCHAR(MAX) | NULL | Ghi chú |
| `updated_by` | BIGINT | FK -> users.id, NULL | Người sửa |

Unique: (`attendance_session_id`, `student_user_id`).

---

## 8.8. `absence_requests` — Đơn xin phép vắng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã đơn |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `attendance_session_id` | BIGINT | FK -> attendance_sessions.id | Buổi vắng |
| `reason` | NVARCHAR(MAX) | NOT NULL | Lý do |
| `evidence_file_id` | BIGINT | FK -> files.id, NULL | Minh chứng |
| `status` | NVARCHAR(30) | NOT NULL | pending, approved, rejected |
| `reviewed_by` | BIGINT | FK -> users.id, NULL | Người duyệt |
| `reviewed_at` | DATETIME | NULL | Ngày duyệt |
| `review_note` | NVARCHAR(MAX) | NULL | Ghi chú duyệt |

---

## 8.9. `grade_appeals` — Phúc khảo/khiếu nại điểm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã phúc khảo |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `grade_item_id` | BIGINT | FK -> grade_items.id, NULL | Cột điểm liên quan |
| `final_grade_id` | BIGINT | FK -> final_grades.id, NULL | Điểm tổng kết liên quan |
| `reason` | NVARCHAR(MAX) | NOT NULL | Lý do phúc khảo |
| `status` | NVARCHAR(30) | NOT NULL | pending, reviewing, approved, rejected, resolved |
| `assigned_to` | BIGINT | FK -> users.id, NULL | Người xử lý |
| `resolved_by` | BIGINT | FK -> users.id, NULL | Người kết luận |
| `resolution` | NVARCHAR(MAX) | NULL | Kết quả xử lý |
| `created_at` | DATETIME | NOT NULL | Ngày gửi |
| `resolved_at` | DATETIME | NULL | Ngày xử lý xong |

---

# 9. Nhóm bảng giao tiếp, thông báo, diễn đàn

## 9.1. `announcements` — Thông báo

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã thông báo |
| `title` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `sender_user_id` | BIGINT | FK -> users.id | Người gửi |
| `target_type` | NVARCHAR(50) | NOT NULL | global, role, faculty, class, section, user |
| `target_id` | BIGINT | NULL | ID đối tượng nhận |
| `priority` | NVARCHAR(30) | DEFAULT normal | normal, high, urgent |
| `publish_at` | DATETIME | NULL | Lên lịch gửi |
| `expires_at` | DATETIME | NULL | Hết hạn hiển thị |
| `status` | NVARCHAR(30) | NOT NULL | draft, published, archived |

---

## 9.2. `announcement_reads` — Trạng thái đọc thông báo

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bản ghi |
| `announcement_id` | BIGINT | FK -> announcements.id | Thông báo |
| `user_id` | BIGINT | FK -> users.id | Người nhận |
| `read_at` | DATETIME | NULL | Đã đọc lúc nào |

---

## 9.3. `notifications` — Notification cá nhân

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã notification |
| `user_id` | BIGINT | FK -> users.id | Người nhận |
| `title` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `message` | NVARCHAR(MAX) | NOT NULL | Nội dung ngắn |
| `type` | NVARCHAR(50) | NOT NULL | grade, deadline, message, system |
| `link_url` | NVARCHAR(1000) | NULL | Link điều hướng |
| `is_read` | BIT | DEFAULT 0 | Đã đọc chưa |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 9.4. `message_threads` — Cuộc trò chuyện

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã thread |
| `subject` | NVARCHAR(255) | NULL | Chủ đề |
| `thread_type` | NVARCHAR(50) | NOT NULL | direct, group, section |
| `section_id` | BIGINT | FK -> course_sections.id, NULL | Nếu là chat lớp |
| `created_by` | BIGINT | FK -> users.id | Người tạo |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 9.5. `message_thread_members` — Thành viên cuộc trò chuyện

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã thành viên |
| `thread_id` | BIGINT | FK -> message_threads.id | Thread |
| `user_id` | BIGINT | FK -> users.id | Thành viên |
| `joined_at` | DATETIME | NOT NULL | Ngày tham gia |
| `last_read_at` | DATETIME | NULL | Đọc lần cuối |

---

## 9.6. `messages` — Tin nhắn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tin nhắn |
| `thread_id` | BIGINT | FK -> message_threads.id | Cuộc trò chuyện |
| `sender_user_id` | BIGINT | FK -> users.id | Người gửi |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `sent_at` | DATETIME | NOT NULL | Ngày gửi |
| `edited_at` | DATETIME | NULL | Ngày sửa |
| `is_deleted` | BIT | DEFAULT 0 | Đã xóa |

---

## 9.7. `forums` — Diễn đàn lớp học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã forum |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `name` | NVARCHAR(255) | NOT NULL | Tên diễn đàn |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `is_moderated` | BIT | DEFAULT 0 | Có kiểm duyệt không |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 9.8. `forum_topics` — Chủ đề thảo luận

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã chủ đề |
| `forum_id` | BIGINT | FK -> forums.id | Diễn đàn |
| `author_user_id` | BIGINT | FK -> users.id | Người tạo |
| `title` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `is_pinned` | BIT | DEFAULT 0 | Ghim |
| `is_locked` | BIT | DEFAULT 0 | Khóa bình luận |
| `status` | NVARCHAR(30) | NOT NULL | visible, hidden, pending |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 9.9. `forum_posts` — Bình luận/trả lời diễn đàn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã bài trả lời |
| `topic_id` | BIGINT | FK -> forum_topics.id | Chủ đề |
| `parent_post_id` | BIGINT | FK -> forum_posts.id, NULL | Trả lời cha |
| `author_user_id` | BIGINT | FK -> users.id | Người viết |
| `content` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `status` | NVARCHAR(30) | NOT NULL | visible, hidden, pending |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `updated_at` | DATETIME | NULL | Ngày sửa |

---

# 10. Nhóm bảng cố vấn học tập, cảnh báo, hỗ trợ

## 10.1. `advisor_assignments` — Phân công cố vấn học tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã phân công |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn |
| `student_user_id` | BIGINT | FK -> users.id, NULL | Sinh viên cụ thể |
| `academic_class_id` | BIGINT | FK -> academic_classes.id, NULL | Lớp cố vấn |
| `program_id` | BIGINT | FK -> academic_programs.id, NULL | Ngành phụ trách |
| `assigned_at` | DATETIME | NOT NULL | Ngày phân công |
| `status` | NVARCHAR(30) | NOT NULL | active/inactive |

---

## 10.2. `academic_alert_rules` — Quy tắc cảnh báo học vụ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã quy tắc |
| `name` | NVARCHAR(255) | NOT NULL | Tên quy tắc |
| `rule_type` | NVARCHAR(50) | NOT NULL | low_grade, absence, inactivity, missing_assignment |
| `threshold_value` | DECIMAL(10,2) | NOT NULL | Ngưỡng cảnh báo |
| `severity` | NVARCHAR(30) | NOT NULL | low, medium, high |
| `scope_type` | NVARCHAR(50) | NULL | global, faculty, program |
| `scope_id` | BIGINT | NULL | ID phạm vi |
| `is_active` | BIT | DEFAULT 1 | Đang bật |

---

## 10.3. `academic_alerts` — Cảnh báo học vụ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã cảnh báo |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `section_id` | BIGINT | FK -> course_sections.id, NULL | Lớp học phần liên quan |
| `rule_id` | BIGINT | FK -> academic_alert_rules.id, NULL | Quy tắc phát sinh |
| `alert_type` | NVARCHAR(50) | NOT NULL | low_grade, absence, inactivity |
| `severity` | NVARCHAR(30) | NOT NULL | low, medium, high |
| `title` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `description` | NVARCHAR(MAX) | NOT NULL | Mô tả |
| `status` | NVARCHAR(30) | NOT NULL | new, in_progress, resolved, dismissed |
| `assigned_advisor_id` | BIGINT | FK -> users.id, NULL | Cố vấn xử lý |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `resolved_at` | DATETIME | NULL | Ngày xử lý |

---

## 10.4. `advising_appointments` — Lịch hẹn tư vấn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã lịch hẹn |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `title` | NVARCHAR(255) | NOT NULL | Chủ đề tư vấn |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `start_time` | DATETIME | NOT NULL | Bắt đầu |
| `end_time` | DATETIME | NOT NULL | Kết thúc |
| `location` | NVARCHAR(255) | NULL | Địa điểm/link online |
| `status` | NVARCHAR(30) | NOT NULL | scheduled, completed, cancelled, no_show |

---

## 10.5. `advising_notes` — Ghi chú/biên bản tư vấn

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ghi chú |
| `appointment_id` | BIGINT | FK -> advising_appointments.id, NULL | Lịch hẹn |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `note_content` | NVARCHAR(MAX) | NOT NULL | Nội dung tư vấn |
| `issue_type` | NVARCHAR(100) | NULL | Học tập, chuyên cần, định hướng |
| `action_plan` | NVARCHAR(MAX) | NULL | Kế hoạch cải thiện |
| `follow_up_date` | DATE | NULL | Ngày theo dõi lại |
| `visibility` | NVARCHAR(50) | NOT NULL | private, advisor_only, faculty_visible |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 10.6. `student_study_plans` — Kế hoạch học tập cá nhân

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã kế hoạch |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `advisor_user_id` | BIGINT | FK -> users.id | Cố vấn |
| `title` | NVARCHAR(255) | NOT NULL | Tên kế hoạch |
| `description` | NVARCHAR(MAX) | NULL | Nội dung |
| `start_date` | DATE | NULL | Bắt đầu |
| `end_date` | DATE | NULL | Kết thúc |
| `status` | NVARCHAR(30) | NOT NULL | draft, active, completed, cancelled |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 10.7. `study_plan_tasks` — Công việc trong kế hoạch học tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã task |
| `study_plan_id` | BIGINT | FK -> student_study_plans.id | Kế hoạch |
| `title` | NVARCHAR(255) | NOT NULL | Tên việc cần làm |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `due_date` | DATE | NULL | Hạn hoàn thành |
| `status` | NVARCHAR(30) | NOT NULL | todo, doing, done, cancelled |
| `completed_at` | DATETIME | NULL | Ngày hoàn thành |

---

## 10.8. `support_tickets` — Phiếu yêu cầu hỗ trợ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã ticket |
| `created_by` | BIGINT | FK -> users.id | Người gửi |
| `assigned_to` | BIGINT | FK -> users.id, NULL | Người xử lý |
| `category` | NVARCHAR(100) | NOT NULL | technical, grade, enrollment, exam, advising |
| `title` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `description` | NVARCHAR(MAX) | NOT NULL | Nội dung |
| `priority` | NVARCHAR(30) | NOT NULL | low, normal, high, urgent |
| `status` | NVARCHAR(30) | NOT NULL | open, in_progress, resolved, closed |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `resolved_at` | DATETIME | NULL | Ngày xử lý xong |

---

# 11. Nhóm bảng khảo sát, đánh giá chất lượng

## 11.1. `surveys` — Khảo sát

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã khảo sát |
| `title` | NVARCHAR(255) | NOT NULL | Tên khảo sát |
| `description` | NVARCHAR(MAX) | NULL | Mô tả |
| `survey_type` | NVARCHAR(50) | NOT NULL | course_feedback, lecturer_evaluation, program_feedback, general |
| `section_id` | BIGINT | FK -> course_sections.id, NULL | Lớp học phần nếu có |
| `target_type` | NVARCHAR(50) | NULL | role, faculty, section, program |
| `target_id` | BIGINT | NULL | ID đối tượng |
| `is_anonymous` | BIT | DEFAULT 1 | Ẩn danh |
| `open_at` | DATETIME | NULL | Mở khảo sát |
| `close_at` | DATETIME | NULL | Đóng khảo sát |
| `status` | NVARCHAR(30) | NOT NULL | draft, published, closed |
| `created_by` | BIGINT | FK -> users.id | Người tạo |

---

## 11.2. `survey_questions` — Câu hỏi khảo sát

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã câu hỏi |
| `survey_id` | BIGINT | FK -> surveys.id | Khảo sát |
| `question_text` | NVARCHAR(MAX) | NOT NULL | Nội dung câu hỏi |
| `question_type` | NVARCHAR(50) | NOT NULL | rating, single_choice, multiple_choice, text |
| `is_required` | BIT | DEFAULT 0 | Bắt buộc trả lời |
| `order_index` | INT | NOT NULL | Thứ tự |

---

## 11.3. `survey_options` — Lựa chọn khảo sát

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã lựa chọn |
| `question_id` | BIGINT | FK -> survey_questions.id | Câu hỏi |
| `option_text` | NVARCHAR(500) | NOT NULL | Nội dung lựa chọn |
| `option_value` | DECIMAL(6,2) | NULL | Giá trị điểm nếu có |
| `order_index` | INT | NOT NULL | Thứ tự |

---

## 11.4. `survey_responses` — Phiếu trả lời khảo sát

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã phiếu trả lời |
| `survey_id` | BIGINT | FK -> surveys.id | Khảo sát |
| `respondent_user_id` | BIGINT | FK -> users.id, NULL | Người trả lời, NULL nếu ẩn danh tuyệt đối |
| `submitted_at` | DATETIME | NOT NULL | Ngày gửi |
| `status` | NVARCHAR(30) | NOT NULL | submitted, invalidated |

---

## 11.5. `survey_answers` — Câu trả lời khảo sát

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã câu trả lời |
| `response_id` | BIGINT | FK -> survey_responses.id | Phiếu trả lời |
| `question_id` | BIGINT | FK -> survey_questions.id | Câu hỏi |
| `option_id` | BIGINT | FK -> survey_options.id, NULL | Lựa chọn |
| `answer_text` | NVARCHAR(MAX) | NULL | Câu trả lời text |
| `rating_value` | DECIMAL(6,2) | NULL | Điểm đánh giá |

---

## 11.6. `course_reviews` — Đánh giá nhanh khóa học/bài học

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã đánh giá |
| `section_id` | BIGINT | FK -> course_sections.id | Lớp học phần |
| `lesson_id` | BIGINT | FK -> lessons.id, NULL | Bài học nếu đánh giá bài |
| `student_user_id` | BIGINT | FK -> users.id | Sinh viên |
| `rating` | INT | NOT NULL | 1-5 sao |
| `comment` | NVARCHAR(MAX) | NULL | Nhận xét |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

# 12. Nhóm bảng tích hợp, bảo mật, vận hành

## 12.1. `files` — Quản lý file upload

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã file |
| `original_name` | NVARCHAR(255) | NOT NULL | Tên gốc |
| `stored_name` | NVARCHAR(255) | NOT NULL | Tên lưu trữ |
| `file_path` | NVARCHAR(1000) | NOT NULL | Đường dẫn |
| `mime_type` | NVARCHAR(100) | NULL | Loại file |
| `file_size` | BIGINT | NOT NULL | Dung lượng byte |
| `checksum` | NVARCHAR(255) | NULL | Hash file |
| `uploaded_by` | BIGINT | FK -> users.id | Người upload |
| `uploaded_at` | DATETIME | NOT NULL | Ngày upload |
| `visibility` | NVARCHAR(50) | NOT NULL | private, course, public |
| `is_deleted` | BIT | DEFAULT 0 | Xóa mềm |

---

## 12.2. `system_settings` — Cấu hình hệ thống

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã cấu hình |
| `setting_key` | NVARCHAR(100) | UNIQUE | Khóa cấu hình |
| `setting_value` | NVARCHAR(MAX) | NULL | Giá trị |
| `data_type` | NVARCHAR(30) | NOT NULL | string, number, boolean, json |
| `description` | NVARCHAR(500) | NULL | Mô tả |
| `updated_by` | BIGINT | FK -> users.id, NULL | Người cập nhật |
| `updated_at` | DATETIME | NULL | Ngày cập nhật |

---

## 12.3. `audit_logs` — Nhật ký thao tác hệ thống

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log |
| `user_id` | BIGINT | FK -> users.id, NULL | Người thao tác |
| `action` | NVARCHAR(100) | NOT NULL | CREATE, UPDATE, DELETE, LOGIN... |
| `entity_type` | NVARCHAR(100) | NULL | Tên bảng/đối tượng |
| `entity_id` | BIGINT | NULL | ID đối tượng |
| `old_value` | NVARCHAR(MAX) | NULL | Dữ liệu cũ dạng JSON |
| `new_value` | NVARCHAR(MAX) | NULL | Dữ liệu mới dạng JSON |
| `ip_address` | NVARCHAR(50) | NULL | IP |
| `user_agent` | NVARCHAR(500) | NULL | Thiết bị |
| `created_at` | DATETIME | NOT NULL | Ngày ghi log |

---

## 12.4. `email_templates` — Mẫu email

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã mẫu |
| `code` | NVARCHAR(100) | UNIQUE | Mã template |
| `subject` | NVARCHAR(255) | NOT NULL | Tiêu đề email |
| `body_html` | NVARCHAR(MAX) | NOT NULL | Nội dung HTML |
| `body_text` | NVARCHAR(MAX) | NULL | Nội dung text |
| `is_active` | BIT | DEFAULT 1 | Đang dùng |

---

## 12.5. `email_logs` — Log gửi email

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log email |
| `recipient_email` | NVARCHAR(255) | NOT NULL | Email nhận |
| `subject` | NVARCHAR(255) | NOT NULL | Tiêu đề |
| `body` | NVARCHAR(MAX) | NULL | Nội dung |
| `status` | NVARCHAR(30) | NOT NULL | queued, sent, failed |
| `error_message` | NVARCHAR(MAX) | NULL | Lỗi nếu có |
| `sent_at` | DATETIME | NULL | Ngày gửi |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |

---

## 12.6. `integrations` — Tích hợp bên ngoài

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã tích hợp |
| `provider` | NVARCHAR(100) | NOT NULL | Google, Microsoft, Zoom, SIS, Turnitin |
| `integration_type` | NVARCHAR(100) | NOT NULL | sso, meeting, plagiarism, storage, sis |
| `config_json` | NVARCHAR(MAX) | NULL | Cấu hình JSON |
| `is_active` | BIT | DEFAULT 1 | Đang bật |
| `created_at` | DATETIME | NOT NULL | Ngày tạo |
| `updated_at` | DATETIME | NULL | Ngày cập nhật |

---

## 12.7. `integration_logs` — Log tích hợp

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã log |
| `integration_id` | BIGINT | FK -> integrations.id | Tích hợp |
| `event_type` | NVARCHAR(100) | NOT NULL | sync_user, create_meeting, send_grade |
| `request_payload` | NVARCHAR(MAX) | NULL | Request |
| `response_payload` | NVARCHAR(MAX) | NULL | Response |
| `status` | NVARCHAR(30) | NOT NULL | success, failed |
| `error_message` | NVARCHAR(MAX) | NULL | Lỗi |
| `created_at` | DATETIME | NOT NULL | Ngày ghi log |

---

## 12.8. `backup_jobs` — Sao lưu dữ liệu

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã backup |
| `job_type` | NVARCHAR(50) | NOT NULL | database, files, full |
| `status` | NVARCHAR(30) | NOT NULL | running, success, failed |
| `backup_path` | NVARCHAR(1000) | NULL | Đường dẫn file backup |
| `started_at` | DATETIME | NOT NULL | Bắt đầu |
| `finished_at` | DATETIME | NULL | Kết thúc |
| `triggered_by` | BIGINT | FK -> users.id, NULL | Người chạy hoặc NULL nếu tự động |
| `error_message` | NVARCHAR(MAX) | NULL | Lỗi nếu có |

---

# 13. Bảng mở rộng nên có nếu hệ thống lớn

Các bảng sau không bắt buộc trong bản đồ án cơ bản, nhưng nên có nếu muốn hệ thống giống LMS thực tế.

| Bảng | Mục đích |
|---|---|
| `live_sessions` | Buổi học online Zoom/Meet/Teams |
| `live_session_attendance` | Điểm danh theo thời lượng tham gia lớp online |
| `plagiarism_checks` | Kết quả kiểm tra đạo văn bài nộp |
| `peer_reviews` | Sinh viên đánh giá chéo bài nhóm |
| `learning_paths` | Lộ trình học cá nhân hóa |
| `certificates` | Chứng chỉ hoàn thành khóa học |
| `certificate_templates` | Mẫu chứng chỉ |
| `calendar_events` | Lịch học, lịch thi, deadline thống nhất |
| `user_notification_preferences` | Cấu hình kênh nhận thông báo của từng user |
| `data_import_jobs` | Log import Excel/CSV |
| `data_export_jobs` | Log export báo cáo |
| `maintenance_windows` | Lịch bảo trì hệ thống |

---

# 14. Quan hệ chính giữa các bảng

## 14.1. Người dùng và phân quyền

```text
users 1---n user_roles n---1 roles
roles 1---n role_permissions n---1 permissions
users 1---1 student_profiles
users 1---1 lecturer_profiles
users 1---1 staff_profiles
```

## 14.2. Tổ chức đào tạo

```text
faculties 1---n departments
faculties 1---n academic_programs
academic_programs 1---n specializations
academic_programs 1---n academic_classes
academic_classes 1---n student_profiles
```

## 14.3. Môn học và lớp học phần

```text
academic_years 1---n semesters
semesters 1---n course_sections
courses 1---n course_sections
course_sections 1---n enrollments
users(student) 1---n enrollments
course_sections 1---n section_lecturers
users(lecturer) 1---n section_lecturers
```

## 14.4. Nội dung học tập

```text
course_sections 1---n course_modules
course_modules 1---n lessons
lessons 1---n learning_resources
lessons 1---n lesson_progress
users(student) 1---n lesson_progress
```

## 14.5. Bài tập

```text
course_sections 1---n assignments
assignments 1---n assignment_submissions
assignment_submissions 1---n submission_files
assignment_submissions 1---1 assignment_grades
assignments 1---n assignment_groups
assignment_groups 1---n assignment_group_members
```

## 14.6. Quiz/thi

```text
question_banks 1---n questions
questions 1---n question_options
quizzes 1---n quiz_questions n---1 questions
quizzes 1---n quiz_attempts
quiz_attempts 1---n quiz_attempt_questions
quiz_attempt_questions 1---n quiz_answers
```

## 14.7. Điểm số

```text
course_sections 1---n grade_categories
course_sections 1---n grade_items
grade_items 1---n student_grades
course_sections 1---n final_grades
student_grades 1---n grade_change_logs
```

## 14.8. Điểm danh

```text
course_sections 1---n attendance_sessions
attendance_sessions 1---n attendance_records
users(student) 1---n attendance_records
attendance_records 1---0..1 absence_requests
```

## 14.9. Cố vấn học tập

```text
users(advisor) 1---n advisor_assignments
users(student) 1---n academic_alerts
users(advisor) 1---n advising_appointments
advising_appointments 1---0..1 advising_notes
student_study_plans 1---n study_plan_tasks
```

---

# 15. Mapping chức năng theo 5 đối tượng và bảng liên quan

## 15.1. Sinh viên

| Nhóm chức năng | Bảng chính |
|---|---|
| Đăng nhập, hồ sơ | `users`, `student_profiles`, `user_sessions` |
| Xem học phần | `enrollments`, `course_sections`, `courses`, `semesters` |
| Xem bài giảng | `course_modules`, `lessons`, `learning_resources`, `files` |
| Theo dõi tiến độ | `lesson_progress`, `content_views`, `section_completion_rules` |
| Nộp bài tập | `assignments`, `assignment_submissions`, `submission_files` |
| Làm quiz/thi | `quizzes`, `quiz_attempts`, `quiz_answers` |
| Xem điểm | `student_grades`, `final_grades`, `assignment_grades` |
| Điểm danh | `attendance_sessions`, `attendance_records`, `absence_requests` |
| Diễn đàn/chat | `forums`, `forum_topics`, `forum_posts`, `message_threads`, `messages` |
| Thông báo | `announcements`, `announcement_reads`, `notifications` |
| Phúc khảo/hỗ trợ | `grade_appeals`, `support_tickets` |
| Khảo sát | `surveys`, `survey_responses`, `survey_answers` |

## 15.2. Giảng viên

| Nhóm chức năng | Bảng chính |
|---|---|
| Quản lý lớp được phân công | `course_sections`, `section_lecturers`, `enrollments` |
| Quản lý đề cương | `course_syllabi` |
| Quản lý bài giảng | `course_modules`, `lessons`, `learning_resources`, `files` |
| Quản lý bài tập | `assignments`, `assignment_files`, `rubrics`, `rubric_criteria` |
| Chấm bài | `assignment_submissions`, `assignment_grades`, `submission_files` |
| Tạo quiz/thi | `question_banks`, `questions`, `question_options`, `quizzes`, `quiz_questions` |
| Chấm tự luận | `quiz_manual_grades`, `quiz_answers` |
| Nhập điểm | `grade_categories`, `grade_items`, `student_grades`, `final_grades` |
| Điểm danh | `attendance_sessions`, `attendance_records` |
| Giao tiếp lớp | `announcements`, `forums`, `messages` |
| Báo cáo lớp | `lesson_progress`, `student_grades`, `attendance_records`, `quiz_attempts` |

## 15.3. Admin

| Nhóm chức năng | Bảng chính |
|---|---|
| Quản lý user | `users`, `student_profiles`, `lecturer_profiles`, `staff_profiles` |
| Phân quyền | `roles`, `permissions`, `role_permissions`, `user_roles` |
| Quản lý tổ chức | `faculties`, `departments`, `academic_programs`, `specializations`, `academic_classes` |
| Học kỳ, năm học | `academic_years`, `semesters`, `semester_weeks` |
| Môn, lớp học phần | `courses`, `course_sections`, `enrollments`, `section_lecturers` |
| Cấu hình hệ thống | `system_settings`, `integrations`, `email_templates` |
| Bảo mật/log | `audit_logs`, `user_sessions`, `integration_logs` |
| Backup/vận hành | `backup_jobs`, `email_logs` |
| Toàn bộ báo cáo | Gần như tất cả bảng nghiệp vụ |

## 15.4. Khoa / Bộ môn / Phòng đào tạo

| Nhóm chức năng | Bảng chính |
|---|---|
| Quản lý chương trình | `academic_programs`, `program_courses`, `program_learning_outcomes`, `clo_plo_mappings` |
| Quản lý môn học | `courses`, `course_prerequisites`, `course_learning_outcomes` |
| Mở lớp học phần | `course_sections`, `section_lecturers`, `enrollments` |
| Phân công giảng viên | `lecturer_profiles`, `section_lecturers` |
| Theo dõi giảng dạy | `course_modules`, `lessons`, `content_views`, `lesson_progress` |
| Duyệt đề cương/điểm | `course_syllabi`, `final_grades` |
| Khảo thí | `quizzes`, `question_banks`, `exam_incidents`, `grade_appeals` |
| Báo cáo đào tạo | `student_grades`, `final_grades`, `attendance_records`, `survey_responses` |

## 15.5. Cố vấn học tập

| Nhóm chức năng | Bảng chính |
|---|---|
| Danh sách sinh viên phụ trách | `advisor_assignments`, `student_profiles`, `academic_classes` |
| Theo dõi tiến độ | `lesson_progress`, `assignment_submissions`, `quiz_attempts` |
| Theo dõi điểm | `student_grades`, `final_grades` |
| Theo dõi chuyên cần | `attendance_records`, `absence_requests` |
| Cảnh báo học vụ | `academic_alert_rules`, `academic_alerts` |
| Lịch tư vấn | `advising_appointments` |
| Ghi chú tư vấn | `advising_notes` |
| Kế hoạch học tập | `student_study_plans`, `study_plan_tasks` |
| Hỗ trợ sinh viên | `support_tickets`, `grade_appeals` |

---

# 16. Bản rút gọn

Chia theo 3 mức.

## 16.1. Mức tối thiểu — 25 bảng

1. `users`
2. `roles`
3. `permissions`
4. `role_permissions`
5. `user_roles`
6. `faculties`
7. `departments`
8. `student_profiles`
9. `lecturer_profiles`
10. `academic_classes`
11. `academic_years`
12. `semesters`
13. `courses`
14. `course_sections`
15. `section_lecturers`
16. `enrollments`
17. `course_modules`
18. `lessons`
19. `learning_resources`
20. `files`
21. `assignments`
22. `assignment_submissions`
23. `quizzes`
24. `questions`
25. `student_grades`

## 16.2. Mức khá đầy đủ — 45 bảng

Thêm các bảng:

26. `lesson_progress`
27. `assignment_files`
28. `submission_files`
29. `assignment_grades`
30. `question_banks`
31. `question_categories`
32. `question_options`
33. `quiz_questions`
34. `quiz_attempts`
35. `quiz_attempt_questions`
36. `quiz_answers`
37. `grade_categories`
38. `grade_items`
39. `final_grades`
40. `attendance_sessions`
41. `attendance_records`
42. `announcements`
43. `notifications`
44. `forums`
45. `forum_topics`

## 16.3. Mức đầy đủ/nâng cao — 75 bảng

Dùng toàn bộ các bảng từ phần 3 đến phần 12. Đây là mức phù hợp nếu thiết kế hệ thống LMS đại học hoàn chỉnh, có Admin, Khoa/Phòng đào tạo, Cố vấn học tập, báo cáo, cảnh báo học vụ, khảo sát và tích hợp.

---

# 17. Thứ tự triển khai database

Tạo bảng theo thứ tự để tránh lỗi khóa ngoại:

1. `users`, `roles`, `permissions`
2. `role_permissions`, `user_roles`
3. `faculties`, `departments`, `academic_programs`, `specializations`, `academic_classes`
4. `student_profiles`, `lecturer_profiles`, `staff_profiles`
5. `academic_years`, `semesters`, `semester_weeks`
6. `courses`, `course_prerequisites`, `program_courses`, `course_learning_outcomes`, `program_learning_outcomes`, `clo_plo_mappings`
7. `course_sections`, `section_lecturers`, `enrollments`
8. `course_syllabi`, `course_modules`, `lessons`, `learning_resources`, `lesson_progress`
9. `assignments`, `assignment_submissions`, `assignment_grades`
10. `question_banks`, `questions`, `quizzes`, `quiz_attempts`, `quiz_answers`
11. `grade_categories`, `grade_items`, `student_grades`, `final_grades`
12. `attendance_sessions`, `attendance_records`, `absence_requests`
13. `announcements`, `notifications`, `forums`, `messages`
14. `advisor_assignments`, `academic_alerts`, `advising_appointments`, `support_tickets`
15. `surveys`, `survey_questions`, `survey_responses`
16. `files`, `system_settings`, `audit_logs`, `integrations`, `backup_jobs`

---

# 18. Kết luận

Với 5 đối tượng sử dụng gồm sinh viên, giảng viên, admin, khoa/bộ môn/phòng đào tạo và cố vấn học tập, hệ thống LMS nên có:

- **Tối thiểu:** 25 bảng
- **Khá đầy đủ:** 45 bảng
- **Đầy đủ/nâng cao:** khoảng 75 bảng lõi
- **Rất đầy đủ như hệ thống thương mại:** 90–100 bảng nếu thêm mobile app, AI, SCORM/xAPI, certificate, payment, data warehouse, logging nâng cao

Bản ERD này đề xuất **75 bảng chính**, đủ để bao phủ các chức năng quan trọng của LMS đại học: học liệu, bài tập, thi online, điểm, điểm danh, thông báo, diễn đàn, báo cáo, phân quyền, cố vấn học tập, cảnh báo học vụ, khảo sát chất lượng và quản trị hệ thống.

---

*ERD này là nguồn sự thật cho database schema. Mọi thay đổi PHẢI tạo Alembic migration mới và update tài liệu này.*
