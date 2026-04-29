# API Specification
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 3.0 | **Ngày:** 2026-04-29

> Dev Frontend và Backend đọc tài liệu này để biết chính xác từng endpoint: method, URL, auth, params, request body, response body, error codes. Mọi thứ phải rõ ràng không cần đoán.
> Phạm vi: Hệ thống LMS dành cho **Sinh viên, Giảng viên, Quản trị viên hệ thống, Khoa/Bộ môn/Phòng đào tạo, Cố vấn học tập**.  
> Kiến trúc đề xuất: Frontend React/Vite, Backend REST API, PostgreSQL, Redis, Object Storage, Email/Notification Service, tích hợp SSO và lớp học trực tuyến.

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả đầy đủ API cho hệ thống LMS, bao gồm:

- Chuẩn endpoint REST.
- Quy ước request/response.
- Authentication và Authorization.
- Danh sách API theo module nghiệp vụ.
- API phục vụ 5 nhóm người dùng chính.
- Request body mẫu.
- Response body mẫu.
- Error codes.
- Pagination, filtering, sorting.
- Upload file.
- Notification.
- Báo cáo.
- API tích hợp bên ngoài.

Tài liệu này có thể dùng để triển khai Swagger/OpenAPI, Postman Collection hoặc làm tài liệu giao tiếp giữa Frontend và Backend.

---

## 2. Tổng quan hệ thống API

### 2.1. Base URL

```http
Local:      http://localhost:8080/api/v1
Staging:    https://staging-lms.example.edu.vn/api/v1
Production: https://lms.example.edu.vn/api/v1
```

### 2.2. Content Type

```http
Content-Type: application/json
Accept: application/json
```

Riêng upload file dùng:

```http
Content-Type: multipart/form-data
```

### 2.3. Authentication

Hệ thống sử dụng JWT Access Token và Refresh Token.

```http
Authorization: Bearer <access_token>
```

### 2.4. Các vai trò chính

| Role Code | Tên vai trò | Mô tả |
|---|---|---|
| `STUDENT` | Sinh viên | Học tập, nộp bài, làm quiz, xem điểm |
| `LECTURER` | Giảng viên | Quản lý lớp, bài giảng, bài tập, quiz, điểm |
| `ADMIN` | Quản trị viên hệ thống | Toàn quyền hệ thống |
| `ACADEMIC_STAFF` | Khoa/Bộ môn/Phòng đào tạo | Quản lý đào tạo theo phạm vi khoa/bộ môn |
| `ADVISOR` | Cố vấn học tập | Theo dõi, cảnh báo và tư vấn sinh viên |
| `TEACHING_ASSISTANT` | Trợ giảng | Hỗ trợ giảng viên nếu hệ thống mở rộng |

---

## 3. Quy ước response chuẩn

### 3.1. Response thành công

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {},
  "meta": {
    "timestamp": "2026-04-29T10:47:00+07:00",
    "requestId": "req_01HXABC123"
  }
}
```

### 3.2. Response danh sách có phân trang

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [
    {}
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 125,
    "totalPages": 7,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2026-04-29T10:47:00+07:00",
    "requestId": "req_01HXABC123"
  }
}
```

### 3.3. Response lỗi

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email không đúng định dạng"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-29T10:47:00+07:00",
    "requestId": "req_01HXABC123"
  }
}
```

---

## 4. HTTP Status Codes

| Status | Ý nghĩa | Khi sử dụng |
|---|---|---|
| 200 | OK | Lấy dữ liệu, cập nhật thành công |
| 201 | Created | Tạo mới thành công |
| 204 | No Content | Xóa thành công, không trả body |
| 400 | Bad Request | Request sai định dạng |
| 401 | Unauthorized | Chưa đăng nhập/token sai |
| 403 | Forbidden | Không có quyền |
| 404 | Not Found | Không tìm thấy tài nguyên |
| 409 | Conflict | Trùng dữ liệu hoặc xung đột trạng thái |
| 422 | Validation Error | Dữ liệu không hợp lệ |
| 429 | Too Many Requests | Gửi request quá nhiều |
| 500 | Internal Server Error | Lỗi hệ thống |

---

## 5. Error Codes chuẩn

| Code | Mô tả |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Sai tài khoản hoặc mật khẩu |
| `AUTH_TOKEN_EXPIRED` | Access token hết hạn |
| `AUTH_REFRESH_TOKEN_INVALID` | Refresh token không hợp lệ |
| `AUTH_ACCOUNT_LOCKED` | Tài khoản bị khóa |
| `FORBIDDEN_ROLE` | Vai trò không đủ quyền |
| `RESOURCE_NOT_FOUND` | Không tìm thấy dữ liệu |
| `VALIDATION_ERROR` | Lỗi validation |
| `DUPLICATE_RESOURCE` | Dữ liệu đã tồn tại |
| `COURSE_NOT_OPEN` | Lớp học phần chưa mở |
| `ENROLLMENT_NOT_FOUND` | Sinh viên chưa ghi danh |
| `ASSIGNMENT_CLOSED` | Bài tập đã đóng |
| `QUIZ_NOT_AVAILABLE` | Quiz chưa mở hoặc đã đóng |
| `QUIZ_ATTEMPT_LIMIT_REACHED` | Vượt số lần làm bài |
| `GRADE_LOCKED` | Bảng điểm đã khóa |
| `ATTENDANCE_SESSION_CLOSED` | Phiên điểm danh đã đóng |
| `FILE_TOO_LARGE` | File vượt dung lượng |
| `FILE_TYPE_NOT_ALLOWED` | Loại file không được phép |
| `INTEGRATION_ERROR` | Lỗi tích hợp bên ngoài |

---

## 6. Quy ước pagination, filter, sort

### 6.1. Query parameters chung

```http
GET /courses?page=1&limit=20&sort=createdAt:desc&keyword=database
```

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `page` | number | Trang hiện tại, mặc định 1 |
| `limit` | number | Số bản ghi/trang, mặc định 20 |
| `sort` | string | Ví dụ `createdAt:desc`, `name:asc` |
| `keyword` | string | Tìm kiếm chung |
| `status` | string | Lọc trạng thái |
| `fromDate` | string | Ngày bắt đầu |
| `toDate` | string | Ngày kết thúc |

---

## 7. Authentication & Account APIs

### 7.1. Đăng nhập

```http
POST /auth/login
```

**Request**

```json
{
  "username": "sv001@university.edu.vn",
  "password": "Password@123",
  "rememberMe": true
}
```

**Response**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 3600,
    "user": {
      "id": "usr_001",
      "fullName": "Nguyễn Văn A",
      "email": "sv001@university.edu.vn",
      "roles": ["STUDENT"]
    }
  }
}
```

**Quyền:** Public.

---

### 7.2. Làm mới token

```http
POST /auth/refresh-token
```

**Request**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

---

### 7.3. Đăng xuất

```http
POST /auth/logout
```

**Request**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Quyền:** Authenticated.

---

### 7.4. Quên mật khẩu

```http
POST /auth/forgot-password
```

**Request**

```json
{
  "email": "user@university.edu.vn"
}
```

---

### 7.5. Đặt lại mật khẩu

```http
POST /auth/reset-password
```

**Request**

```json
{
  "token": "reset_token",
  "newPassword": "NewPassword@123"
}
```

---

### 7.6. Đổi mật khẩu

```http
PUT /auth/change-password
```

**Request**

```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

---

### 7.7. Lấy thông tin tài khoản hiện tại

```http
GET /auth/me
```

**Response**

```json
{
  "id": "usr_001",
  "fullName": "Nguyễn Văn A",
  "email": "sv001@university.edu.vn",
  "avatarUrl": "https://cdn.example.edu.vn/avatar.png",
  "roles": ["STUDENT"],
  "department": {
    "id": "dep_it",
    "name": "Khoa Công nghệ thông tin"
  }
}
```

---

## 8. User Profile APIs

### 8.1. Xem hồ sơ cá nhân

```http
GET /profile
```

**Quyền:** Authenticated.

### 8.2. Cập nhật hồ sơ cá nhân

```http
PUT /profile
```

**Request**

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0900000000",
  "address": "Hà Nội",
  "dateOfBirth": "2004-01-01",
  "gender": "MALE"
}
```

### 8.3. Upload avatar

```http
POST /profile/avatar
Content-Type: multipart/form-data
```

**Form data**

| Field | Type | Required |
|---|---|---|
| `file` | file | Yes |

---

## 9. Admin — User Management APIs

