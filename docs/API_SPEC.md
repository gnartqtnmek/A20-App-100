# API Specification
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 2.0 | **Ngày:** 2026-04-27

> Dev Frontend và Backend đọc tài liệu này để biết chính xác từng endpoint: method, URL, auth, params, request body, response body, error codes. Mọi thứ phải rõ ràng không cần đoán.

---

## 1. Chuẩn Chung (Global Standards)

### 1.1 Base URLs

| Môi trường | LMS API | Agent API |
|-----------|---------|---------|
| Local Dev | `http://localhost:8000/api/v1` | `http://localhost:8001/api/v1` |
| Staging | `https://api.staging.lms-team100.app/api/v1` | `https://agent-api.staging.lms-team100.app/api/v1` |
| Production | `https://api.lms-team100.app/api/v1` | `https://agent-api.lms-team100.app/api/v1` |

### 1.2 Authentication

Tất cả endpoint (trừ auth) yêu cầu JWT Bearer token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token hết hạn → `401 TOKEN_EXPIRED` → Frontend tự gọi `POST /auth/refresh` → Retry.

### 1.3 Request Headers Chuẩn

```http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid-v4>  (optional, FE gán để trace)
Accept-Language: vi       (optional)
```

### 1.4 Pagination (Request)

Tất cả danh sách endpoint hỗ trợ:

| Param | Type | Default | Max | Mô tả |
|-------|------|---------|-----|-------|
| `page` | integer | 1 | — | Trang hiện tại |
| `limit` | integer | 20 | 100 | Số items/trang |
| `sort_by` | string | — | — | Field để sort (vd: created_at, title) |
| `sort_order` | string | desc | — | `asc` hoặc `desc` |

