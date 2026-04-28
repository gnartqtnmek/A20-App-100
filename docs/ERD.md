# ERD — Entity-Relationship Diagram & Database Design
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 2.0 | **Ngày:** 2026-04-27 | **Database:** PostgreSQL 15 + pgvector

> **Mục đích:** Backend dev đọc tài liệu này để tạo đúng schema, đúng constraints, đúng indexes. Mọi thay đổi schema phải tạo Alembic migration mới.

---

## 1. Danh sách Bảng

| # | Bảng | Mục đích |
|---|------|---------|
| 1 | `users` | Tài khoản người dùng (admin/instructor/student) |
| 2 | `refresh_tokens` | JWT refresh tokens (để revoke) |
| 3 | `password_reset_tokens` | Tokens đặt lại mật khẩu |
| 4 | `courses` | Khóa học |
| 5 | `enrollments` | Quan hệ SV ↔ Course |
| 6 | `course_documents` | Tài liệu upload lên course |
| 7 | `document_chunks` | Chunks từ tài liệu (cho RAG + pgvector) |
| 8 | `document_processing_logs` | Log quá trình index tài liệu |
| 9 | `course_announcements` | Thông báo của GV trong course |
| 10 | `assignments` | Bài tập |
| 11 | `assignment_extensions` | Gia hạn deadline cho SV cụ thể |
| 12 | `submissions` | Bài nộp của SV |
| 13 | `grades` | Điểm số |
| 14 | `notifications` | Thông báo in-app |
| 15 | `user_notification_preferences` | Cài đặt thông báo per user |
| 16 | `email_logs` | Log email đã gửi |
| 17 | `conversations` | Cuộc trò chuyện với AI Agent |
| 18 | `messages` | Tin nhắn trong conversation |
| 19 | `memories` | Memories của AI về từng user |
| 20 | `ai_usage_logs` | Log usage + cost của AI API |
| 21 | `weekly_digests` | Lịch sử weekly digest emails |

---

## 2. Chi tiết Từng Bảng

### 2.1 Bảng `users`

**Mục đích:** Lưu tất cả tài khoản. Là bảng trung tâm của hệ thống.

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | Primary key |
| `email` | VARCHAR(255) | NOT NULL | — | UNIQUE | Email đăng nhập, lowercase |
| `hashed_password` | VARCHAR(255) | NOT NULL | — | — | bcrypt hash |
| `full_name` | VARCHAR(255) | NOT NULL | — | — | Họ và tên đầy đủ |
| `role` | VARCHAR(20) | NOT NULL | — | CHECK IN ('admin','instructor','student') | Phân quyền |
| `student_id` | VARCHAR(20) | NULL | NULL | UNIQUE (nullable) | Mã SV, chỉ có nếu role=student |
| `avatar_url` | VARCHAR(500) | NULL | NULL | — | URL ảnh đại diện |
| `is_active` | BOOLEAN | NOT NULL | TRUE | — | FALSE = tài khoản bị khóa |
| `email_subscribed` | BOOLEAN | NOT NULL | TRUE | — | Cho phép nhận email không |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | Auto-update qua trigger |

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    student_id VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_student_id_unique UNIQUE (student_id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);          -- Lookup by email (login)
CREATE INDEX idx_users_role ON users(role);             -- Filter by role
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE; -- Active users only
```

**Business Rules ở DB level:**
- Email lưu lowercase (enforce ở application layer trước khi INSERT)
- student_id chỉ unique với non-NULL values (PostgreSQL UNIQUE constraint bỏ qua NULL)

---

### 2.2 Bảng `refresh_tokens`

**Mục đích:** Lưu refresh tokens để có thể revoke khi user logout hoặc bị khóa.

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE DELETE | |
| `token_hash` | VARCHAR(64) | NOT NULL | — | UNIQUE | SHA-256 hash của token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | — | Thời hạn của token |
| `revoked_at` | TIMESTAMPTZ | NULL | NULL | — | Thời điểm bị revoke |
| `device_info` | VARCHAR(255) | NULL | NULL | — | User-Agent (optional) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    device_info VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
-- Periodic cleanup: DELETE WHERE expires_at < NOW() OR revoked_at IS NOT NULL
```