### 9.1. Lấy danh sách người dùng

```http
GET /admin/users?page=1&limit=20&role=STUDENT&departmentId=dep_it&status=ACTIVE&keyword=nguyen
```

**Quyền:** `ADMIN`, `ACADEMIC_STAFF` phạm vi được cấp.

### 9.2. Tạo người dùng

```http
POST /admin/users
```

**Request**

```json
{
  "code": "SV2026001",
  "fullName": "Nguyễn Văn A",
  "email": "sv2026001@university.edu.vn",
  "phone": "0900000000",
  "password": "Password@123",
  "roles": ["STUDENT"],
  "departmentId": "dep_it",
  "majorId": "major_se",
  "classId": "class_k18a",
  "status": "ACTIVE"
}
```

### 9.3. Xem chi tiết người dùng

```http
GET /admin/users/{userId}
```

### 9.4. Cập nhật người dùng

```http
PUT /admin/users/{userId}
```

### 9.5. Khóa tài khoản

```http
PATCH /admin/users/{userId}/lock
```

**Request**

```json
{
  "reason": "Vi phạm quy định sử dụng hệ thống"
}
```

### 9.6. Mở khóa tài khoản

```http
PATCH /admin/users/{userId}/unlock
```

### 9.7. Reset mật khẩu người dùng

```http
POST /admin/users/{userId}/reset-password
```

### 9.8. Xóa người dùng

```http
DELETE /admin/users/{userId}
```

### 9.9. Import người dùng

```http
POST /admin/users/import
Content-Type: multipart/form-data
```

**Form data:** `file`, `role`, `departmentId`.

### 9.10. Export người dùng

```http
GET /admin/users/export?format=xlsx&role=STUDENT&departmentId=dep_it
```

---

## 10. Role & Permission APIs

### 10.1. Lấy danh sách vai trò

```http
GET /admin/roles
```

### 10.2. Tạo vai trò

```http
POST /admin/roles
```

```json
{
  "code": "ADVISOR",
  "name": "Cố vấn học tập",
  "description": "Theo dõi và hỗ trợ sinh viên"
}
```

### 10.3. Cập nhật vai trò

```http
PUT /admin/roles/{roleId}
```

### 10.4. Xóa vai trò

```http
DELETE /admin/roles/{roleId}
```

### 10.5. Lấy danh sách quyền

```http
GET /admin/permissions
```

### 10.6. Gán quyền cho vai trò

```http
PUT /admin/roles/{roleId}/permissions
```

```json
{
  "permissionIds": [
    "course.read",
    "course.create",
    "course.update",
    "grade.approve"
  ]
}
```

### 10.7. Gán vai trò cho người dùng

```http
POST /admin/users/{userId}/roles
```

```json
{
  "roleCodes": ["LECTURER", "ADVISOR"]
}
```

### 10.8. Thu hồi vai trò người dùng

```http
DELETE /admin/users/{userId}/roles/{roleCode}
```

---

## 11. Organization APIs — Khoa, Bộ môn, Ngành, Lớp hành chính

### 11.1. Danh sách khoa

```http
GET /departments
```

### 11.2. Tạo khoa

```http
POST /admin/departments
```

```json
{
  "code": "IT",
  "name": "Khoa Công nghệ thông tin",
  "description": "Đào tạo CNTT",
  "managerId": "usr_lecturer_001"
}
```

### 11.3. Cập nhật khoa

```http
PUT /admin/departments/{departmentId}
```

### 11.4. Xóa/ẩn khoa

```http
DELETE /admin/departments/{departmentId}
```

### 11.5. Danh sách bộ môn

```http
GET /departments/{departmentId}/subject-groups
```

### 11.6. Tạo bộ môn

```http
POST /admin/subject-groups
```

```json
{
  "departmentId": "dep_it",
  "code": "SE",
  "name": "Bộ môn Công nghệ phần mềm",
  "managerId": "usr_lecturer_002"
}
```

### 11.7. Danh sách ngành/chuyên ngành

```http
GET /majors?departmentId=dep_it
```

### 11.8. Tạo ngành

```http
POST /admin/majors
```

### 11.9. Danh sách lớp hành chính

```http
GET /academic-classes?departmentId=dep_it&cohort=2026
```

### 11.10. Tạo lớp hành chính

```http
POST /admin/academic-classes
```

```json
{
  "code": "K18A-CNTT",
  "name": "K18A Công nghệ thông tin",
  "departmentId": "dep_it",
  "majorId": "major_it",
  "cohort": "2026",
  "advisorId": "usr_advisor_001"
}
```

---

## 12. Academic Year & Semester APIs

### 12.1. Danh sách năm học

```http
GET /academic-years
```

### 12.2. Tạo năm học

```http
POST /admin/academic-years
```

```json
{
  "name": "2026-2027",
  "startDate": "2026-08-01",
  "endDate": "2027-07-31",
  "status": "ACTIVE"
}
```

### 12.3. Danh sách học kỳ

```http
GET /semesters?academicYearId=ay_2026
```

### 12.4. Tạo học kỳ

```http
POST /admin/semesters
```

```json
{
  "academicYearId": "ay_2026",
  "code": "HK1",
  "name": "Học kỳ 1",
  "startDate": "2026-08-15",
  "endDate": "2026-12-31",
  "registrationStartDate": "2026-07-15",
  "registrationEndDate": "2026-08-01"
}
```

### 12.5. Khóa học kỳ

```http
PATCH /admin/semesters/{semesterId}/lock
```

---

## 13. Course Catalog APIs — Môn học

### 13.1. Lấy danh sách môn học

```http
GET /courses/catalog?departmentId=dep_it&keyword=database&page=1&limit=20
```

### 13.2. Tạo môn học

```http
POST /admin/courses/catalog
```

```json
{
  "code": "IT301",
  "name": "Cơ sở dữ liệu",
  "credits": 3,
  "departmentId": "dep_it",
  "subjectGroupId": "sg_se",
  "description": "Môn học về thiết kế và truy vấn cơ sở dữ liệu",
  "prerequisiteCourseIds": ["course_it101"],
  "status": "ACTIVE"
}
```

### 13.3. Chi tiết môn học

```http
GET /courses/catalog/{courseId}
```

### 13.4. Cập nhật môn học

```http
PUT /admin/courses/catalog/{courseId}
```

### 13.5. Ẩn/ngừng môn học

```http
PATCH /admin/courses/catalog/{courseId}/deactivate
```

### 13.6. Quản lý môn tiên quyết

```http
PUT /admin/courses/catalog/{courseId}/prerequisites
```

```json
{
  "prerequisiteCourseIds": ["course_it101", "course_math101"]
}
```

---

## 14. Program Curriculum APIs — Chương trình đào tạo

### 14.1. Danh sách chương trình đào tạo

```http
GET /curriculums?majorId=major_it&cohort=2026
```

### 14.2. Tạo chương trình đào tạo

```http
POST /academic/curriculums
```

```json
{
  "majorId": "major_it",
  "cohort": "2026",
  "name": "CTĐT CNTT khóa 2026",
  "totalCredits": 140,
  "description": "Chương trình đào tạo ngành CNTT"
}
```

### 14.3. Thêm môn vào chương trình

```http
POST /academic/curriculums/{curriculumId}/courses
```

```json
{
  "courseId": "course_it301",
  "semesterNo": 4,
  "type": "REQUIRED",
  "credits": 3
}
```

### 14.4. Cập nhật mapping chuẩn đầu ra CLO/PLO

```http
PUT /academic/curriculums/{curriculumId}/outcome-mapping
```

```json
{
  "mappings": [
    {
      "courseId": "course_it301",
      "cloCode": "CLO1",
      "ploCode": "PLO2",
      "level": "HIGH"
    }
  ]
}
```

---

## 15. Course Section APIs — Lớp học phần

### 15.1. Danh sách lớp học phần

```http
GET /course-sections?semesterId=sem_2026_hk1&departmentId=dep_it&lecturerId=usr_lecturer_001&status=OPEN
```

### 15.2. Tạo lớp học phần

```http
POST /academic/course-sections
```

```json
{
  "courseId": "course_it301",
  "semesterId": "sem_2026_hk1",
  "sectionCode": "IT301-01",
  "name": "Cơ sở dữ liệu - Nhóm 01",
  "lecturerId": "usr_lecturer_001",
  "teachingAssistantIds": ["usr_ta_001"],
  "maxStudents": 60,
  "scheduleText": "Thứ 2, tiết 1-3, phòng A101",
  "status": "DRAFT"
}
```

