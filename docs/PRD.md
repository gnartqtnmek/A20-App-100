# PRD — Product Requirements Document
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 2.0 | **Ngày:** 2026-04-27 | **Nhóm:** Team 100

> **Mục đích:** Dev đọc tài liệu này để hiểu CHÍNH XÁC từng tính năng cần xây dựng, logic hoạt động, điều kiện nghiệm thu, và edge cases. Mọi câu hỏi về "hệ thống này hoạt động thế nào?" phải được trả lời trong tài liệu này.

---

## 1. Persona & User Journey

### 1.1 Persona A — Sinh viên "Minh"

| Thuộc tính | Chi tiết |
|-----------|---------|
| Tuổi | 20, năm 2 đại học |
| Học | 5 môn/kỳ, GPA 6.5/10 |
| Thói quen | Hay quên deadline, thường hỏi lại GV cùng câu hỏi nhiều lần |
| Pain points | Chatbot cũ không nhớ mình là ai; tìm điểm phải vào nhiều trang; không biết mình yếu chỗ nào |
| Mục tiêu | Biết mình đang đứng ở đâu; có người (AI) nhắc nhở và hướng dẫn cá nhân |
| Sử dụng app | Chủ yếu trên điện thoại, thỉnh thoảng laptop |

**User Journey của Minh:**
```
Sáng thức dậy → Mở app → Dashboard hiện "2 bài tập sắp đến hạn"
     ↓
Vào AI Chat → "Tóm tắt tuần học của tôi đi"
     ↓
Agent (nhớ từ tuần trước): "Tuần qua bạn nộp được 2 bài,
còn Bài 3 của CS201 hết hạn thứ 6. Lần trước bạn hỏi về 
Recursion, bạn cần ôn thêm phần đó không?"
     ↓
Minh: "Ừ, giải thích lại Recursion cho tôi bằng ví dụ Python"
     ↓
Agent trả lời có code ví dụ, cite từ slide Chương 4
     ↓
Minh nộp bài đúng hạn → Nhận điểm → Agent ghi nhớ tiến trình
```

### 1.2 Persona B — Giảng viên "Lan"

| Thuộc tính | Chi tiết |
|-----------|---------|
| Tuổi | 35, giảng viên 8 năm kinh nghiệm |
| Dạy | 3 môn, 120 SV/môn |
| Pain points | Chấm bài thủ công mất nhiều giờ; SV hỏi lặp đi lặp lại cùng câu; không biết SV nào đang gặp khó khăn |
| Mục tiêu | Tạo bài tập nhanh; xem ai chưa nộp; AI giảm tải câu hỏi thường gặp |

### 1.3 Persona C — Admin "Hùng"

| Thuộc tính | Chi tiết |
|-----------|---------|
| Tuổi | 28, quản trị viên hệ thống |
| Nhiệm vụ | Quản lý tài khoản, giám sát hệ thống, báo cáo cho BGH |
| Mục tiêu | Dashboard tổng hợp; quản lý bulk user; kiểm soát chi phí AI |

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Định nghĩa Role

| Role | Mô tả | Ai có |
|------|-------|-------|
| `admin` | Toàn quyền hệ thống | IT Admin trường |
| `instructor` | Quản lý courses của mình | Giảng viên |
| `student` | Tham gia courses, nộp bài, chat AI | Sinh viên |

### 2.2 Ma trận Phân quyền Đầy đủ

| Resource | Action | admin | instructor | student | Ghi chú |
|----------|--------|-------|-----------|---------|---------|
| **User** | create | ✅ | ❌ | ❌ | |
| **User** | read own profile | ✅ | ✅ | ✅ | |
| **User** | read any profile | ✅ | ❌ | ❌ | |
| **User** | update own profile | ✅ | ✅ | ✅ | |
| **User** | update any (role, is_active) | ✅ | ❌ | ❌ | |
| **User** | delete (soft) | ✅ | ❌ | ❌ | |
| **Course** | create | ✅ | ✅ | ❌ | |
| **Course** | read (open courses) | ✅ | ✅ | ✅ | Ai cũng xem được |
| **Course** | read own enrolled | ✅ | N/A | ✅ | SV xem courses đã enroll |
| **Course** | read own teaching | ✅ | ✅ | ❌ | GV xem courses mình dạy |
| **Course** | update | ✅ | Own only | ❌ | |
| **Course** | delete/archive | ✅ | Own only | ❌ | Soft delete |
| **Course** | enroll student | ✅ | Own course | Self (nếu open) | |
| **Course** | unenroll student | ✅ | Own course | Self | |
| **Course** | view student list | ✅ | Own course | ❌ | |
| **Document** | upload | ✅ | Own course | ❌ | |
| **Document** | download | ✅ | Own course | Enrolled | |
| **Document** | delete | ✅ | Own course | ❌ | |
| **Announcement** | create | ✅ | Own course | ❌ | |
| **Announcement** | read | ✅ | Own course | Enrolled | |
| **Assignment** | create | ✅ | Own course | ❌ | |
| **Assignment** | read (published) | ✅ | Own course | Enrolled | |
| **Assignment** | read (draft) | ✅ | Own course | ❌ | Draft chỉ GV thấy |
| **Assignment** | update | ✅ | Own course | ❌ | |
| **Assignment** | delete | ✅ | Own course | ❌ | |
| **Assignment** | publish/unpublish | ✅ | Own course | ❌ | |
| **Submission** | create | ❌ | ❌ | Own (enrolled) | |
| **Submission** | read own | ✅ | Own course | Own | |
| **Submission** | read all in course | ✅ | Own course | ❌ | |
| **Submission** | download file | ✅ | Own course | Own | |
| **Grade** | create/update | ✅ | Own course | ❌ | |
| **Grade** | read own | ✅ | Own course | Own | |
| **Grade** | read all | ✅ | Own course | ❌ | |
| **Notification** | read own | ✅ | ✅ | ✅ | |
| **Notification** | mark read | ✅ | ✅ | ✅ | Own only |
| **AI Conversation** | create | ✅ | ✅ | ✅ | |
| **AI Conversation** | read own | ✅ | Own | Own | |
| **AI Conversation** | read student's (in own course) | ❌ | ✅ | ❌ | GV xem SV trong course mình |
| **AI Conversation** | read any | ✅ | ❌ | ❌ | |
| **Memory** | read own | ✅ | Own | Own | |
| **Memory** | delete own entry | ✅ | ✅ | ✅ | |
| **Analytics** | system-wide | ✅ | ❌ | ❌ | |
| **Analytics** | own course | ✅ | ✅ | ❌ | |
| **Analytics** | own learning | ✅ | ✅ | ✅ | |
| **Admin Panel** | access | ✅ | ❌ | ❌ | |
| **Notification Prefs** | read/update own | ✅ | ✅ | ✅ | |

---

## 3. Business Rules

> BR = Business Rule. Tất cả đều bắt buộc trừ khi có note "Optional".

