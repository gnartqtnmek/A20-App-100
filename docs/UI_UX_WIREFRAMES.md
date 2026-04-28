# UI/UX Design Specification & Wireframes
## AI20K-015: LMS Chatbot Có Trí Nhớ
**Version:** 2.0 | **Date:** 2026-04-27 | **Design Tool:** Figma (link: TBD)

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Layout & Navigation Patterns](#2-layout--navigation-patterns)
3. [Authentication Screens](#3-authentication-screens)
4. [Student Dashboard](#4-student-dashboard)
5. [Course Screens](#5-course-screens)
6. [Assignment Screens](#6-assignment-screens)
7. [Grade Screens](#7-grade-screens)
8. [Notification Center](#8-notification-center)
9. [AI Agent Chat](#9-ai-agent-chat)
10. [Memory Management](#10-memory-management)
11. [Instructor Screens](#11-instructor-screens)
12. [Admin Panel](#12-admin-panel)
13. [Component States](#13-component-states)
14. [Responsive Breakpoints](#14-responsive-breakpoints)
15. [Interaction Patterns](#15-interaction-patterns)
16. [Error & Empty States](#16-error--empty-states)
17. [Accessibility Specifications](#17-accessibility-specifications)

---

## 1. Design System

### 1.1 Color Palette

```
PRIMARY COLORS
┌────────────────────────────────────────────────────────────┐
│  Brand Blue       #2563EB   (primary actions, links)       │
│  Brand Blue Dark  #1D4ED8   (hover state)                  │
│  Brand Blue Light #DBEAFE   (selected background, badges)  │
├────────────────────────────────────────────────────────────┤
│  NEUTRAL SCALE                                             │
│  Gray 950  #0A0A0A  (headings)                            │
│  Gray 800  #1F2937  (body text)                            │
│  Gray 600  #4B5563  (secondary text, labels)               │
│  Gray 400  #9CA3AF  (placeholder, disabled text)           │
│  Gray 200  #E5E7EB  (borders, dividers)                    │
│  Gray 100  #F3F4F6  (input background, table row hover)    │
│  Gray 50   #F9FAFB  (page background)                      │
│  White     #FFFFFF  (card background)                      │
├────────────────────────────────────────────────────────────┤
│  SEMANTIC COLORS                                           │
│  Success Green    #16A34A  (submitted, released, active)   │
│  Success Light    #DCFCE7  (success badge background)      │
│  Warning Amber    #D97706  (due soon, pending)             │
│  Warning Light    #FEF3C7  (warning badge background)      │
│  Error Red        #DC2626  (late, error, destructive)      │
│  Error Light      #FEE2E2  (error badge background)        │
│  Info Purple      #7C3AED  (AI-related elements)           │
│  Info Purple Light #EDE9FE  (AI badge background)          │
└────────────────────────────────────────────────────────────┘

USAGE RULES:
- Blue: Primary CTA buttons, active nav items, links
- Purple: Everything AI-related (chat bubble, memory badge, AI icon)
- Green: Submitted status, graded status, online indicators
- Amber: Due-soon warnings (< 48h), pending review
- Red: Overdue/late, delete actions, error messages
- Never use red for primary actions (only destructive)
```

### 1.2 Typography

```
FONT FAMILY: Inter (Google Fonts)
Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

SCALE:
┌─────────────────┬──────┬────────┬──────────────────────────┐
│ Token           │ Size │ Weight │ Usage                    │
├─────────────────┼──────┼────────┼──────────────────────────┤
│ text-3xl        │ 30px │ 700    │ Page titles              │
│ text-2xl        │ 24px │ 700    │ Section headings         │
│ text-xl         │ 20px │ 600    │ Card titles, modal heads │
│ text-lg         │ 18px │ 600    │ Sub-section labels       │
│ text-base       │ 16px │ 400    │ Body text (default)      │
│ text-sm         │ 14px │ 400    │ Captions, metadata       │
│ text-xs         │ 12px │ 500    │ Badges, labels, tags     │
└─────────────────┴──────┴────────┴──────────────────────────┘

LINE HEIGHT: 1.5× font size (body), 1.2× (headings)
LETTER SPACING: -0.01em for headings, 0 for body
```

### 1.3 Spacing System (8px base grid)

```
4px   = 0.5 spacing unit  → icon internal padding
8px   = 1 unit            → tight gaps, badge padding
12px  = 1.5 units         → button padding-y, input padding-y
16px  = 2 units           → card padding, section gap (mobile)
20px  = 2.5 units         → button padding-x (medium)
24px  = 3 units           → card gap, content block spacing
32px  = 4 units           → section padding (desktop)
40px  = 5 units           → page section gap
48px  = 6 units           → hero padding
64px  = 8 units           → major section break
```

### 1.4 Border Radius

```
rounded-sm    4px   → badges, tags
rounded       6px   → inputs, small buttons
rounded-md    8px   → cards, dropdowns, modals
rounded-lg    12px  → large cards, panels
rounded-xl    16px  → chat bubbles, image containers
rounded-full  9999px → avatars, pills, toggle buttons
```

### 1.5 Shadow System

```
shadow-sm   → 0 1px 2px rgba(0,0,0,0.05)        cards at rest
shadow      → 0 2px 8px rgba(0,0,0,0.08)         cards on hover, dropdowns
shadow-md   → 0 4px 16px rgba(0,0,0,0.10)        modals, popovers
shadow-lg   → 0 8px 32px rgba(0,0,0,0.12)        floating panels, sidebars
```

### 1.6 Component Library

```
ATOMS (building blocks):
  Button          → Primary | Secondary | Ghost | Destructive | Icon
  Input           → Text | Password | Textarea | File | Search
  Badge           → Status colors, size variants
  Avatar          → XS(24) | SM(32) | MD(40) | LG(64) | XL(96)
  Spinner         → SM(16) | MD(24) | LG(40)
  Icon            → Lucide React icon set
  Divider         → Horizontal | Vertical
  Toggle          → Boolean switch
  Checkbox        → Default | Indeterminate
  Radio           → Single select

MOLECULES (composed components):
  FormField       → Label + Input + HelperText + ErrorText
  SearchBar       → Icon + Input + Clear button
  Notification    → Icon + Title + Body + Time + Actions
  FileUpload      → Drag zone + file list + progress
  GradeChip       → Score/Max with color coding
  DeadlineChip    → Relative time + urgency color
  CourseCard      → Cover + Title + Instructor + Progress
  AssignmentRow   → Title + Due + Status + Actions
  ChatMessage     → Role (user/assistant) + Content + Time
  MemoryCard      → Content + Date + Delete action
  UserRow         → Avatar + Name + Role + Status + Actions

ORGANISMS (page sections):
  AppHeader       → Logo + Nav + UserMenu
  Sidebar         → Nav links + active state
  PageHeader      → Title + Breadcrumb + Actions
  DataTable       → Columns + Rows + Sort + Pagination
  CourseGrid      → CourseCard grid (2-3 col responsive)
  AssignmentList  → AssignmentRow list
  GradeBook       → Course group + Assignment rows + GPA
  ChatWindow      → MessageList + InputBar + SSE indicator
  MemoryList      → MemoryCard list + bulk delete
  StatsCard       → Label + Value + Trend + Icon
  EmptyState      → Illustration + Message + CTA
```

### 1.7 Icon Usage

```
ICON LIBRARY: Lucide React (consistent stroke width: 1.5)
SIZE RULES:
  - In buttons: 16px
  - Standalone / nav: 20px
  - Feature icons / illustrations: 32-48px

KEY ICONS:
  BookOpen      → Courses
  ClipboardList → Assignments
  GraduationCap → Grades
  Bell          → Notifications
  MessageSquare → AI Chat
  Brain         → Memory
  Upload        → File upload
  Download      → File download
  Check         → Success / Submitted
  Clock         → Deadline / Pending
  AlertTriangle → Warning / Late
  X             → Close / Error / Delete
  Plus          → Create / Add
  Settings      → Preferences
  User          → Profile
  Shield        → Admin
  ChevronRight  → Navigate forward
  ChevronDown   → Expand dropdown
  Search        → Search bar
  Send          → Submit message
  Sparkles      → AI features
  Paperclip     → File attachment
  Star          → Grade / Rating
```

---

## 2. Layout & Navigation Patterns

### 2.1 App Shell (LMS Web - lms-web)

```
DESKTOP (≥1024px):
┌─────────────────────────────────────────────────────────┐
│ HEADER (64px height, sticky, white, shadow-sm)          │
│ [Logo]  [Nav: Khóa học | Bài tập | Điểm]  [Bell] [Av] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   SIDEBAR    │   MAIN CONTENT AREA                      │
│   (240px,    │   (flex-1, max-w-5xl, mx-auto)          │
│   sticky,    │   padding: 32px 24px                     │
│   white)     │                                          │
│              │                                          │
│  [nav items] │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘

MOBILE (< 768px):
┌───────────────────────────────────┐
│ HEADER (56px)                     │
│ [Hamburger] [Logo] [Bell] [Av]   │
├───────────────────────────────────┤
│                                   │
│   MAIN CONTENT AREA               │
│   padding: 16px                   │
│                                   │
├───────────────────────────────────┤
│ BOTTOM NAV (56px, sticky)         │
│ [Home][Courses][Chat][Notif][Me] │
└───────────────────────────────────┘

TABLET (768px-1023px):
- Same as mobile but bottom nav replaced with collapsible sidebar
- Content padding: 24px
- Grid columns: 2 instead of 1
```

### 2.2 App Shell (Agent Web - agent-web)

```
DESKTOP:
┌────────────────────────────────────────────────────────┐
│ HEADER (56px)                                          │
│ [Logo "AI Trợ Lý"]  [━━━━━━━━━━]  [Memory] [Profile] │
├─────────────────┬──────────────────────────────────────┤
│ CONVERSATION    │  CHAT AREA                           │
│ SIDEBAR (280px) │                                      │
│                 │  ┌──────────────────────────────┐   │
│ [+ New Chat]    │  │  MESSAGES                    │   │
│ ─────────────── │  │  (scrollable, flex-col)      │   │
│ Today           │  │                              │   │
│ [Conv title 1]  │  │                              │   │
│ [Conv title 2]  │  └──────────────────────────────┘   │
│ Yesterday       │  ┌──────────────────────────────┐   │
│ [Conv title 3]  │  │  INPUT BAR                   │   │
│                 │  │  [Clip][Textarea][Send]      │   │
│                 │  └──────────────────────────────┘   │
└─────────────────┴──────────────────────────────────────┘

MOBILE:
- Sidebar hidden by default, slide-in drawer on tap
- Chat takes full width
- Bottom input bar fixed
```

### 2.3 Navigation Items by Role

```
STUDENT NAV (lms-web sidebar):
  📊 Tổng quan         → /dashboard
  📚 Khóa học          → /courses
  📋 Bài tập           → /assignments
  🎓 Điểm số           → /grades
  🔔 Thông báo         → /notifications
  ────────────────────
  🤖 AI Trợ Lý         → opens agent-web (new tab or embedded)
  ─────────────────────
  ⚙️ Cài đặt           → /settings
  👤 Hồ sơ             → /profile

INSTRUCTOR NAV (lms-web sidebar):
  📊 Tổng quan         → /dashboard
  📚 Khóa học của tôi  → /courses
  📋 Bài tập           → /assignments
  🎓 Chấm điểm         → /grading
  🔔 Thông báo         → /notifications
  ─────────────────────
  ⚙️ Cài đặt           → /settings
  👤 Hồ sơ             → /profile

ADMIN NAV (lms-web sidebar):
  📊 Dashboard         → /admin
  👥 Người dùng        → /admin/users
  📚 Khóa học          → /admin/courses
  🤖 Chi phí AI        → /admin/ai-costs
  ─────────────────────
  ⚙️ Cài đặt           → /settings
```

### 2.4 Header User Menu (Dropdown)

```
[Avatar] ▼
┌─────────────────────┐
│ 👤 Nguyễn Văn Minh  │
│    minh@email.com   │
├─────────────────────┤
│ 👤 Hồ sơ cá nhân   │
│ ⚙️ Cài đặt thông báo│
│ 🔑 Đổi mật khẩu     │
├─────────────────────┤
│ 🚪 Đăng xuất        │
└─────────────────────┘
```

---

## 3. Authentication Screens

### 3.1 Login Page (`/login`)

```
DESKTOP LAYOUT (split):
┌────────────────────────────┬───────────────────────────┐
│  LEFT PANEL (50%)          │  RIGHT PANEL (50%)        │
│  Brand illustration        │  Login form               │
│  bg: Brand Blue (#2563EB)  │  bg: White                │
│                            │                           │
│  [Logo]                    │  ┌─────────────────────┐  │
│                            │  │                     │  │
│  "Học thông minh hơn       │  │  Đăng nhập          │  │
│   với AI Trợ Lý"           │  │  ─────────────────  │  │
│                            │  │                     │  │
│  • AI nhớ tiến trình học   │  │  Email              │  │
│  • Nhắc nhở deadline       │  │  [_______________]  │  │
│  • Tìm kiếm tài liệu       │  │                     │  │
│                            │  │  Mật khẩu           │  │
│                            │  │  [___________] [👁] │  │
│                            │  │                     │  │
│                            │  │  [ ] Ghi nhớ đăng   │  │
│                            │  │      nhập            │  │
│                            │  │                     │  │
│                            │  │  [  ĐĂNG NHẬP  ]    │  │
│                            │  │     (Blue btn)      │  │
│                            │  │                     │  │
│                            │  │  Quên mật khẩu?     │  │
│                            │  │                     │  │
│                            │  │  ─── hoặc ───       │  │
│                            │  │                     │  │
│                            │  │  Chưa có tài khoản? │  │
│                            │  │  [  ĐĂNG KÝ  ]      │  │
│                            │  │   (Ghost btn)       │  │
│                            │  └─────────────────────┘  │
└────────────────────────────┴───────────────────────────┘

MOBILE LAYOUT (single column):
┌──────────────────────────┐
│  [Logo]  LMS AI          │
│  ─────────────────────── │
│  Đăng nhập               │
│                          │
│  Email                   │
│  [________________________]│
│                          │
│  Mật khẩu                │
│  [__________________][👁]│
│                          │
│  [  ĐĂNG NHẬP  ]         │
│                          │
│  Quên mật khẩu?          │
│                          │
│  ─────────────────────── │
│  Chưa có tài khoản?      │
│  [  ĐĂNG KÝ  ]           │
└──────────────────────────┘

STATES:
  Default   → All fields empty, button enabled
  Loading   → Button shows spinner, all fields disabled
  Error     → Red border on field, error text below:
              "Email hoặc mật khẩu không đúng"
  Success   → Redirect to /dashboard (no state shown)

VALIDATION (inline, on blur):
  Email     → "Email không hợp lệ" if not valid format
  Password  → "Mật khẩu phải có ít nhất 8 ký tự" if < 8 chars
```

### 3.2 Register Page (`/register`)

```
┌──────────────────────────────────────────┐
│  Tạo tài khoản                           │
│  ─────────────────────────────────────── │
│                                          │
│  Họ và tên                               │
│  [_______________________________________]│
│                                          │
│  Email                                   │
│  [_______________________________________]│
│                                          │
│  Mật khẩu                               │
│  [___________________________________][👁]│
│  ████████░░ Độ mạnh: Tốt                 │
│  (password strength bar: red/amber/green)│
│                                          │
│  Xác nhận mật khẩu                      │
│  [___________________________________][👁]│
│                                          │
│  Vai trò                                 │
│  ◉ Sinh viên  ○ Giảng viên               │
│                                          │
│  [  ĐĂNG KÝ  ]                           │
│                                          │
│  Đã có tài khoản? [Đăng nhập]            │
│                                          │
│  Bằng cách đăng ký, bạn đồng ý với      │
│  Điều khoản sử dụng và Chính sách        │
│  bảo mật của chúng tôi.                  │
└──────────────────────────────────────────┘

PASSWORD STRENGTH INDICATOR:
  1-3 chars entered: No bar shown
  Weak (< 8 or no variety):  [██░░░░] Red    "Yếu"
  Medium (8+ with 1 type):   [████░░] Amber  "Trung bình"
  Strong (8+ with 2+ types): [██████] Green  "Mạnh"
  Criteria: uppercase + lowercase + number = strong
```

### 3.3 Forgot Password Page (`/forgot-password`)

```
┌──────────────────────────────────────────┐
│  [← Quay lại đăng nhập]                 │
│                                          │
│  Quên mật khẩu?                          │
│  Nhập email và chúng tôi sẽ gửi link     │
│  đặt lại mật khẩu cho bạn.              │
│                                          │
│  Email                                   │
│  [_______________________________________]│
│                                          │
│  [  GỬI LINK ĐẶT LẠI  ]                 │
└──────────────────────────────────────────┘

SUCCESS STATE (after submit):
┌──────────────────────────────────────────┐
│  ✅ Email đã được gửi!                   │
│                                          │
│  Chúng tôi đã gửi link đặt lại          │
│  mật khẩu đến:                           │
│  minh@email.com                          │
│                                          │
│  Link có hiệu lực trong 1 giờ.           │
│                                          │
│  Không nhận được email?                  │
│  [Gửi lại] (countdown: 60s cooldown)     │
│                                          │
│  [← Quay lại đăng nhập]                 │
└──────────────────────────────────────────┘
```

### 3.4 Reset Password Page (`/reset-password?token=...`)

```
VALID TOKEN STATE:
┌──────────────────────────────────────────┐
│  Đặt lại mật khẩu                        │
│                                          │
│  Mật khẩu mới                           │
│  [___________________________________][👁]│
│  ██████░░ Độ mạnh: Mạnh                  │
│                                          │
│  Xác nhận mật khẩu mới                  │
│  [___________________________________][👁]│
│  ✓ Mật khẩu khớp                        │
│                                          │
│  [  LƯU MẬT KHẨU MỚI  ]                │
└──────────────────────────────────────────┘

EXPIRED TOKEN STATE:
┌──────────────────────────────────────────┐
│  ❌ Link đã hết hạn                      │
│                                          │
│  Link đặt lại mật khẩu chỉ có hiệu      │
│  lực trong 1 giờ.                        │
│                                          │
│  [  YÊU CẦU LINK MỚI  ]                 │
└──────────────────────────────────────────┘
```

---

## 4. Student Dashboard

### 4.1 Dashboard Page (`/dashboard`)

```
DESKTOP LAYOUT:
┌─────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                  │
│ Xin chào, Minh! 👋        Thứ Hai, 27/04/2026              │
├──────────────────────────────────────────────────────────────┤
│ STATS ROW (4 cards, equal width)                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │📚        │ │📋        │ │⏰        │ │🎓        │        │
│ │Khóa học  │ │Bài tập   │ │Sắp hết   │ │Điểm TB   │        │
│ │đang học  │ │chưa nộp  │ │hạn (48h) │ │học kỳ    │        │
│ │  3       │ │  2       │ │  1       │ │  8.5     │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────┬────────────────────────────────┤
│ UPCOMING DEADLINES (60%)    │ RECENT GRADES (40%)            │
│                             │                                │
│ Bài tập sắp đến hạn         │ Điểm mới nhất                  │
│ ────────────────────        │ ──────────────────             │
│                             │                                │
│ ⚠️ CÒN 6 GIỜ               │ Lập trình Python               │
│ Bài tập tuần 8              │ Bài 5: Vòng lặp                │
│ Lập trình Python            │ 85/100 ✅ Đã xem               │
│ [Nộp bài ngay →]            │                                │
│                             │ Toán rời rạc                   │
│ ⚡ CÒN 1 NGÀY 3 GIỜ         │ Quiz 3                         │
│ Bài luận chương 2           │ 72/100 ✅ Đã xem               │
│ Văn học Việt Nam            │                                │
│ [Xem chi tiết →]            │ [Xem tất cả điểm →]            │
│                             │                                │
│ 📅 THỨ 5, 30/04            │                                │
│ Đồ án nhóm - Phase 1        │                                │
│ Kỹ thuật phần mềm           │                                │
│ [Xem chi tiết →]            │                                │
│                             │                                │
│ [Xem tất cả bài tập →]      │                                │
├─────────────────────────────┴────────────────────────────────┤
│ MY COURSES (full width, horizontal scroll on mobile)         │
│ Khóa học của tôi                                             │
│ ──────────────────────────────────────────────────           │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ [course cover]  │ │ [course cover]  │ │ [course cover]  │ │
│ │ ─────────────── │ │ ─────────────── │ │ ─────────────── │ │
│ │ Lập trình Python│ │ Toán rời rạc    │ │ Kỹ thuật PM     │ │
│ │ GV: Nguyễn Lan  │ │ GV: Trần Hùng  │ │ GV: Lê Anh      │ │
│ │ 3 bài tập mới   │ │ Điểm: 7.8      │ │ Đồ án: Phase 1  │ │
│ │ [Vào khóa học →]│ │ [Vào khóa học →]│ │ [Vào khóa học→] │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                             [+ Đăng ký KH]   │
└──────────────────────────────────────────────────────────────┘

STAT CARD STATES:
  "Bài tập chưa nộp" = 0  → Green text, "Bạn đã nộp hết!"
  "Sắp hết hạn" > 0       → Amber card border + amber icon
  "Sắp hết hạn" = 0       → Normal gray card
```

---

## 5. Course Screens

### 5.1 Course List Page (`/courses`)

```
┌──────────────────────────────────────────────────────────┐
│ PAGE HEADER                                              │
│ Khóa học của tôi          [+ Đăng ký khóa học]          │
│ ────────────────────────────────────────────────         │
│                                                          │
│ FILTER BAR:                                              │
│ [🔍 Tìm kiếm khóa học...]  [Tất cả ▼]  [Học kỳ 2 ▼]   │
│                                                          │
│ COURSE GRID (3 col desktop, 2 col tablet, 1 col mobile): │
│                                                          │
│ ┌──────────────────────┐ ┌──────────────────────┐        │
│ │ ████████████████████ │ │ ████████████████████ │        │
│ │ (cover image 16:9)   │ │ (cover image 16:9)   │        │
│ ├──────────────────────┤ ├──────────────────────┤        │
│ │ LẬP TRÌNH PYTHON     │ │ TOÁN RỜI RẠC         │        │
│ │ ● Đang học           │ │ ● Đang học           │        │
│ │                      │ │                      │        │
│ │ 👤 Nguyễn Thị Lan    │ │ 👤 Trần Văn Hùng    │        │
│ │ 📋 12 bài tập        │ │ 📋 8 bài tập         │        │
│ │ 👥 45 sinh viên      │ │ 👥 38 sinh viên      │        │
│ │                      │ │                      │        │
│ │ [Vào khóa học →]     │ │ [Vào khóa học →]     │        │
│ └──────────────────────┘ └──────────────────────┘        │
│                                                          │
│ EMPTY STATE (no courses):                                │
│   [Illustration: student with books]                     │
│   "Bạn chưa đăng ký khóa học nào"                       │
│   [Đăng ký khóa học đầu tiên]                            │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Enroll Course Modal

```
┌────────────────────────────────────┐
│ Đăng ký khóa học             [✕]  │
│ ──────────────────────────────── │
│                                    │
│ Mã đăng ký                         │
│ [____________________________]     │
│ Nhập mã do giảng viên cung cấp    │
│                                    │
│ [  HỦY  ]  [  ĐĂNG KÝ  ]         │
└────────────────────────────────────┘

AFTER CODE ENTERED (preview):
┌────────────────────────────────────┐
│ Đăng ký khóa học             [✕]  │
│ ──────────────────────────────── │
│                                    │
│ Mã đăng ký                         │
│ [LT-PY-2026     ] ✓ Hợp lệ        │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Lập trình Python             │  │
│ │ GV: Nguyễn Thị Lan           │  │
│ │ 45 sinh viên đang học        │  │
│ └──────────────────────────────┘  │
│                                    │
│ [  HỦY  ]  [  XÁC NHẬN ĐĂNG KÝ ]│
└────────────────────────────────────┘
```

### 5.3 Course Detail Page (`/courses/[courseId]`)

```
DESKTOP:
┌────────────────────────────────────────────────────────────┐
│ BREADCRUMB: Khóa học > Lập trình Python                    │
├────────────────────────────────────────────────────────────┤
│ COURSE HEADER                                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [Course cover image - full width, 200px tall]       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ Lập trình Python                          [🤖 Hỏi AI]     │
│ 👤 GV: Nguyễn Thị Lan  |  👥 45 SV  |  📋 12 bài tập    │
│ Mã khóa học: LT-PY-2026                                   │
│                                                            │
│ Mô tả: Khóa học này cung cấp nền tảng lập trình Python    │
│ từ cơ bản đến nâng cao, bao gồm OOP, xử lý file, và API. │
├────────────────────────────────────────────────────────────┤
│ TABS: [Bài tập] [Tài liệu] [Thông báo] [Thành viên]      │
├────────────────────────────────────────────────────────────┤
│ TAB CONTENT: Bài tập (default)                             │
│                                                            │
│  Trạng thái: Tất cả ▼    Sắp xếp: Hạn nộp ▼              │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ⚠️ Bài tập tuần 8: Vòng lặp và hàm số               │   │
│  │ 🕐 Hạn: 27/04/2026 23:59  |  Còn lại: 6 giờ        │   │
│  │ 💯 100 điểm               |  [CHƯA NỘP]             │   │
│  │                           [Xem chi tiết & Nộp bài] │   │
│  └────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ✅ Bài tập tuần 7: Cấu trúc dữ liệu               │   │
│  │ 🕐 Hạn: 20/04/2026 23:59  |  Đã nộp đúng hạn      │   │
│  │ 💯 85/100 điểm            |  [ĐÃ CHẤM ĐIỂM]        │   │
│  │                           [Xem chi tiết]           │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘

TAB: Tài liệu
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 📄 Slide_Tuan_1_Gioi_thieu_Python.pdf   12/01/2026  │  │
│  │ 📄 Slide_Tuan_2_Bien_va_kieu_du_lieu.pdf 19/01/2026 │  │
│  │ 📄 Lab_1_Huong_dan_thuc_hanh.pdf        19/01/2026  │  │
│  │ 📊 Slide_Tuan_3_Vong_lap.pptx           26/01/2026  │  │
│  └─────────────────────────────────────────────────────┘  │
│  Note: Tài liệu được AI sử dụng để trả lời câu hỏi.      │

TAB: Thông báo
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 📢 Thay đổi lịch thi giữa kỳ          27/04 10:00  │  │
│  │ Lịch thi giữa kỳ được dời sang ngày 5/5...         │  │
│  └─────────────────────────────────────────────────────┘  │
```

---

## 6. Assignment Screens

### 6.1 Assignment List Page (`/assignments`)

```
┌──────────────────────────────────────────────────────────┐
│ PAGE HEADER                                              │
│ Bài tập của tôi                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ FILTER BAR:                                              │
│ [🔍 Tìm bài tập...]  [Khóa học ▼]  [Trạng thái ▼]      │
│                                                          │
│ TABS: [Tất cả (12)] [Chưa nộp (2)] [Đã nộp (8)] [Quá hạn(2)]│
│                                                          │
│ TODAY:                                                   │
│ ┌──────────────────────────────────────────────────┐    │
│ │🔴 QUÁ HẠN • Lập trình Python                     │    │
│ │ Bài tập tuần 6: Đệ quy                           │    │
│ │ Hạn nộp: 20/04/2026  |  Không có gia hạn         │    │
│ │ [Xem chi tiết]                                   │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ THỨ BA, 28/04/2026:                                      │
│ ┌──────────────────────────────────────────────────┐    │
│ │⚠️ CÒN 1 NGÀY • Văn học Việt Nam                  │    │
│ │ Bài luận chương 2: Truyện Kiều                   │    │
│ │ Hạn nộp: 28/04/2026 23:59  |  100 điểm           │    │
│ │ [Xem & Nộp bài →]                                │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ THỨ NĂM, 30/04/2026:                                     │
│ ┌──────────────────────────────────────────────────┐    │
│ │📅 CÒN 3 NGÀY • Kỹ thuật phần mềm                 │    │
│ │ Đồ án nhóm - Phase 1: Phân tích yêu cầu          │    │
│ │ Hạn nộp: 30/04/2026 23:59  |  200 điểm           │    │
│ │ [Xem chi tiết →]                                 │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

STATUS BADGE COLORS:
  Chưa nộp   → Gray badge
  Đã nộp     → Green badge
  Trễ hạn    → Red badge
  Đã chấm    → Blue badge
  Gia hạn    → Purple badge (has extension)
```

### 6.2 Assignment Detail + Submit Page (`/assignments/[id]`)

```
STUDENT VIEW (unpublished → 404):

┌────────────────────────────────────────────────────────────┐
│ BREADCRUMB: Bài tập > Bài tập tuần 8: Vòng lặp và hàm số  │
├────────────────────────────────────────────────────────────┤
│ ASSIGNMENT INFO                                            │
│                                                            │
│ Bài tập tuần 8: Vòng lặp và hàm số                        │
│ Lập trình Python  |  💯 100 điểm                           │
│                                                            │
│ DEADLINE BANNER:                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ⚠️  Hạn nộp: Thứ Hai, 27/04/2026 23:59             │   │
│ │     Còn lại: 5 giờ 42 phút                         │   │
│ └─────────────────────────────────────────────────────┘   │
│ (If < 24h: amber. If < 1h: red. If over: red "QUÁ HẠN")  │
│                                                            │
│ MÔ TẢ BÀI TẬP:                                            │
│ Hoàn thành các bài tập sau về vòng lặp for/while và       │
│ định nghĩa hàm trong Python:                               │
│                                                            │
│ 1. Viết hàm fibonacci(n) trả về số Fibonacci thứ n.       │
│ 2. Viết hàm is_prime(n) kiểm tra số nguyên tố.            │
│ 3. Sử dụng list comprehension để lọc số chẵn từ list.     │
│                                                            │
│ Yêu cầu: File .py, có comment giải thích, chạy được.      │
├────────────────────────────────────────────────────────────┤
│ NỘP BÀI                                                    │
│                                                            │
│ File bài làm                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │                                                     │   │
│ │      📎 Kéo thả file vào đây hoặc                   │   │
│ │         [Chọn file]                                 │   │
│ │                                                     │   │
│ │      Hỗ trợ: .py, .pdf, .docx, .zip (tối đa 50MB) │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ Ghi chú (tùy chọn)                                        │
│ [________________________________________________]         │
│ [________________________________________________]         │
│ [________________________________________________]         │
│                                                            │
│ [  NỘP BÀI  ]                                             │
│ Sau khi nộp, bạn có thể nộp lại cho đến khi hết hạn.     │
└────────────────────────────────────────────────────────────┘

AFTER FILE SELECTED:
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✅ bai_tap_tuan8.py   (4.2 KB)           [✕ Xóa]   │   │
│ └─────────────────────────────────────────────────────┘   │

AFTER SUBMISSION:
┌────────────────────────────────────────────────────────────┐
│ ✅ ĐÃ NỘP BÀI                                              │
│                                                            │
│ Bài làm của bạn đã được ghi nhận.                          │
│ Nộp lúc: 27/04/2026 18:23 (đúng hạn)                      │
│                                                            │
│ File: bai_tap_tuan8.py                                     │
│ Ghi chú: "Bài đầy đủ 3 phần"                              │
│                                                            │
│ [Nộp lại] (available until deadline)  [Tải file đã nộp]  │
└────────────────────────────────────────────────────────────┘

GRADED STATE:
┌────────────────────────────────────────────────────────────┐
│ ✅ ĐÃ CHẤM ĐIỂM                                            │
│                                                            │
│ Điểm số: 85 / 100                                          │
│                                                            │
│ Nhận xét của giảng viên:                                   │
│ "Code chạy đúng, logic fibonacci tốt. Tuy nhiên           │
│  hàm is_prime chưa xử lý trường hợp n=1. Cần thêm        │
│  comment giải thích bước kiểm tra."                        │
│                                                            │
│ Chấm bởi: GV. Nguyễn Thị Lan  |  28/04/2026               │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Grade Screens

### 7.1 Grade Book Page (`/grades`)

```
┌────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                │
│ Bảng điểm của tôi                                          │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ GPA SUMMARY CARD:                                          │
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Điểm trung bình học kỳ này                         │   │
│ │                                                     │   │
│ │        8.3 / 10                                     │   │
│ │     ━━━━━━━━━━━━━━━━━━━━━━━━━━                      │   │
│ │     ███████████████████░░░░░░                       │   │
│ │         (progress bar, green)                       │   │
│ │                                                     │   │
│ │  3 khóa học  |  22 bài tập đã chấm                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ COURSE ACCORDION (expandable):                             │
│                                                            │
│ ▼ Lập trình Python             Điểm TB: 8.5 / 10          │
│   ──────────────────────────────────────────────────────  │
│   ┌────────────────────────────────────────────────────┐  │
│   │ BÀI TẬP             HẠN NỘP    ĐIỂM    TRẠNG THÁI │  │
│   ├────────────────────────────────────────────────────┤  │
│   │ Bài tập tuần 1      10/01      95/100  ✅ Đúng hạn │  │
│   │ Bài tập tuần 2      17/01      88/100  ✅ Đúng hạn │  │
│   │ Bài tập tuần 3      24/01      72/100  🔴 Trễ hạn  │  │
│   │ Quiz giữa kỳ        31/01      90/100  ✅ Đúng hạn │  │
│   │ Bài tập tuần 5      07/02      85/100  ✅ Đúng hạn │  │
│   │ Bài tập tuần 8      27/04      -       ⏳ Chờ chấm │  │
│   └────────────────────────────────────────────────────┘  │
│                                                            │
│ ▶ Toán rời rạc                 Điểm TB: 7.8 / 10          │
│                                                            │
│ ▶ Kỹ thuật phần mềm            Điểm TB: 8.6 / 10          │
└────────────────────────────────────────────────────────────┘

GRADE COLOR CODING:
  ≥ 9.0  → Green text (Xuất sắc)
  8.0-8.9 → Blue text (Giỏi)
  7.0-7.9 → Default (Khá)
  5.0-6.9 → Amber text (Trung bình)
  < 5.0  → Red text (Yếu)

GRADE DETAIL MODAL (click a row):
┌──────────────────────────────────────────┐
│ Bài tập tuần 3: Hàm và Module      [✕]  │
│ ──────────────────────────────────────── │
│ Điểm: 72 / 100                          │
│ Nộp: 25/01/2026 01:23 (🔴 trễ 1 giờ 23p)│
│                                          │
│ Nhận xét:                               │
│ "Code chạy được nhưng chưa xử lý        │
│  exception. Module chưa đúng cấu trúc." │
│                                          │
│ Chấm: GV. Nguyễn Thị Lan  26/01/2026   │
│                                          │
│ [Tải bài đã nộp]  [Hỏi AI về điểm này] │
└──────────────────────────────────────────┘
```

---

## 8. Notification Center

### 8.1 Notification Bell (Header)

```
UNREAD COUNT BADGE:
[🔔] ← with red dot (3) if unread > 0
  ↓ click
┌──────────────────────────────────────────┐
│ Thông báo                  [Đọc hết]    │
│ ──────────────────────────────────────── │
│ ● [Grade] 🎓 Điểm bài tập tuần 7        │
│   Bạn được 85/100 điểm                  │
│   Lập trình Python • 5 phút trước       │
│ ─────────────────────────────────────── │
│ ● [Reminder] ⚠️ Nhắc nhở hạn nộp bài   │
│   Còn 24h nữa: Bài luận chương 2       │
│   Văn học • 2 giờ trước                │
│ ─────────────────────────────────────── │
│   [Announcement] 📢 Thay đổi lịch thi  │
│   Kỳ thi giữa kỳ dời sang 5/5         │
│   Lập trình Python • 1 ngày trước      │
│ ─────────────────────────────────────── │
│ [Xem tất cả thông báo →]               │
└──────────────────────────────────────────┘
(Unread = filled dot ●; Read = no dot)
```

### 8.2 Notification Page (`/notifications`)

```
┌──────────────────────────────────────────────────────────┐
│ Thông báo                                                │
│ [Đánh dấu tất cả đã đọc]  [⚙️ Cài đặt thông báo]       │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ FILTER: [Tất cả] [Chưa đọc] [Điểm số] [Bài tập] [Hệ thống]│
│                                                          │
│ HÔM NAY                                                  │
│ ┌──────────────────────────────────────────────────┐    │
│ │ ● 🎓  Điểm số                                    │    │
│ │    Bài tập tuần 7 đã được chấm                   │    │
│ │    Điểm: 85/100 · Lập trình Python               │    │
│ │    5 phút trước           [Xem điểm] [✕]         │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ HÔM QUA                                                  │
│ ┌──────────────────────────────────────────────────┐    │
│ │  ⏰  Nhắc nhở                                    │    │
│ │    Còn 24h: Bài luận chương 2                    │    │
│ │    Hạn nộp: 28/04/2026 23:59                     │    │
│ │    22 giờ trước           [Đến bài tập] [✕]      │    │
│ └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Notification Preferences Page (`/settings/notifications`)

```
┌──────────────────────────────────────────────────────────┐
│ Cài đặt thông báo                                        │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ EMAIL THÔNG BÁO                                          │
│                                                          │
│ Nhắc nhở hạn nộp bài                                    │
│ [●──] Bật  ← toggle                                      │
│ Nhận email 48h và 24h trước hạn nộp                     │
│                                                          │
│ Điểm số mới                                              │
│ [●──] Bật                                                │
│ Khi giảng viên chấm điểm bài nộp của bạn               │
│                                                          │
│ Thông báo từ khóa học                                    │
│ [●──] Bật                                                │
│ Khi giảng viên đăng thông báo mới                       │
│                                                          │
│ Bài tập mới                                              │
│ [──○] Tắt                                                │
│ Khi có bài tập mới được đăng                            │
│                                                          │
│ Tóm tắt hàng tuần (AI)                                  │
│ [●──] Bật                                                │
│ Email AI tổng hợp tình hình học tập mỗi thứ Hai        │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│ THÔNG BÁO TRONG ỨNG DỤNG                                │
│                                                          │
│ Tất cả thông báo trong app                              │
│ [●──] Bật                                                │
│                                                          │
│ [  LƯU CÀI ĐẶT  ]                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 9. AI Agent Chat

### 9.1 Chat Interface (agent-web)

```
DESKTOP LAYOUT:
┌─────────────────┬──────────────────────────────────────────┐
│ SIDEBAR (280px) │ CHAT AREA                                │
│                 │                                          │
│ + Cuộc trò      │ HEADER:                                  │
│   chuyện mới   │ 🤖 AI Trợ Lý học tập  [🧠 Ký ức (12)]   │
│ ─────────────── │ ──────────────────────────────────────── │
│ HÔM NAY        │                                          │
│                 │ MESSAGES AREA (scrollable):              │
│ Hỏi về bài     │                                          │
│ tập Python     │  ┌─────────────────────────────────────┐ │
│                 │  │         27/04/2026                  │ │
│ Deadline tuần  │  └─────────────────────────────────────┘ │
│ này là gì      │                                          │
│                 │  [User bubble - right aligned]           │
│ ─────────────── │  ╔═══════════════════════════════════╗  │
│ HÔM QUA        │  ║ Bài tập tuần này mình cần nộp gì? ║  │
│                 │  ╚═══════════════════════════════════╝  │
│ Giải thích     │                         18:10            │
│ đệ quy         │                                          │
│                 │  [AI bubble - left aligned, purple tint] │
│ Điểm môn       │  ╔════════════════════════════════════╗  │
│ Python          │  ║ 🤖 Xin chào Minh! Để tra cứu      ║  │
│                 │  ║ deadline cho bạn...                ║  │
│ ─────────────── │  ║                                    ║  │
│ TUẦN TRƯỚC     │  ║ [🔧 Đang tra cứu bài tập...]       ║  │
│                 │  ║ (tool_call indicator, animated)    ║  │
│ Ôn tập giữa   │  ║                                    ║  │
│ kỳ             │  ║ Bạn có **2 bài tập** sắp đến hạn: ║  │
│                 │  ║                                    ║  │
│                 │  ║ 1. **Bài tập tuần 8** (Python)    ║  │
│                 │  ║    ⚠️ Còn **5 giờ** · 100đ        ║  │
│                 │  ║    → Chưa nộp                      ║  │
│                 │  ║                                    ║  │
│                 │  ║ 2. **Bài luận chương 2** (VH)     ║  │
│                 │  ║    📅 Còn **1 ngày** · 100đ        ║  │
│                 │  ║    → Chưa nộp                      ║  │
│                 │  ║                                    ║  │
│                 │  ║ Bạn muốn mình giúp gì thêm?       ║  │
│                 │  ╚════════════════════════════════════╝  │
│                 │                              18:10       │
│ [⚙️] [👤]      │                                          │
│                 │ INPUT BAR (fixed bottom):                │
│                 │ ┌─────────────────────────────────────┐ │
│                 │ │📎 │ Nhập câu hỏi...           │ [➤] │ │
│                 │ └─────────────────────────────────────┘ │
│                 │  AI có thể mắc sai sót. Kiểm tra lại.  │
└─────────────────┴──────────────────────────────────────────┘

STREAMING INDICATOR (while AI is typing):
  [🤖 ████████████████░░░░░░░░░░░░░░░░░░░░░░░   ]
  Shows animated cursor ▊ at end of streaming text

TOOL CALL INDICATOR:
  ┌──────────────────────────────────────┐
  │ 🔧 Đang tra cứu bài tập của bạn...  │  ← spinner
  └──────────────────────────────────────┘

MEMORY UPDATE INDICATOR (brief toast, 2s):
  ┌──────────────────────────────────────┐
  │ 🧠 AI đã ghi nhớ thông tin mới      │
  └──────────────────────────────────────┘
```

### 9.2 Chat Bubble Variants

```
USER MESSAGE:
  Background: #2563EB (brand blue)
  Text: White
  Align: Right
  Max-width: 75%
  Border-radius: 18px 18px 4px 18px

AI MESSAGE:
  Background: #F3F4F6 (gray-100) or #EDE9FE (purple-light for memory-heavy)
  Text: Gray-800
  Align: Left
  Max-width: 85%
  Border-radius: 18px 18px 18px 4px
  Has small 🤖 avatar on left

TOOL CALL IN PROGRESS:
  Background: White, border: 1px solid gray-200
  Animated: pulsing opacity 50%→100%
  Icon: 🔧 animated spin

ERROR MESSAGE:
  Background: #FEE2E2 (red-100)
  Text: #DC2626
  Border: 1px solid #FCA5A5
  "❌ Có lỗi xảy ra. Vui lòng thử lại."

SYSTEM INFO MESSAGE (centered):
  Background: none
  Text: Gray-400, text-xs, italic
  Example: "Cuộc trò chuyện mới bắt đầu"
           "AI đã nhớ: Minh đang học Python"
```

### 9.3 New Conversation / Empty State

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│         🤖                                             │
│                                                        │
│    Xin chào, Minh!                                     │
│    Tôi là AI Trợ Lý học tập của bạn.                  │
│    Tôi có thể giúp bạn về:                             │
│                                                        │
│    ┌─────────────────────────────────────────────┐    │
│    │ 📋  Bài tập và deadline của bạn             │    │
│    └─────────────────────────────────────────────┘    │
│    ┌─────────────────────────────────────────────┐    │
│    │ 🎓  Điểm số và tiến trình học               │    │
│    └─────────────────────────────────────────────┘    │
│    ┌─────────────────────────────────────────────┐    │
│    │ 📄  Nội dung tài liệu khóa học              │    │
│    └─────────────────────────────────────────────┘    │
│    ┌─────────────────────────────────────────────┐    │
│    │ 💡  Giải thích khái niệm học thuật          │    │
│    └─────────────────────────────────────────────┘    │
│                                                        │
│    Bạn cần giúp gì hôm nay?                            │
│                                                        │
└────────────────────────────────────────────────────────┘

SUGGESTION CHIPS (clickable quick-start):
  [Deadline tuần này?]  [Điểm môn Python?]  [Giải thích recursion]
```

---

## 10. Memory Management

### 10.1 Memory Panel (`/memories` or slide-over)

```
┌───────────────────────────────────────────────────────────┐
│ Ký ức AI của tôi                    [Xóa tất cả] [✕]     │
│ ─────────────────────────────────────────────────────────  │
│ AI ghi nhớ những thông tin quan trọng từ cuộc trò chuyện  │
│ để cá nhân hóa hỗ trợ cho bạn.                            │
│                                                            │
│ 12 ký ức  |  [🔍 Tìm ký ức...]                            │
│                                                            │
│ HỌC TẬP:                                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🧠 Minh đang gặp khó khăn với đệ quy trong Python  │   │
│ │    Đã ghi nhớ: 20/04/2026             [✕ Xóa]      │   │
│ └─────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🧠 Minh thích học qua ví dụ thực tế, không lý thuyết│   │
│ │    Đã ghi nhớ: 18/04/2026             [✕ Xóa]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ TIẾN TRÌNH:                                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🧠 Minh đã nộp bài tập tuần 7 muộn do ốm           │   │
│ │    Đã ghi nhớ: 22/04/2026             [✕ Xóa]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ MỤC TIÊU:                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🧠 Minh muốn cải thiện điểm Python lên ≥ 9.0       │   │
│ │    Đã ghi nhớ: 15/04/2026             [✕ Xóa]      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ [Xóa tất cả ký ức]                                        │
│ Lưu ý: Xóa ký ức không xóa lịch sử trò chuyện.           │
└───────────────────────────────────────────────────────────┘

DELETE CONFIRMATION MODAL:
┌──────────────────────────────────────────┐
│ Xóa ký ức này?                      [✕] │
│ ──────────────────────────────────────── │
│ "Minh đang gặp khó khăn với đệ quy      │
│  trong Python"                           │
│                                          │
│ Hành động này không thể hoàn tác.       │
│                                          │
│ [  HỦY  ]  [  XÓA  ] ← Red button      │
└──────────────────────────────────────────┘
```

---

## 11. Instructor Screens

### 11.1 Instructor Course Management

```
COURSE DETAIL (INSTRUCTOR VIEW) - Extra Tab: Quản lý
┌────────────────────────────────────────────────────────────┐
│ TABS: [Bài tập] [Tài liệu] [Thông báo] [Thành viên]       │
│       [Quản lý] ← instructor-only                          │
├────────────────────────────────────────────────────────────┤
│ TAB: Quản lý                                               │
│                                                            │
│ THÔNG TIN KHÓA HỌC               [Chỉnh sửa] [Xóa KH]    │
│ ─────────────────────────────────────────────────────────  │
│ Tên: Lập trình Python                                      │
│ Mã đăng ký: LT-PY-2026  [📋 Sao chép] [🔄 Tạo mã mới]   │
│ Trạng thái: ● Đang hoạt động                               │
│ Tạo ngày: 10/01/2026                                       │
│                                                            │
│ TÀI LIỆU ĐÃ TẢI LÊN                [+ Tải lên tài liệu]  │
│ ─────────────────────────────────────────────────────────  │
│ 📄 Slide_Tuan_1.pdf       12/01  🟢 Đã index  [✕]         │
│ 📄 Slide_Tuan_2.pdf       19/01  🟢 Đã index  [✕]         │
│ 📄 Lab_1.pdf              19/01  🔄 Đang xử lý...         │
│ 📄 Slide_Tuan_3.pptx      26/01  ❌ Lỗi index [Thử lại]  │
└────────────────────────────────────────────────────────────┘

UPLOAD DOCUMENT MODAL:
┌──────────────────────────────────────────┐
│ Tải lên tài liệu                    [✕] │
│ ──────────────────────────────────────── │
│ ┌────────────────────────────────────┐  │
│ │                                    │  │
│ │  📁 Kéo thả file vào đây           │  │
│ │     hoặc [Chọn file]               │  │
│ │                                    │  │
│ │  Định dạng: PDF, DOCX, TXT, PPTX  │  │
│ │  Tối đa: 50MB / file               │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 📄 Slide_Tuan_4.pdf  (2.8MB)  ████████░│
│                                          │
│ Tài liệu sẽ được AI index tự động.     │
│                                          │
│ [HỦY]  [TẢI LÊN]                       │
└──────────────────────────────────────────┘
```

### 11.2 Assignment Creation Page

```
┌────────────────────────────────────────────────────────────┐
│ Tạo bài tập mới                                            │
│ Lập trình Python                                           │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ Tiêu đề bài tập *                                          │
│ [Bài tập tuần 8: Vòng lặp và hàm số________________________]│
│                                                            │
│ Mô tả / Yêu cầu                                           │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [B] [I] [U] [•] [1.] [<>] ─ markdown toolbar      │    │
│ ├────────────────────────────────────────────────────┤    │
│ │ Hoàn thành các bài tập sau về vòng lặp...          │    │
│ │                                                    │    │
│ │                                                    │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ Thời hạn nộp *                                            │
│ [27/04/2026] [23:59]  ← date + time pickers               │
│                                                            │
│ Điểm tối đa *                                             │
│ [100]  điểm                                               │
│                                                            │
│ Loại nộp bài                                              │
│ ☑ File đính kèm     ☑ Văn bản                             │
│                                                            │
│ Trạng thái                                                │
│ ○ Nháp (chưa hiển thị cho SV)   ● Đăng ngay               │
│                                                            │
│ [LƯU NHÁP]  [ĐĂNG BÀI TẬP]                               │
└────────────────────────────────────────────────────────────┘
```

### 11.3 Submission Review Page (Instructor)

```
┌────────────────────────────────────────────────────────────┐
│ Bài nộp: Bài tập tuần 8                                    │
│ 45 sinh viên  |  38 đã nộp (84%)  |  7 chưa nộp           │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ FILTER: [Tất cả] [Đã nộp] [Chưa nộp] [Đúng hạn] [Trễ hạn]│
│ SEARCH: [🔍 Tìm sinh viên...]                              │
│                                                            │
│ PROGRESS BAR:                                              │
│ ████████████████████████████████████████░░░░░░░  84%      │
│ 38/45 đã nộp  |  5 đã chấm  |  33 chờ chấm                │
│                                                            │
│ TABLE:                                                     │
│ ┌─────┬──────────────────┬──────────┬────────┬──────────┐ │
│ │  #  │ Sinh viên        │ Nộp lúc  │ Điểm   │ Thao tác │ │
│ ├─────┼──────────────────┼──────────┼────────┼──────────┤ │
│ │  1  │ 👤 Nguyễn V. Minh│ 27/04    │ 85/100 │[Xem điểm]│ │
│ │     │                  │ 18:23    │ ✅     │          │ │
│ ├─────┼──────────────────┼──────────┼────────┼──────────┤ │
│ │  2  │ 👤 Trần T. Hoa   │ 27/04    │ -      │[Chấm điểm│ │
│ │     │                  │ 21:15    │ ⏳     │ ngay]    │ │
│ ├─────┼──────────────────┼──────────┼────────┼──────────┤ │
│ │  3  │ 👤 Lê V. Nam     │ 28/04    │ -      │[Chấm điểm│ │
│ │     │ 🔴 Trễ 2h        │ 01:45    │ ⏳     │ ngay]    │ │
│ ├─────┼──────────────────┼──────────┼────────┼──────────┤ │
│ │  7  │ 👤 Phạm T. Linh  │ -        │ -      │[Gia hạn] │ │
│ │     │ Chưa nộp         │          │        │          │ │
│ └─────┴──────────────────┴──────────┴────────┴──────────┘ │
└────────────────────────────────────────────────────────────┘

GRADE ENTRY MODAL (click "Chấm điểm"):
┌──────────────────────────────────────────┐
│ Chấm điểm: Trần Thị Hoa              [✕]│
│ ──────────────────────────────────────── │
│                                          │
│ File đã nộp:                            │
│ 📄 bai_tap_8_hoa.py  (3.1KB)  [Tải về] │
│                                          │
│ Nộp: 27/04/2026 21:15 (đúng hạn)       │
│                                          │
│ Điểm  *                                 │
│ [____] / 100  điểm                      │
│                                          │
│ Nhận xét                                │
│ [_______________________________________]│
│ [_______________________________________]│
│ [_______________________________________]│
│                                          │
│ [LƯU NHÁP]  [LƯU & THÔNG BÁO SV]       │
│             ↑ sends grade notification  │
└──────────────────────────────────────────┘
```

### 11.4 Extension Grant Modal

```
┌──────────────────────────────────────────┐
│ Gia hạn cho sinh viên                [✕]│
│ ──────────────────────────────────────── │
│ Sinh viên: Phạm Thị Linh                │
│ Bài tập: Bài tập tuần 8                 │
│                                          │
│ Hạn hiện tại: 27/04/2026 23:59          │
│                                          │
│ Gia hạn đến *                           │
│ [29/04/2026] [23:59]                    │
│                                          │
│ Lý do (không hiển thị cho SV)           │
│ [Sinh viên báo ốm, có giấy xác nhận__]  │
│                                          │
│ [HỦY]  [XÁC NHẬN GIA HẠN]              │
└──────────────────────────────────────────┘
```

---

## 12. Admin Panel

### 12.1 Admin Dashboard (`/admin`)

```
┌────────────────────────────────────────────────────────────┐
│ Admin Dashboard                          27/04/2026        │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ STATS ROW:                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │👥 Tổng   │ │📚 Khóa   │ │🤖 Token  │ │💰 Chi phí│      │
│ │người dùng│ │học       │ │ AI (tháng│ │AI (tháng)│      │
│ │   248    │ │  15      │ │ 1.2M     │ │  $5.40   │      │
│ │ +12 mới  │ │ 3 mới    │ │ ↑ 18%    │ │ ↑ 18%    │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                            │
│ AI COST CHART (line chart by week):                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Chi phí AI theo ngày (tháng 4/2026)                  │  │
│ │  $0.40 ┤                           ╭──╮              │  │
│ │  $0.30 ┤               ╭──╮    ╭──╯  ╰              │  │
│ │  $0.20 ┤     ╭──╮ ╭──╯   ╰────╯                     │  │
│ │  $0.10 ┤─────╯  ╰─╯                                 │  │
│ │   $0   ┼────────────────────────────────────         │  │
│ │        01  05  10  15  20  25  27                    │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ TOP AI USERS THIS MONTH:                                   │
│ ┌──────────────────────────────────────────────────────┐  │
│ │  # │ Người dùng        │ Cuộc TT │ Token   │ Chi phí│  │
│ ├────┼────────────────────┼─────────┼─────────┼────────┤  │
│ │  1 │ Nguyễn Văn Minh   │   45    │ 120,000 │ $0.54  │  │
│ │  2 │ Trần Thị Hoa      │   38    │  98,000 │ $0.44  │  │
│ │  3 │ Lê Văn Nam        │   31    │  78,000 │ $0.35  │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 12.2 User Management (`/admin/users`)

```
┌────────────────────────────────────────────────────────────┐
│ Quản lý người dùng                [+ Tạo người dùng]       │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ FILTER: [🔍 Tìm theo tên/email...]  [Vai trò ▼]  [Trạng thái▼]│
│                                                            │
│ TABLE:                                                     │
│ ┌──┬────────────────────┬──────────────────┬──────┬──────┬────────┐│
│ │  │ Tên                │ Email            │ Vai  │ Trạng│Thao tác││
│ │  │                    │                  │ trò  │ thái │        ││
│ ├──┼────────────────────┼──────────────────┼──────┼──────┼────────┤│
│ │👤│ Nguyễn Văn Minh    │ minh@email.com   │ SV   │●Hoạt │[⋯]    ││
│ │👤│ Nguyễn Thị Lan     │ lan@email.com    │ GV   │●Hoạt │[⋯]    ││
│ │👤│ Trần Văn Hùng      │ hung@email.com   │ Admin│●Hoạt │[⋯]    ││
│ │👤│ Phạm T. Linh       │ linh@email.com   │ SV   │○Khóa │[⋯]    ││
│ └──┴────────────────────┴──────────────────┴──────┴──────┴────────┘│
│ 248 người dùng   Trang 1/13   [< Trước] [1] [2] [3] [Sau >]       │
└────────────────────────────────────────────────────────────┘

USER ACTION MENU (click ⋯):
┌──────────────────────┐
│ Xem hồ sơ           │
│ Đổi vai trò         │
│ ─────────────────── │
│ Khóa tài khoản      │ ← amber
│ Xóa tài khoản       │ ← red
└──────────────────────┘

CREATE USER MODAL:
┌──────────────────────────────────────────┐
│ Tạo tài khoản mới                    [✕]│
│ ──────────────────────────────────────── │
│ Họ và tên *    [________________________]│
│ Email *        [________________________]│
│ Mật khẩu *     [________________________]│
│                Gửi email để SV tự đổi   │
│ Vai trò *      ○ Sinh viên  ● Giảng viên│
│                                          │
│ [HỦY]  [TẠO TÀI KHOẢN]                 │
└──────────────────────────────────────────┘
```

---

## 13. Component States

### 13.1 Button States

```
PRIMARY BUTTON:
  Default:  bg-blue-600  text-white  cursor-pointer
  Hover:    bg-blue-700  (100ms transition)
  Active:   bg-blue-800  scale-[0.98]
  Focus:    ring-2 ring-blue-500 ring-offset-2
  Disabled: bg-gray-200  text-gray-400  cursor-not-allowed
  Loading:  bg-blue-600  [Spinner] [Label...]  cursor-wait

DESTRUCTIVE BUTTON:
  Default:  bg-red-600   text-white
  Hover:    bg-red-700
  Focus:    ring-2 ring-red-500 ring-offset-2

GHOST BUTTON:
  Default:  bg-transparent  text-blue-600  border border-blue-600
  Hover:    bg-blue-50
```

### 13.2 Input States

```
TEXT INPUT:
  Default:  border-gray-300  bg-white          focus-ring: blue-500
  Filled:   border-gray-400  (slightly darker)
  Focus:    border-blue-500  ring-1 ring-blue-500
  Error:    border-red-500   ring-1 ring-red-500
  Disabled: bg-gray-100  text-gray-400  cursor-not-allowed
  Success:  border-green-500  ✓ icon on right

TEXTAREA:
  Same as text input, min-height: 96px, resize: vertical

FILE UPLOAD DROP ZONE:
  Default:  border-2 border-dashed border-gray-300  bg-gray-50
  Drag-over: border-blue-500  bg-blue-50  (pulse animation)
  Has-file:  border-green-500  bg-green-50
  Error:    border-red-500  bg-red-50
```

### 13.3 Card States

```
COURSE CARD:
  Default: bg-white  shadow-sm  border border-gray-100
  Hover:   shadow-md  transform translateY(-2px)  (200ms)
  Active:  shadow-sm  transform translateY(0)

ASSIGNMENT ROW:
  Default: bg-white  border-b border-gray-100
  Hover:   bg-gray-50
  Unread:  bg-blue-50  (if has ungraded or new grade)
  Overdue: left-border: 3px solid red-500
  Due-soon: left-border: 3px solid amber-500
```

### 13.4 Badge/Status Chip States

```
STATUS BADGES:
  "Chưa nộp"  → bg-gray-100    text-gray-600   border-gray-200
  "Đã nộp"    → bg-green-100   text-green-700  border-green-200
  "Trễ hạn"   → bg-red-100     text-red-700    border-red-200
  "Đã chấm"   → bg-blue-100    text-blue-700   border-blue-200
  "Gia hạn"   → bg-purple-100  text-purple-700 border-purple-200
  "Đang index"→ bg-amber-100   text-amber-700  (pulse animation)
  "Lỗi index" → bg-red-100     text-red-700    [Thử lại] link
  "Đã index"  → bg-green-100   text-green-700
```

### 13.5 Toast Notifications

```
SUCCESS TOAST (top-right, 3s auto-dismiss):
  ┌──────────────────────────────────────┐
  │ ✅  Nộp bài thành công!             [✕]│
  └──────────────────────────────────────┘

ERROR TOAST:
  ┌──────────────────────────────────────┐
  │ ❌  Có lỗi xảy ra. Thử lại sau.    [✕]│
  └──────────────────────────────────────┘

INFO TOAST:
  ┌──────────────────────────────────────┐
  │ ℹ️  File đang được xử lý...         [✕]│
  └──────────────────────────────────────┘

POSITION: top-right, 16px from edge
STACK: multiple toasts stack vertically
ANIMATION: slide-in from right, fade-out
```

---

## 14. Responsive Breakpoints

### 14.1 Breakpoint Definitions

```
xs:  < 480px   (small phone)
sm:  480-767px (large phone)
md:  768-1023px (tablet)
lg:  1024-1279px (desktop)
xl:  ≥ 1280px  (large desktop)
```

### 14.2 Layout Changes Per Breakpoint

```
NAVIGATION:
  lg+: Left sidebar (240px, always visible)
  md:  Collapsible sidebar (icon-only when collapsed)
  sm-: Bottom navigation bar (5 icons)

COURSE GRID:
  xl:  3 columns
  lg:  3 columns
  md:  2 columns
  sm-: 1 column (full width cards)

DASHBOARD STATS:
  lg+: 4 columns in one row
  md:  2 columns × 2 rows
  sm-: 2 columns × 2 rows (compact)

ASSIGNMENT TABLE:
  lg+: Full table with all columns
  md:  Hide "Khóa học" column, show as subtitle
  sm-: Card layout (stacked info), no table

GRADE BOOK:
  lg+: Full table
  md:  Scrollable table (horizontal scroll)
  sm-: Accordion + simple list per assignment

CHAT INTERFACE:
  lg+: Sidebar (280px) + chat area
  md:  Sidebar hidden, hamburger to open
  sm-: Sidebar as full-screen drawer

MODALS:
  md+: Centered modal (max-width 480px)
  sm-: Bottom sheet (slides up, full width)
```

### 14.3 Mobile-Specific Patterns

```
BOTTOM NAVIGATION (mobile):
┌────────────────────────────────────┐
│ 🏠      📚      🤖      🔔      👤 │
│Tổng    Khóa   Chat   Thông   Hồ  │
│quan    học            báo    sơ  │
└────────────────────────────────────┘
Active item: filled icon + blue label

PULL-TO-REFRESH:
  - Dashboard, Notification list, Course list
  - Spinner appears at top, threshold: 80px pull

SWIPE ACTIONS (notification list):
  Swipe left → reveals [Xóa] button (red)
  Swipe right → reveals [Đọc] button (blue)

FILE UPLOAD (mobile):
  "Chọn file" → native OS file picker
  Camera option: not available (academic context)

STICKY ELEMENTS:
  - Filter bar sticks below header on scroll
  - Submit button sticks to bottom on assignment page
```

---

## 15. Interaction Patterns

### 15.1 Loading Patterns

```
INITIAL PAGE LOAD: Skeleton screens (not spinner)
  Course card skeleton:
  ┌────────────────────────┐
  │ ████████████████████  │  ← gray animated shimmer
  │ ──────────────────     │
  │ ██████████████         │
  │ ██████                 │
  │ ████████████           │
  └────────────────────────┘

API CALLS (subsequent): Inline spinner or button loading state
TABLE LOAD: Skeleton rows (5 rows of gray bars)
CHAT RESPONSE: Streaming text with blinking cursor ▊

SHIMMER ANIMATION:
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)
  animation: shimmer 1.5s infinite
```

### 15.2 Form Submission Patterns

```
SUBMIT FLOW:
  1. User clicks submit
  2. Button → loading state (spinner + disabled)
  3. All form fields → disabled
  4. API call in progress
  5a. Success → Toast notification + redirect/update
  5b. Error → Form re-enabled + error message shown

VALIDATION TIMING:
  - On blur: validate individual field
  - On submit: validate all fields at once
  - Real-time: password strength only

ERROR DISPLAY:
  Field-level: Red text below the field
  Form-level: Red alert box at top of form
  Toast: For save/delete confirmations
```

### 15.3 Confirmation Patterns

```
DESTRUCTIVE ACTIONS require confirmation modal:
  - Delete conversation
  - Delete all memories
  - Drop course
  - Delete user (admin)
  - Delete course (admin)

REVERSIBLE ACTIONS use toast with undo:
  - Mark notification read  → "Đã đọc [Hoàn tác]"
  - Archive conversation    → "Đã lưu trữ [Hoàn tác]"
  Undo window: 5 seconds
```

### 15.4 Real-Time Updates

```
SSE CHAT STREAMING:
  - Connection established: "🟢 Đã kết nối"
  - Token received: Append to bubble, scroll to bottom
  - Tool call: Show tool indicator card
  - Done: Remove cursor, show timestamp
  - Error: Show error bubble, retry option
  - Disconnected: Show reconnecting indicator, auto-retry 3×

NOTIFICATION POLLING:
  - Poll /notifications?unread=true every 30 seconds
  - If new: update bell badge count (no full refresh)
  - Use React Query's refetchInterval

GRADE/SUBMISSION STATUS:
  - Optimistic update on submit (show "Đã nộp" immediately)
  - Confirm with API response
  - Rollback on error
```

### 15.5 Navigation Patterns

```
BREADCRUMBS: Always show on pages 2+ levels deep
  Tổng quan > Khóa học > Lập trình Python > Bài tập tuần 8

BACK NAVIGATION:
  - Use browser back by default
  - Explicit [← Back] link on assignment, course detail

PAGE TRANSITIONS:
  - Fade in: 150ms ease on route change
  - Scroll to top: on every route change

LINK BEHAVIOR:
  - LMS pages: same tab
  - AI Chat (agent-web): new tab from LMS
  - File downloads: new tab
  - External docs: new tab with rel="noopener noreferrer"
```

---

## 16. Error & Empty States

### 16.1 Empty States

```
NO COURSES (student):
  ┌──────────────────────────────────────┐
  │      [📚 illustration]               │
  │  Bạn chưa đăng ký khóa học nào      │
  │  Đăng ký khóa học để bắt đầu học!   │
  │  [Đăng ký khóa học đầu tiên]         │
  └──────────────────────────────────────┘

NO ASSIGNMENTS:
  ┌──────────────────────────────────────┐
  │      [📋 illustration]               │
  │  Không có bài tập nào                │
  │  Chưa có bài tập nào được đăng.     │
  └──────────────────────────────────────┘

NO NOTIFICATIONS:
  ┌──────────────────────────────────────┐
  │      [🔔 illustration]               │
  │  Không có thông báo mới              │
  │  Bạn đã đọc tất cả thông báo.       │
  └──────────────────────────────────────┘

NO GRADES YET:
  ┌──────────────────────────────────────┐
  │      [🎓 illustration]               │
  │  Chưa có điểm nào                   │
  │  Giảng viên chưa chấm bài tập nào.  │
  └──────────────────────────────────────┘

NO MEMORIES (AI):
  ┌──────────────────────────────────────┐
  │      [🧠 illustration]               │
  │  AI chưa ghi nhớ gì                 │
  │  Bắt đầu trò chuyện với AI để       │
  │  xây dựng ký ức học tập của bạn.    │
  └──────────────────────────────────────┘

SEARCH NO RESULTS:
  ┌──────────────────────────────────────┐
  │      [🔍 illustration]               │
  │  Không tìm thấy kết quả             │
  │  Thử từ khóa khác hoặc xóa bộ lọc  │
  │  [Xóa bộ lọc]                       │
  └──────────────────────────────────────┘
```

### 16.2 Error States

```
404 NOT FOUND:
  ┌──────────────────────────────────────┐
  │         404                          │
  │   Trang không tồn tại               │
  │   Trang bạn tìm không còn ở đây    │
  │   [Về trang chủ]                     │
  └──────────────────────────────────────┘

500 SERVER ERROR:
  ┌──────────────────────────────────────┐
  │         ⚠️                            │
  │   Có lỗi xảy ra                      │
  │   Server đang gặp sự cố. Vui lòng   │
  │   thử lại sau.                       │
  │   [Thử lại]  [Về trang chủ]          │
  └──────────────────────────────────────┘

NETWORK OFFLINE:
  (Banner at top of page, not full page)
  ┌──────────────────────────────────────┐
  │ 📡 Mất kết nối. Đang thử lại...     │
  └──────────────────────────────────────┘

AI UNAVAILABLE:
  (In chat window)
  ┌──────────────────────────────────────┐
  │ ❌ AI Trợ Lý tạm thời không khả dụng│
  │    Vui lòng thử lại sau vài phút.   │
  │    [Thử lại]                         │
  └──────────────────────────────────────┘

UNAUTHORIZED (403):
  Redirect to /login with ?redirect= original URL
  Toast on login page: "Vui lòng đăng nhập để tiếp tục"

FILE TOO LARGE:
  (Inline, in file upload zone)
  ┌──────────────────────────────────────┐
  │ ❌ File vượt quá 50MB                │
  │    Vui lòng chọn file nhỏ hơn.      │
  └──────────────────────────────────────┘
```

---

## 17. Accessibility Specifications

### 17.1 Keyboard Navigation

```
TAB ORDER (logical reading order):
  Login page: Email → Password → Remember → Login btn → Forgot link → Register link

KEYBOARD SHORTCUTS:
  / (forward slash): Focus search bar
  Escape:           Close modal, close dropdown, cancel
  Enter:            Submit focused form, confirm dialog
  Space:            Toggle checkbox, toggle
  Arrow keys:       Navigate dropdown options
  Tab/Shift+Tab:    Forward/backward focus

FOCUS TRAP:
  - Modals: Focus trapped inside, Tab cycles within
  - On open: Focus moves to modal heading
  - On close: Focus returns to trigger element

SKIP LINK:
  First focusable element on every page:
  [Bỏ qua điều hướng → đến nội dung chính]
  (visible only on focus, positioned absolute top-left)
```

### 17.2 ARIA Labels

```
ICON BUTTONS (no visible text):
  <button aria-label="Đóng thông báo">✕</button>
  <button aria-label="Xóa ký ức này">✕</button>
  <button aria-label="Tải file bài tập">⬇</button>

STATUS BADGES:
  <span role="status" aria-label="Trạng thái: Đã nộp">✅ Đã nộp</span>

LIVE REGIONS (for dynamic content):
  Notification count: <span aria-live="polite" aria-atomic="true">3</span>
  Streaming text: <div aria-live="polite"> (AI response area)
  Toast notifications: <div aria-live="assertive"> (errors)
                       <div aria-live="polite"> (success)

LOADING STATES:
  <button aria-busy="true" aria-label="Đang đăng nhập...">
  <div role="status" aria-label="Đang tải...">

FORM ERRORS:
  <input aria-invalid="true" aria-describedby="email-error" />
  <p id="email-error" role="alert">Email không hợp lệ</p>

DIALOG:
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
```

### 17.3 Color & Contrast

```
CONTRAST RATIOS (WCAG 2.1 AA requirement: 4.5:1 normal, 3:1 large):

Text on White background:
  Gray-800 (#1F2937) on White:  16.1:1  ✅
  Gray-600 (#4B5563) on White:   7.2:1  ✅
  Gray-400 (#9CA3AF) on White:   3.0:1  ❌ only use for large/decorative text
  Blue-600 (#2563EB) on White:   5.9:1  ✅

Text on Blue background (buttons):
  White on Blue-600 (#2563EB):   5.9:1  ✅
  White on Blue-700 (#1D4ED8):   7.2:1  ✅

Text on colored backgrounds (badges):
  Green-700 on Green-100:  5.2:1  ✅
  Red-700 on Red-100:      5.8:1  ✅
  Amber-700 on Amber-100:  4.6:1  ✅

DO NOT USE:
  Gray-400 (#9CA3AF) for any body text → fails contrast
  Yellow text on white → fails contrast
```

### 17.4 Screen Reader Considerations

```
IMAGES:
  Decorative images: alt=""
  Course cover (meaningful): alt="Ảnh bìa khóa học [Tên KH]"
  User avatar: alt="Ảnh đại diện của [Tên]"
  Illustrations: alt="[Description of what illustration shows]"

TABLES:
  All tables use <thead>, <th scope="col">, <th scope="row">
  Complex tables add aria-label on table itself

FORMS:
  Every input has associated <label> (not just placeholder)
  Error messages associated via aria-describedby
  Required fields: aria-required="true" AND visual indicator (*)

DYNAMIC CONTENT:
  Page title updates on route change (document.title)
  Focus moves to main heading on navigation
  New chat messages: screen reader reads them via aria-live

GRADE VISUALIZATION:
  Progress bars: aria-valuenow, aria-valuemin, aria-valuemax
  Charts: data table alternative provided
```

---

*This document specifies the complete UI/UX design for all screens in both lms-web and agent-web applications. All wireframes use ASCII art for specification; final implementation uses Tailwind CSS + shadcn/ui component library following this design system.*

*Design assets in Figma: [Link TBD — to be created by design team]*

*Version 2.0 | Owner: Team AI20K-015 | Next review: Sprint 4 demo*