### 15.3. Chi tiết lớp học phần

```http
GET /course-sections/{sectionId}
```

### 15.4. Cập nhật lớp học phần

```http
PUT /academic/course-sections/{sectionId}
```

### 15.5. Mở lớp học phần

```http
PATCH /academic/course-sections/{sectionId}/open
```

### 15.6. Đóng/hủy lớp học phần

```http
PATCH /academic/course-sections/{sectionId}/close
```

```json
{
  "reason": "Không đủ sĩ số"
}
```

### 15.7. Gán giảng viên

```http
PUT /academic/course-sections/{sectionId}/lecturer
```

```json
{
  "lecturerId": "usr_lecturer_001"
}
```

### 15.8. Gán trợ giảng

```http
PUT /academic/course-sections/{sectionId}/teaching-assistants
```

```json
{
  "teachingAssistantIds": ["usr_ta_001", "usr_ta_002"]
}
```

### 15.9. Sao chép lớp học phần từ kỳ trước

```http
POST /academic/course-sections/{sectionId}/clone
```

```json
{
  "targetSemesterId": "sem_2026_hk2",
  "copyContent": true,
  "copyAssignments": true,
  "copyQuizzes": false
}
```

---

## 16. Enrollment APIs — Ghi danh sinh viên

### 16.1. Danh sách sinh viên trong lớp học phần

```http
GET /course-sections/{sectionId}/enrollments?page=1&limit=50&status=ACTIVE
```

### 16.2. Ghi danh một sinh viên

```http
POST /course-sections/{sectionId}/enrollments
```

```json
{
  "studentId": "usr_student_001"
}
```

### 16.3. Ghi danh hàng loạt

```http
POST /course-sections/{sectionId}/enrollments/bulk
```

```json
{
  "studentIds": ["usr_student_001", "usr_student_002"]
}
```

### 16.4. Import danh sách ghi danh

```http
POST /course-sections/{sectionId}/enrollments/import
Content-Type: multipart/form-data
```

### 16.5. Hủy ghi danh

```http
DELETE /course-sections/{sectionId}/enrollments/{studentId}
```

### 16.6. Chuyển lớp học phần

```http
POST /enrollments/transfer
```

```json
{
  "studentId": "usr_student_001",
  "fromSectionId": "sec_001",
  "toSectionId": "sec_002",
  "reason": "Trùng lịch học"
}
```

### 16.7. Sinh viên xem các lớp của mình

```http
GET /student/course-sections?semesterId=sem_2026_hk1
```

**Quyền:** `STUDENT`.

---

## 17. Course Content APIs — Bài giảng, học liệu

### 17.1. Danh sách module/chương của lớp

```http
GET /course-sections/{sectionId}/modules
```

### 17.2. Tạo module/chương

```http
POST /lecturer/course-sections/{sectionId}/modules
```

```json
{
  "title": "Chương 1: Tổng quan cơ sở dữ liệu",
  "description": "Giới thiệu về DBMS",
  "orderIndex": 1,
  "publishAt": "2026-09-01T08:00:00+07:00",
  "isVisible": true
}
```

### 17.3. Cập nhật module

```http
PUT /lecturer/modules/{moduleId}
```

### 17.4. Xóa module

```http
DELETE /lecturer/modules/{moduleId}
```

### 17.5. Sắp xếp module

```http
PUT /lecturer/course-sections/{sectionId}/modules/reorder
```

```json
{
  "items": [
    { "moduleId": "mod_001", "orderIndex": 1 },
    { "moduleId": "mod_002", "orderIndex": 2 }
  ]
}
```

### 17.6. Danh sách bài học

```http
GET /modules/{moduleId}/lessons
```

### 17.7. Tạo bài học

```http
POST /lecturer/modules/{moduleId}/lessons
```

```json
{
  "title": "Bài 1: Khái niệm DBMS",
  "type": "VIDEO",
  "contentHtml": "<p>Nội dung bài học</p>",
  "videoUrl": "https://cdn.example.edu.vn/videos/dbms.mp4",
  "durationMinutes": 45,
  "orderIndex": 1,
  "isRequired": true,
  "publishAt": "2026-09-01T08:00:00+07:00"
}
```

### 17.8. Cập nhật bài học

```http
PUT /lecturer/lessons/{lessonId}
```

### 17.9. Xóa bài học

```http
DELETE /lecturer/lessons/{lessonId}
```

### 17.10. Upload tài liệu bài học

```http
POST /lecturer/lessons/{lessonId}/resources
Content-Type: multipart/form-data
```

**Form data:** `file`, `title`, `description`.

### 17.11. Sinh viên xem bài học

```http
GET /student/lessons/{lessonId}
```

### 17.12. Đánh dấu hoàn thành bài học

```http
POST /student/lessons/{lessonId}/complete
```

### 17.13. Ghi nhận tiến độ xem video

```http
POST /student/lessons/{lessonId}/progress
```

```json
{
  "watchedSeconds": 960,
  "totalSeconds": 1800,
  "lastPositionSeconds": 960,
  "completed": false
}
```

### 17.14. Bookmark bài học

```http
POST /student/lessons/{lessonId}/bookmark
```

### 17.15. Ghi chú cá nhân trong bài học

```http
POST /student/lessons/{lessonId}/notes
```

```json
{
  "content": "Cần ôn lại phần normalization",
  "timestampSeconds": 540
}
```

### 17.16. Tìm kiếm nội dung trong khóa học

```http
GET /course-sections/{sectionId}/search?keyword=normalization
```

---

## 18. Assignment APIs — Bài tập

### 18.1. Danh sách bài tập của lớp

```http
GET /course-sections/{sectionId}/assignments?status=OPEN
```

### 18.2. Tạo bài tập

```http
POST /lecturer/course-sections/{sectionId}/assignments
```

```json
{
  "title": "Bài tập 1: Thiết kế ERD",
  "description": "Thiết kế ERD cho hệ thống quản lý thư viện",
  "type": "INDIVIDUAL",
  "submissionType": "FILE",
  "maxScore": 10,
  "openAt": "2026-09-10T08:00:00+07:00",
  "dueAt": "2026-09-20T23:59:00+07:00",
  "allowLateSubmission": true,
  "latePenaltyPercentPerDay": 10,
  "allowedFileTypes": ["pdf", "docx", "zip"],
  "maxFileSizeMb": 50,
  "rubricId": "rubric_001"
}
```

### 18.3. Chi tiết bài tập

```http
GET /assignments/{assignmentId}
```

### 18.4. Cập nhật bài tập

```http
PUT /lecturer/assignments/{assignmentId}
```

### 18.5. Xóa bài tập

```http
DELETE /lecturer/assignments/{assignmentId}
```

### 18.6. Gia hạn bài tập cho lớp

```http
PATCH /lecturer/assignments/{assignmentId}/extend
```

```json
{
  "newDueAt": "2026-09-25T23:59:00+07:00",
  "reason": "Gia hạn theo đề nghị lớp"
}
```

### 18.7. Gia hạn bài tập cho một sinh viên

```http
PATCH /lecturer/assignments/{assignmentId}/extend-student
```

```json
{
  "studentId": "usr_student_001",
  "newDueAt": "2026-09-26T23:59:00+07:00",
  "reason": "Sinh viên có lý do chính đáng"
}
```

### 18.8. Sinh viên nộp bài

```http
POST /student/assignments/{assignmentId}/submissions
Content-Type: multipart/form-data
```

**Form data**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `files` | file[] | No | File bài nộp |
| `textAnswer` | string | No | Nội dung text |
| `linkUrl` | string | No | Link bài làm |

### 18.9. Sinh viên cập nhật bài nộp

```http
PUT /student/assignments/{assignmentId}/submissions/{submissionId}
```

### 18.10. Xem bài nộp của sinh viên

```http
GET /student/assignments/{assignmentId}/my-submission
```

### 18.11. Giảng viên xem danh sách bài nộp

```http
GET /lecturer/assignments/{assignmentId}/submissions?status=SUBMITTED&page=1&limit=50
```

### 18.12. Tải toàn bộ bài nộp

```http
GET /lecturer/assignments/{assignmentId}/submissions/download-all
```

### 18.13. Chấm bài

```http
POST /lecturer/submissions/{submissionId}/grade
```

```json
{
  "score": 8.5,
  "feedback": "Bài làm tốt, cần bổ sung phần quan hệ N-N",
  "rubricScores": [
    {
      "criterionId": "crit_001",
      "score": 4
    }
  ],
  "publishToStudent": true
}
```