**Logic:**
- Khi verify refresh token: tìm theo `token_hash = SHA256(input_token)`, check `expires_at > NOW()` và `revoked_at IS NULL`
- Khi logout: SET revoked_at = NOW() WHERE token_hash = ?
- Khi khóa tài khoản: DELETE FROM refresh_tokens WHERE user_id = ?

---

### 2.3 Bảng `password_reset_tokens`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `token_hash` | VARCHAR(64) | NOT NULL | — | UNIQUE | SHA-256 hash |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | — | NOW() + 1 hour |
| `used_at` | TIMESTAMPTZ | NULL | NULL | — | Đặt khi dùng xong |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);
```

---

### 2.4 Bảng `courses`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `title` | VARCHAR(255) | NOT NULL | — | — | Tên khóa học |
| `description` | TEXT | NULL | NULL | — | Markdown |
| `course_code` | VARCHAR(20) | NOT NULL | — | UNIQUE | Mã môn, uppercase |
| `instructor_id` | UUID | NOT NULL | — | FK → users.id RESTRICT | GV phụ trách |
| `start_date` | DATE | NULL | NULL | — | Ngày bắt đầu |
| `end_date` | DATE | NULL | NULL | — | Ngày kết thúc |
| `max_students` | INTEGER | NULL | NULL | CHECK > 0 | NULL = không giới hạn |
| `is_open` | BOOLEAN | NOT NULL | FALSE | — | SV có thể tự enroll |
| `is_archived` | BOOLEAN | NOT NULL | FALSE | — | Ẩn khỏi tìm kiếm |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_code VARCHAR(20) NOT NULL,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date DATE,
    end_date DATE,
    max_students INTEGER CHECK (max_students > 0),
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT courses_code_unique UNIQUE (course_code),
    CONSTRAINT courses_date_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_open ON courses(is_open, is_archived) WHERE is_open = TRUE AND is_archived = FALSE;
CREATE INDEX idx_courses_code ON courses(course_code);
-- Full-text search index (nếu cần tìm kiếm)
CREATE INDEX idx_courses_title_fts ON courses USING gin(to_tsvector('simple', title));
```

**ON DELETE RESTRICT cho instructor_id:** Không cho xóa user nếu còn là instructor của course nào.

---

### 2.5 Bảng `enrollments`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `student_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `course_id` | UUID | NOT NULL | — | FK → courses.id CASCADE | |
| `enrolled_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | Lần đầu enroll |
| `status` | VARCHAR(20) | NOT NULL | 'active' | CHECK IN ('active','dropped','completed') | |
| `dropped_at` | TIMESTAMPTZ | NULL | NULL | — | Thời điểm drop (nếu có) |

```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'dropped', 'completed')),
    dropped_at TIMESTAMPTZ,
    CONSTRAINT enrollments_unique UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_course ON enrollments(course_id, status);
-- Query "active students of course":
-- SELECT * FROM enrollments WHERE course_id = ? AND status = 'active'
```

**Lưu ý:** UNIQUE(student_id, course_id) đảm bảo không duplicate. Khi re-enroll: UPDATE status='active' thay vì INSERT mới.

---

### 2.6 Bảng `course_documents`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `course_id` | UUID | NOT NULL | — | FK → courses.id CASCADE | |
| `filename` | VARCHAR(255) | NOT NULL | — | — | Tên file gốc (đã sanitize) |
| `storage_path` | VARCHAR(500) | NOT NULL | — | — | Đường dẫn trên server |
| `file_type` | VARCHAR(10) | NOT NULL | — | CHECK IN ('pdf','docx','pptx','txt','zip') | |
| `file_size_bytes` | INTEGER | NOT NULL | — | CHECK > 0 | |
| `is_indexed` | BOOLEAN | NOT NULL | FALSE | — | Đã embed vào vector store |
| `index_status` | VARCHAR(20) | NOT NULL | 'pending' | CHECK IN ('pending','processing','indexed','failed') | |
| `error_message` | TEXT | NULL | NULL | — | Lỗi nếu index_status='failed' |
| `uploaded_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `uploaded_by` | UUID | NOT NULL | — | FK → users.id RESTRICT | |

```sql
CREATE TABLE course_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf','docx','pptx','txt','zip')),
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
    is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    index_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (index_status IN ('pending','processing','indexed','failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_docs_course ON course_documents(course_id);
CREATE INDEX idx_docs_indexed ON course_documents(course_id, is_indexed) WHERE is_indexed = TRUE;
```