### 3.1 Authentication & User

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-001 | Email phải unique trong hệ thống (case-insensitive). `NGUYEN@gmail.com` = `nguyen@gmail.com` | DB UNIQUE + normalize lowercase trước khi lưu |
| BR-002 | Password phải ≥ 8 ký tự, có ≥ 1 chữ hoa, ≥ 1 chữ thường, ≥ 1 chữ số | API validation |
| BR-003 | student_id phải unique nếu được cung cấp | DB UNIQUE (nullable) |
| BR-004 | Access token hết hạn sau 15 phút. Refresh token hết hạn sau 7 ngày | JWT exp claim |
| BR-005 | Khi admin khóa tài khoản (is_active=false), tất cả refresh tokens của user đó phải bị revoke ngay lập tức | Cascade delete refresh_tokens |
| BR-006 | Khi user đổi password, tất cả refresh tokens cũ bị revoke | Delete all refresh_tokens của user |
| BR-007 | Không thể đăng nhập với tài khoản is_active=false | Check trước khi generate token |
| BR-008 | Password reset token hết hạn sau 1 giờ và chỉ dùng được 1 lần | expires_at + used_at check |

### 3.2 Course Management

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-009 | course_code phải unique trong toàn hệ thống (case-insensitive) | DB UNIQUE + normalize uppercase |
| BR-010 | Chỉ instructor tạo course mới được là instructor của course đó | Set instructor_id = current_user.id |
| BR-011 | SV chỉ enroll được course có is_open=true | Check trước khi insert enrollment |
| BR-012 | Nếu max_students đã đạt, không thể enroll thêm | SELECT COUNT + compare |
| BR-013 | Không thể enroll cùng 1 course 2 lần (kể cả sau khi drop) | UNIQUE constraint (student_id, course_id) — UPDATE status thay vì INSERT mới |
| BR-014 | Khi SV drop course, status chuyển sang 'dropped', KHÔNG xóa enrollment record | Soft status change |
| BR-015 | SV drop rồi có thể re-enroll nếu course vẫn open và chưa đủ chỗ | UPDATE enrollment status='active' |
| BR-016 | Archived course (is_archived=true) không hiển thị trong search, SV không thể enroll mới | Filter is_archived=false trong queries |
| BR-017 | GV không thể archive course có bài tập chưa được chấm hết (warning, không block) | Return warning trong response |

### 3.3 Assignment & Submission

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-018 | Deadline phải ở tương lai khi tạo bài tập | Validate deadline > NOW() |
| BR-019 | Assignment chỉ hiển thị cho SV khi is_published=true | Filter trong query |
| BR-020 | SV chỉ nộp bài khi đã enroll khóa học và enrollment.status='active' | Check enrollment |
| BR-021 | Nếu NOW() > deadline VÀ allow_late_submission=false → reject submission | Check trước khi xử lý |
| BR-022 | Nếu NOW() > deadline VÀ allow_late_submission=true → accept nhưng đánh is_late=true | Set is_late=true |
| BR-023 | Mỗi SV chỉ có 1 submission record per assignment. Nộp lại = UPDATE record, tăng attempt_number | UPSERT logic |
| BR-024 | SV không thể nộp bài sau khi đã được chấm điểm (trừ khi GV reset) | Check grade exists |
| BR-025 | File upload: max 50MB, chỉ accept PDF/DOCX/PPTX/TXT/ZIP | Validate mime type bằng magic bytes, không phải extension |
| BR-026 | Khi GV xóa assignment đã có submission → soft delete (is_deleted=true), không xóa thật | Soft delete |
| BR-027 | GV chỉ chấm được bài trong course mình dạy | Authorization check |
| BR-028 | Điểm (score) không được âm và không được vượt max_score | Validate: 0 ≤ score ≤ max_score |
| BR-029 | Khi GV grant extension cho SV, deadline mới override deadline gốc chỉ cho SV đó | assignment_extensions table |

### 3.4 Grades

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-030 | SV chỉ xem điểm của mình, không xem điểm của SV khác | WHERE student_id = current_user.id |
| BR-031 | GPA tính theo công thức: Σ(score/max_score × 10) / n với n = số grade có điểm | Function calculate_gpa() |
| BR-032 | Grade loại 'midterm' và 'final' được nhập thủ công (không cần submission) | submission_id nullable |
| BR-033 | Khi update grade, lưu lịch sử thay đổi (graded_at, graded_by update) | UPDATE grades record |

### 3.5 Notification

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-034 | Notification được tạo async (qua Celery) — không block main request | Celery task |
| BR-035 | Email chỉ gửi nếu user.email_subscribed=true VÀ notification_preferences cho loại đó = true | Check cả hai |
| BR-036 | Deadline reminder gửi khi còn đúng 48h VÀ 24h (tính tại thời điểm check 9:00 AM) | Celery beat |
| BR-037 | Không gửi reminder nếu SV đã nộp bài rồi | LEFT JOIN submissions, filter NULL |
| BR-038 | Weekly digest: chỉ gửi vào 8:00 AM thứ Hai, chỉ cho is_active=true SV | Celery beat |

### 3.6 AI Agent & Memory

| ID | Rule | Implement ở đâu |
|----|------|----------------|
| BR-039 | Memory của user A tuyệt đối không được đưa vào context của user B | Filter user_id mọi memory query |
| BR-040 | Agent chỉ trả về điểm/bài tập của user đang chat, không ai khác | Internal API filter user_id |
| BR-041 | Nếu SV không enroll course đang chọn làm context → agent không dùng RAG từ course đó | Check enrollment trước RAG |
| BR-042 | AI rate limit: 10 requests/phút/user. Vượt → 429, thông báo "Vui lòng chờ X giây" | Redis rate limiter |
| BR-043 | Conversation title tự động lấy từ 50 ký tự đầu của message đầu tiên của user | Auto-set khi message đầu tiên |
| BR-044 | Memory được extract và update BẤT ĐỒNG BỘ sau khi stream response xong | Async background task |
| BR-045 | Document phải is_indexed=true mới được dùng trong RAG | Check is_indexed trước khi search |
| BR-046 | Chỉ admin và GV của course mới xem được conversation của SV | Authorization check |

---

## 4. Trạng thái (State Machines)

### 4.1 Submission Status

```
                    ┌─────────────────┐
                    │   NOT_SUBMITTED  │ ← Trạng thái ban đầu (mọi SV enrolled)
                    └────────┬────────┘
                             │ SV nộp bài (trong hạn)
                             ▼
                    ┌─────────────────┐
              ┌────▶│    SUBMITTED    │◀──────────┐
              │     └────────┬────────┘           │
              │              │                    │ SV nộp lại
              │              │ GV chấm điểm       │ (nếu allow_late hoặc
              │              ▼                    │  GV reset grade)
              │     ┌─────────────────┐           │
              │     │     GRADED      │───────────┘
              │     └─────────────────┘
              │
              │ SV nộp trễ (after deadline, allow_late=true)
              │
              ▼
     ┌─────────────────┐
     │   LATE_SUBMITTED │
     └────────┬─────────┘
              │ GV chấm
              ▼
     ┌─────────────────┐
     │   LATE_GRADED   │
     └─────────────────┘

OVERDUE: Trạng thái hiển thị (computed, không lưu DB):
  = NOT_SUBMITTED AND NOW() > deadline AND allow_late=false
```