### 18.14. Upload file phản hồi

```http
POST /lecturer/submissions/{submissionId}/feedback-files
Content-Type: multipart/form-data
```

### 18.15. Sinh viên xem feedback bài tập

```http
GET /student/submissions/{submissionId}/feedback
```

### 18.16. Kiểm tra đạo văn bài nộp

```http
POST /lecturer/submissions/{submissionId}/plagiarism-check
```

### 18.17. Xem báo cáo đạo văn

```http
GET /lecturer/submissions/{submissionId}/plagiarism-report
```

---

## 19. Rubric APIs

### 19.1. Danh sách rubric

```http
GET /rubrics?courseId=course_it301
```

### 19.2. Tạo rubric

```http
POST /lecturer/rubrics
```

```json
{
  "name": "Rubric chấm ERD",
  "description": "Tiêu chí đánh giá bài thiết kế ERD",
  "criteria": [
    {
      "name": "Đúng thực thể",
      "description": "Xác định đúng entity",
      "maxScore": 4
    },
    {
      "name": "Đúng quan hệ",
      "description": "Xác định đúng relationship",
      "maxScore": 4
    },
    {
      "name": "Trình bày",
      "description": "Sơ đồ rõ ràng",
      "maxScore": 2
    }
  ]
}
```

### 19.3. Cập nhật rubric

```http
PUT /lecturer/rubrics/{rubricId}
```

### 19.4. Xóa rubric

```http
DELETE /lecturer/rubrics/{rubricId}
```

---

## 20. Quiz & Exam APIs

### 20.1. Danh sách quiz của lớp

```http
GET /course-sections/{sectionId}/quizzes
```

### 20.2. Tạo quiz/bài thi

```http
POST /lecturer/course-sections/{sectionId}/quizzes
```

```json
{
  "title": "Quiz chương 1",
  "description": "Kiểm tra kiến thức chương 1",
  "type": "QUIZ",
  "openAt": "2026-09-15T08:00:00+07:00",
  "closeAt": "2026-09-15T23:59:00+07:00",
  "durationMinutes": 30,
  "maxAttempts": 1,
  "gradingMethod": "HIGHEST",
  "shuffleQuestions": true,
  "shuffleAnswers": true,
  "showResultMode": "AFTER_CLOSE",
  "enableProctoring": false,
  "maxScore": 10
}
```

### 20.3. Cập nhật quiz

```http
PUT /lecturer/quizzes/{quizId}
```

### 20.4. Xóa quiz

```http
DELETE /lecturer/quizzes/{quizId}
```

### 20.5. Thêm câu hỏi vào quiz

```http
POST /lecturer/quizzes/{quizId}/questions
```

```json
{
  "questionBankId": "qb_001",
  "questionIds": ["q_001", "q_002"],
  "randomConfig": {
    "enabled": true,
    "easyCount": 5,
    "mediumCount": 3,
    "hardCount": 2
  }
}
```

### 20.6. Sinh viên bắt đầu làm quiz

```http
POST /student/quizzes/{quizId}/attempts/start
```

**Response**

```json
{
  "attemptId": "attempt_001",
  "quizId": "quiz_001",
  "startedAt": "2026-09-15T08:00:00+07:00",
  "expireAt": "2026-09-15T08:30:00+07:00",
  "questions": [
    {
      "id": "question_001",
      "type": "SINGLE_CHOICE",
      "content": "DBMS là gì?",
      "score": 1,
      "answers": [
        { "id": "ans_001", "content": "Database Management System" },
        { "id": "ans_002", "content": "Data Backup Management" }
      ]
    }
  ]
}
```

### 20.7. Lưu câu trả lời tạm thời

```http
PUT /student/quiz-attempts/{attemptId}/answers
```

```json
{
  "answers": [
    {
      "questionId": "question_001",
      "selectedAnswerIds": ["ans_001"]
    },
    {
      "questionId": "question_002",
      "textAnswer": "Câu trả lời tự luận"
    }
  ]
}
```

### 20.8. Nộp bài quiz

```http
POST /student/quiz-attempts/{attemptId}/submit
```

### 20.9. Xem kết quả quiz của sinh viên

```http
GET /student/quizzes/{quizId}/results
```

### 20.10. Giảng viên xem danh sách lượt làm bài

```http
GET /lecturer/quizzes/{quizId}/attempts?page=1&limit=50
```

### 20.11. Chấm câu tự luận

```http
POST /lecturer/quiz-attempts/{attemptId}/manual-grade
```

```json
{
  "questionGrades": [
    {
      "questionId": "question_essay_001",
      "score": 3.5,
      "feedback": "Lập luận khá tốt"
    }
  ]
}
```

### 20.12. Xem log làm bài

```http
GET /lecturer/quiz-attempts/{attemptId}/logs
```

### 20.13. Mở lại lượt làm bài

```http
PATCH /lecturer/quiz-attempts/{attemptId}/reopen
```

```json
{
  "newExpireAt": "2026-09-15T10:00:00+07:00",
  "reason": "Sinh viên mất kết nối"
}
```

---

## 21. Question Bank APIs

### 21.1. Danh sách ngân hàng câu hỏi

```http
GET /question-banks?courseId=course_it301
```

### 21.2. Tạo ngân hàng câu hỏi

```http
POST /lecturer/question-banks
```

```json
{
  "courseId": "course_it301",
  "name": "Ngân hàng câu hỏi CSDL",
  "description": "Câu hỏi theo chương"
}
```

### 21.3. Tạo câu hỏi

```http
POST /lecturer/question-banks/{bankId}/questions
```

```json
{
  "type": "SINGLE_CHOICE",
  "content": "Khóa chính là gì?",
  "difficulty": "EASY",
  "score": 1,
  "tags": ["primary-key", "database"],
  "answers": [
    {
      "content": "Thuộc tính định danh duy nhất bản ghi",
      "isCorrect": true
    },
    {
      "content": "Thuộc tính cho phép null",
      "isCorrect": false
    }
  ],
  "explanation": "Khóa chính dùng để định danh duy nhất mỗi bản ghi."
}
```

### 21.4. Cập nhật câu hỏi

```http
PUT /lecturer/questions/{questionId}
```

### 21.5. Xóa câu hỏi

```http
DELETE /lecturer/questions/{questionId}
```

### 21.6. Import câu hỏi

```http
POST /lecturer/question-banks/{bankId}/questions/import
Content-Type: multipart/form-data
```

### 21.7. Export câu hỏi

```http
GET /lecturer/question-banks/{bankId}/questions/export?format=xlsx
```

---

## 22. Gradebook APIs — Điểm số

### 22.1. Sinh viên xem bảng điểm của mình trong lớp

```http
GET /student/course-sections/{sectionId}/grades
```

### 22.2. Giảng viên xem bảng điểm lớp

```http
GET /lecturer/course-sections/{sectionId}/gradebook
```

### 22.3. Tạo cột điểm

```http
POST /lecturer/course-sections/{sectionId}/grade-items
```

```json
{
  "name": "Điểm chuyên cần",
  "type": "ATTENDANCE",
  "maxScore": 10,
  "weightPercent": 10,
  "isPublished": false
}
```

### 22.4. Cập nhật cột điểm

```http
PUT /lecturer/grade-items/{gradeItemId}
```

### 22.5. Nhập điểm thủ công

```http
PUT /lecturer/grade-items/{gradeItemId}/scores
```

```json
{
  "scores": [
    {
      "studentId": "usr_student_001",
      "score": 8.5,
      "comment": "Tốt"
    }
  ]
}
```

### 22.6. Import điểm

```http
POST /lecturer/course-sections/{sectionId}/grades/import
Content-Type: multipart/form-data
```

### 22.7. Export bảng điểm

```http
GET /lecturer/course-sections/{sectionId}/grades/export?format=xlsx
```

### 22.8. Công bố điểm

```http
PATCH /lecturer/grade-items/{gradeItemId}/publish
```

### 22.9. Ẩn điểm

```http
PATCH /lecturer/grade-items/{gradeItemId}/unpublish
```

### 22.10. Tính điểm tổng kết

```http
POST /lecturer/course-sections/{sectionId}/grades/calculate-final
```

### 22.11. Gửi điểm cho khoa/phòng đào tạo duyệt

```http
POST /lecturer/course-sections/{sectionId}/grades/submit-for-approval
```