---

### 2.7 Bảng `document_chunks` (Vector Store)

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `document_id` | UUID | NOT NULL | — | FK → course_documents.id CASCADE | |
| `chunk_index` | INTEGER | NOT NULL | — | — | Thứ tự chunk trong document |
| `content` | TEXT | NOT NULL | — | — | Nội dung text của chunk |
| `embedding` | VECTOR(1536) | NULL | NULL | — | OpenAI text-embedding-3-small |
| `page_number` | INTEGER | NULL | NULL | — | Số trang (nếu PDF) |
| `section_title` | VARCHAR(255) | NULL | NULL | — | Tiêu đề section |
| `token_count` | INTEGER | NULL | NULL | — | Số tokens trong chunk |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES course_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    page_number INTEGER,
    section_title VARCHAR(255),
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chunks_unique UNIQUE (document_id, chunk_index)
);

-- B-tree index để lookup chunks của 1 document
CREATE INDEX idx_chunks_document ON document_chunks(document_id, chunk_index);

-- IVFFlat index cho approximate nearest neighbor search
-- lists = sqrt(số rows ≈ 100 cho < 100K chunks)
-- Chỉ index rows có embedding (sau khi embed xong)
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
    WHERE embedding IS NOT NULL;
```

**Lưu ý về ivfflat:**
- `vector_cosine_ops`: dùng cosine similarity (phù hợp nhất cho embeddings)
- `lists = 100`: phù hợp khi có ~100K chunks. Tăng lên 200 nếu > 500K chunks
- Sau khi insert nhiều rows, chạy `VACUUM ANALYZE document_chunks;` để rebuild index

**RAG Query Example:**
```sql
SELECT dc.content, dc.page_number, dc.section_title,
       cd.filename, cd.course_id,
       1 - (dc.embedding <=> $1::vector) AS similarity
FROM document_chunks dc
JOIN course_documents cd ON dc.document_id = cd.id
WHERE cd.course_id = $2
  AND cd.is_indexed = TRUE
  AND dc.embedding IS NOT NULL
ORDER BY dc.embedding <=> $1::vector
LIMIT 5;
-- $1 = query embedding (1536 floats)
-- $2 = course_id UUID
-- Chỉ trả về rows có similarity >= 0.7 ở application layer
```

---

### 2.8 Bảng `document_processing_logs`

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `document_id` | UUID | NOT NULL | — | FK → course_documents.id CASCADE |
| `status` | VARCHAR(20) | NOT NULL | — | 'started','completed','failed' |
| `chunks_created` | INTEGER | NULL | NULL | Số chunks đã tạo |
| `error_message` | TEXT | NULL | NULL | |
| `started_at` | TIMESTAMPTZ | NOT NULL | NOW() | |
| `completed_at` | TIMESTAMPTZ | NULL | NULL | |

```sql
CREATE TABLE document_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES course_documents(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('started','completed','failed')),
    chunks_created INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_dpl_document ON document_processing_logs(document_id);
```

---

### 2.9 Bảng `course_announcements`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `course_id` | UUID | NOT NULL | — | FK → courses.id CASCADE | |
| `author_id` | UUID | NOT NULL | — | FK → users.id RESTRICT | GV tạo |
| `title` | VARCHAR(255) | NOT NULL | — | — | |
| `content` | TEXT | NOT NULL | — | — | Markdown |
| `is_pinned` | BOOLEAN | NOT NULL | FALSE | — | Ghim lên đầu |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE course_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_announcements_course ON course_announcements(course_id, created_at DESC);
CREATE INDEX idx_announcements_pinned ON course_announcements(course_id, is_pinned) WHERE is_pinned = TRUE;
```

---

### 2.10 Bảng `assignments`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `course_id` | UUID | NOT NULL | — | FK → courses.id CASCADE | |
| `created_by` | UUID | NOT NULL | — | FK → users.id RESTRICT | |
| `title` | VARCHAR(255) | NOT NULL | — | — | |
| `description` | TEXT | NULL | NULL | — | Markdown |
| `deadline` | TIMESTAMPTZ | NOT NULL | — | — | Thời hạn nộp |
| `max_score` | INTEGER | NOT NULL | 100 | CHECK 1..1000 | Điểm tối đa |
| `allow_late_submission` | BOOLEAN | NOT NULL | FALSE | — | |
| `submission_type` | VARCHAR(10) | NOT NULL | 'both' | CHECK IN ('text','file','both') | |
| `is_published` | BOOLEAN | NOT NULL | FALSE | — | SV thấy khi TRUE |
| `is_deleted` | BOOLEAN | NOT NULL | FALSE | — | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100 CHECK (max_score BETWEEN 1 AND 1000),
    allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
    submission_type VARCHAR(10) NOT NULL DEFAULT 'both'
        CHECK (submission_type IN ('text', 'file', 'both')),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_course ON assignments(course_id, is_deleted, is_published);