**Giá trị `status` hiển thị cho frontend:**
```
not_submitted  → Chưa nộp
submitted      → Đã nộp (đúng hạn)
late           → Đã nộp (trễ)
graded         → Đã chấm
overdue        → Quá hạn, không thể nộp
```

### 4.2 Enrollment Status

```
                    ┌──────────────┐
                    │   (Không có) │ ← Chưa enroll
                    └──────┬───────┘
                           │ Enroll
                           ▼
                    ┌──────────────┐
              ┌────▶│    ACTIVE    │
              │     └──────┬───────┘
              │            │ Drop course
              │            ▼
              │     ┌──────────────┐
              │     │   DROPPED    │
              │     └──────┬───────┘
              │            │ Re-enroll (nếu course vẫn open)
              └────────────┘
              
                    ┌──────────────┐
                    │  COMPLETED   │ ← Admin/GV set khi course kết thúc
                    └──────────────┘

Lưu ý: Chỉ enrollment.status='ACTIVE' mới được:
  - Nộp bài
  - Xem tài liệu
  - Chat với AI trong context course đó
```

### 4.3 Assignment Status (từ góc nhìn GV)

```
┌──────────────┐
│    DRAFT     │ ← is_published=false, SV không thấy
└──────┬───────┘
       │ GV publish
       ▼
┌──────────────┐
│  PUBLISHED   │ ← SV thấy và có thể nộp bài
└──────┬───────┘
       │ Quá deadline (computed)
       ▼
┌──────────────┐
│    CLOSED    │ ← Computed từ deadline, không lưu DB
└──────────────┘
       │ GV unpublish (vẫn có thể)
       ▼
┌──────────────┐
│    DRAFT     │
└──────────────┘
```

### 4.4 Document Processing Status

```
┌──────────────────┐
│   UPLOADED       │ ← is_indexed=false, file lưu xong
└──────┬───────────┘
       │ Celery task index_document() chạy
       ▼
┌──────────────────┐
│   PROCESSING     │ ← Đang chunk + embed
└──────┬───────────┘
       │                    │ Lỗi (file corrupt, API fail)
       ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│    INDEXED       │  │     FAILED       │ ← Có thể retry
└──────────────────┘  └──────────────────┘
  is_indexed=true        is_indexed=false, error_message set
  Agent có thể dùng RAG  Thông báo GV re-upload
```

### 4.5 Notification Status

```
┌──────────────┐
│    UNREAD    │ ← Trạng thái ban đầu khi tạo notification
└──────┬───────┘
       │ User mark read HOẶC user click vào notification
       ▼
┌──────────────┐
│     READ     │ ← read_at = NOW()
└──────────────┘

Lưu ý: Notification không có trạng thái "DELETED" —
  nếu muốn xóa, delete thật từ DB.
```

---

## 5. Notification Trigger Matrix

> Mọi notification đều được tạo qua Celery (async). Email chỉ gửi khi user có `email_subscribed=true` VÀ preference tương ứng bật.

| Event | Trigger | Recipients | In-App | Email | Template | Delay |
|-------|---------|-----------|--------|-------|----------|-------|
| Đăng ký tài khoản | POST /auth/register | User mới | ❌ | ✅ | `welcome` | Ngay lập tức |
| Enroll course | POST /courses/{id}/enroll | GV của course | ✅ | Optional | `enrollment_confirmed` | Ngay lập tức |
| Enroll confirmed | POST /courses/{id}/enroll | SV vừa enroll | ✅ | ✅ | `enrolled_student` | Ngay lập tức |
| Assignment mới publish | PATCH assignment (is_published=true) | Tất cả SV enrolled | ✅ | ✅ | `new_assignment` | Ngay lập tức |
| Deadline sắp đến 48h | Celery Beat 9AM daily | SV chưa nộp | ✅ | ✅ | `deadline_reminder_48h` | Không delay |
| Deadline sắp đến 24h | Celery Beat 9AM daily | SV chưa nộp | ✅ | ✅ | `deadline_reminder_24h` | Không delay |
| Bài tập được chấm | POST /submissions/{id}/grade | SV có submission | ✅ | ✅ | `grade_released` | Ngay lập tức |
| Bài nộp mới | POST /assignments/{id}/submit | GV của course | ✅ | Optional | `new_submission` | Ngay lập tức |
| SV nộp bài xác nhận | POST /assignments/{id}/submit | SV vừa nộp | ✅ | ✅ | `submission_confirmed` | Ngay lập tức |
| Announcement mới | POST /courses/{id}/announcements | Tất cả SV enrolled | ✅ | Optional | `new_announcement` | Ngay lập tức |
| Điểm midterm/final | POST /grades (manual) | SV | ✅ | ✅ | `grade_released` | Ngay lập tức |
| Weekly digest | Celery Beat thứ Hai 8AM | SV active + subscribed | ❌ | ✅ | `weekly_digest` | Không delay |
| Tài khoản bị khóa | PATCH /admin/users (is_active=false) | User bị khóa | ❌ | ✅ | `account_suspended` | Ngay lập tức |

---

## 6. Email Templates

### Template: `welcome`

**Subject:** `Chào mừng bạn đến với LMS Team 100!`

**Biến:**
- `{{full_name}}` — Họ tên người dùng
- `{{role}}` — student / instructor
- `{{login_url}}` — Link đăng nhập

**Nội dung:**
```
Xin chào {{full_name}},

Tài khoản {{role}} của bạn đã được tạo thành công.
Đăng nhập ngay: {{login_url}}

Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
```

---

### Template: `new_assignment`

**Subject:** `[{{course_code}}] Bài tập mới: {{assignment_title}}`

**Biến:**
- `{{full_name}}`, `{{course_name}}`, `{{course_code}}`
- `{{assignment_title}}`, `{{assignment_description_preview}}` (100 chars)
- `{{deadline}}` (format: "23:59 ngày 15/03/2024")
- `{{days_remaining}}` (số ngày còn lại)
- `{{assignment_url}}` — Link vào trang bài tập

---

### Template: `deadline_reminder_48h` / `deadline_reminder_24h`

**Subject:** `⏰ [{{course_code}}] Còn {{hours_remaining}} giờ để nộp: {{assignment_title}}`

**Biến:**
- `{{full_name}}`, `{{course_name}}`, `{{assignment_title}}`
- `{{deadline}}`, `{{hours_remaining}}`
- `{{assignment_url}}`
- `{{ai_tip}}` — Tip học từ AI dựa trên memory của SV (optional, có thể "")

---

### Template: `grade_released`