### 22.12. Khoa/phòng đào tạo duyệt điểm

```http
POST /academic/course-sections/{sectionId}/grades/approve
```

```json
{
  "approved": true,
  "note": "Bảng điểm hợp lệ"
}
```

### 22.13. Khóa bảng điểm

```http
PATCH /academic/course-sections/{sectionId}/grades/lock
```

### 22.14. Mở khóa bảng điểm

```http
PATCH /academic/course-sections/{sectionId}/grades/unlock
```

```json
{
  "reason": "Cần điều chỉnh điểm sau phúc khảo"
}
```

### 22.15. Lịch sử sửa điểm

```http
GET /course-sections/{sectionId}/grades/audit-logs
```

---

## 23. Grade Appeal APIs — Phúc khảo/khiếu nại điểm

### 23.1. Sinh viên tạo yêu cầu phúc khảo

```http
POST /student/grade-appeals
```

```json
{
  "sectionId": "sec_001",
  "gradeItemId": "grade_midterm",
  "reason": "Em muốn xem lại điểm bài giữa kỳ",
  "evidenceFileIds": ["file_001"]
}
```

### 23.2. Sinh viên xem danh sách phúc khảo

```http
GET /student/grade-appeals
```

### 23.3. Giảng viên xem yêu cầu phúc khảo lớp mình

```http
GET /lecturer/grade-appeals?sectionId=sec_001&status=PENDING
```

### 23.4. Giảng viên phản hồi phúc khảo

```http
POST /lecturer/grade-appeals/{appealId}/respond
```

```json
{
  "status": "APPROVED",
  "response": "Đã kiểm tra lại, điểm được điều chỉnh",
  "newScore": 8.0
}
```

### 23.5. Khoa/phòng đào tạo theo dõi phúc khảo

```http
GET /academic/grade-appeals?departmentId=dep_it&status=PENDING
```

---

## 24. Attendance APIs — Điểm danh

### 24.1. Danh sách buổi điểm danh của lớp

```http
GET /course-sections/{sectionId}/attendance-sessions
```

### 24.2. Tạo buổi điểm danh

```http
POST /lecturer/course-sections/{sectionId}/attendance-sessions
```

```json
{
  "title": "Điểm danh tuần 1",
  "sessionDate": "2026-09-01",
  "startTime": "08:00",
  "endTime": "10:30",
  "method": "QR_CODE",
  "location": "A101",
  "allowLateMinutes": 15
}
```

### 24.3. Tạo mã QR điểm danh

```http
POST /lecturer/attendance-sessions/{sessionId}/qr-code
```

```json
{
  "expiresInSeconds": 120,
  "refreshable": true
}
```

### 24.4. Sinh viên điểm danh bằng QR

```http
POST /student/attendance-sessions/{sessionId}/check-in/qr
```

```json
{
  "qrToken": "qr_token_value",
  "deviceId": "device_001",
  "latitude": 21.0278,
  "longitude": 105.8342
}
```

### 24.5. Sinh viên điểm danh bằng mã lớp

```http
POST /student/attendance-sessions/{sessionId}/check-in/code
```

```json
{
  "code": "123456"
}
```

### 24.6. Giảng viên điểm danh thủ công

```http
PUT /lecturer/attendance-sessions/{sessionId}/records
```

```json
{
  "records": [
    {
      "studentId": "usr_student_001",
      "status": "PRESENT",
      "note": "Có mặt"
    },
    {
      "studentId": "usr_student_002",
      "status": "ABSENT",
      "note": "Không phép"
    }
  ]
}
```

### 24.7. Sinh viên xem chuyên cần cá nhân

```http
GET /student/course-sections/{sectionId}/attendance
```

### 24.8. Giảng viên xem báo cáo chuyên cần lớp

```http
GET /lecturer/course-sections/{sectionId}/attendance/report
```

### 24.9. Khoa/phòng đào tạo xem báo cáo chuyên cần

```http
GET /academic/attendance/reports?departmentId=dep_it&semesterId=sem_2026_hk1
```

### 24.10. Sinh viên gửi lý do vắng

```http
POST /student/attendance-records/{recordId}/excuse
```

```json
{
  "reason": "Bị ốm",
  "evidenceFileIds": ["file_medical_001"]
}
```

### 24.11. Duyệt lý do vắng

```http
POST /lecturer/attendance-excuses/{excuseId}/review
```

```json
{
  "status": "APPROVED",
  "note": "Đã duyệt vắng có phép"
}
```

---

## 25. Online Class APIs — Lớp học trực tuyến

### 25.1. Danh sách buổi học online

```http
GET /course-sections/{sectionId}/online-sessions
```

### 25.2. Tạo buổi học online

```http
POST /lecturer/course-sections/{sectionId}/online-sessions
```

```json
{
  "title": "Buổi học online tuần 2",
  "platform": "ZOOM",
  "startTime": "2026-09-08T08:00:00+07:00",
  "endTime": "2026-09-08T10:30:00+07:00",
  "autoCreateMeeting": true,
  "description": "Học chương 2"
}
```

### 25.3. Cập nhật buổi học online

```http
PUT /lecturer/online-sessions/{onlineSessionId}
```

### 25.4. Xóa buổi học online

```http
DELETE /lecturer/online-sessions/{onlineSessionId}
```

### 25.5. Sinh viên lấy link tham gia

```http
GET /student/online-sessions/{onlineSessionId}/join-link
```

### 25.6. Upload bản ghi buổi học

```http
POST /lecturer/online-sessions/{onlineSessionId}/recordings
Content-Type: multipart/form-data
```

### 25.7. Sinh viên xem bản ghi

```http
GET /student/online-sessions/{onlineSessionId}/recordings
```

### 25.8. Đồng bộ attendance từ nền tảng online

```http
POST /integrations/online-sessions/{onlineSessionId}/sync-attendance
```

---

## 26. Forum & Discussion APIs

### 26.1. Danh sách diễn đàn lớp

```http
GET /course-sections/{sectionId}/forums
```

### 26.2. Tạo diễn đàn

```http
POST /lecturer/course-sections/{sectionId}/forums
```

```json
{
  "title": "Hỏi đáp chương 1",
  "description": "Nơi đặt câu hỏi về chương 1",
  "isPinned": true,
  "allowStudentPost": true
}
```

### 26.3. Danh sách chủ đề

```http
GET /forums/{forumId}/topics?page=1&limit=20
```

### 26.4. Tạo chủ đề

```http
POST /forums/{forumId}/topics
```

```json
{
  "title": "Câu hỏi về khóa chính",
  "content": "Em chưa hiểu khác nhau giữa primary key và unique key",
  "tags": ["database", "primary-key"]
}
```

### 26.5. Bình luận chủ đề

```http
POST /forum-topics/{topicId}/comments
```

```json
{
  "content": "Primary key không được null, unique key có thể tùy DBMS."
}
```

### 26.6. Like/đánh dấu hữu ích

```http
POST /forum-posts/{postId}/reactions
```

```json
{
  "type": "HELPFUL"
}
```

### 26.7. Ghim chủ đề

```http
PATCH /lecturer/forum-topics/{topicId}/pin
```

### 26.8. Khóa chủ đề

```http
PATCH /lecturer/forum-topics/{topicId}/lock
```

### 26.9. Báo cáo nội dung vi phạm

```http
POST /forum-posts/{postId}/report
```

```json
{
  "reason": "Nội dung không phù hợp"
}
```

### 26.10. Admin kiểm duyệt bài viết

```http
POST /admin/forum-reports/{reportId}/review
```

```json
{
  "action": "HIDE_POST",
  "note": "Nội dung vi phạm quy định"
}
```

---

## 27. Messaging APIs — Nhắn tin

### 27.1. Danh sách hội thoại

```http
GET /messages/conversations
```

### 27.2. Tạo hội thoại

```http
POST /messages/conversations
```

```json
{
  "participantIds": ["usr_student_001", "usr_lecturer_001"],
  "title": "Trao đổi bài tập 1"
}
```

### 27.3. Xem tin nhắn trong hội thoại

```http
GET /messages/conversations/{conversationId}/messages?page=1&limit=30
```

### 27.4. Gửi tin nhắn

```http
POST /messages/conversations/{conversationId}/messages
```

```json
{
  "content": "Thầy/cô cho em hỏi về deadline bài tập 1 ạ.",
  "attachmentFileIds": []
}
```

### 27.5. Đánh dấu đã đọc

```http
PATCH /messages/conversations/{conversationId}/read
```

---