CREATE INDEX idx_assignments_deadline ON assignments(deadline) WHERE is_published = TRUE AND is_deleted = FALSE;
-- Query SV xem bài tập của 1 course:
-- WHERE course_id = ? AND is_published = TRUE AND is_deleted = FALSE ORDER BY deadline ASC
```

---

### 2.11 Bảng `assignment_extensions`

**Mục đích:** GV gia hạn deadline cho 1 SV cụ thể.

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `assignment_id` | UUID | NOT NULL | — | FK → assignments.id CASCADE |
| `student_id` | UUID | NOT NULL | — | FK → users.id CASCADE |
| `new_deadline` | TIMESTAMPTZ | NOT NULL | — | Deadline mới của SV này |
| `reason` | TEXT | NULL | NULL | Lý do gia hạn |
| `granted_by` | UUID | NOT NULL | — | FK → users.id RESTRICT (GV) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | |

```sql
CREATE TABLE assignment_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    new_deadline TIMESTAMPTZ NOT NULL,
    reason TEXT,
    granted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ext_unique UNIQUE (assignment_id, student_id)
);
CREATE INDEX idx_ext_student_assign ON assignment_extensions(student_id, assignment_id);
```

**Logic trong submission check:**
```sql
-- Lấy effective deadline cho 1 SV:
SELECT COALESCE(ae.new_deadline, a.deadline) AS effective_deadline
FROM assignments a
LEFT JOIN assignment_extensions ae
  ON ae.assignment_id = a.id AND ae.student_id = $student_id
WHERE a.id = $assignment_id;
```

---

### 2.12 Bảng `submissions`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `assignment_id` | UUID | NOT NULL | — | FK → assignments.id CASCADE | |
| `student_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `content` | TEXT | NULL | NULL | — | Text submission |
| `file_path` | VARCHAR(500) | NULL | NULL | — | Path của file |
| `file_name` | VARCHAR(255) | NULL | NULL | — | Tên file gốc |
| `file_size_bytes` | INTEGER | NULL | NULL | — | |
| `submitted_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | Thời điểm nộp |
| `is_late` | BOOLEAN | NOT NULL | FALSE | — | Tính bởi application |
| `attempt_number` | INTEGER | NOT NULL | 1 | CHECK ≥ 1 | Lần nộp thứ mấy |

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_bytes INTEGER,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
    CONSTRAINT submissions_unique UNIQUE (assignment_id, student_id),
    CONSTRAINT submissions_content_check CHECK (content IS NOT NULL OR file_path IS NOT NULL)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_student_assign ON submissions(student_id, assignment_id);
```

**UNIQUE(assignment_id, student_id):** Mỗi SV chỉ có 1 row per assignment. Nộp lại = UPDATE (không INSERT mới).

---