**Subject:** `✅ Điểm của bạn: {{assignment_title}} — {{score}}/{{max_score}}`

**Biến:**
- `{{full_name}}`, `{{course_name}}`, `{{assignment_title}}`
- `{{score}}`, `{{max_score}}`, `{{percentage}}`
- `{{feedback}}` — Nhận xét của GV (có thể trống)
- `{{grade_url}}` — Link xem điểm
- `{{graded_by_name}}` — Tên GV chấm

---

### Template: `submission_confirmed`

**Subject:** `✅ Đã nộp bài: {{assignment_title}}`

**Biến:**
- `{{full_name}}`, `{{course_name}}`, `{{assignment_title}}`
- `{{submitted_at}}`, `{{is_late}}` (boolean)
- `{{late_warning}}` — "" nếu đúng hạn, "⚠️ Bài nộp trễ hạn, GV có thể trừ điểm." nếu trễ

---

### Template: `weekly_digest`

**Subject:** `📚 Tóm tắt học tập tuần {{week_number}}/{{year}} — {{full_name}}`

**Biến:**
- `{{full_name}}`, `{{week_start}}`, `{{week_end}}`
- `{{assignments_submitted}}` — Số bài đã nộp
- `{{grades_received}}` — List [{title, score, max_score}]
- `{{upcoming_assignments}}` — List [{title, course, deadline, days_left}]
- `{{ai_personalized_summary}}` — Đoạn text được AI generate
- `{{ai_study_tip}}` — Tip học tập cá nhân hóa
- `{{chat_url}}` — Link vào AI Chat
- `{{unsubscribe_url}}` — Link unsubscribe

---

## 7. Feature List Đầy đủ

### Module 1: Authentication (Sprint 1)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-AUTH-01 | Đăng ký tài khoản | Form: email, password, confirm_password, full_name, role, student_id (nếu SV). Validate tất cả fields. Hash password bcrypt. Auto-create notification preferences. | P0 |
| F-AUTH-02 | Đăng nhập | Email + password. Trả về access_token (JWT 15 phút) + refresh_token (7 ngày). Lưu token. | P0 |
| F-AUTH-03 | Đăng xuất | Revoke refresh token. Clear local storage/cookie. Redirect /login. | P0 |
| F-AUTH-04 | Tự động refresh token | Interceptor detect 401 → tự gọi /auth/refresh → retry request. User không biết. | P0 |
| F-AUTH-05 | Quên mật khẩu | Nhập email → gửi email có link reset (valid 1h). | P1 |
| F-AUTH-06 | Reset mật khẩu | Click link → form nhập password mới. Token chỉ dùng 1 lần. | P1 |
| F-AUTH-07 | Đổi mật khẩu (đã login) | Nhập password cũ + mới. Revoke tất cả refresh tokens cũ. | P1 |
| F-AUTH-08 | Xem/cập nhật profile | Đổi full_name, avatar. Không cho đổi email (cần flow riêng). | P1 |

### Module 2: Course Management (Sprint 1-2)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-COURSE-01 | GV tạo khóa học | title, course_code (unique), description, start_date, end_date, max_students, is_open. | P0 |
| F-COURSE-02 | Danh sách khóa học | SV: xem courses đang enroll + open courses. GV: xem courses đang dạy. Admin: tất cả. Pagination + search. | P0 |
| F-COURSE-03 | Chi tiết khóa học | Title, mô tả, GV, số SV, progress (cho SV enrolled), tabs: Tổng quan/Bài tập/Tài liệu/Thành viên. | P0 |
| F-COURSE-04 | SV enroll course | Nút "Đăng ký" trên open courses. Validate business rules BR-011, BR-012, BR-013. | P0 |
| F-COURSE-05 | SV drop course | Nút "Rời khỏi" trên enrolled courses. Set status='dropped'. | P1 |
| F-COURSE-06 | GV cập nhật course | Sửa title, desc, max_students, is_open. Không cho sửa course_code. | P1 |
| F-COURSE-07 | GV archive course | Soft delete. Course bị ẩn khỏi tìm kiếm. SV enrolled vẫn xem được. | P2 |
| F-COURSE-08 | GV xem danh sách SV | Table SV enrolled với status, thời gian enroll. Có thể kick SV. | P1 |
| F-COURSE-09 | GV tạo announcement | Thông báo cho toàn bộ SV enrolled. is_pinned option. | P2 |
| F-COURSE-10 | Upload tài liệu | GV upload PDF/DOCX/PPTX. Sau upload, trigger indexing background. Show is_indexed status. | P1 |
| F-COURSE-11 | Tìm kiếm khóa học | Search theo title, course_code. Filter: is_open, has_enrolled. | P1 |

### Module 3: Assignment & Submission (Sprint 2-3)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-ASSIGN-01 | GV tạo bài tập | title, description (Markdown), deadline (datetime-local), max_score, allow_late_submission, submission_type (text/file/both), is_published. | P0 |
| F-ASSIGN-02 | SV xem danh sách bài tập | Group theo course. Mỗi item: tên, deadline, trạng thái (not_submitted/submitted/graded/overdue), điểm nếu đã chấm. Sort theo deadline gần nhất. | P0 |
| F-ASSIGN-03 | SV xem chi tiết bài tập | Title, mô tả đầy đủ (render Markdown), deadline countdown, form nộp bài. | P0 |
| F-ASSIGN-04 | SV nộp bài (text) | Textarea, min 10 chars. Hiển thị character count. | P0 |
| F-ASSIGN-05 | SV nộp bài (file) | Drag & drop hoặc click. Progress bar upload. Validate size + type. | P0 |
| F-ASSIGN-06 | SV xem điểm + feedback | Sau khi GV chấm: hiển thị score/max_score, percentage, feedback của GV. | P0 |
| F-ASSIGN-07 | GV xem danh sách bài nộp | Table: SV, thời gian nộp, is_late, trạng thái chấm. Filter: chưa chấm/đã chấm/nộp trễ. Pagination. | P0 |
| F-ASSIGN-08 | GV chấm điểm | Xem content/download file → Nhập score (0-max_score) + feedback text → Submit. | P0 |
| F-ASSIGN-09 | GV cập nhật bài tập | Sửa title, desc, deadline (chỉ tương lai), max_score, allow_late. Nếu đã có submission thì warning khi sửa max_score. | P1 |
| F-ASSIGN-10 | GV publish/unpublish | Toggle is_published. Khi publish → notify SV. Khi unpublish → SV không thấy nhưng submissions không bị xóa. | P1 |
| F-ASSIGN-11 | GV grant extension | GV có thể set deadline mới cho 1 SV cụ thể (assignment_extensions table). | P2 |
| F-ASSIGN-12 | GV xem analytics bài tập | Tỷ lệ nộp đúng hạn, điểm trung bình, phân bố điểm (chart). | P2 |