## 28. Notification APIs — Thông báo

### 28.1. Danh sách thông báo của tôi

```http
GET /notifications?page=1&limit=20&status=UNREAD
```

### 28.2. Đánh dấu đã đọc

```http
PATCH /notifications/{notificationId}/read
```

### 28.3. Đánh dấu tất cả đã đọc

```http
PATCH /notifications/read-all
```

### 28.4. Gửi thông báo lớp học

```http
POST /lecturer/course-sections/{sectionId}/announcements
```

```json
{
  "title": "Nhắc nộp bài tập 1",
  "content": "Các bạn nhớ nộp bài trước 23:59 ngày 20/09.",
  "channels": ["WEB", "EMAIL"],
  "scheduleAt": null
}
```

### 28.5. Admin gửi thông báo toàn hệ thống

```http
POST /admin/announcements
```

```json
{
  "title": "Bảo trì hệ thống",
  "content": "Hệ thống bảo trì từ 22:00 đến 23:00.",
  "target": {
    "roles": ["STUDENT", "LECTURER"],
    "departmentIds": []
  },
  "channels": ["WEB", "EMAIL", "PUSH"],
  "scheduleAt": "2026-04-30T08:00:00+07:00"
}
```

### 28.6. Cấu hình nhận thông báo cá nhân

```http
PUT /notification-settings
```

```json
{
  "emailEnabled": true,
  "pushEnabled": true,
  "assignmentReminder": true,
  "gradePublished": true,
  "forumReply": true
}
```

---

## 29. Calendar APIs — Lịch học, lịch thi, deadline

### 29.1. Lịch cá nhân

```http
GET /calendar/my-events?fromDate=2026-09-01&toDate=2026-09-30
```

### 29.2. Lịch lớp học phần

```http
GET /course-sections/{sectionId}/calendar
```

### 29.3. Tạo sự kiện lớp

```http
POST /lecturer/course-sections/{sectionId}/calendar-events
```

```json
{
  "title": "Ôn tập giữa kỳ",
  "type": "CLASS_EVENT",
  "startTime": "2026-10-01T08:00:00+07:00",
  "endTime": "2026-10-01T10:00:00+07:00",
  "location": "A101",
  "description": "Ôn tập trước kiểm tra giữa kỳ"
}
```

### 29.4. Đồng bộ Google Calendar/Outlook

```http
POST /calendar/sync
```

```json
{
  "provider": "GOOGLE_CALENDAR"
}
```

---

## 30. Learning Group APIs — Nhóm học tập

### 30.1. Danh sách nhóm trong lớp

```http
GET /course-sections/{sectionId}/groups
```

### 30.2. Tạo nhóm thủ công

```http
POST /lecturer/course-sections/{sectionId}/groups
```

```json
{
  "name": "Nhóm 1",
  "memberIds": ["usr_student_001", "usr_student_002"],
  "leaderId": "usr_student_001"
}
```

### 30.3. Tạo nhóm tự động

```http
POST /lecturer/course-sections/{sectionId}/groups/auto-generate
```

```json
{
  "groupSize": 5,
  "strategy": "RANDOM"
}
```

### 30.4. Cập nhật thành viên nhóm

```http
PUT /lecturer/groups/{groupId}/members
```

### 30.5. Sinh viên xem nhóm của mình

```http
GET /student/course-sections/{sectionId}/my-group
```

### 30.6. Peer review thành viên nhóm

```http
POST /student/groups/{groupId}/peer-reviews
```

```json
{
  "reviews": [
    {
      "studentId": "usr_student_002",
      "score": 4,
      "comment": "Bạn đóng góp tốt"
    }
  ]
}
```

---

## 31. Survey & Feedback APIs

### 31.1. Danh sách khảo sát

```http
GET /surveys?target=STUDENT&status=OPEN
```

### 31.2. Tạo khảo sát

```http
POST /academic/surveys
```

```json
{
  "title": "Khảo sát đánh giá môn học",
  "description": "Đánh giá chất lượng giảng dạy",
  "anonymous": true,
  "target": {
    "sectionIds": ["sec_001"],
    "roles": ["STUDENT"]
  },
  "openAt": "2026-12-01T08:00:00+07:00",
  "closeAt": "2026-12-15T23:59:00+07:00",
  "questions": [
    {
      "type": "RATING",
      "content": "Mức độ hài lòng với môn học?",
      "required": true,
      "maxRating": 5
    },
    {
      "type": "TEXT",
      "content": "Góp ý thêm",
      "required": false
    }
  ]
}
```

### 31.3. Sinh viên gửi phản hồi khảo sát

```http
POST /surveys/{surveyId}/responses
```

```json
{
  "answers": [
    {
      "questionId": "sq_001",
      "rating": 5
    },
    {
      "questionId": "sq_002",
      "text": "Môn học hữu ích"
    }
  ]
}
```

### 31.4. Xem kết quả khảo sát

```http
GET /academic/surveys/{surveyId}/results
```

---

## 32. Advisor APIs — Cố vấn học tập

### 32.1. Danh sách sinh viên phụ trách

```http
GET /advisor/students?page=1&limit=50&riskLevel=HIGH&keyword=nguyen
```

### 32.2. Hồ sơ học tập sinh viên

```http
GET /advisor/students/{studentId}/academic-profile
```

**Response gồm:** thông tin cá nhân, lớp, ngành, môn đang học, điểm, chuyên cần, tiến độ học tập, cảnh báo, lịch sử tư vấn.

### 32.3. Tiến độ học tập sinh viên

```http
GET /advisor/students/{studentId}/learning-progress?semesterId=sem_2026_hk1
```

### 32.4. Điểm và chuyên cần của sinh viên

```http
GET /advisor/students/{studentId}/performance?semesterId=sem_2026_hk1
```

### 32.5. Danh sách cảnh báo học vụ

```http
GET /advisor/academic-alerts?status=OPEN&riskLevel=HIGH
```

### 32.6. Tạo cảnh báo học vụ thủ công

```http
POST /advisor/academic-alerts
```

```json
{
  "studentId": "usr_student_001",
  "type": "LOW_GRADE",
  "riskLevel": "HIGH",
  "reason": "Điểm giữa kỳ dưới 5 ở 3 môn",
  "recommendedAction": "Hẹn tư vấn và lập kế hoạch học tập"
}
```

### 32.7. Cập nhật trạng thái cảnh báo

```http
PATCH /advisor/academic-alerts/{alertId}/status
```

```json
{
  "status": "IN_PROGRESS",
  "note": "Đã liên hệ sinh viên"
}
```

### 32.8. Đóng cảnh báo học vụ

```http
PATCH /advisor/academic-alerts/{alertId}/close
```

```json
{
  "resolution": "Sinh viên đã cam kết cải thiện và có kế hoạch học tập mới"
}
```

### 32.9. Tạo lịch hẹn tư vấn

```http
POST /advisor/counseling-sessions
```

```json
{
  "studentId": "usr_student_001",
  "title": "Tư vấn học tập giữa kỳ",
  "scheduledAt": "2026-10-10T14:00:00+07:00",
  "location": "Phòng cố vấn A203",
  "mode": "OFFLINE",
  "note": "Trao đổi về kết quả giữa kỳ"
}
```

### 32.10. Ghi biên bản tư vấn

```http
POST /advisor/counseling-sessions/{sessionId}/notes
```

```json
{
  "summary": "Sinh viên gặp khó khăn môn CSDL và Toán rời rạc",
  "issues": ["LOW_GRADE", "LOW_ATTENDANCE"],
  "actionPlan": "Học phụ đạo 2 buổi/tuần, hoàn thành bài còn thiếu",
  "followUpAt": "2026-10-24T14:00:00+07:00"
}
```

### 32.11. Tạo kế hoạch học tập cá nhân

```http
POST /advisor/students/{studentId}/study-plans
```

```json
{
  "title": "Kế hoạch cải thiện học tập tháng 10",
  "goals": [
    "Hoàn thành 100% bài tập CSDL",
    "Đạt trên 7 điểm quiz chương 2"
  ],
  "tasks": [
    {
      "title": "Ôn normalization",
      "dueDate": "2026-10-15"
    }
  ]
}
```

### 32.12. Báo cáo cố vấn

```http
GET /advisor/reports/summary?semesterId=sem_2026_hk1
```

---

## 33. Academic Staff APIs — Khoa/Bộ môn/Phòng đào tạo

### 33.1. Dashboard đào tạo