### 2.13 Bảng `grades`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `submission_id` | UUID | NULL | NULL | FK → submissions.id SET NULL | NULL nếu nhập thủ công |
| `assignment_id` | UUID | NOT NULL | — | FK → assignments.id CASCADE | |
| `student_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `graded_by` | UUID | NOT NULL | — | FK → users.id RESTRICT | |
| `score` | NUMERIC(7,2) | NOT NULL | — | CHECK ≥ 0 | |
| `max_score` | NUMERIC(7,2) | NOT NULL | — | CHECK > 0 | |
| `feedback` | TEXT | NULL | NULL | — | Nhận xét GV |
| `grade_type` | VARCHAR(20) | NOT NULL | 'assignment' | CHECK IN (...) | |
| `graded_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    score NUMERIC(7,2) NOT NULL CHECK (score >= 0),
    max_score NUMERIC(7,2) NOT NULL CHECK (max_score > 0),
    feedback TEXT,
    grade_type VARCHAR(20) NOT NULL DEFAULT 'assignment'
        CHECK (grade_type IN ('assignment','midterm','final','participation','bonus')),
    graded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT grades_score_max CHECK (score <= max_score),
    CONSTRAINT grades_unique UNIQUE (student_id, assignment_id)
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_grades_student_type ON grades(student_id, grade_type);
```

---

### 2.14 Bảng `notifications`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `type` | VARCHAR(50) | NOT NULL | — | CHECK IN (...) | |
| `title` | VARCHAR(255) | NOT NULL | — | — | |
| `body` | TEXT | NOT NULL | — | — | |
| `resource_type` | VARCHAR(30) | NULL | NULL | — | 'assignment','grade','course','announcement' |
| `resource_id` | UUID | NULL | NULL | — | ID của resource liên quan |
| `is_read` | BOOLEAN | NOT NULL | FALSE | — | |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `read_at` | TIMESTAMPTZ | NULL | NULL | — | |

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'new_assignment','deadline_reminder_48h','deadline_reminder_24h',
        'grade_released','submission_confirmed','new_submission',
        'enrollment_confirmed','student_enrolled','new_announcement',
        'account_suspended','system'
    )),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    resource_type VARCHAR(30),
    resource_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read, created_at DESC)
    WHERE is_read = FALSE;
CREATE INDEX idx_notif_user_all ON notifications(user_id, created_at DESC);
```

---

### 2.15 Bảng `user_notification_preferences`

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE, UNIQUE |
| `email_new_assignment` | BOOLEAN | NOT NULL | TRUE | |
| `email_deadline_reminder` | BOOLEAN | NOT NULL | TRUE | |
| `email_grade_released` | BOOLEAN | NOT NULL | TRUE | |
| `email_submission_confirmed` | BOOLEAN | NOT NULL | TRUE | |
| `email_weekly_digest` | BOOLEAN | NOT NULL | TRUE | |
| `email_announcements` | BOOLEAN | NOT NULL | FALSE | Default off |
| `inapp_new_assignment` | BOOLEAN | NOT NULL | TRUE | |
| `inapp_deadline_reminder` | BOOLEAN | NOT NULL | TRUE | |
| `inapp_grade_released` | BOOLEAN | NOT NULL | TRUE | |
| `inapp_new_submission` | BOOLEAN | NOT NULL | TRUE | GV nhận khi SV nộp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | |

```sql
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_new_assignment BOOLEAN NOT NULL DEFAULT TRUE,
    email_deadline_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    email_grade_released BOOLEAN NOT NULL DEFAULT TRUE,
    email_submission_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    email_weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
    email_announcements BOOLEAN NOT NULL DEFAULT FALSE,
    inapp_new_assignment BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_deadline_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_grade_released BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_new_submission BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unp_user_unique UNIQUE (user_id)
);
```

---

### 2.16 Bảng `email_logs`

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `user_id` | UUID | NULL | NULL | FK → users.id SET NULL (NULL nếu user bị xóa) |
| `template_name` | VARCHAR(50) | NOT NULL | — | Tên template email |
| `to_email` | VARCHAR(255) | NOT NULL | — | Email nhận |
| `subject` | VARCHAR(255) | NOT NULL | — | |
| `status` | VARCHAR(20) | NOT NULL | — | 'sent','failed','bounced' |
| `provider_message_id` | VARCHAR(255) | NULL | NULL | ID từ Resend |
| `error_message` | TEXT | NULL | NULL | |
| `sent_at` | TIMESTAMPTZ | NOT NULL | NOW() | |

```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    template_name VARCHAR(50) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent','failed','bounced')),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_logs_user ON email_logs(user_id, sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status, sent_at DESC);
```

---

### 2.17 Bảng `conversations`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `course_id` | UUID | NULL | NULL | FK → courses.id SET NULL | Context course |
| `title` | VARCHAR(255) | NULL | NULL | — | Auto-generated |
| `is_deleted` | BOOLEAN | NOT NULL | FALSE | — | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `last_message_at` | TIMESTAMPTZ | NULL | NULL | — | Cho sorting |

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