### Module 4: Grades (Sprint 3)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-GRADE-01 | SV xem bảng điểm | Danh sách tất cả grades, group theo course. Mỗi course có GPA riêng. Overall GPA cuối trang. | P0 |
| F-GRADE-02 | GV nhập điểm thủ công | Cho grade_type = midterm/final/participation. Không cần submission. Nhập cho từng SV. | P1 |
| F-GRADE-03 | GV xem grades overview | Table tất cả SV × assignment với ô điểm. Tính GPA trung bình lớp. | P1 |
| F-GRADE-04 | GV update grade | Chỉnh lại điểm + feedback. Lịch sử thay đổi không hiển thị ra UI (chỉ lưu DB). | P1 |
| F-GRADE-05 | Export grades CSV | GV export điểm của course ra CSV. Format: StudentID, Name, [Assignment1], [Assignment2], ..., GPA. | P2 |

### Module 5: Notifications (Sprint 4)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-NOTIF-01 | Notification bell | Icon chuông trên header với badge số unread. Click → dropdown top 5 notifications. | P0 |
| F-NOTIF-02 | Trang notifications | Danh sách đầy đủ, filter unread/all. Click notification → navigate đến resource. | P0 |
| F-NOTIF-03 | Mark as read | Click vào notification → mark read. Nút "Đánh dấu tất cả đã đọc". | P0 |
| F-NOTIF-04 | Cài đặt preferences | Toggle từng loại notification (email + in-app riêng). Default: tất cả bật. | P1 |
| F-NOTIF-05 | Real-time badge update | Polling mỗi 30 giây để cập nhật unread count (không cần WebSocket phase 1). | P1 |

### Module 6: AI Agent — Chat Core (Sprint 1-2)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-AI-01 | Chat interface | Input box (Enter gửi, Shift+Enter xuống dòng), bubble messages, timestamp, avatar. | P0 |
| F-AI-02 | Streaming response | Tokens hiện ra từng chữ. Hiển thị "🤖 Đang trả lời..." trong khi chờ. | P0 |
| F-AI-03 | Context selector | Dropdown chọn "Không có ngữ cảnh" hoặc tên course đã enroll. Ảnh hưởng đến RAG và agent tools. | P0 |
| F-AI-04 | Tạo conversation mới | Nút "+ New Chat". Chọn context. Auto-generate title từ message đầu. | P0 |
| F-AI-05 | Lịch sử conversations | Sidebar trái: danh sách conversations, sort theo last_message_at desc. Group: Hôm nay / Hôm qua / Tuần trước. | P0 |
| F-AI-06 | Xem lại conversation cũ | Click vào conversation → load toàn bộ messages. Không giới hạn scroll. | P0 |
| F-AI-07 | Xóa conversation | Xóa toàn bộ messages của conversation (soft delete). | P2 |
| F-AI-08 | Tool call indicators | Khi agent gọi tool, hiển thị "🔧 Đang tra cứu điểm số..." trong bubble riêng, mờ đi sau khi xong. | P1 |
| F-AI-09 | Source citations | Khi agent dùng RAG, hiển thị footnote "Nguồn: [Tên file, trang X]" trong response. | P1 |
| F-AI-10 | Error handling chat | Nếu AI lỗi, hiển thị error message + nút "Thử lại". Không mất message đã gõ. | P0 |
| F-AI-11 | Copy message | Button copy nội dung assistant message. | P2 |
| F-AI-12 | Markdown render | Agent responses render Markdown: bold, italic, code blocks, lists, tables. | P1 |

### Module 7: AI Agent — Tools (Sprint 3-4)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-TOOL-01 | Tool: get_my_grades | Agent lấy điểm của SV đang chat. Câu hỏi "điểm" trigger tool này. | P0 |
| F-TOOL-02 | Tool: get_my_assignments | Agent lấy danh sách bài tập + status. "bài nào chưa nộp" trigger. | P0 |
| F-TOOL-03 | Tool: get_course_info | Agent lấy thông tin course SV đang chọn làm context. | P1 |
| F-TOOL-04 | Tool: search_documents (RAG) | Agent tìm trong tài liệu course được index. Chỉ search trong course context. | P1 |
| F-TOOL-05 | Tool: calculate_gpa | Agent tính GPA từ grades data. | P1 |
| F-TOOL-06 | Tool: get_upcoming_deadlines | Agent lấy danh sách deadline sắp tới, sort. | P1 |

### Module 8: Memory System (Sprint 3-4)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-MEM-01 | Auto-extract memory | Sau mỗi conversation, Mem0 extract facts và lưu memory. Background async. | P0 |
| F-MEM-02 | Inject memory vào context | Trước khi invoke agent, load top-5 relevant memories, inject vào system prompt. | P0 |
| F-MEM-03 | Memory types | Lưu: weakness (điểm yếu), preference (sở thích học), question (câu hỏi đã hỏi), progress (tiến trình), achievement (thành tựu). | P0 |
| F-MEM-04 | Xem memory của mình | SV xem tóm tắt các memory AI đang nhớ về mình. Phân tab theo type. | P1 |
| F-MEM-05 | Xóa memory entry | SV có thể xóa 1 memory entry cụ thể. | P2 |
| F-MEM-06 | GV xem memory SV | GV xem tóm tắt memory của SV trong course mình (không xem full, chỉ weaknesses). | P2 |

### Module 9: Proactive Features (Sprint 5)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-PRO-01 | Weekly digest email | Gửi thứ Hai 8AM. Nội dung: tóm tắt tuần, bài tập sắp tới, AI tip cá nhân. | P0 |
| F-PRO-02 | Deadline reminder email | 48h và 24h trước deadline, chỉ với SV chưa nộp. | P1 |
| F-PRO-03 | Dashboard AI recommendation | Trong dashboard SV: box "💡 Gợi ý hôm nay" từ Agent (lấy 1 lần khi load dashboard). | P1 |
| F-PRO-04 | At-risk detection | Tổng hợp SV có nguy cơ (ít chat, nhiều bài chưa nộp). Hiển thị trong instructor analytics. | P2 |

### Module 10: Analytics (Sprint 6)

| ID | Feature | Mô tả chi tiết | Priority |
|----|---------|---------------|---------|
| F-ANA-01 | Student learning dashboard | SV xem tiến trình: GPA từng môn, số bài đã nộp/tổng, learning activity chart (7 ngày gần nhất). | P1 |
| F-ANA-02 | Instructor course analytics | GV xem: tỷ lệ nộp bài, điểm trung bình, SV active, top 5 câu hỏi AI của SV trong course. | P1 |
| F-ANA-03 | Admin system dashboard | Tổng số users, courses, messages, AI cost tháng này. | P2 |

---

## 8. User Stories & Acceptance Criteria Đầy đủ

### US-AUTH-01: Đăng ký tài khoản

> As a visitor, I want to create an account so that I can access the LMS system.