```http
GET /academic/dashboard?departmentId=dep_it&semesterId=sem_2026_hk1
```

### 33.2. Theo dõi tiến độ lớp học phần

```http
GET /academic/course-sections/{sectionId}/progress
```

### 33.3. Theo dõi hoạt động giảng viên

```http
GET /academic/lecturers/{lecturerId}/teaching-activity?semesterId=sem_2026_hk1
```

### 33.4. Danh sách lớp rủi ro

```http
GET /academic/risk/course-sections?departmentId=dep_it&semesterId=sem_2026_hk1
```

### 33.5. Danh sách sinh viên rủi ro

```http
GET /academic/risk/students?departmentId=dep_it&semesterId=sem_2026_hk1
```

### 33.6. Phân công giảng viên

```http
POST /academic/teaching-assignments
```

```json
{
  "sectionId": "sec_001",
  "lecturerId": "usr_lecturer_001",
  "role": "PRIMARY_LECTURER"
}
```

### 33.7. Xem tải giảng viên

```http
GET /academic/lecturers/workload?departmentId=dep_it&semesterId=sem_2026_hk1
```

### 33.8. Duyệt đề cương môn học

```http
POST /academic/course-sections/{sectionId}/syllabus/review
```

```json
{
  "status": "APPROVED",
  "comment": "Đề cương đầy đủ"
}
```

### 33.9. Duyệt đề thi

```http
POST /academic/quizzes/{quizId}/review
```

```json
{
  "status": "APPROVED",
  "comment": "Đề thi phù hợp chuẩn đầu ra"
}
```

### 33.10. Báo cáo đào tạo cấp khoa

```http
GET /academic/reports/training-quality?departmentId=dep_it&semesterId=sem_2026_hk1
```

---

## 34. Learning Analytics APIs

### 34.1. Dashboard tiến độ lớp

```http
GET /analytics/course-sections/{sectionId}/overview
```

### 34.2. Sinh viên có nguy cơ trong lớp

```http
GET /analytics/course-sections/{sectionId}/risk-students
```

### 34.3. Phân tích bài tập

```http
GET /analytics/assignments/{assignmentId}
```

### 34.4. Phân tích quiz

```http
GET /analytics/quizzes/{quizId}
```

### 34.5. Phân tích câu hỏi quiz

```http
GET /analytics/quizzes/{quizId}/question-analysis
```

### 34.6. Phân tích phổ điểm lớp

```http
GET /analytics/course-sections/{sectionId}/grade-distribution
```

### 34.7. Phân tích chuyên cần

```http
GET /analytics/course-sections/{sectionId}/attendance
```

---

## 35. Report APIs

### 35.1. Báo cáo sinh viên cá nhân

```http
GET /reports/students/{studentId}/academic-summary?semesterId=sem_2026_hk1
```

### 35.2. Báo cáo lớp học phần

```http
GET /reports/course-sections/{sectionId}/summary
```

### 35.3. Báo cáo giảng viên

```http
GET /reports/lecturers/{lecturerId}/summary?semesterId=sem_2026_hk1
```

### 35.4. Báo cáo khoa

```http
GET /reports/departments/{departmentId}/summary?semesterId=sem_2026_hk1
```

### 35.5. Báo cáo toàn hệ thống

```http
GET /admin/reports/system-summary?semesterId=sem_2026_hk1
```

### 35.6. Export báo cáo

```http
POST /reports/export
```

```json
{
  "reportType": "COURSE_SECTION_SUMMARY",
  "format": "PDF",
  "filters": {
    "sectionId": "sec_001"
  }
}
```

### 35.7. Kiểm tra trạng thái file export

```http
GET /reports/export-jobs/{jobId}
```

---

## 36. File & Storage APIs

### 36.1. Upload file chung

```http
POST /files/upload
Content-Type: multipart/form-data
```

**Form data**

| Field | Type | Required |
|---|---|---|
| `file` | file | Yes |
| `module` | string | Yes |
| `visibility` | string | No |

### 36.2. Lấy thông tin file

```http
GET /files/{fileId}
```

### 36.3. Tải file

```http
GET /files/{fileId}/download
```

### 36.4. Xóa file

```http
DELETE /files/{fileId}
```

### 36.5. Admin cấu hình loại file cho phép

```http
PUT /admin/file-settings
```

```json
{
  "allowedExtensions": ["pdf", "docx", "pptx", "xlsx", "zip", "mp4"],
  "maxFileSizeMb": 200,
  "maxVideoSizeMb": 2048,
  "storageQuotaPerCourseMb": 10240
}
```

---

## 37. Audit Log APIs

### 37.1. Admin xem audit log

```http
GET /admin/audit-logs?action=GRADE_UPDATE&userId=usr_001&fromDate=2026-09-01&toDate=2026-09-30
```

### 37.2. Xem audit log của tài nguyên

```http
GET /audit-logs/resource?resourceType=GRADE&resourceId=grade_001
```

---

## 38. System Configuration APIs

### 38.1. Lấy cấu hình hệ thống

```http
GET /admin/system-settings
```

### 38.2. Cập nhật cấu hình hệ thống

```http
PUT /admin/system-settings
```

```json
{
  "schoolName": "Trường Đại học ABC",
  "timezone": "Asia/Ho_Chi_Minh",
  "defaultLanguage": "vi",
  "maintenanceMode": false,
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireNumber": true,
    "requireSpecialChar": true
  }
}
```

### 38.3. Cấu hình email SMTP

```http
PUT /admin/integrations/smtp
```

```json
{
  "host": "smtp.example.edu.vn",
  "port": 587,
  "username": "noreply@example.edu.vn",
  "password": "secret",
  "fromEmail": "noreply@example.edu.vn",
  "fromName": "LMS University"
}
```

### 38.4. Cấu hình SSO

```http
PUT /admin/integrations/sso
```

```json
{
  "provider": "GOOGLE",
  "enabled": true,
  "clientId": "google_client_id",
  "clientSecret": "google_client_secret",
  "allowedDomains": ["university.edu.vn"]
}
```

---

## 39. Integration APIs

### 39.1. Đồng bộ người dùng từ SIS

```http
POST /admin/integrations/sis/sync-users
```

```json
{
  "semesterId": "sem_2026_hk1",
  "syncMode": "INCREMENTAL"
}
```

### 39.2. Đồng bộ lớp học phần từ SIS

```http
POST /admin/integrations/sis/sync-course-sections
```

### 39.3. Đồng bộ điểm sang SIS

```http
POST /academic/integrations/sis/sync-grades
```

```json
{
  "sectionId": "sec_001"
}
```

### 39.4. Kiểm tra trạng thái job đồng bộ

```http
GET /integrations/jobs/{jobId}
```

### 39.5. Webhook nhận sự kiện lớp học online

```http
POST /webhooks/online-meeting/{provider}
```

---

## 40. Dashboard APIs theo vai trò

### 40.1. Dashboard sinh viên

```http
GET /student/dashboard
```

Trả về:

- Môn đang học.
- Deadline sắp tới.
- Quiz đang mở.
- Điểm mới.
- Cảnh báo chuyên cần.
- Thông báo mới.

### 40.2. Dashboard giảng viên

```http
GET /lecturer/dashboard
```

Trả về:

- Lớp đang dạy.
- Bài tập cần chấm.
- Quiz đang diễn ra.
- Sinh viên rủi ro.
- Lịch dạy.
- Thông báo lớp.

### 40.3. Dashboard admin

```http
GET /admin/dashboard
```

Trả về:

- Người dùng toàn hệ thống.
- Lớp/môn/học kỳ.
- Hoạt động hệ thống.
- Dung lượng.
- Cảnh báo lỗi.
- Báo cáo tổng quan.

### 40.4. Dashboard khoa/phòng đào tạo

```http
GET /academic/dashboard
```

Trả về:

- Lớp theo khoa.
- Tiến độ giảng dạy.
- Điểm/chuyên cần.
- Cảnh báo lớp/sinh viên.
- Tải giảng viên.

### 40.5. Dashboard cố vấn học tập

```http
GET /advisor/dashboard
```

Trả về:

- Sinh viên phụ trách.
- Sinh viên rủi ro.
- Lịch tư vấn.
- Cảnh báo mới.
- Báo cáo lớp cố vấn.

---

## 41. Permission Matrix tổng quan API

