# Brainio LMS QA Checklist (Stabilization)

## 1. Environment & Build

- [ ] `docker compose up -d postgres redis` thành công
- [ ] `cd apps/api && python -m alembic upgrade head` thành công
- [ ] `cd apps/api && python seed.py` thành công
- [ ] `cd apps/api && python -c "from main import app; print(bool(app))"` trả về `True`
- [ ] `cd apps/web && npx tsc --noEmit` không lỗi
- [ ] `cd apps/web && npm run build` không lỗi
- [ ] `docker compose build` build được `api` và `web`

## 2. Authentication & Session

- [ ] `POST /api/v1/auth/login` hoạt động với 5 tài khoản demo
- [ ] `GET /api/v1/auth/me` trả về đúng role
- [ ] `POST /api/v1/auth/refresh` cấp access token mới
- [ ] `POST /api/v1/auth/logout` phản hồi hợp lệ

## 3. RBAC (Bắt buộc)

### Student
- [ ] Student không truy cập được endpoint `admin/*`
- [ ] Student không truy cập được endpoint `lecturer/*`
- [ ] Student chỉ xem course đã enroll
- [ ] Student chỉ xem grade/attendance của chính mình

### Lecturer
- [ ] Lecturer không truy cập được endpoint `admin/*`
- [ ] Lecturer chỉ xem `sections` do mình phụ trách
- [ ] Lecturer chỉ CRUD lesson/assignment/quiz trong section của mình
- [ ] Lecturer chỉ xem submission/gradebook lớp mình dạy

### Admin
- [ ] Admin truy cập được toàn bộ module quản trị
- [ ] Admin CRUD user/course/section thành công
- [ ] Admin xem được audit logs và reports hệ thống
- [ ] Admin có thể gọi API advisor/academic để kiểm tra tổng quan dữ liệu

### Academic Staff
- [ ] Academic staff truy cập được `academic/*`
- [ ] Academic staff chỉ thao tác curriculum/section trong phạm vi `department_id` của mình
- [ ] Academic staff phân công lecturer thành công trong phạm vi đào tạo
- [ ] Academic staff xử lý grade/exam approval trong phạm vi đào tạo

### Advisor
- [ ] Advisor chỉ xem danh sách sinh viên đã được assign
- [ ] Advisor không xem được progress sinh viên ngoài phạm vi phụ trách
- [ ] Advisor tạo risk alert/consultation/study plan/support request đúng sinh viên phụ trách
- [ ] Advisor xem report advisor đúng dữ liệu phụ trách

## 4. Student Flows

- [ ] Student xem `My Courses`, course detail, lessons
- [ ] Student xem assignments và submit assignment
- [ ] Student làm quiz và nhận điểm auto-grade
- [ ] Student xem grades và attendance

## 5. Lecturer Flows

- [ ] Lecturer tạo lesson/assignment/quiz
- [ ] Student submit bài, lecturer xem submissions
- [ ] Lecturer chấm điểm + feedback
- [ ] Lecturer tạo attendance session và mark attendance

## 6. Admin Flows

- [ ] CRUD users
- [ ] CRUD departments/programs/courses
- [ ] CRUD semesters/sections
- [ ] Quản lý role/permission matrix
- [ ] Xem report hệ thống cơ bản

## 7. Academic Staff Flows

- [ ] CRUD curriculum entries
- [ ] Quản lý section opening/status
- [ ] Lecturer assignment
- [ ] Student tracking
- [ ] Grade approval workflow
- [ ] Exam approval foundation

## 8. Advisor Flows

- [ ] Assigned students list
- [ ] Student progress tracking
- [ ] Risk alerts lifecycle (open/close/update)
- [ ] Consultation records
- [ ] Study plans
- [ ] Support requests/escalation

## 9. Platform Features (Sprint 7)

- [ ] Notifications: create/list/mark-read
- [ ] Announcements: create/list theo role
- [ ] Reports theo role (`/api/v1/reports/{role}`)
- [ ] File upload foundation hoạt động
- [ ] Pagination/filter/search có trên list APIs chính
- [ ] Error response format nhất quán (`422/500`)

## 10. Frontend UX/Polish

- [ ] Dashboard theo role render đúng module
- [ ] Sidebar role-based hoạt động
- [ ] Notification center hiển thị đúng
- [ ] Reports panel hoạt động
- [ ] Dark mode toggle hoạt động
- [ ] Loading/empty/error states hiển thị hợp lý
- [ ] Responsive cơ bản trên mobile