CREATE INDEX idx_conv_user ON conversations(user_id, is_deleted, last_message_at DESC);
CREATE INDEX idx_conv_course ON conversations(course_id) WHERE course_id IS NOT NULL;
```

---

### 2.18 Bảng `messages`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `conversation_id` | UUID | NOT NULL | — | FK → conversations.id CASCADE | |
| `role` | VARCHAR(20) | NOT NULL | — | CHECK IN ('user','assistant','system') | |
| `content` | TEXT | NOT NULL | — | — | Nội dung |
| `tool_calls` | JSONB | NULL | NULL | — | Tool calls metadata |
| `sources` | JSONB | NULL | NULL | — | RAG sources [{doc, page}] |
| `tokens_used` | INTEGER | NULL | NULL | — | Tokens của response này |
| `model_used` | VARCHAR(50) | NULL | NULL | — | Model name |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    sources JSONB,
    tokens_used INTEGER,
    model_used VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at ASC);
-- Load conversation: SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
```

---

### 2.19 Bảng `memories`

| Column | Type | Nullable | Default | Constraint | Mô tả |
|--------|------|---------|---------|-----------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE | |
| `mem0_memory_id` | VARCHAR(255) | NULL | NULL | UNIQUE | ID từ Mem0 (nếu dùng Mem0 hosted) |
| `memory_type` | VARCHAR(30) | NOT NULL | — | CHECK IN (...) | |
| `content` | TEXT | NOT NULL | — | — | Nội dung memory |
| `course_id` | UUID | NULL | NULL | FK → courses.id SET NULL | Liên quan đến course nào |
| `topic` | VARCHAR(100) | NULL | NULL | — | Chủ đề (vd: "Recursion") |
| `source` | VARCHAR(20) | NOT NULL | 'mem0' | — | 'mem0' hoặc 'manual' |
| `relevance_score` | FLOAT | NULL | NULL | — | Score từ Mem0 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | — | |
| `expires_at` | TIMESTAMPTZ | NULL | NULL | — | NULL = permanent |

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mem0_memory_id VARCHAR(255) UNIQUE,
    memory_type VARCHAR(30) NOT NULL
        CHECK (memory_type IN ('weakness','preference','question','progress','achievement','other')),
    content TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    topic VARCHAR(100),
    source VARCHAR(20) NOT NULL DEFAULT 'mem0',
    relevance_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_memories_user ON memories(user_id, memory_type);
CREATE INDEX idx_memories_user_course ON memories(user_id, course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_memories_expires ON memories(expires_at) WHERE expires_at IS NOT NULL;
-- CRITICAL: Mọi query memory PHẢI có WHERE user_id = ?
```

---

### 2.20 Bảng `ai_usage_logs`

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `user_id` | UUID | NULL | NULL | FK → users.id SET NULL |
| `conversation_id` | UUID | NULL | NULL | FK → conversations.id SET NULL |
| `provider` | VARCHAR(20) | NOT NULL | — | 'anthropic' / 'openai' |
| `model` | VARCHAR(50) | NOT NULL | — | Model name |
| `input_tokens` | INTEGER | NOT NULL | — | |
| `output_tokens` | INTEGER | NOT NULL | — | |
| `cost_usd` | NUMERIC(10,6) | NOT NULL | — | Chi phí USD |
| `request_type` | VARCHAR(20) | NOT NULL | — | 'chat' / 'embedding' / 'memory' |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | |

```sql
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('anthropic','openai')),
    model VARCHAR(50) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('chat','embedding','memory')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_logs_date ON ai_usage_logs(created_at DESC);
-- Monthly cost: SELECT SUM(cost_usd) FROM ai_usage_logs WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
```

---

### 2.21 Bảng `weekly_digests`

| Column | Type | Nullable | Default | Mô tả |
|--------|------|---------|---------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | |
| `user_id` | UUID | NOT NULL | — | FK → users.id CASCADE |
| `week_start` | DATE | NOT NULL | — | Thứ Hai của tuần |
| `week_end` | DATE | NOT NULL | — | Chủ Nhật của tuần |
| `content_summary` | JSONB | NULL | NULL | Tóm tắt nội dung (để debug) |
| `is_sent` | BOOLEAN | NOT NULL | FALSE | |
| `sent_at` | TIMESTAMPTZ | NULL | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | |

```sql
CREATE TABLE weekly_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content_summary JSONB,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wd_unique UNIQUE (user_id, week_start)
);
CREATE INDEX idx_wd_user ON weekly_digests(user_id, week_start DESC);
```

---

## 3. Database Functions

### 3.1 calculate_course_gpa()

```sql
CREATE OR REPLACE FUNCTION calculate_course_gpa(
    p_student_id UUID,
    p_course_id UUID
) RETURNS NUMERIC(5,2) AS $$
DECLARE
    v_gpa NUMERIC(5,2);