| Nhóm API | Student | Lecturer | Admin | Academic Staff | Advisor |
|---|---:|---:|---:|---:|---:|
| Auth/Profile | R/W cá nhân | R/W cá nhân | R/W cá nhân | R/W cá nhân | R/W cá nhân |
| User Management | No | R SV lớp mình | Full | R/W phạm vi khoa | R SV phụ trách |
| Roles/Permissions | No | No | Full | No/Hạn chế | No |
| Organization | R hạn chế | R | Full | R/W phạm vi | R |
| Academic Year/Semester | R | R | Full | R/W phạm vi | R |
| Course Catalog | R | R | Full | R/W phạm vi | R |
| Course Sections | R lớp mình | R/W lớp dạy | Full | R/W phạm vi | R |
| Enrollment | R cá nhân | R lớp dạy | Full | R/W phạm vi | R SV phụ trách |
| Content/Lessons | R | R/W lớp dạy | Full/Moderate | Review | R tiến độ |
| Assignments | Submit | R/W/Grade | Full | Monitor | Monitor |
| Quiz/Exam | Attempt | R/W/Grade | Full | Review/Monitor | Monitor |
| Gradebook | R cá nhân | R/W lớp dạy | Full | Approve/Lock | R SV phụ trách |
| Attendance | Check-in | R/W lớp dạy | Full | Monitor | Monitor |
| Online Classes | Join | R/W lớp dạy | Full | Monitor | R |
| Forum | R/W | Moderate lớp | Full Moderate | Monitor | Monitor |
| Notifications | Receive | Send lớp | Full | Send phạm vi | Send nhóm phụ trách |
| Reports | Cá nhân | Lớp dạy | Full | Phạm vi khoa | SV phụ trách |
| System Settings | No | No | Full | No | No |
| Audit Logs | No | Hạn chế | Full | Hạn chế | No |

---

## 42. API checklist theo chức năng của 5 đối tượng

### 42.1. Sinh viên

- Đăng nhập, đổi mật khẩu, quản lý hồ sơ.
- Xem học phần đã ghi danh.
- Xem bài giảng, tài liệu, video.
- Ghi chú, bookmark, đánh dấu hoàn thành bài học.
- Nộp bài tập cá nhân/nhóm.
- Làm quiz/thi online.
- Xem điểm, feedback, rubric.
- Gửi phúc khảo.
- Điểm danh QR/mã lớp/online.
- Xem lịch học, lịch thi, deadline.
- Tham gia lớp học online.
- Thảo luận forum, nhắn tin.
- Làm khảo sát, gửi phản hồi.
- Gửi ticket/yêu cầu hỗ trợ.

### 42.2. Giảng viên

- Quản lý lớp được phân công.
- Tạo chương, bài học, tài liệu, video.
- Tạo bài tập, rubric, chấm bài.
- Tạo ngân hàng câu hỏi, quiz, đề thi.
- Chấm tự luận, xử lý sự cố thi.
- Quản lý bảng điểm, công bố điểm.
- Tạo và quản lý điểm danh.
- Tạo buổi học online, upload recording.
- Quản lý forum, thông báo lớp.
- Chia nhóm sinh viên, peer review.
- Xem báo cáo lớp, tiến độ, rủi ro.

### 42.3. Admin

- Quản lý người dùng, role, permission.
- Quản lý cơ cấu trường: khoa, bộ môn, ngành, lớp.
- Quản lý học kỳ, năm học.
- Quản lý môn học, lớp học phần, ghi danh.
- Kiểm duyệt nội dung, forum.
- Quản lý cấu hình hệ thống, file, email, SSO.
- Quản lý backup, audit log, bảo mật.
- Xem báo cáo toàn hệ thống.
- Quản lý tích hợp SIS, Zoom/Meet/Teams, Turnitin.

### 42.4. Khoa/Bộ môn/Phòng đào tạo

- Quản lý chương trình đào tạo.
- Quản lý môn học theo khoa/bộ môn.
- Tạo/mở/đóng lớp học phần.
- Phân công giảng viên/trợ giảng.
- Theo dõi tiến độ lớp, hoạt động giảng viên.
- Duyệt đề cương, đề thi, điểm.
- Theo dõi điểm, chuyên cần, sinh viên rủi ro.
- Quản lý khảo sát đánh giá chất lượng.
- Xuất báo cáo đào tạo.

### 42.5. Cố vấn học tập

- Xem danh sách sinh viên phụ trách.
- Xem hồ sơ học tập, điểm, chuyên cần, tiến độ.
- Theo dõi cảnh báo học vụ.
- Tạo/cập nhật/đóng cảnh báo.
- Tạo lịch hẹn tư vấn.
- Ghi biên bản tư vấn.
- Tạo kế hoạch học tập cá nhân.
- Gửi thông báo/nhắn tin cho sinh viên.
- Theo dõi đăng ký học phần, nợ môn, quá tải tín chỉ.
- Xuất báo cáo cố vấn.

---

## 43. Gợi ý cấu trúc Swagger/OpenAPI

Nên tách tags như sau:

```yaml
tags:
  - Auth
  - Profile
  - Admin Users
  - Roles Permissions
  - Organization
  - Academic Year Semester
  - Course Catalog
  - Curriculum
  - Course Sections
  - Enrollments
  - Course Content
  - Assignments
  - Rubrics
  - Quizzes Exams
  - Question Banks
  - Gradebook
  - Grade Appeals
  - Attendance
  - Online Classes
  - Forums
  - Messaging
  - Notifications
  - Calendar
  - Groups
  - Surveys
  - Advisor
  - Academic Staff
  - Analytics
  - Reports
  - Files
  - Audit Logs
  - System Settings
  - Integrations
```

---

## 44. Nguyên tắc bảo mật API

1. Tất cả API trừ login/forgot-password/reset-password phải yêu cầu JWT.
2. Backend phải kiểm tra quyền bằng RBAC và phạm vi dữ liệu.
3. Sinh viên chỉ được truy cập dữ liệu của chính mình hoặc lớp đã ghi danh.
4. Giảng viên chỉ được sửa lớp được phân công.
5. Academic Staff chỉ được quản lý dữ liệu trong phạm vi khoa/bộ môn/phòng được cấp.
6. Advisor chỉ được xem sinh viên phụ trách.
7. Admin có toàn quyền nhưng mọi thao tác quan trọng phải ghi audit log.
8. File upload phải kiểm tra MIME type, extension, dung lượng và virus scan nếu có.
9. Điểm đã khóa không được sửa nếu không có quyền mở khóa.
10. Các API nhạy cảm cần rate limit và audit log.

---

## 45. Gợi ý rate limit

| Nhóm API | Giới hạn đề xuất |
|---|---:|
| Login | 5 lần/phút/IP |
| Forgot password | 3 lần/giờ/email |
| Upload file | 30 request/phút/user |
| Quiz answer autosave | 120 request/phút/user |
| Notification read | 300 request/phút/user |
| Report export | 10 job/giờ/user |
| Admin bulk import | 5 job/giờ/admin |

---

## 46. Gợi ý event nội bộ

Hệ thống nên phát event để xử lý bất đồng bộ:

| Event | Khi phát sinh | Consumer |
|---|---|---|
| `UserCreated` | Tạo user | Email welcome |
| `EnrollmentCreated` | Ghi danh | Notification |
| `LessonCompleted` | Hoàn thành bài học | Analytics |
| `AssignmentSubmitted` | Sinh viên nộp bài | Lecturer notification |
| `AssignmentGraded` | Chấm bài | Student notification |
| `QuizSubmitted` | Nộp quiz | Auto grading |
| `GradePublished` | Công bố điểm | Notification |
| `AttendanceCheckedIn` | Điểm danh | Attendance analytics |
| `AcademicAlertCreated` | Cảnh báo học vụ | Advisor notification |
| `ReportExportRequested` | Xuất báo cáo | Queue worker |

---

## 47. Kết luận

File API_SPEC.md này bao phủ đầy đủ các nhóm API chính cho hệ thống LMS đại học 5 đối tượng:

- Sinh viên.
- Giảng viên.
- Quản trị viên hệ thống.
- Khoa/Bộ môn/Phòng đào tạo.
- Cố vấn học tập.

Khi triển khai thực tế, nên chuyển tài liệu này thành:

1. Swagger/OpenAPI YAML hoặc JSON.
2. Postman Collection.
3. API contract giữa Frontend và Backend.
4. Test cases API cho QA.
5. RBAC permission seed trong database.

---

*Tài liệu API này là contract giữa Frontend và Backend. Mọi thay đổi breaking (thêm required field, đổi response format) phải update tài liệu và thông báo toàn team.*