### 1.5 Pagination (Response Envelope)

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8,
  "has_next": true,
  "has_prev": false
}
```

### 1.6 Error Response Format

Tất cả lỗi trả về format chuẩn:
```json
{
  "detail": "Mô tả lỗi bằng tiếng Việt cho user",
  "error_code": "SNAKE_CASE_CODE",
  "field_errors": {
    "email": ["Email không hợp lệ"],
    "password": ["Mật khẩu quá ngắn"]
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```
- `field_errors`: chỉ có khi `error_code = VALIDATION_ERROR` (422)
- `request_id`: luôn có, dùng để trace logs

### 1.7 HTTP Status Codes

| Code | Ý nghĩa | Khi nào |
|------|---------|---------|
| 200 | OK | GET thành công, PATCH thành công |
| 201 | Created | POST tạo resource thành công |
| 204 | No Content | DELETE thành công |
| 400 | Bad Request | Logic lỗi (deadline passed, đã enroll, ...) |
| 401 | Unauthorized | Token không hợp lệ hoặc hết hạn |
| 403 | Forbidden | Đã auth nhưng không có quyền |
| 404 | Not Found | Resource không tồn tại |
| 409 | Conflict | Duplicate (email, course_code, ...) |
| 422 | Unprocessable Entity | Validation lỗi (Pydantic) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Lỗi server không xử lý được |
| 502 | Bad Gateway | External service (AI API) lỗi |

### 1.8 Rate Limits

| Nhóm | Limit | Redis Key |
|------|-------|----------|
| Auth endpoints | 10 req/min/IP | `rl:auth:{ip}` |
| General API | 60 req/min/user | `rl:api:{user_id}` |
| File upload | 5 req/min/user | `rl:upload:{user_id}` |
| AI Chat | 10 req/min/user | `rl:ai:{user_id}` |

Rate limit headers trong response:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1704067200
Retry-After: 30  (chỉ khi 429)
```

### 1.9 Datetime Format

- Tất cả datetime: **ISO 8601 UTC** — `"2024-03-15T08:30:00Z"`
- Date only: `"2024-03-15"`
- Frontend hiển thị theo timezone `Asia/Ho_Chi_Minh` (UTC+7)

### 1.10 UUID Format

Tất cả IDs: UUID v4 — `"550e8400-e29b-41d4-a716-446655440000"`

---

## 2. Authentication API

### POST `/auth/register`

Đăng ký tài khoản mới.

**Auth:** Không cần | **Rate limit:** Auth limit

**Request Body:**
```json
{
  "email": "nguyen.van.a@university.edu.vn",
  "password": "SecurePass123!",
  "full_name": "Nguyễn Văn A",
  "role": "student",
  "student_id": "20210001"
}
```

| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| `email` | string | ✅ | valid email, max 255, normalized lowercase |
| `password` | string | ✅ | min 8, 1 uppercase, 1 lowercase, 1 digit |
| `full_name` | string | ✅ | min 2, max 255 |
| `role` | string | ✅ | enum: `student`, `instructor` |
| `student_id` | string | nếu role=student | max 20, alphanumeric |

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyen.van.a@university.edu.vn",
  "full_name": "Nguyễn Văn A",
  "role": "student",
  "student_id": "20210001",
  "created_at": "2024-01-15T08:00:00Z"
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 409 | `EMAIL_EXISTS` | Email đã tồn tại trong DB |
| 409 | `STUDENT_ID_EXISTS` | student_id đã tồn tại |
| 422 | `VALIDATION_ERROR` | Bất kỳ field nào không pass validation |

---

### POST `/auth/login`

Đăng nhập.

**Auth:** Không cần | **Rate limit:** Auth limit

**Request Body:**
```json
{
  "email": "nguyen.van.a@university.edu.vn",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6Im5ndXllbi52YW4uYUB1bml2ZXJzaXR5LmVkdS52biIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNjgxMDAsImp0aSI6InVuaXF1ZS1qd3QtaWQifQ.signature",
  "refresh_token": "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "nguyen.van.a@university.edu.vn",
    "full_name": "Nguyễn Văn A",
    "role": "student",
    "student_id": "20210001",
    "avatar_url": null
  }
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 401 | `INVALID_CREDENTIALS` | Email hoặc password sai |
| 403 | `ACCOUNT_SUSPENDED` | is_active = false |

---

### POST `/auth/refresh`

Làm mới access token.

**Auth:** Không cần (dùng refresh_token)

**Request Body:**
```json
{
  "refresh_token": "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_in": 900
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 401 | `REFRESH_INVALID` | Token không tìm thấy trong DB |
| 401 | `REFRESH_EXPIRED` | Token đã hết hạn |
| 401 | `REFRESH_REVOKED` | Token đã bị revoke |

---

### POST `/auth/logout`

Đăng xuất (revoke refresh token).

**Auth:** Required

**Request Body:**
```json
{
  "refresh_token": "a3f2b1c4..."
}
```

**Response 200:**
```json
{"message": "Đăng xuất thành công"}
```

---

### POST `/auth/forgot-password`

Yêu cầu reset mật khẩu.

**Auth:** Không cần | **Rate limit:** Auth limit

**Request Body:**
```json
{"email": "nguyen.van.a@university.edu.vn"}
```

**Response 200 (luôn trả về 200 dù email có tồn tại hay không — bảo mật):**
```json
{
  "message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
}
```

---

### POST `/auth/reset-password`

Đặt lại mật khẩu với token từ email.

**Auth:** Không cần

**Request Body:**
```json
{
  "token": "hex-token-from-email",
  "new_password": "NewSecurePass456!",
  "confirm_password": "NewSecurePass456!"
}
```

**Response 200:**
```json
{"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `RESET_TOKEN_EXPIRED` | Token quá 1 giờ |
| 400 | `RESET_TOKEN_USED` | Token đã dùng rồi |
| 400 | `RESET_TOKEN_INVALID` | Token không tồn tại |
| 422 | `VALIDATION_ERROR` | Password không đủ mạnh hoặc không khớp |

---

### POST `/auth/change-password`

Đổi mật khẩu (đang đăng nhập).

**Auth:** Required

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!",
  "confirm_password": "NewPass456!"
}
```

**Response 200:**
```json
{"message": "Đổi mật khẩu thành công. Các phiên đăng nhập khác đã bị đăng xuất."}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `WRONG_PASSWORD` | current_password sai |
| 422 | `VALIDATION_ERROR` | new_password không đủ mạnh hoặc không khớp |

---

## 3. Users API

### GET `/users/me`

Xem profile của mình.

**Auth:** Required (any role)

**Response 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyen.van.a@university.edu.vn",
  "full_name": "Nguyễn Văn A",
  "role": "student",
  "student_id": "20210001",
  "avatar_url": "https://example.com/avatars/user.jpg",
  "is_active": true,
  "email_subscribed": true,
  "created_at": "2024-01-15T08:00:00Z",
  "updated_at": "2024-01-15T08:00:00Z"
}
```

---

### PATCH `/users/me`

Cập nhật profile. Chỉ các field được gửi mới được update.

**Auth:** Required (any role)

**Request Body (tất cả optional):**
```json
{
  "full_name": "Nguyễn Văn An",
  "email_subscribed": false
}
```

**Response 200:** User object đầy đủ

**Lưu ý:** Không cho đổi email, role, student_id qua endpoint này.

---

### PATCH `/users/me/avatar`

Upload ảnh đại diện.

**Auth:** Required | **Content-Type:** `multipart/form-data`

**Request:** `file` — image file (JPEG/PNG/WebP, max 5MB)

**Response 200:**
```json
{
  "avatar_url": "https://example.com/uploads/avatars/user-uuid.jpg"
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `INVALID_IMAGE_TYPE` | File không phải ảnh |
| 400 | `FILE_TOO_LARGE` | > 5MB |

---

### GET `/users` *(Admin only)*

Danh sách tất cả users.

**Auth:** Required (admin only)

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `page` | int | Trang (default: 1) |
| `limit` | int | Số items (default: 20, max: 100) |
| `role` | string | Filter: student / instructor / admin |
| `is_active` | boolean | Filter trạng thái |
| `search` | string | Tìm theo full_name, email, student_id |
| `sort_by` | string | created_at / full_name / email |
| `sort_order` | string | asc / desc (default: desc) |

**Response 200:** Paginated list of User objects

---

### GET `/users/{userId}` *(Admin only)*

Xem chi tiết 1 user.

**Auth:** Required (admin only)

**Response 200:** User object đầy đủ

**Error:** `404 USER_NOT_FOUND`

---

### PATCH `/users/{userId}` *(Admin only)*

Admin cập nhật user (khóa, đổi role).

**Auth:** Required (admin only)

**Request Body (tất cả optional):**
```json
{
  "is_active": false,
  "role": "instructor",
  "email_subscribed": true
}
```

**Behavior khi `is_active: false`:** Tự động revoke tất cả refresh_tokens của user đó.

**Response 200:** User object

---

## 4. Courses API

### POST `/courses`

Tạo khóa học mới.

**Auth:** Required (instructor, admin)

**Request Body:**
```json
{
  "title": "Cấu trúc Dữ liệu và Giải thuật",
  "description": "## Mô tả\nKhóa học này bao gồm...",
  "course_code": "CS201",
  "start_date": "2024-02-01",
  "end_date": "2024-06-30",
  "max_students": 60,
  "is_open": true
}
```

| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| `title` | string | ✅ | min 3, max 255 |
| `description` | string | ❌ | max 5000, Markdown |
| `course_code` | string | ✅ | min 2, max 20, alphanumeric+dash, unique |
| `start_date` | date | ❌ | YYYY-MM-DD |
| `end_date` | date | ❌ | YYYY-MM-DD, after start_date |
| `max_students` | integer | ❌ | ≥ 1, null = unlimited |
| `is_open` | boolean | ❌ | default: false |

**Response 201:**
```json
{
  "id": "course-uuid",
  "title": "Cấu trúc Dữ liệu và Giải thuật",
  "description": "## Mô tả...",
  "course_code": "CS201",
  "instructor": {
    "id": "instructor-uuid",
    "full_name": "Trần Thị B",
    "avatar_url": null
  },
  "start_date": "2024-02-01",
  "end_date": "2024-06-30",
  "max_students": 60,
  "enrolled_count": 0,
  "is_open": true,
  "is_archived": false,
  "created_at": "2024-01-15T08:00:00Z",
  "updated_at": "2024-01-15T08:00:00Z"
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 409 | `COURSE_CODE_EXISTS` | course_code trùng |
| 400 | `INVALID_DATE_RANGE` | end_date trước start_date |

---

### GET `/courses`

Danh sách khóa học.

**Auth:** Required | **Rate limit:** General

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `page, limit` | int | Pagination |
| `search` | string | Tìm theo title, course_code |
| `is_open` | boolean | Lọc theo is_open |
| `enrolled` | boolean | `true` = chỉ courses đã enroll (SV only) |
| `teaching` | boolean | `true` = chỉ courses đang dạy (GV only) |

**Response 200:** Paginated list với mỗi item:
```json
{
  "id": "course-uuid",
  "title": "Cấu trúc Dữ liệu",
  "course_code": "CS201",
  "instructor": {"id": "...", "full_name": "Trần Thị B"},
  "enrolled_count": 45,
  "max_students": 60,
  "is_open": true,
  "is_enrolled": true,
  "my_progress": {
    "submitted": 3,
    "total_assignments": 7,
    "percentage": 43
  }
}
```
- `is_enrolled`: true/false (từ góc nhìn user đang request)
- `my_progress`: chỉ có với SV đã enroll

---

### GET `/courses/{courseId}`

Chi tiết 1 khóa học.

**Auth:** Required

**Response 200:**
```json
{
  "id": "course-uuid",
  "title": "Cấu trúc Dữ liệu và Giải thuật",
  "description": "## Mô tả...",
  "course_code": "CS201",
  "instructor": {
    "id": "instructor-uuid",
    "full_name": "Trần Thị B",
    "avatar_url": "https://..."
  },
  "start_date": "2024-02-01",
  "end_date": "2024-06-30",
  "max_students": 60,
  "enrolled_count": 45,
  "is_open": true,
  "is_archived": false,
  "is_enrolled": true,
  "enrollment_status": "active",
  "documents_count": 8,
  "assignments_count": 7,
  "created_at": "2024-01-15T08:00:00Z"
}
```

**Error:** `404 COURSE_NOT_FOUND`

**Permission:** SV chỉ xem được course đã enroll hoặc course is_open=true.

---

### PATCH `/courses/{courseId}`

Cập nhật khóa học.

**Auth:** Required (owner instructor, admin)

**Request Body (tất cả optional):**
```json
{
  "title": "Tên mới",
  "description": "Mô tả mới",
  "is_open": false,
  "max_students": 80
}
```

**Không cho sửa:** `course_code`, `instructor_id`

**Response 200:** Course object đầy đủ

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 403 | `NOT_COURSE_INSTRUCTOR` | User không phải instructor của course |
| 404 | `COURSE_NOT_FOUND` | |

---

### DELETE `/courses/{courseId}`

Archive (soft delete) khóa học.

**Auth:** Required (owner instructor, admin)

**Response 200:**
```json
{"message": "Đã lưu trữ khóa học thành công"}
```

---

### POST `/courses/{courseId}/enroll`

Sinh viên đăng ký khóa học.

**Auth:** Required (student only)

**Request Body:** Không cần (user_id lấy từ JWT)

**Response 201:**
```json
{
  "enrollment_id": "enroll-uuid",
  "course_id": "course-uuid",
  "status": "active",
  "enrolled_at": "2024-01-20T08:00:00Z"
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `COURSE_NOT_OPEN` | is_open = false |
| 400 | `COURSE_FULL` | enrolled_count >= max_students |
| 409 | `ALREADY_ENROLLED` | Đã có enrollment với status=active |
| 403 | `PERMISSION_DENIED` | Không phải student |

---

### DELETE `/courses/{courseId}/enroll`

Sinh viên rời khỏi khóa học (drop).

**Auth:** Required (student only)

**Response 200:**
```json
{"message": "Đã rời khỏi khóa học"}
```

---

### GET `/courses/{courseId}/students`

Danh sách sinh viên trong khóa học.

**Auth:** Required (instructor của course, admin)

**Query params:** `?status=active&page=1&limit=50&search=nguyen`

**Response 200:** Paginated list:
```json
{
  "items": [
    {
      "id": "user-uuid",
      "full_name": "Nguyễn Văn A",
      "student_id": "20210001",
      "email": "nguyen@...",
      "avatar_url": null,
      "enrolled_at": "2024-01-20T08:00:00Z",
      "status": "active",
      "submissions_count": 3,
      "graded_count": 2,
      "last_active_at": "2024-03-01T15:00:00Z"
    }
  ],
  "total": 45
}
```

---

### DELETE `/courses/{courseId}/students/{studentId}`

GV kick sinh viên khỏi khóa học.

**Auth:** Required (instructor của course, admin)

**Response 200:**
```json
{"message": "Đã xóa sinh viên khỏi khóa học"}
```

---

### POST `/courses/{courseId}/documents`

Upload tài liệu vào khóa học.

**Auth:** Required (instructor của course, admin)

**Content-Type:** `multipart/form-data`

**Request:** `file` — PDF/DOCX/PPTX/TXT/ZIP, max 100MB

**Response 201:**
```json
{
  "id": "doc-uuid",
  "filename": "Slide_Chuong3.pdf",
  "file_type": "pdf",
  "file_size_bytes": 2048576,
  "is_indexed": false,
  "index_status": "pending",
  "uploaded_at": "2024-03-01T08:00:00Z"
}
```

**Lưu ý:** Sau khi upload, background task tự động index. FE polling `GET /courses/{id}/documents` để biết khi nào `is_indexed = true`.

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `INVALID_FILE_TYPE` | File không phải loại cho phép |
| 400 | `FILE_TOO_LARGE` | > 100MB |

---

### GET `/courses/{courseId}/documents`

Danh sách tài liệu của khóa học.

**Auth:** Required (enrolled student, instructor, admin)

**Response 200:**
```json
{
  "items": [
    {
      "id": "doc-uuid",
      "filename": "Slide_Chuong3.pdf",
      "file_type": "pdf",
      "file_size_bytes": 2048576,
      "is_indexed": true,
      "index_status": "indexed",
      "uploaded_at": "2024-03-01T08:00:00Z",
      "uploaded_by": {
        "full_name": "Trần Thị B"
      }
    }
  ]
}
```

---

### DELETE `/courses/{courseId}/documents/{docId}`

Xóa tài liệu.

**Auth:** Required (instructor của course, admin)

**Response 204:** No content

**Side effect:** Xóa tất cả document_chunks liên quan (cascade).

---

### POST `/courses/{courseId}/announcements`

GV đăng thông báo.

**Auth:** Required (instructor của course, admin)

**Request Body:**
```json
{
  "title": "Thông báo lịch thi giữa kỳ",
  "content": "## Chi tiết\n\nThi vào ngày 15/03...",
  "is_pinned": false
}
```

**Response 201:** Announcement object

**Side effect:** Gửi in-app notification cho tất cả SV enrolled.

---

### GET `/courses/{courseId}/announcements`

Danh sách thông báo.

**Auth:** Required (enrolled student, instructor, admin)

**Response 200:** Pinned announcements trước, sau đó sort theo created_at DESC

---

## 5. Assignments API

### POST `/courses/{courseId}/assignments`

GV tạo bài tập.

**Auth:** Required (instructor của course, admin)

**Request Body:**
```json
{
  "title": "Bài tập 2: Implement Binary Tree",
  "description": "## Yêu cầu\n\nImplement BST với:\n- insert()\n- search()\n- delete()\n\n## Nộp bài\nFile .py hoặc .zip",
  "deadline": "2024-03-15T23:59:59Z",
  "max_score": 100,
  "allow_late_submission": false,
  "submission_type": "file",
  "is_published": true
}
```

| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| `title` | string | ✅ | min 3, max 255 |
| `description` | string | ❌ | max 10000 |
| `deadline` | datetime | ✅ | phải > NOW() |
| `max_score` | integer | ✅ | 1-1000 |
| `allow_late_submission` | boolean | ❌ | default: false |
| `submission_type` | string | ❌ | text/file/both, default: both |
| `is_published` | boolean | ❌ | default: false |

**Response 201:**
```json
{
  "id": "assign-uuid",
  "course_id": "course-uuid",
  "title": "Bài tập 2: Implement Binary Tree",
  "description": "## Yêu cầu...",
  "deadline": "2024-03-15T23:59:59Z",
  "max_score": 100,
  "allow_late_submission": false,
  "submission_type": "file",
  "is_published": true,
  "submissions_count": 0,
  "graded_count": 0,
  "created_at": "2024-01-15T08:00:00Z"
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `FUTURE_DEADLINE_REQUIRED` | deadline ≤ NOW() |
| 403 | `NOT_COURSE_INSTRUCTOR` | |

---

### GET `/courses/{courseId}/assignments`

Danh sách bài tập của khóa học.

**Auth:** Required (enrolled student, instructor, admin)

**Query params:** `?page=1&limit=20&status=not_submitted` (status filter chỉ cho SV)

**Response 200 (từ góc nhìn SV):**
```json
{
  "items": [
    {
      "id": "assign-uuid",
      "title": "Bài tập 1: Linked List",
      "deadline": "2024-03-01T23:59:59Z",
      "max_score": 100,
      "allow_late_submission": false,
      "submission_type": "file",
      "my_submission": {
        "id": "sub-uuid",
        "submitted_at": "2024-02-28T15:30:00Z",
        "is_late": false,
        "attempt_number": 1,
        "file_name": "linked_list.py"
      },
      "my_grade": {
        "score": 85,
        "max_score": 100,
        "feedback": "Code tốt!",
        "graded_at": "2024-03-05T10:00:00Z"
      },
      "status": "graded",
      "effective_deadline": "2024-03-01T23:59:59Z"
    }
  ]
}
```

**Response 200 (từ góc nhìn GV — thêm trường):**
```json
{
  "items": [
    {
      "id": "assign-uuid",
      "title": "...",
      "deadline": "...",
      "submissions_count": 38,
      "graded_count": 25,
      "not_submitted_count": 7,
      "average_score": 78.5,
      "is_published": true
    }
  ]
}
```

---

### GET `/assignments/{assignmentId}`

Chi tiết 1 bài tập.

**Auth:** Required

**Response 200:** Full assignment object với my_submission và my_grade (nếu là SV)

**Error:** `404 ASSIGNMENT_NOT_FOUND`

---

### PATCH `/assignments/{assignmentId}`

Cập nhật bài tập.

**Auth:** Required (instructor, admin)

**Request Body (tất cả optional):**
```json
{
  "title": "Bài tập mới",
  "deadline": "2024-04-01T23:59:59Z",
  "allow_late_submission": true
}
```

**Lưu ý:** deadline mới phải > NOW(). Không cho sửa max_score nếu đã có grade.

**Response 200:** Assignment object

---

### DELETE `/assignments/{assignmentId}`

Xóa bài tập (soft delete — is_deleted=true).

**Auth:** Required (instructor, admin)

**Response 200:**
```json
{"message": "Đã xóa bài tập"}
```

---

### POST `/assignments/{assignmentId}/publish`

Publish/unpublish bài tập.

**Auth:** Required (instructor, admin)

**Request Body:**
```json
{"is_published": true}
```

**Side effect khi `is_published: true`:** Gửi notification cho tất cả SV enrolled.

**Response 200:** `{"is_published": true, "message": "Đã đăng bài tập"}`

---

### POST `/assignments/{assignmentId}/submit`

Sinh viên nộp bài.

**Auth:** Required (student only) | **Content-Type:** `multipart/form-data` hoặc `application/json`

**Request (JSON — text submission):**
```json
{"content": "Đây là câu trả lời của tôi..."}
```

**Request (multipart — file submission):**
- `file`: file binary
- `content`: (optional) text kèm theo

**Response 201:**
```json
{
  "id": "sub-uuid",
  "assignment_id": "assign-uuid",
  "submitted_at": "2024-02-28T15:30:22Z",
  "is_late": false,
  "attempt_number": 1,
  "file_name": "binary_tree.py",
  "file_size_bytes": 4096
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `DEADLINE_PASSED` | Quá deadline và allow_late=false |
| 400 | `ALREADY_GRADED` | Bài đã được chấm, không cho nộp lại |
| 400 | `FILE_TOO_LARGE` | > 50MB |
| 400 | `INVALID_FILE_TYPE` | Magic bytes không hợp lệ |
| 403 | `NOT_ENROLLED` | Chưa enroll hoặc status≠active |

---

### GET `/assignments/{assignmentId}/submissions`

Danh sách bài nộp (GV xem).

**Auth:** Required (instructor của course, admin)

**Query params:** `?page=1&limit=30&status=not_submitted&search=nguyen`

**status values:** `all | submitted | not_submitted | graded | late`

**Response 200:**
```json
{
  "items": [
    {
      "id": "sub-uuid",
      "student": {
        "id": "user-uuid",
        "full_name": "Nguyễn Văn A",
        "student_id": "20210001",
        "avatar_url": null
      },
      "submitted_at": "2024-02-28T15:30:22Z",
      "is_late": false,
      "attempt_number": 1,
      "file_name": "binary_tree.py",
      "file_size_bytes": 4096,
      "content_preview": null,
      "grade": {
        "score": 85,
        "max_score": 100,
        "graded_at": "2024-03-05T10:00:00Z"
      },
      "status": "graded"
    }
  ],
  "total": 45,
  "submitted": 38,
  "graded": 25,
  "not_submitted": 7,
  "late": 3,
  "average_score": 78.5
}
```

---

### GET `/assignments/{assignmentId}/my-submission`

SV xem bài nộp của mình.

**Auth:** Required (student only)

**Response 200:** Submission object + grade nếu đã chấm. `null` nếu chưa nộp.

---

### GET `/submissions/{submissionId}`

Chi tiết 1 bài nộp.

**Auth:** Required (student=own, instructor=in own course, admin=any)

**Response 200:**
```json
{
  "id": "sub-uuid",
  "assignment": {
    "id": "assign-uuid",
    "title": "Bài tập 2",
    "max_score": 100
  },
  "student": {
    "id": "user-uuid",
    "full_name": "Nguyễn Văn A"
  },
  "content": null,
  "file_name": "binary_tree.py",
  "file_size_bytes": 4096,
  "download_url": "/api/v1/submissions/sub-uuid/download",
  "submitted_at": "2024-02-28T15:30:22Z",
  "is_late": false,
  "attempt_number": 1,
  "grade": {
    "score": 85,
    "max_score": 100,
    "feedback": "Code tốt, cần cải thiện edge cases",
    "graded_by": {"full_name": "Trần Thị B"},
    "graded_at": "2024-03-05T10:00:00Z"
  }
}
```

---

### GET `/submissions/{submissionId}/download`

Download file submission.

**Auth:** Required (student=own, instructor=in own course, admin)

**Response:** Binary file với headers:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="binary_tree.py"
```

**Lưu ý:** URL có thể là signed URL (valid 5 phút) để security.

---

### POST `/submissions/{submissionId}/grade`

GV chấm điểm lần đầu.

**Auth:** Required (instructor của course, admin)

**Request Body:**
```json
{
  "score": 85,
  "feedback": "Code tốt! Logic xử lý edge case cần được cải thiện, đặc biệt khi tree rỗng. Complexity analysis đúng."
}
```

| Field | Type | Required | Validation |
|-------|------|---------|-----------|
| `score` | number | ✅ | 0 ≤ score ≤ max_score |
| `feedback` | string | ❌ | max 2000 chars |

**Response 201:**
```json
{
  "id": "grade-uuid",
  "submission_id": "sub-uuid",
  "student_id": "user-uuid",
  "score": 85,
  "max_score": 100,
  "percentage": 85.0,
  "feedback": "Code tốt!...",
  "graded_by": {
    "id": "instructor-uuid",
    "full_name": "Trần Thị B"
  },
  "graded_at": "2024-03-05T10:00:00Z"
}
```

**Side effect:** Tạo in-app notification + gửi email cho SV.

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 400 | `SCORE_EXCEEDS_MAX` | score > max_score |
| 409 | `ALREADY_GRADED` | Đã có grade, dùng PATCH để update |
| 403 | `NOT_COURSE_INSTRUCTOR` | |

---

### PATCH `/submissions/{submissionId}/grade`

GV cập nhật điểm đã chấm.

**Auth:** Required (instructor, admin)

**Request Body:** Giống POST

**Response 200:** Grade object

---

## 6. Grades API

### GET `/grades/my`

SV xem tất cả điểm của mình.

**Auth:** Required (student only)

**Response 200:**
```json
{
  "courses": [
    {
      "course": {
        "id": "course-uuid",
        "title": "Cấu trúc Dữ liệu",
        "course_code": "CS201"
      },
      "grades": [
        {
          "assignment_id": "assign-uuid",
          "assignment_title": "Bài tập 1: Linked List",
          "grade_type": "assignment",
          "score": 85,
          "max_score": 100,
          "percentage": 85.0,
          "feedback": "Code tốt!",
          "graded_at": "2024-03-05T10:00:00Z"
        },
        {
          "assignment_title": "Giữa kỳ",
          "grade_type": "midterm",
          "score": 7.5,
          "max_score": 10,
          "percentage": 75.0,
          "graded_at": "2024-04-01T10:00:00Z"
        }
      ],
      "course_gpa": 8.0,
      "assignments_submitted": 5,
      "assignments_total": 7
    }
  ],
  "overall_gpa": 7.8
}
```

---

### GET `/grades/my/summary`

GPA summary ngắn gọn.

**Auth:** Required (student only)

**Response 200:**
```json
{
  "overall_gpa": 7.8,
  "courses_count": 3,
  "total_assignments": 15,
  "submitted": 12,
  "graded": 10,
  "submission_rate": 80.0
}
```

---

### GET `/courses/{courseId}/grades`

GV xem điểm toàn bộ SV trong course.

**Auth:** Required (instructor của course, admin)

**Query params:** `?page=1&limit=50`

**Response 200:**
```json
{
  "assignments": [
    {"id": "assign-1-uuid", "title": "Bài tập 1", "max_score": 100},
    {"id": "assign-2-uuid", "title": "Giữa kỳ", "max_score": 10}
  ],
  "students": [
    {
      "student": {"id": "user-uuid", "full_name": "Nguyễn Văn A", "student_id": "20210001"},
      "grades": {
        "assign-1-uuid": {"score": 85, "graded_at": "..."},
        "assign-2-uuid": {"score": 7.5, "graded_at": "..."}
      },
      "gpa": 8.0
    }
  ],
  "class_average": 7.5
}
```

---

### POST `/courses/{courseId}/grades/manual`

GV nhập điểm thủ công (midterm, final).

**Auth:** Required (instructor, admin)

**Request Body:**
```json
{
  "title": "Thi giữa kỳ",
  "grade_type": "midterm",
  "max_score": 10,
  "grades": [
    {"student_id": "user-uuid-1", "score": 7.5, "feedback": ""},
    {"student_id": "user-uuid-2", "score": 8.0, "feedback": ""}
  ]
}
```

**Response 200:**
```json
{
  "created_count": 2,
  "message": "Đã nhập điểm cho 2 sinh viên"
}
```

---

## 7. Notifications API

### GET `/notifications`

Danh sách notifications.

**Auth:** Required (any role, own only)

**Query params:** `?page=1&limit=20&unread=true`

**Response 200:**
```json
{
  "items": [
    {
      "id": "notif-uuid",
      "type": "grade_released",
      "title": "Bạn đã có điểm mới",
      "body": "Bài tập 1 của môn CS201 đã được chấm: 85/100",
      "resource_type": "grade",
      "resource_id": "grade-uuid",
      "is_read": false,
      "created_at": "2024-03-05T10:00:00Z",
      "read_at": null
    }
  ],
  "total": 12,
  "unread_count": 3
}
```

---

### PATCH `/notifications/{notifId}/read`

Đánh dấu đã đọc.

**Auth:** Required (own only)

**Response 200:**
```json
{"is_read": true, "read_at": "2024-03-06T08:00:00Z"}
```

---

### POST `/notifications/read-all`

Đánh dấu tất cả đã đọc.

**Auth:** Required

**Response 200:**
```json
{"marked_count": 3, "message": "Đã đánh dấu 3 thông báo là đã đọc"}
```

---

### DELETE `/notifications/{notifId}`

Xóa notification.

**Auth:** Required (own only)

**Response 204:** No content

---

### GET `/notifications/preferences`

Xem cài đặt thông báo.

**Auth:** Required

**Response 200:**
```json
{
  "email_new_assignment": true,
  "email_deadline_reminder": true,
  "email_grade_released": true,
  "email_submission_confirmed": true,
  "email_weekly_digest": true,
  "email_announcements": false,
  "inapp_new_assignment": true,
  "inapp_deadline_reminder": true,
  "inapp_grade_released": true,
  "inapp_new_submission": true
}
```

---

### PATCH `/notifications/preferences`

Cập nhật cài đặt thông báo.

**Auth:** Required

**Request Body (tất cả optional):**
```json
{
  "email_weekly_digest": false,
  "email_announcements": true
}
```

**Response 200:** Preferences object đầy đủ

---

## 8. Admin API

### GET `/admin/dashboard`

Tổng quan hệ thống.

**Auth:** Required (admin only)

**Response 200:**
```json
{
  "users": {
    "total": 350,
    "students": 300,
    "instructors": 48,
    "admins": 2,
    "active": 340
  },
  "courses": {
    "total": 25,
    "open": 18,
    "archived": 3
  },
  "activity": {
    "messages_today": 234,
    "submissions_today": 45,
    "active_users_today": 89
  },
  "ai_costs": {
    "this_month_usd": 12.45,
    "this_week_usd": 3.21,
    "today_usd": 0.87
  }
}
```

---

### GET `/admin/users`

Danh sách users (admin).

**Auth:** Required (admin only)

**Query params:** `?role=student&is_active=true&search=nguyen&page=1&limit=20`

**Response 200:** Paginated User list với thêm thống kê:
```json
{
  "items": [
    {
      "id": "...",
      "email": "...",
      "full_name": "...",
      "role": "student",
      "student_id": "20210001",
      "is_active": true,
      "created_at": "...",
      "enrolled_courses_count": 3,
      "last_login_at": "2024-03-01T15:00:00Z"
    }
  ]
}
```

---

### POST `/admin/users`

Admin tạo user thủ công (kể cả admin role).

**Auth:** Required (admin only)

**Request Body:** Giống /auth/register nhưng có thể set `role: "admin"`

**Response 201:** User object

---

## 9. Agent API (Base: `:8001/api/v1`)

### POST `/conversations`

Tạo conversation mới.

**Auth:** Required

**Request Body:**
```json
{
  "course_id": "course-uuid",
  "title": null
}
```

| Field | Required | Mô tả |
|-------|---------|-------|
| `course_id` | ❌ | UUID. Phải là course user đã enroll. null = general context |
| `title` | ❌ | null = auto-generated từ message đầu tiên |

**Response 201:**
```json
{
  "id": "conv-uuid",
  "user_id": "user-uuid",
  "course_id": "course-uuid",
  "course": {
    "title": "CS201 - Cấu trúc Dữ liệu",
    "course_code": "CS201"
  },
  "title": null,
  "created_at": "2024-03-01T08:00:00Z",
  "last_message_at": null
}
```

**Error:** `403 NOT_ENROLLED` nếu course_id được cung cấp nhưng user chưa enroll

---

### GET `/conversations`

Danh sách conversations của mình.

**Auth:** Required

**Query params:** `?page=1&limit=20&course_id=uuid`

**Response 200:**
```json
{
  "items": [
    {
      "id": "conv-uuid",
      "title": "Recursion là gì?",
      "course": {
        "id": "course-uuid",
        "title": "CS201 - Cấu trúc Dữ liệu",
        "course_code": "CS201"
      },
      "last_message_at": "2024-03-01T10:30:00Z",
      "created_at": "2024-03-01T08:00:00Z",
      "message_count": 8
    }
  ]
}
```

---

### GET `/conversations/{convId}`

Chi tiết conversation.

**Auth:** Required (owner, instructor của course liên quan, admin)

**Response 200:** Conversation object

---

### DELETE `/conversations/{convId}`

Xóa conversation (soft delete).

**Auth:** Required (owner only)

**Response 200:** `{"message": "Đã xóa cuộc trò chuyện"}`

---

### GET `/conversations/{convId}/messages`

Lịch sử messages.

**Auth:** Required (owner, instructor của course, admin)

**Query params:** `?page=1&limit=50` (oldest first)

**Response 200:**
```json
{
  "conversation": {
    "id": "conv-uuid",
    "title": "Recursion là gì?"
  },
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "user",
      "content": "Recursion là gì?",
      "created_at": "2024-03-01T08:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "Recursion (đệ quy) là kỹ thuật lập trình...",
      "sources": [
        {
          "filename": "Slide_Chuong4.pdf",
          "page_number": 12,
          "section_title": "Đệ quy cơ bản"
        }
      ],
      "tokens_used": 245,
      "model_used": "claude-sonnet-4-6",
      "created_at": "2024-03-01T08:00:05Z"
    }
  ],
  "total": 8
}
```

---

### POST `/conversations/{convId}/messages` ⭐ SSE Streaming

Gửi message và nhận response dạng stream.

**Auth:** Required (owner only) | **Rate limit:** AI limit (10/min/user)

**Request Body:**
```json
{
  "content": "Điểm bài tập 1 của tôi là bao nhiêu?"
}
```

**Request Headers:**
```http
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer <token>
```

**Response:** `Content-Type: text/event-stream`

**SSE Event Format:**
```
data: <JSON>\n\n
```

**Tất cả event types:**

```
# 1. Token event — mỗi token từ LLM
data: {"type": "token", "content": "Bài"}

data: {"type": "token", "content": " tập"}

data: {"type": "token", "content": " 1"}

# 2. Tool call start — Agent bắt đầu gọi tool
data: {"type": "tool_call_start", "tool_name": "get_grades", "display_message": "Đang tra cứu điểm số..."}

# 3. Tool call end — Tool xong
data: {"type": "tool_call_end", "tool_name": "get_grades"}

# 4. Tool result (optional, debug)
data: {"type": "tool_result", "tool_name": "get_grades", "summary": "Tìm thấy 3 grades"}

# 5. Memory update (sau khi done)
data: {"type": "memory_update", "message": "Đã cập nhật memory của bạn"}

# 6. Info — thông tin phụ (ví dụ: dùng fallback model)
data: {"type": "info", "message": "Đang dùng model dự phòng do quá tải"}

# 7. Error — lỗi xảy ra
data: {"type": "error", "error_code": "AI_UNAVAILABLE", "message": "Hệ thống AI tạm thời gián đoạn. Vui lòng thử lại sau ít phút."}

# 8. Done — kết thúc stream
data: {"type": "done", "message_id": "msg-uuid", "tokens_used": 245, "model_used": "claude-sonnet-4-6"}

# Stream kết thúc
data: [DONE]
```

**Ví dụ full stream:**
```
data: {"type": "tool_call_start", "tool_name": "get_grades", "display_message": "Đang tra cứu điểm số..."}

data: {"type": "tool_call_end", "tool_name": "get_grades"}

data: {"type": "token", "content": "Dựa"}

data: {"type": "token", "content": " trên"}

data: {"type": "token", "content": " dữ"}

data: {"type": "token", "content": " liệu"}

data: {"type": "token", "content": " điểm"}

data: {"type": "token", "content": " số"}

data: {"type": "token", "content": " của"}

data: {"type": "token", "content": " bạn:\n\n"}

data: {"type": "token", "content": "**Bài"}

data: {"type": "token", "content": " tập"}

data: {"type": "token", "content": " 1:"}

data: {"type": "token", "content": " Linked"}

data: {"type": "token", "content": " List**"}

data: {"type": "token", "content": " —"}

data: {"type": "token", "content": " 85/100\n"}

data: {"type": "done", "message_id": "msg-uuid-assistant", "tokens_used": 312, "model_used": "claude-sonnet-4-6"}

data: [DONE]
```

**Frontend handling:**
```typescript
// Kết nối SSE
const response = await fetch(url, { method: 'POST', body: ..., headers: { 'Accept': 'text/event-stream' } });
const reader = response.body.getReader();
let buffer = '';
let fullContent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += new TextDecoder().decode(value);
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Giữ lại dòng chưa hoàn chỉnh
  
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return;
    
    const event = JSON.parse(data);
    switch (event.type) {
      case 'token':
        fullContent += event.content;
        updateMessageUI(fullContent);  // Re-render
        break;
      case 'tool_call_start':
        showToolIndicator(event.display_message);
        break;
      case 'tool_call_end':
        hideToolIndicator();
        break;
      case 'error':
        showError(event.message);
        return;
      case 'done':
        finalizeMessage(event.message_id);
        break;
    }
  }
}
```

**Errors:**
| Status | error_code | Khi nào |
|--------|-----------|---------|
| 403 | `PERMISSION_DENIED` | Không phải owner của conversation |
| 429 | `AI_RATE_LIMIT` | Vượt 10 requests/phút |
| 502 | `AI_UNAVAILABLE` | Tất cả AI providers fail |

---

### GET `/memories/my`

Xem memories của mình.

**Auth:** Required

**Query params:** `?type=weakness&page=1&limit=20`

**type values:** `weakness | preference | question | progress | achievement | other`

**Response 200:**
```json
{
  "items": [
    {
      "id": "mem-uuid",
      "memory_type": "weakness",
      "content": "Sinh viên đang gặp khó khăn với Recursion và Dynamic Programming",
      "topic": "Recursion",
      "course": {
        "id": "course-uuid",
        "title": "CS201",
        "course_code": "CS201"
      },
      "created_at": "2024-03-01T08:00:00Z",
      "updated_at": "2024-03-10T15:00:00Z"
    },
    {
      "id": "mem-uuid-2",
      "memory_type": "preference",
      "content": "Sinh viên thích học qua ví dụ code Python cụ thể",
      "topic": null,
      "course": null,
      "created_at": "2024-03-02T09:00:00Z"
    }
  ],
  "total": 12,
  "by_type": {
    "weakness": 3,
    "preference": 2,
    "question": 5,
    "progress": 2
  }
}
```

---

### DELETE `/memories/{memoryId}`

Xóa 1 memory entry.

**Auth:** Required (owner only)

**Response 204:** No content

---

### GET `/rag/search`

Tìm kiếm trong tài liệu khóa học (dùng nội bộ bởi agent, cũng exposed cho debug).

**Auth:** Required

**Query params:**

| Param | Required | Mô tả |
|-------|---------|-------|
| `q` | ✅ | Query text |
| `course_id` | ✅ | UUID của course |
| `limit` | ❌ | Số kết quả (default: 5, max: 10) |

**Response 200:**
```json
{
  "results": [
    {
      "content": "Binary Search Tree (BST) là một cấu trúc dữ liệu dạng cây...",
      "similarity": 0.94,
      "document": {
        "filename": "Slide_Chuong4.pdf",
        "course_id": "course-uuid"
      },
      "page_number": 12,
      "section_title": "Binary Search Tree"
    }
  ],
  "query": "binary search tree",
  "course_id": "course-uuid"
}
```

**Error:** `400 COURSE_NOT_INDEXED` nếu course chưa có tài liệu nào is_indexed=true

---

## 10. Internal Agent Tools API

> ⚠️ Các endpoints này **CHỈ** dành cho Agent API gọi nội bộ. Không expose ra internet. Auth bằng header `X-Agent-Key`.

**Base:** `http://lms-api:8000/api/v1/agent-tools` (internal Docker network)

**Auth header:** `X-Agent-Key: {AGENT_INTERNAL_KEY}`

---

### GET `/agent-tools/students/{userId}/profile`

Lấy profile + enrolled courses của SV.

**Response 200:**
```json
{
  "id": "user-uuid",
  "full_name": "Nguyễn Văn A",
  "student_id": "20210001",
  "enrolled_courses": [
    {
      "id": "course-uuid",
      "title": "Cấu trúc Dữ liệu và Giải thuật",
      "course_code": "CS201",
      "instructor_name": "Trần Thị B"
    }
  ]
}
```

---

### GET `/agent-tools/students/{userId}/grades`

Lấy điểm số của SV.

**Query params:** `?course_id=uuid` (optional, filter theo course)

**Response 200:**
```json
{
  "grades": [
    {
      "course_code": "CS201",
      "course_title": "Cấu trúc Dữ liệu",
      "assignment_title": "Bài tập 1: Linked List",
      "grade_type": "assignment",
      "score": 85,
      "max_score": 100,
      "percentage": 85.0,
      "feedback": "Code tốt!",
      "graded_at": "2024-03-05T10:00:00Z"
    }
  ],
  "course_gpas": [
    {"course_code": "CS201", "gpa": 8.2}
  ],
  "overall_gpa": 7.8
}
```

---

### GET `/agent-tools/students/{userId}/assignments`

Lấy danh sách bài tập + status của SV.

**Query params:** `?status=not_submitted&course_id=uuid`

**Response 200:**
```json
{
  "assignments": [
    {
      "id": "assign-uuid",
      "title": "Bài tập 2: Binary Tree",
      "course_code": "CS201",
      "course_title": "Cấu trúc Dữ liệu",
      "deadline": "2024-04-01T23:59:59Z",
      "effective_deadline": "2024-04-01T23:59:59Z",
      "days_remaining": 5,
      "hours_remaining": 120,
      "max_score": 100,
      "status": "not_submitted",
      "allow_late_submission": false
    }
  ]
}
```

---

### GET `/agent-tools/students/{userId}/courses`

Lấy danh sách courses đã enroll.

**Response 200:** List of course objects với basic info

---

## 11. Bảng Error Codes Đầy đủ

| error_code | HTTP | Mô tả |
|-----------|------|-------|
| `EMAIL_EXISTS` | 409 | Email đã tồn tại |
| `STUDENT_ID_EXISTS` | 409 | Mã sinh viên đã tồn tại |
| `COURSE_CODE_EXISTS` | 409 | Mã môn học đã tồn tại |
| `ALREADY_ENROLLED` | 409 | SV đã enroll khóa học này |
| `ALREADY_GRADED` | 409 | Submission đã được chấm |
| `INVALID_CREDENTIALS` | 401 | Sai email/password |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn |
| `REFRESH_INVALID` | 401 | Refresh token không hợp lệ |
| `REFRESH_EXPIRED` | 401 | Refresh token hết hạn |
| `REFRESH_REVOKED` | 401 | Refresh token đã bị revoke |
| `ACCOUNT_SUSPENDED` | 403 | Tài khoản bị khóa |
| `PERMISSION_DENIED` | 403 | Không có quyền |
| `NOT_COURSE_INSTRUCTOR` | 403 | Không phải GV của course này |
| `NOT_ENROLLED` | 403 | Chưa enroll hoặc enrollment không active |
| `COURSE_NOT_FOUND` | 404 | Course không tồn tại |
| `ASSIGNMENT_NOT_FOUND` | 404 | Assignment không tồn tại |
| `SUBMISSION_NOT_FOUND` | 404 | Submission không tồn tại |
| `USER_NOT_FOUND` | 404 | User không tồn tại |
| `NOTIFICATION_NOT_FOUND` | 404 | Notification không tồn tại |
| `DOCUMENT_NOT_FOUND` | 404 | Document không tồn tại |
| `MEMORY_NOT_FOUND` | 404 | Memory không tồn tại |
| `CONVERSATION_NOT_FOUND` | 404 | Conversation không tồn tại |
| `COURSE_NOT_OPEN` | 400 | Course chưa mở đăng ký |
| `COURSE_FULL` | 400 | Course đã đủ SV |
| `DEADLINE_PASSED` | 400 | Quá hạn nộp bài |
| `FUTURE_DEADLINE_REQUIRED` | 400 | Deadline phải ở tương lai |
| `SCORE_EXCEEDS_MAX` | 400 | Điểm vượt quá điểm tối đa |
| `FILE_TOO_LARGE` | 400 | File quá lớn |
| `INVALID_FILE_TYPE` | 400 | Định dạng file không hỗ trợ |
| `INVALID_IMAGE_TYPE` | 400 | File không phải ảnh hợp lệ |
| `INVALID_DATE_RANGE` | 400 | end_date trước start_date |
| `WRONG_PASSWORD` | 400 | Mật khẩu hiện tại sai |
| `RESET_TOKEN_EXPIRED` | 400 | Token reset hết hạn |
| `RESET_TOKEN_USED` | 400 | Token đã dùng |
| `RESET_TOKEN_INVALID` | 400 | Token không tồn tại |
| `VALIDATION_ERROR` | 422 | Input validation lỗi |
| `RATE_LIMIT_EXCEEDED` | 429 | Vượt rate limit |
| `AI_RATE_LIMIT` | 429 | Vượt AI rate limit |
| `COURSE_NOT_INDEXED` | 400 | Course chưa có tài liệu được index |
| `AI_UNAVAILABLE` | 502 | AI service không khả dụng |
| `INTERNAL_ERROR` | 500 | Lỗi server |

---

*Tài liệu API này là contract giữa Frontend và Backend. Mọi thay đổi breaking (thêm required field, đổi response format) phải update tài liệu và thông báo toàn team.*