**AC:**
- [x] AC1: Form hiển thị: Email*, Password*, Confirm Password*, Họ tên*, Role (Student/Instructor)*, Mã SV (nếu Role=Student)
- [x] AC2: Email validate: regex format + không được trùng (server-side). Error message inline: "Email đã được sử dụng"
- [x] AC3: Password validate: ≥8 chars, có 1 chữ hoa, 1 thường, 1 số. Error: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số"
- [x] AC4: Confirm Password phải khớp Password. Error inline: "Mật khẩu không khớp"
- [x] AC5: Mã SV bắt buộc nếu role=student. Không được trùng. Error: "Mã sinh viên đã được sử dụng"
- [x] AC6: Submit → button disabled + spinner. API call POST /auth/register
- [x] AC7: Thành công (201) → Toast "Đăng ký thành công!" → redirect /login sau 2 giây
- [x] AC8: Thất bại (422) → Highlight đúng field lỗi với message từ server
- [x] AC9: Password trong DB được hash bcrypt (không lưu plaintext)
- [x] AC10: Sau khi tạo user, tự động tạo user_notification_preferences với tất cả = true

---

### US-AUTH-02: Đăng nhập

> As a registered user, I want to log in to access my personalized content.

**AC:**
- [x] AC1: Form: Email + Password. Nút "Đăng nhập". Link "Quên mật khẩu?"
- [x] AC2: Submit → API POST /auth/login
- [x] AC3: Sai credentials → HTTP 401 → Message: "Email hoặc mật khẩu không đúng" (KHÔNG chỉ rõ field nào sai, bảo mật)
- [x] AC4: Tài khoản bị khóa → HTTP 403 → Message: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ admin."
- [x] AC5: Thành công → Lưu access_token vào memory (Zustand) + refresh_token vào httpOnly cookie
- [x] AC6: Redirect theo role: admin → /admin, instructor → /dashboard (instructor view), student → /dashboard (student view)
- [x] AC7: Nếu đã login mà vào /login → redirect /dashboard
- [x] AC8: Sau đăng nhập, header hiện avatar + tên user

---

### US-AUTH-05: Quên mật khẩu

> As a user who forgot my password, I want to reset it via email.

**AC:**
- [x] AC1: Nhập email → POST /auth/forgot-password
- [x] AC2: Nếu email không tồn tại → Response: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn" (không tiết lộ email có hay không)
- [x] AC3: Nếu email tồn tại → Gửi email với link reset (valid 1h, single-use)
- [x] AC4: Link format: `https://lms.app/reset-password?token=<token>`
- [x] AC5: Click link trong email → Form nhập password mới + confirm
- [x] AC6: Token hết hạn → "Link đã hết hạn. Vui lòng yêu cầu lại"
- [x] AC7: Reset thành công → Revoke tất cả refresh tokens → Toast "Đổi mật khẩu thành công!" → redirect /login

---

### US-COURSE-01: Giảng viên tạo khóa học

> As an instructor, I want to create a course so that students can enroll and access my materials.

**AC:**
- [x] AC1: Form: Tên khóa học* (max 255), Mã môn* (unique, max 20, auto uppercase), Mô tả (Markdown textarea), Ngày bắt đầu, Ngày kết thúc, Sĩ số tối đa (số hoặc để trống = không giới hạn), Cho phép tự đăng ký (toggle)
- [x] AC2: course_code duplicate → "Mã môn học đã tồn tại"
- [x] AC3: end_date phải sau start_date nếu cả hai được nhập
- [x] AC4: Tạo thành công → Redirect /courses/{courseId} → Tab "Tổng quan"
- [x] AC5: Course mới tạo: is_published=false, is_archived=false, is_open=false (GV phải tự bật)
- [x] AC6: Course hiện trong "Môn học của tôi" (instructor view) ngay sau khi tạo

---

### US-COURSE-04: Sinh viên enroll khóa học

> As a student, I want to enroll in an open course so that I can access its content.

**AC:**
- [x] AC1: SV thấy nút "Đăng ký" trên open courses chưa enroll
- [x] AC2: Course đã enroll → nút "Đã tham gia" (disabled)
- [x] AC3: Course is_open=false → nút "Chưa mở đăng ký" (disabled)
- [x] AC4: POST /courses/{id}/enroll → nếu thành công → nút chuyển "Đã tham gia" + toast "Đăng ký thành công!"
- [x] AC5: Vượt max_students → "Khóa học đã đủ số lượng sinh viên"
- [x] AC6: Sau khi enroll → khóa học xuất hiện trong "Môn học của tôi"
- [x] AC7: GV nhận in-app notification "Nguyễn Văn A vừa đăng ký CS201"

---

### US-ASSIGN-03: Sinh viên nộp bài tập

> As a student, I want to submit my assignment before the deadline.

**AC:**
- [x] AC1: Chỉ SV enrolled với status=active mới thấy form nộp bài
- [x] AC2: Hiển thị countdown: "Còn 2 ngày 3 giờ 15 phút". Khi ≤ 24h: màu đỏ, pulse animation
- [x] AC3: Submission type = 'file': chỉ hiện file upload. Type = 'text': chỉ textarea. Type = 'both': cả hai
- [x] AC4: File upload: drag & drop hoặc click. Validate client-side size (≤50MB) trước khi upload
- [x] AC5: Trong khi upload: progress bar, nút "Nộp bài" disabled
- [x] AC6: Upload fail (file quá lớn/sai định dạng) → inline error, không clear form
- [x] AC7: Sau khi upload xong: hiện filename + size + "✅ Sẵn sàng nộp"
- [x] AC8: Nộp thành công (201) → Toast "Nộp bài thành công!" → Page refresh → Hiện "Đã nộp lúc [time]"
- [x] AC9: Nộp trễ (is_late=true) → Toast màu vàng "Đã nộp (trễ hạn). GV có thể áp dụng quy định trừ điểm."
- [x] AC10: Quá hạn + allow_late=false → Form disabled, message "Đã hết thời hạn nộp bài"
- [x] AC11: Đã được chấm điểm → Form disabled, hiện điểm + feedback, không cho nộp lại
- [x] AC12: Nếu nộp lại được (đã nộp, chưa chấm, allow_late=true hoặc trong hạn) → "Nộp lại" button, confirm dialog trước

---

### US-ASSIGN-08: Giảng viên chấm điểm

> As an instructor, I want to grade student submissions and provide feedback.

**AC:**
- [x] AC1: Table bài nộp: SV name, student_id, submitted_at, is_late (badge "Trễ" màu cam), action "Chấm"
- [x] AC2: Filter tabs: Tất cả | Chưa chấm | Đã chấm | Nộp trễ
- [x] AC3: Click "Chấm" → Slide panel hoặc modal hiện: preview content (nếu text) hoặc link download (nếu file), input điểm (0 đến max_score), textarea feedback
- [x] AC4: Validate: score không được trống, phải là số, 0 ≤ score ≤ max_score
- [x] AC5: Submit → POST /submissions/{id}/grade → Hàng trong table update: "Đã chấm: 85/100"
- [x] AC6: SV nhận in-app notification + email ngay sau khi GV chấm
- [x] AC7: GV có thể chấm lại (update grade) bằng cách click "Sửa điểm"
- [x] AC8: Sau khi chấm, điểm hiện trong grade_overview của GV và bảng điểm của SV

