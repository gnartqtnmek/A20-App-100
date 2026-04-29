# Brainio LMS Demo Script

## A. Khởi động demo

1. `docker compose up -d postgres redis`
2. `cd apps/api && python -m alembic upgrade head`
3. `cd apps/api && python seed.py`
4. `cd apps/api && uvicorn main:app --reload --port 8000`
5. `cd apps/web && npm install && npm run dev`

Mở:
- API docs: `http://localhost:8000/docs`
- Web: `http://localhost:3000`

## B. Demo flow theo role

## 1) Student

1. Login `student@brainio.edu`
2. Vào dashboard student
3. Mở `My Courses` -> xem `SE401-01`
4. Mở lessons/assignments/quizzes
5. Submit assignment (nếu cần resubmit)
6. Xem `Grades` và `Attendance`

Expected:
- Chỉ thấy dữ liệu của chính student
- Không truy cập được module admin/lecturer

## 2) Lecturer

1. Login `lecturer@brainio.edu`
2. Vào dashboard lecturer
3. Mở `Course Studio` cho section đang dạy
4. Tạo/sửa lesson, assignment, quiz
5. Mở submissions và chấm điểm + feedback
6. Mở attendance manager và mark attendance

Expected:
- Chỉ thao tác section thuộc lecturer
- Dữ liệu gradebook cập nhật sau khi chấm

## 3) Admin

1. Login `admin@brainio.edu`
2. Vào dashboard admin
3. Kiểm tra Users/Departments/Programs/Courses/Sections
4. Tạo mới user/course/section
5. Mở reports hệ thống và audit logs

Expected:
- Toàn quyền CRUD quản trị
- Xem được báo cáo tổng quan

## 4) Academic Staff

1. Login `staff@brainio.edu`
2. Vào dashboard academic staff
3. Quản lý curriculum entries
4. Quản lý section và phân công lecturer
5. Duyệt grade approval / exam approval

Expected:
- Chỉ quản lý trong phạm vi đào tạo được phân công (department scope)

## 5) Advisor

1. Login `advisor@brainio.edu`
2. Vào dashboard advisor
3. Mở `My Students`
4. Mở progress của student phụ trách
5. Tạo risk alert + consultation note + study plan
6. Tạo support request/escalation

Expected:
- Chỉ xem và thao tác sinh viên đã assign cho advisor

## C. Cross-role verification scenario

1. Lecturer tạo/điều chỉnh assignment
2. Student nộp assignment
3. Lecturer chấm điểm
4. Student mở trang grades để xem điểm mới
5. Advisor mở progress để theo dõi thay đổi
6. Academic staff xử lý grade approval

## D. API smoke checks đề xuất

- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/student/courses`
- `GET /api/v1/lecturer/sections`
- `GET /api/v1/admin/courses`
- `GET /api/v1/academic/sections`
- `GET /api/v1/advisor/students`
- `GET /api/v1/reports/{role}`