BEGIN
    SELECT ROUND(AVG(score / max_score * 10), 2)
    INTO v_gpa
    FROM grades g
    JOIN assignments a ON g.assignment_id = a.id
    WHERE g.student_id = p_student_id
      AND a.course_id = p_course_id
      AND g.score IS NOT NULL;
    
    RETURN COALESCE(v_gpa, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage: SELECT calculate_course_gpa('student-uuid', 'course-uuid');
```

### 3.2 get_effective_deadline()

```sql
CREATE OR REPLACE FUNCTION get_effective_deadline(
    p_assignment_id UUID,
    p_student_id UUID
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
BEGIN
    SELECT COALESCE(ae.new_deadline, a.deadline)
    INTO v_deadline
    FROM assignments a
    LEFT JOIN assignment_extensions ae
        ON ae.assignment_id = a.id AND ae.student_id = p_student_id
    WHERE a.id = p_assignment_id;
    
    RETURN v_deadline;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3.3 get_submission_status()

```sql
CREATE OR REPLACE FUNCTION get_submission_status(
    p_assignment_id UUID,
    p_student_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_submission submissions%ROWTYPE;
    v_grade grades%ROWTYPE;
    v_deadline TIMESTAMPTZ;
    v_allow_late BOOLEAN;
BEGIN
    SELECT * INTO v_submission
    FROM submissions WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
    
    IF v_submission.id IS NULL THEN
        SELECT get_effective_deadline(p_assignment_id, p_student_id) INTO v_deadline;
        SELECT allow_late_submission INTO v_allow_late FROM assignments WHERE id = p_assignment_id;
        
        IF NOW() > v_deadline AND NOT v_allow_late THEN
            RETURN 'overdue';
        ELSE
            RETURN 'not_submitted';
        END IF;
    END IF;
    
    SELECT * INTO v_grade FROM grades WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
    
    IF v_grade.id IS NOT NULL THEN
        IF v_submission.is_late THEN RETURN 'late_graded'; ELSE RETURN 'graded'; END IF;
    ELSE
        IF v_submission.is_late THEN RETURN 'late'; ELSE RETURN 'submitted'; END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 4. Triggers

### 4.1 Auto-update `updated_at`

```sql
-- Function dùng chung cho tất cả bảng
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng cho từng bảng
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (tương tự cho các bảng khác có updated_at)
```

### 4.2 Auto-create notification preferences khi tạo user

```sql
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_create_prefs
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
```

### 4.3 Auto-update `last_message_at` trên conversation

```sql
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_message_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
```

---

## 5. Seed Data Script

```sql
-- ========================================
-- SEED DATA CHO DEVELOPMENT/TESTING
-- ========================================

-- Admin user (password: Admin@123456)
INSERT INTO users (id, email, hashed_password, full_name, role, is_active) VALUES
('00000000-0000-0000-0000-000000000001',
 'admin@lms.test',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLQ/', -- bcrypt('Admin@123456')
 'Admin Hệ thống', 'admin', TRUE);

-- Instructors (password: Giaovien@123456)
INSERT INTO users (id, email, hashed_password, full_name, role, is_active) VALUES
('00000000-0000-0000-0000-000000000002',
 'gv.tran@lms.test', '$2b$12$...', 'Trần Thị B', 'instructor', TRUE),
('00000000-0000-0000-0000-000000000003',
 'gv.le@lms.test', '$2b$12$...', 'Lê Văn C', 'instructor', TRUE);

-- Students (password: Sinhvien@123456)
INSERT INTO users (id, email, hashed_password, full_name, role, student_id) VALUES
('00000000-0000-0000-0000-000000000004',
 'sv.nguyen@lms.test', '$2b$12$...', 'Nguyễn Văn A', 'student', '20210001'),
('00000000-0000-0000-0000-000000000005',
 'sv.pham@lms.test', '$2b$12$...', 'Phạm Thị D', 'student', '20210002'),
('00000000-0000-0000-0000-000000000006',
 'sv.hoang@lms.test', '$2b$12$...', 'Hoàng Minh E', 'student', '20210003');

-- Courses
INSERT INTO courses (id, title, course_code, instructor_id, is_open, max_students) VALUES
('10000000-0000-0000-0000-000000000001',
 'Cấu trúc Dữ liệu và Giải thuật', 'CS201',
 '00000000-0000-0000-0000-000000000002', TRUE, 60),
('10000000-0000-0000-0000-000000000002',
 'Toán Rời rạc cho CNTT', 'MATH201',
 '00000000-0000-0000-0000-000000000003', TRUE, 50);

-- Enrollments
INSERT INTO enrollments (student_id, course_id, status) VALUES
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'active'),
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'active'),
('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'active'),
('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'active');

-- Assignments
INSERT INTO assignments (id, course_id, created_by, title, deadline, max_score, is_published, submission_type) VALUES
('20000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000002',
 'Bài tập 1: Implement Linked List',
 NOW() + INTERVAL '7 days', 100, TRUE, 'file'),
('20000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000002',
 'Bài tập 2: Binary Tree',
 NOW() + INTERVAL '14 days', 100, TRUE, 'file');
```

---

## 6. Common Query Patterns

### 6.1 Dashboard Student — Upcoming Assignments

```sql
SELECT
    a.id, a.title, a.deadline, a.max_score, a.allow_late_submission,
    c.title AS course_title, c.course_code,
    s.id AS submission_id, s.submitted_at, s.is_late,
    g.score, g.feedback,
    get_submission_status(a.id, $student_id) AS status,
    COALESCE(ae.new_deadline, a.deadline) AS effective_deadline
FROM assignments a
JOIN courses c ON a.course_id = c.id
JOIN enrollments e ON e.course_id = c.id AND e.student_id = $student_id AND e.status = 'active'
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $student_id
LEFT JOIN grades g ON g.assignment_id = a.id AND g.student_id = $student_id
LEFT JOIN assignment_extensions ae ON ae.assignment_id = a.id AND ae.student_id = $student_id
WHERE a.is_published = TRUE
  AND a.is_deleted = FALSE
  AND COALESCE(ae.new_deadline, a.deadline) >= NOW() - INTERVAL '1 day'
ORDER BY effective_deadline ASC
LIMIT 10;
```

### 6.2 Instructor — Submission Overview

```sql
SELECT
    u.full_name, u.student_id,
    s.submitted_at, s.is_late, s.file_name,
    g.score, g.feedback, g.graded_at,
    CASE
        WHEN g.id IS NOT NULL THEN 'graded'
        WHEN s.id IS NOT NULL AND s.is_late THEN 'late'
        WHEN s.id IS NOT NULL THEN 'submitted'
        ELSE 'not_submitted'
    END AS status
FROM enrollments e
JOIN users u ON u.id = e.student_id
LEFT JOIN submissions s ON s.assignment_id = $assignment_id AND s.student_id = u.id
LEFT JOIN grades g ON g.assignment_id = $assignment_id AND g.student_id = u.id
WHERE e.course_id = (SELECT course_id FROM assignments WHERE id = $assignment_id)
  AND e.status = 'active'
ORDER BY u.full_name;
```

### 6.3 Celery Beat — Find Students Needing Deadline Reminder

```sql
-- SV cần nhắc 48h (chạy lúc 9AM, tìm deadline từ 8AM-10AM ngày kia)
SELECT DISTINCT
    u.id AS user_id, u.email, u.full_name,
    a.id AS assignment_id, a.title AS assignment_title,
    COALESCE(ae.new_deadline, a.deadline) AS effective_deadline,
    c.title AS course_title, c.course_code,
    np.email_deadline_reminder
FROM assignments a
JOIN courses c ON c.id = a.course_id
JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
JOIN users u ON u.id = e.student_id AND u.is_active = TRUE
JOIN user_notification_preferences np ON np.user_id = u.id
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
LEFT JOIN assignment_extensions ae ON ae.assignment_id = a.id AND ae.student_id = u.id
WHERE s.id IS NULL  -- Chưa nộp
  AND a.is_published = TRUE
  AND a.is_deleted = FALSE
  AND COALESCE(ae.new_deadline, a.deadline)
      BETWEEN NOW() + INTERVAL '47 hours' AND NOW() + INTERVAL '49 hours';
```

---

*ERD này là nguồn sự thật cho database schema. Mọi thay đổi PHẢI tạo Alembic migration mới và update tài liệu này.*