---

### US-AI-01: Chat với AI Agent

> As a student, I want to chat with the AI agent to get study help.

**AC:**
- [x] AC1: Chat interface load trong < 1 giây (skeleton loading nếu cần)
- [x] AC2: Input box focused mặc định khi mở chat
- [x] AC3: Enter gửi message. Shift+Enter = newline
- [x] AC4: Sau khi gửi: input clear, message SV hiện bubble phải, "🤖 Đang trả lời..." xuất hiện
- [x] AC5: Streaming: text xuất hiện từng từ. Scroll tự động xuống khi có token mới
- [x] AC6: Tool call: Khi agent gọi tool, hiện bubble "🔧 Đang tra cứu [tên action]..." — tự ẩn sau khi xong
- [x] AC7: Response hoàn chỉnh: markdown được render (bold, code, list, table)
- [x] AC8: Nếu context = course X, agent có thể search tài liệu của course X
- [x] AC9: Agent không bao giờ tiết lộ điểm của SV khác
- [x] AC10: Nếu AI API fail → message lỗi "Hệ thống AI tạm thời gián đoạn. Vui lòng thử lại." + nút "Thử lại" gửi lại message

---

### US-MEM-02: Agent nhớ context từ phiên trước

> As a student, I want the agent to remember my learning history across sessions.

**AC:**
- [x] AC1: Mở conversation mới → System prompt của agent chứa memories từ các conversation trước
- [x] AC2: Ví dụ: Phiên trước hỏi về Recursion → phiên mới Agent có thể nhắc: "Lần trước bạn đang học về Recursion, bạn có muốn tiếp tục không?"
- [x] AC3: Memory được extract BẤT ĐỒNG BỘ sau khi conversation kết thúc (không delay response)
- [x] AC4: Memory của user A không bao giờ xuất hiện trong context của user B (kiểm tra bằng 2 accounts riêng)
- [x] AC5: Nội dung memory: điểm yếu (weakness), sở thích học (preference), câu hỏi đã hỏi (question), tiến trình (progress)
- [x] AC6: SV xem memory tại /profile/memory — hiện list các memory entry theo tab type

---

### US-PRO-01: Weekly Learning Digest Email

> As a student, I want to receive a weekly email summarizing my learning progress.

**AC:**
- [x] AC1: Email gửi 8:00 AM thứ Hai hàng tuần (Asia/Ho_Chi_Minh timezone)
- [x] AC2: Chỉ gửi cho SV: is_active=true + email_subscribed=true + email_weekly_digest preference=true
- [x] AC3: Nội dung PHẢI cá nhân hóa — không phải template generic
- [x] AC4: Email bao gồm: tóm tắt tuần qua (bài đã nộp, điểm nhận), bài tập sắp tới (7 ngày tới), tip học từ AI dựa trên weakness memory
- [x] AC5: Email có nút "Vào học ngay" → link đến app
- [x] AC6: Email có link "Hủy đăng ký nhận email" → click → cập nhật preference → không gửi nữa
- [x] AC7: Nếu SV không có activity trong tuần → vẫn gửi nhưng content khác: "Tuần này bạn chưa có hoạt động. Hãy bắt đầu hôm nay!"
- [x] AC8: Email HTML đẹp, responsive, hiển thị tốt trên mobile

---

## 9. Validation Rules Đầy đủ

### 9.1 User Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| email | Required, valid email format (RFC 5322), max 255 chars, lowercase | "Email không hợp lệ" |
| password | Required, min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit | "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số" |
| full_name | Required, min 2 chars, max 255 chars, no leading/trailing spaces | "Họ tên phải có ít nhất 2 ký tự" |
| role | Required, one of: student, instructor | "Role không hợp lệ" |
| student_id | Required if role=student, max 20 chars, alphanumeric | "Mã sinh viên không được để trống" |
| avatar_url | Optional, valid URL, max 500 chars | "URL không hợp lệ" |

### 9.2 Course Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| title | Required, min 3 chars, max 255 chars | "Tên khóa học phải có ít nhất 3 ký tự" |
| course_code | Required, min 2 chars, max 20 chars, alphanumeric + dashes, unique | "Mã môn học đã tồn tại" / "Mã môn học chỉ chứa chữ cái, số và dấu gạch ngang" |
| description | Optional, max 5000 chars | |
| start_date | Optional, valid date format YYYY-MM-DD | "Ngày bắt đầu không hợp lệ" |
| end_date | Optional, after start_date if both provided | "Ngày kết thúc phải sau ngày bắt đầu" |
| max_students | Optional, integer ≥ 1 if provided | "Sĩ số tối đa phải là số nguyên dương" |

### 9.3 Assignment Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| title | Required, min 3 chars, max 255 chars | "Tiêu đề phải có ít nhất 3 ký tự" |
| description | Optional, max 10000 chars (Markdown) | |
| deadline | Required, must be future datetime | "Thời hạn phải ở tương lai" |
| max_score | Required, integer, 1-1000 | "Điểm tối đa phải từ 1 đến 1000" |
| submission_type | Required, enum: text/file/both | |
| allow_late_submission | Required boolean, default false | |
| is_published | Required boolean, default false | |

### 9.4 Submission Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| content | Required if submission_type=text/both, min 10 chars | "Nội dung câu trả lời phải có ít nhất 10 ký tự" |
| file | Required if submission_type=file/both, max 50MB, allowed types | "File không được vượt quá 50MB" / "Định dạng file không được hỗ trợ. Chấp nhận: PDF, DOCX, PPTX, TXT, ZIP" |

### 9.5 Grade Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| score | Required, number, 0 ≤ score ≤ max_score | "Điểm phải nằm trong khoảng 0 đến [max_score]" |
| feedback | Optional, max 2000 chars | |

### 9.6 AI Chat Fields

| Field | Validation | Error Message |
|-------|-----------|---------------|
| content | Required, min 1 char (after trim), max 2000 chars | "Vui lòng nhập câu hỏi" / "Câu hỏi tối đa 2000 ký tự" |
| course_id | Optional, must be course where user enrolled | "Bạn chưa đăng ký khóa học này" |

---

## 10. Error Messages (Vietnamese)

| HTTP Code | Error Code | Message hiển thị cho user |
|-----------|-----------|--------------------------|
| 400 | DEADLINE_PASSED | "Đã hết thời hạn nộp bài" |
| 400 | COURSE_NOT_OPEN | "Khóa học chưa mở đăng ký" |
| 400 | COURSE_FULL | "Khóa học đã đủ số lượng sinh viên" |
| 400 | ALREADY_ENROLLED | "Bạn đã đăng ký khóa học này" |
| 400 | SCORE_EXCEEDS_MAX | "Điểm không được vượt quá điểm tối đa ({max_score})" |
| 400 | FILE_TOO_LARGE | "File không được vượt quá 50MB" |
| 400 | INVALID_FILE_TYPE | "Định dạng file không được hỗ trợ" |
| 400 | ALREADY_GRADED | "Bài nộp này đã được chấm điểm" |
| 400 | NOT_ENROLLED | "Bạn chưa đăng ký khóa học này" |
| 400 | FUTURE_DEADLINE_REQUIRED | "Thời hạn phải ở tương lai" |
| 400 | RESET_TOKEN_USED | "Link đặt lại mật khẩu đã được sử dụng" |
| 400 | RESET_TOKEN_EXPIRED | "Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại." |
| 401 | INVALID_CREDENTIALS | "Email hoặc mật khẩu không đúng" |
| 401 | TOKEN_EXPIRED | "Phiên đăng nhập đã hết hạn. Đang làm mới..." |
| 401 | REFRESH_EXPIRED | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." |
| 401 | REFRESH_INVALID | "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." |
| 403 | ACCOUNT_SUSPENDED | "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ admin." |
| 403 | PERMISSION_DENIED | "Bạn không có quyền thực hiện hành động này" |
| 403 | NOT_COURSE_INSTRUCTOR | "Bạn không phải giảng viên của khóa học này" |
| 404 | COURSE_NOT_FOUND | "Khóa học không tồn tại" |
| 404 | ASSIGNMENT_NOT_FOUND | "Bài tập không tồn tại" |
| 404 | SUBMISSION_NOT_FOUND | "Bài nộp không tồn tại" |
| 404 | USER_NOT_FOUND | "Người dùng không tồn tại" |
| 409 | EMAIL_EXISTS | "Email đã được sử dụng" |
| 409 | COURSE_CODE_EXISTS | "Mã môn học đã tồn tại" |
| 409 | STUDENT_ID_EXISTS | "Mã sinh viên đã được sử dụng" |
| 422 | VALIDATION_ERROR | "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại." |
| 429 | RATE_LIMIT_EXCEEDED | "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ {seconds} giây." |
| 429 | AI_RATE_LIMIT | "Bạn đã gửi quá nhiều câu hỏi. Vui lòng chờ {seconds} giây." |
| 500 | INTERNAL_ERROR | "Đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ hỗ trợ." |
| 502 | AI_UNAVAILABLE | "Hệ thống AI tạm thời gián đoạn. Vui lòng thử lại sau ít phút." |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Yêu cầu | Target | Đo lường |
|---------|--------|---------|
| API response (non-AI) | p50 ≤ 200ms, p95 ≤ 500ms | Logging middleware |
| Page load (LCP) | ≤ 2.5 giây | Next.js Analytics |
| AI time-to-first-token | ≤ 2 giây | AI usage logs |
| AI completion time | ≤ 30 giây | AI usage logs |
| File upload (50MB) | ≤ 60 giây | - |
| Concurrent users | ≥ 100 đồng thời | Load test |
| DB query single record | ≤ 50ms | - |

### 11.2 Security

- HTTPS bắt buộc cho tất cả traffic
- JWT HS256, secret key ≥ 32 chars
- bcrypt cost factor = 12
- Tất cả file upload kiểm tra magic bytes (không tin extension/content-type)
- Rate limit per user (Redis)
- CORS chỉ allow listed origins
- SQL injection: dùng ORM parameterized queries, không raw SQL
- XSS: Content-Security-Policy headers, sanitize user input display
- Path traversal: sanitize filename khi lưu file

### 11.3 Accessibility & Browser Support

- Responsive: hoạt động tốt trên ≥ 375px width (iPhone SE)
- Browser support: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- Keyboard navigation: tất cả interactive elements accessible bằng Tab
- Loading states: tất cả async operations có skeleton/spinner
- Empty states: tất cả danh sách rỗng có message + call-to-action

### 11.4 Availability

- Uptime target: ≥ 99% trong giờ học (7:00 AM - 10:00 PM, thứ 2-7)
- Maintenance window: Chủ nhật 2:00 AM - 4:00 AM (nếu cần)
- Recovery Time Objective (RTO): ≤ 30 phút
- Recovery Point Objective (RPO): ≤ 24 giờ (daily backup)

---

## 12. System Automatic Behaviors (Scheduled Tasks)

| Task | Schedule | Logic |
|------|----------|-------|
| Deadline reminder 48h | Daily 9:00 AM ICT | Tìm assignments có deadline trong khoảng NOW+47h đến NOW+49h. Gửi notification cho SV enrolled chưa có submission. |
| Deadline reminder 24h | Daily 9:00 AM ICT | Tìm assignments có deadline trong khoảng NOW+23h đến NOW+25h. Gửi notification cho SV enrolled chưa có submission. |
| Weekly digest | Thứ Hai 8:00 AM ICT | Generate và gửi email cho tất cả SV active + subscribed. |
| Memory extraction | Ngay sau mỗi conversation | Async task: gọi Mem0 để extract facts từ conversation, update memories. |
| Document indexing | Ngay sau upload | Async task: extract text, chunk, embed, lưu vào pgvector, update is_indexed=true. |
| AI usage log aggregation | Daily 1:00 AM ICT | Tổng hợp AI cost theo user cho ngày hôm qua. (Optional phase 2) |

---

## 13. Sprint Roadmap Chi tiết

| Sprint | Duration | Deliverables chính |
|--------|----------|-------------------|
| **Sprint 1** | Tuần 1-2 | Setup infra (Docker, DB, migrations), Auth API (register/login/JWT), Course CRUD basic, LMS Web skeleton (layout, auth pages), Agent Web skeleton, Chat UI basic (no streaming) |
| **Sprint 2** | Tuần 3-4 | Assignment CRUD, File upload (submissions), Streaming SSE chat, Agent API basic (LangGraph setup), LMS Web: course detail, assignment list, submission form |
| **Sprint 3** | Tuần 5-6 | Grades API, Memory system MVP (Mem0 integration), Agent tools (get_grades, get_assignments), Notification system (in-app), LMS Web: grades page, notification bell |
| **Sprint 4** | Tuần 7-8 | RAG system (document indexing, pgvector search), Deadline reminders (Celery Beat), Email notifications (Resend), Grade notification, Agent tool: search_documents |
| **Sprint 5** | Tuần 9-10 | Weekly digest email, Memory UI (/profile/memory), Dashboard AI recommendation, Proactive features, LMS Web polish |
| **Sprint 6** | Tuần 11-12 | Analytics dashboard (student + instructor), Announcement feature, Admin panel basic, Performance optimization |
| **Sprint 7** | Tuần 13-14 | At-risk detection, Memory management (delete), Extension grants, Bug fixing, Security audit |
| **Sprint 8** | Tuần 15-16 | Performance tuning, Load testing, Documentation, Demo preparation, Final QA |

---

*Document này là nguồn sự thật cho tất cả tính năng. Mọi thay đổi phải update tài liệu này đồng thời với code.*
