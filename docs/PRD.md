# PRD — Product Requirements Document
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 3.0 | **Ngày:** 2026-04-29 | **Nhóm:** Team 100
**Phạm vi:** Hệ thống Learning Management System cho môi trường đại học  
**Đối tượng chính:** Sinh viên, Giảng viên, Quản trị viên hệ thống, Khoa/Bộ môn/Phòng đào tạo, Cố vấn học tập  
**Công nghệ định hướng:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, FastAPI, PostgreSQL 15, Redis 7, Docker, Railway, GitHub Actions  

---

## 1. Tổng quan sản phẩm

## 1.1. Mục tiêu sản phẩm

Hệ thống LMS được xây dựng nhằm số hóa toàn bộ hoạt động dạy, học, quản lý học phần, đánh giá, điểm danh, theo dõi tiến độ và cảnh báo học vụ trong môi trường đại học.

Sản phẩm cần hỗ trợ đầy đủ 5 nhóm người dùng:

1. **Sinh viên**: học tập, nộp bài, làm bài kiểm tra, xem điểm, nhận thông báo, trao đổi với giảng viên/cố vấn.
2. **Giảng viên**: quản lý lớp học phần, bài giảng, bài tập, quiz, điểm danh, chấm điểm, báo cáo lớp.
3. **Quản trị viên hệ thống**: quản lý người dùng, phân quyền, cấu hình hệ thống, bảo mật, vận hành, tích hợp.
4. **Khoa / Bộ môn / Phòng đào tạo**: quản lý chương trình đào tạo, lớp học phần, phân công giảng viên, duyệt điểm, theo dõi chất lượng đào tạo.
5. **Cố vấn học tập**: theo dõi sinh viên, cảnh báo học vụ, tư vấn, hỗ trợ và báo cáo tình trạng học tập.

## 1.2. Giá trị cốt lõi

| Giá trị | Mô tả |
|---|---|
| Quản lý học tập tập trung | Tất cả học phần, bài giảng, bài tập, quiz, điểm, điểm danh nằm trong một hệ thống |
| Chuẩn hóa quy trình đào tạo | Khoa/phòng đào tạo có thể kiểm soát lớp học phần, đề cương, điểm, khảo thí |
| Minh bạch học tập | Sinh viên xem rõ tiến độ, điểm, deadline, phản hồi |
| Tăng hiệu quả giảng dạy | Giảng viên dễ tạo học liệu, bài tập, quiz, chấm điểm và thống kê |
| Cảnh báo sớm sinh viên rủi ro | Cố vấn học tập/khoa có thể phát hiện sinh viên yếu, vắng nhiều, ít tương tác |
| Bảo mật và phân quyền rõ ràng | Role-based access control theo vai trò và phạm vi dữ liệu |
| Dễ mở rộng | Kiến trúc frontend/backend tách biệt, PostgreSQL, Redis, API-first |

## 1.3. Phạm vi sản phẩm

### Bao gồm

- Quản lý tài khoản, hồ sơ, đăng nhập, phân quyền.
- Quản lý cơ cấu trường: khoa, bộ môn, ngành, lớp hành chính, học kỳ.
- Quản lý môn học, lớp học phần, ghi danh sinh viên.
- Quản lý bài giảng, học liệu, tài liệu, video.
- Quản lý bài tập, nộp bài, chấm bài, rubric.
- Quản lý quiz/bài kiểm tra/ngân hàng câu hỏi.
- Quản lý điểm, trọng số, bảng điểm, phúc khảo.
- Quản lý điểm danh, chuyên cần.
- Diễn đàn, thông báo, tin nhắn, khảo sát.
- Lớp học trực tuyến thông qua link Zoom/Meet/Teams.
- Dashboard, báo cáo, phân tích, cảnh báo học vụ.
- Quản trị hệ thống, bảo mật, audit log, backup, deployment.

### Không bao gồm trong phiên bản hiện tại

- AI Agent/RAG, chatbot AI.
- Thanh toán học phí trực tuyến.
- Mobile app native.
- Proctoring nâng cao bằng nhận diện khuôn mặt.
- Tích hợp sâu với hệ thống đào tạo thật nếu chưa có API từ trường.

---

# 2. Persona người dùng

## 2.1. Sinh viên

**Mục tiêu:** học tập, nhận tài liệu, nộp bài, làm quiz, xem điểm, theo dõi deadline.  
**Nỗi đau:** quên deadline, không biết điểm/feedback, khó tìm tài liệu, không biết tiến độ học tập.  
**Thành công khi:** sinh viên có thể học, nộp bài, làm quiz, xem điểm, nhận thông báo rõ ràng.

## 2.2. Giảng viên

**Mục tiêu:** quản lý lớp, đăng bài giảng, giao bài, chấm bài, điểm danh, theo dõi sinh viên.  
**Nỗi đau:** chấm bài thủ công, khó theo dõi sinh viên yếu, gửi thông báo rời rạc.  
**Thành công khi:** giảng viên giảm thời gian quản lý lớp, chấm điểm nhanh, có báo cáo rõ ràng.

## 2.3. Admin

**Mục tiêu:** vận hành hệ thống, quản lý user, role, cấu hình, bảo mật, backup.  
**Nỗi đau:** phân quyền phức tạp, dữ liệu phân tán, khó kiểm soát log/lỗi.  
**Thành công khi:** hệ thống ổn định, bảo mật, phân quyền đúng, dễ vận hành.

## 2.4. Khoa / Bộ môn / Phòng đào tạo

**Mục tiêu:** quản lý lớp học phần, chương trình đào tạo, phân công giảng viên, duyệt điểm, theo dõi chất lượng.  
**Nỗi đau:** thiếu báo cáo tổng quan, khó kiểm soát tiến độ giảng dạy, điểm và khảo thí.  
**Thành công khi:** quản lý được toàn bộ hoạt động đào tạo trong phạm vi khoa/phòng.

## 2.5. Cố vấn học tập

**Mục tiêu:** theo dõi sinh viên phụ trách, phát hiện rủi ro, tư vấn và hỗ trợ.  
**Nỗi đau:** thiếu dữ liệu tập trung về điểm, chuyên cần, bài tập, tiến độ.  
**Thành công khi:** phát hiện sớm sinh viên cần hỗ trợ và theo dõi được kết quả sau tư vấn.

---

# 3. Vai trò và phân quyền tổng quan

| Module | Sinh viên | Giảng viên | Admin | Khoa/Bộ môn/Phòng đào tạo | Cố vấn học tập |
|---|---|---|---|---|---|
| Hồ sơ cá nhân | Xem/sửa cá nhân | Xem/sửa cá nhân | Toàn quyền | Xem/sửa cá nhân | Xem/sửa cá nhân |
| Người dùng | Không | Xem sinh viên lớp mình | Toàn quyền | Xem/quản lý phạm vi khoa | Xem sinh viên phụ trách |
| Role/Permission | Không | Không | Toàn quyền | Hạn chế | Không |
| Cơ cấu tổ chức | Xem hạn chế | Xem hạn chế | Toàn quyền | Quản lý phạm vi | Xem hạn chế |
| Môn học | Xem | Xem/quản lý lớp được giao | Toàn quyền | Quản lý phạm vi khoa | Xem |
| Lớp học phần | Tham gia | Quản lý lớp được giao | Toàn quyền | Quản lý phạm vi khoa | Xem |
| Bài giảng | Xem/học | Tạo/sửa/xóa lớp mình | Toàn quyền/kiểm duyệt | Theo dõi/duyệt | Xem tiến độ |
| Bài tập | Nộp bài | Tạo/chấm | Toàn quyền | Theo dõi | Theo dõi |
| Quiz/Thi | Làm bài | Tạo/chấm | Toàn quyền | Duyệt/theo dõi | Theo dõi |
| Điểm | Xem cá nhân | Nhập/chấm lớp mình | Toàn quyền | Duyệt/xem | Xem sinh viên phụ trách |
| Điểm danh | Điểm danh/xem | Tạo/sửa | Toàn quyền | Theo dõi | Theo dõi |
| Forum | Tham gia | Quản lý lớp mình | Kiểm duyệt | Theo dõi | Theo dõi |
| Thông báo | Nhận | Gửi lớp mình | Toàn quyền | Gửi theo phạm vi | Gửi nhóm phụ trách |
| Báo cáo | Cá nhân | Lớp mình | Toàn hệ thống | Theo khoa/bộ môn | Sinh viên phụ trách |
| Cấu hình hệ thống | Không | Không | Toàn quyền | Không/hạn chế | Không |
| Cảnh báo học vụ | Nhận | Tạo/xem lớp mình | Cấu hình | Theo dõi/phân phối | Xử lý trực tiếp |

---

# 4. Yêu cầu chức năng chi tiết

# 4.1. Module xác thực & tài khoản

## 4.1.1. Mục tiêu

Cho phép người dùng đăng nhập an toàn, quản lý hồ sơ cá nhân, bảo vệ tài khoản và phân quyền truy cập theo vai trò.

## 4.1.2. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| AUTH-01 | Đăng nhập | Tất cả | Đăng nhập bằng email/mã số + mật khẩu |
| AUTH-02 | Đăng xuất | Tất cả | Kết thúc phiên đăng nhập |
| AUTH-03 | Quên mật khẩu | Tất cả | Gửi email đặt lại mật khẩu |
| AUTH-04 | Đổi mật khẩu | Tất cả | Đổi mật khẩu sau khi xác thực mật khẩu cũ |
| AUTH-05 | Refresh token | Tất cả | Làm mới access token an toàn |
| AUTH-06 | Quản lý phiên | Admin, User | Xem/đăng xuất thiết bị đang đăng nhập |
| AUTH-07 | 2FA | Tất cả, Admin cấu hình | OTP qua email/app nếu bật |
| AUTH-08 | Hồ sơ cá nhân | Tất cả | Xem/sửa thông tin cá nhân được phép |
| AUTH-09 | Avatar | Tất cả | Tải ảnh đại diện, kiểm tra MIME type |
| AUTH-10 | Lịch sử đăng nhập | User, Admin | Xem thời gian, IP, thiết bị |
| AUTH-11 | Khóa tài khoản | Admin | Khóa/mở tài khoản người dùng |
| AUTH-12 | Chính sách mật khẩu | Admin | Cấu hình độ dài, độ mạnh, hết hạn |

## 4.1.3. User stories & Acceptance Criteria

### AUTH-01 — Đăng nhập

**User story:** Là người dùng LMS, tôi muốn đăng nhập bằng tài khoản được cấp để truy cập đúng chức năng theo vai trò.

**Acceptance Criteria:**

- Người dùng nhập email/mã số và mật khẩu hợp lệ thì đăng nhập thành công.
- Hệ thống trả về access token và refresh token.
- Người dùng được điều hướng về dashboard theo vai trò.
- Nếu sai mật khẩu, hiển thị lỗi rõ ràng nhưng không tiết lộ tài khoản có tồn tại hay không.
- Nếu tài khoản bị khóa, hiển thị thông báo tài khoản không được phép truy cập.
- Sau nhiều lần đăng nhập sai, hệ thống có thể tạm khóa hoặc yêu cầu captcha.

### AUTH-03 — Quên mật khẩu

**Acceptance Criteria:**

- Người dùng nhập email hợp lệ thì hệ thống gửi link đặt lại mật khẩu.
- Link có thời hạn sử dụng.
- Link chỉ dùng được một lần.
- Mật khẩu mới phải thỏa chính sách mật khẩu.

---

# 4.2. Module quản lý người dùng

## 4.2.1. Mục tiêu

Admin quản lý toàn bộ tài khoản; khoa/phòng đào tạo quản lý người dùng trong phạm vi; giảng viên/cố vấn xem người học liên quan.

## 4.2.2. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| USER-01 | Tạo người dùng | Admin | Tạo tài khoản sinh viên, giảng viên, cố vấn, staff |
| USER-02 | Cập nhật người dùng | Admin | Sửa thông tin cá nhân, khoa, trạng thái |
| USER-03 | Xóa mềm người dùng | Admin | Vô hiệu hóa nhưng giữ dữ liệu lịch sử |
| USER-04 | Khôi phục người dùng | Admin | Khôi phục tài khoản đã xóa mềm |
| USER-05 | Import người dùng | Admin, Phòng đào tạo | Import Excel/CSV |
| USER-06 | Export người dùng | Admin, Khoa | Xuất Excel/CSV/PDF |
| USER-07 | Tìm kiếm/lọc | Admin, Khoa, GV, Cố vấn | Theo tên, email, mã số, vai trò, khoa |
| USER-08 | Gán khoa/lớp/ngành | Admin, Phòng đào tạo | Gán người dùng vào đơn vị tổ chức |
| USER-09 | Reset mật khẩu | Admin | Đặt lại mật khẩu cho user |
| USER-10 | Xem hoạt động user | Admin, GV, Cố vấn | Xem login, bài nộp, tiến độ theo quyền |

## 4.2.3. Acceptance Criteria chính

- Import file phải validate trùng email/mã số.
- Nếu dòng dữ liệu lỗi, hệ thống hiển thị dòng lỗi và lý do.
- Xóa người dùng không được làm mất dữ liệu bài nộp, điểm, log.
- Người dùng chỉ xem được dữ liệu trong phạm vi quyền.

---

# 4.3. Module vai trò & phân quyền RBAC

## 4.3.1. Mục tiêu

Thiết lập phân quyền rõ ràng theo vai trò, chức năng và phạm vi dữ liệu.

## 4.3.2. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| RBAC-01 | Tạo vai trò | Admin | Tạo Student, Lecturer, Advisor, Academic Staff, Admin |
| RBAC-02 | Sửa vai trò | Admin | Đổi tên, mô tả, trạng thái |
| RBAC-03 | Gán role cho user | Admin | Một user có thể có nhiều role |
| RBAC-04 | Thu hồi role | Admin | Gỡ quyền khỏi user |
| RBAC-05 | Quản lý permission | Admin | Permission theo module/action |
| RBAC-06 | Ma trận quyền | Admin | Xem bảng role-permission |
| RBAC-07 | Phân quyền dữ liệu | Admin | Theo khoa, lớp, học kỳ, môn |
| RBAC-08 | Audit phân quyền | Admin | Ghi nhận ai cấp/thu hồi quyền |

## 4.3.3. Permission mẫu

| Permission | Ý nghĩa |
|---|---|
| users.read | Xem người dùng |
| users.create | Tạo người dùng |
| courses.manage | Quản lý môn học |
| sections.manage | Quản lý lớp học phần |
| lessons.manage | Quản lý bài giảng |
| assignments.grade | Chấm bài tập |
| exams.approve | Duyệt bài thi |
| grades.publish | Công bố điểm |
| reports.view_faculty | Xem báo cáo cấp khoa |
| system.configure | Cấu hình hệ thống |

---

# 4.4. Module cơ cấu tổ chức

## 4.4.1. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| ORG-01 | Quản lý campus | Admin | Cơ sở đào tạo |
| ORG-02 | Quản lý khoa | Admin | Tạo/sửa/xóa khoa |
| ORG-03 | Quản lý bộ môn | Admin, Khoa | Bộ môn thuộc khoa |
| ORG-04 | Quản lý phòng ban | Admin | Phòng đào tạo, khảo thí |
| ORG-05 | Quản lý ngành | Admin, Khoa | Ngành học |
| ORG-06 | Quản lý chuyên ngành | Admin, Khoa | Chuyên ngành thuộc ngành |
| ORG-07 | Quản lý lớp hành chính | Admin, Phòng đào tạo | Lớp sinh viên theo khóa |
| ORG-08 | Quản lý niên khóa | Admin | Ví dụ 2024-2028 |
| ORG-09 | Gán trưởng khoa/bộ môn | Admin | Người phụ trách đơn vị |

## 4.4.2. Acceptance Criteria

- Không cho xóa khoa/bộ môn nếu còn môn học hoặc user đang gắn trực tiếp, trừ khi chuyển dữ liệu.
- Mã khoa, mã ngành, mã lớp không được trùng.
- Có lịch sử thay đổi dữ liệu tổ chức.

---

# 4.5. Module năm học, học kỳ, lịch đào tạo

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| TERM-01 | Tạo năm học | Admin, Phòng đào tạo | Ví dụ 2025-2026 |
| TERM-02 | Tạo học kỳ | Admin, Phòng đào tạo | HK1, HK2, Hè |
| TERM-03 | Thiết lập tuần học | Admin, Phòng đào tạo | Tuần 1 đến tuần 15 |
| TERM-04 | Lịch nghỉ | Admin, Phòng đào tạo | Lễ, Tết, nghỉ bù |
| TERM-05 | Đợt đăng ký học | Phòng đào tạo | Mở/đóng thời gian đăng ký |
| TERM-06 | Đợt thi | Phòng đào tạo, Khảo thí | Giữa kỳ, cuối kỳ |
| TERM-07 | Khóa học kỳ | Admin, Phòng đào tạo | Chốt dữ liệu học kỳ |
| TERM-08 | Sao chép cấu hình | Admin | Tạo học kỳ mới từ học kỳ cũ |

---

# 4.6. Module chương trình đào tạo

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| CURR-01 | Quản lý khung CTĐT | Khoa, Phòng đào tạo | Môn theo kỳ |
| CURR-02 | Quản lý môn bắt buộc | Khoa | Required courses |
| CURR-03 | Quản lý môn tự chọn | Khoa | Elective courses |
| CURR-04 | Quản lý môn tiên quyết | Khoa | Prerequisite |
| CURR-05 | Chuẩn đầu ra PLO | Khoa | Program Learning Outcomes |
| CURR-06 | Chuẩn đầu ra CLO | Khoa, Giảng viên | Course Learning Outcomes |
| CURR-07 | Mapping CLO-PLO | Khoa | Liên kết chuẩn đầu ra |
| CURR-08 | Duyệt đề cương chuẩn | Khoa, Phòng đào tạo | Approve syllabus |
| CURR-09 | Lịch sử thay đổi CTĐT | Khoa, Admin | Versioning |

---

# 4.7. Module môn học & lớp học phần

## 4.7.1. Chức năng môn học

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| COURSE-01 | Tạo môn học | Admin, Khoa | Mã môn, tên môn, tín chỉ |
| COURSE-02 | Sửa môn học | Admin, Khoa | Cập nhật mô tả, số tín chỉ |
| COURSE-03 | Ẩn/ngừng môn | Admin, Khoa | Không còn mở lớp mới |
| COURSE-04 | Quản lý tài liệu chuẩn | Khoa, GV | Giáo trình, tài liệu tham khảo |
| COURSE-05 | Quản lý đề cương | Khoa, GV | Syllabus |
| COURSE-06 | Quản lý rubric chuẩn | Khoa | Tiêu chí đánh giá |

## 4.7.2. Chức năng lớp học phần

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| SECTION-01 | Tạo lớp học phần | Admin, Phòng đào tạo, Khoa | Theo môn và học kỳ |
| SECTION-02 | Gán giảng viên | Khoa, Phòng đào tạo | Lecturer assignment |
| SECTION-03 | Gán trợ giảng | GV, Khoa | Teaching assistant |
| SECTION-04 | Ghi danh sinh viên | Admin, Phòng đào tạo | Enrollment |
| SECTION-05 | Chuyển lớp | Phòng đào tạo | Chuyển sinh viên giữa section |
| SECTION-06 | Tách/gộp lớp | Phòng đào tạo | Theo sĩ số |
| SECTION-07 | Mở/đóng lớp | Khoa, Phòng đào tạo | Theo trạng thái |
| SECTION-08 | Sao chép lớp | GV, Admin | Clone nội dung kỳ trước |
| SECTION-09 | Lưu trữ lớp | Admin, GV | Sau khi kết thúc |
| SECTION-10 | Xem danh sách lớp | Tất cả theo quyền | Danh sách section liên quan |

## 4.7.3. Acceptance Criteria

- Mỗi lớp học phần phải thuộc một môn học và một học kỳ.
- Không thể ghi danh sinh viên vào lớp đã đóng nếu không có quyền đặc biệt.
- Giảng viên chỉ sửa lớp được phân công.
- Sinh viên chỉ nhìn thấy lớp mình đã ghi danh hoặc lớp public được phép xem.

---

# 4.8. Module học liệu & bài giảng

## 4.8.1. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| LESSON-01 | Tạo chương/chủ đề | Giảng viên | Tuần/chương/module |
| LESSON-02 | Tạo bài học | Giảng viên | Text, video, tài liệu |
| LESSON-03 | Upload tài liệu | Giảng viên | PDF, DOCX, PPTX, ZIP |
| LESSON-04 | Upload video | Giảng viên | MP4 hoặc link |
| LESSON-05 | Nhúng video | Giảng viên | YouTube/Vimeo/internal |
| LESSON-06 | Sắp xếp bài học | Giảng viên | Drag/drop |
| LESSON-07 | Ẩn/hiện bài học | Giảng viên | Draft/published |
| LESSON-08 | Hẹn giờ công bố | Giảng viên | Publish theo thời gian |
| LESSON-09 | Điều kiện mở bài | Giảng viên | Học bài trước, đạt quiz |
| LESSON-10 | Theo dõi lượt xem | Giảng viên, Khoa | Learning logs |
| LESSON-11 | Đánh dấu đã học | Sinh viên | Mark complete |
| LESSON-12 | Bookmark | Sinh viên | Lưu bài quan trọng |
| LESSON-13 | Ghi chú cá nhân | Sinh viên | Private note |
| LESSON-14 | Tìm kiếm học liệu | Sinh viên, GV | Search trong course |
| LESSON-15 | Duyệt/xóa nội dung | Admin, Khoa | Kiểm duyệt nếu cần |

## 4.8.2. Acceptance Criteria

- File upload phải kiểm tra MIME type và dung lượng.
- Bài học draft không hiển thị với sinh viên.
- Bài học theo điều kiện chỉ mở khi sinh viên đạt điều kiện.
- Mọi lượt xem bài học được ghi log để phục vụ tiến độ.

---

# 4.9. Module bài tập

## 4.9.1. Chức năng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| ASSIGN-01 | Tạo bài tập | Giảng viên | Cá nhân/nhóm |
| ASSIGN-02 | Cấu hình deadline | Giảng viên | Ngày mở, hạn nộp, ngày đóng |
| ASSIGN-03 | Cấu hình loại nộp | Giảng viên | File/text/link/code |
| ASSIGN-04 | Cấu hình nộp muộn | Giảng viên | Cho phép/trừ điểm |
| ASSIGN-05 | Cấu hình số lần nộp | Giảng viên | Một/nhiều lần |
| ASSIGN-06 | Đính kèm đề bài | Giảng viên | File hướng dẫn |
| ASSIGN-07 | Rubric | Giảng viên | Tiêu chí chấm |
| ASSIGN-08 | Nộp bài | Sinh viên | File/text/link |
| ASSIGN-09 | Sửa bài nộp | Sinh viên | Nếu được phép |
| ASSIGN-10 | Xem trạng thái nộp | Sinh viên, GV | Chưa nộp/đã nộp/trễ |
| ASSIGN-11 | Tải bài nộp | Giảng viên | Từng bài hoặc ZIP |
| ASSIGN-12 | Chấm bài | Giảng viên | Điểm + feedback |
| ASSIGN-13 | Chấm theo rubric | Giảng viên | Điểm theo tiêu chí |
| ASSIGN-14 | File phản hồi | Giảng viên | Upload file sửa bài |
| ASSIGN-15 | Công bố điểm | Giảng viên | Sinh viên xem điểm |
| ASSIGN-16 | Gia hạn deadline | Giảng viên | Cho lớp/cá nhân |
| ASSIGN-17 | Kiểm tra đạo văn | GV/Admin | Tích hợp nếu có |
| ASSIGN-18 | Khiếu nại điểm | Sinh viên | Gửi yêu cầu xem lại |
| ASSIGN-19 | Theo dõi tỷ lệ nộp | GV, Khoa, Cố vấn | Báo cáo nộp bài |

## 4.9.2. Acceptance Criteria

- Không cho nộp bài sau deadline nếu không bật nộp muộn.
- Lưu timestamp từng lần nộp.
- Nếu bài nhóm, điểm có thể áp dụng cho cả nhóm hoặc từng cá nhân.
- Sinh viên chỉ xem feedback/điểm sau khi giảng viên công bố.

---

# 4.10. Module quiz, kiểm tra, thi, ngân hàng câu hỏi

## 4.10.1. Chức năng ngân hàng câu hỏi

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| QB-01 | Tạo câu hỏi | Giảng viên | MCQ, true/false, essay, fill blank |
| QB-02 | Phân loại câu hỏi | Giảng viên | Môn, chương, mức độ |
| QB-03 | Tag câu hỏi | Giảng viên | CLO, topic |
| QB-04 | Import câu hỏi | Giảng viên, Admin | Excel/Word/XML |
| QB-05 | Export câu hỏi | Giảng viên, Admin | Sao lưu |
| QB-06 | Chia sẻ ngân hàng | Khoa, GV | Theo môn/bộ môn |
| QB-07 | Khóa câu hỏi | Khoa/Admin | Không cho sửa sau duyệt |

## 4.10.2. Chức năng quiz/thi

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| EXAM-01 | Tạo quiz/bài thi | Giảng viên | Quiz, midterm, final |
| EXAM-02 | Cấu hình thời gian | Giảng viên | Open/close window |
| EXAM-03 | Timer | Giảng viên | Giới hạn thời lượng |
| EXAM-04 | Số lần làm | Giảng viên | Attempts |
| EXAM-05 | Cách lấy điểm | Giảng viên | Cao nhất/trung bình/lần cuối |
| EXAM-06 | Random câu hỏi | Giảng viên | Từ question bank |
| EXAM-07 | Trộn đáp án | Giảng viên | Shuffle choices |
| EXAM-08 | Hiển thị kết quả | Giảng viên | Sau làm/sau đóng bài |
| EXAM-09 | Duyệt đề thi | Khoa/Phòng đào tạo | Approval |
| EXAM-10 | Làm bài | Sinh viên | Theo thời gian và attempt |
| EXAM-11 | Tự động lưu | Sinh viên | Autosave |
| EXAM-12 | Tự động nộp | Hệ thống | Khi hết giờ |
| EXAM-13 | Tự động chấm | Hệ thống | Câu khách quan |
| EXAM-14 | Chấm tự luận | Giảng viên | Manual grading |
| EXAM-15 | Log làm bài | GV/Admin/Khoa | IP, thiết bị, rời tab |
| EXAM-16 | Xử lý sự cố | GV/Admin/Khoa | Mở lại/gia hạn |
| EXAM-17 | Phân tích câu hỏi | GV/Khoa | Tỷ lệ đúng/sai |
| EXAM-18 | Phúc khảo bài thi | SV/GV/Khoa | Yêu cầu xem lại |

## 4.10.3. Acceptance Criteria

- Khi hết giờ, hệ thống tự nộp bài với đáp án đã lưu.
- Không cho làm bài ngoài thời gian mở trừ khi có gia hạn cá nhân.
- Mỗi lần làm bài lưu attempt riêng.
- Log thi không được sửa bởi giảng viên thông thường.

---

# 4.11. Module điểm số & phúc khảo

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| GRADE-01 | Tạo cột điểm | Giảng viên | Assignment, quiz, attendance |
| GRADE-02 | Cấu hình trọng số | Giảng viên, Khoa | % đầu điểm |
| GRADE-03 | Nhập điểm thủ công | Giảng viên | Theo sinh viên |
| GRADE-04 | Import điểm | Giảng viên, Khoa | Excel |
| GRADE-05 | Tính điểm tổng kết | Hệ thống | Theo công thức |
| GRADE-06 | Làm tròn điểm | Hệ thống | Theo cấu hình |
| GRADE-07 | Công bố điểm | Giảng viên | Sinh viên xem được |
| GRADE-08 | Ẩn điểm | Giảng viên | Chưa công bố |
| GRADE-09 | Duyệt điểm cuối kỳ | Khoa/Phòng đào tạo | Chốt điểm |
| GRADE-10 | Khóa bảng điểm | Khoa/Admin | Không cho sửa |
| GRADE-11 | Mở khóa điểm | Admin/Khoa | Theo quyền |
| GRADE-12 | Lịch sử sửa điểm | Admin/Khoa | Audit |
| GRADE-13 | Xuất bảng điểm | GV/Khoa/Admin | Excel/PDF |
| GRADE-14 | Sinh viên xem điểm | Sinh viên | Bảng điểm cá nhân |
| GRADE-15 | Gửi phúc khảo | Sinh viên | Yêu cầu xem lại điểm |
| GRADE-16 | Xử lý phúc khảo | GV/Khoa | Phản hồi và cập nhật |
| GRADE-17 | Đồng bộ điểm | Admin/Khoa | Sang SIS nếu có |

---

# 4.12. Module điểm danh & chuyên cần

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| ATT-01 | Tạo buổi điểm danh | Giảng viên | Theo lịch học |
| ATT-02 | Điểm danh thủ công | Giảng viên | Có mặt/vắng/trễ |
| ATT-03 | QR attendance | Giảng viên/Sinh viên | Sinh viên quét QR |
| ATT-04 | Mã điểm danh | Giảng viên/Sinh viên | Nhập mã lớp |
| ATT-05 | Online attendance | Hệ thống | Theo tham gia Zoom/Meet nếu có dữ liệu |
| ATT-06 | Sửa điểm danh | Giảng viên | Có lý do |
| ATT-07 | Gửi lý do vắng | Sinh viên | Xin phép/đính kèm minh chứng |
| ATT-08 | Duyệt lý do vắng | GV/Khoa | Có phép/không phép |
| ATT-09 | Thống kê chuyên cần | GV/Khoa/Cố vấn | Tỷ lệ đi học |
| ATT-10 | Cảnh báo vắng nhiều | Hệ thống | Theo ngưỡng |
| ATT-11 | Export điểm danh | GV/Khoa/Admin | Excel/PDF |

---

# 4.13. Module lớp học trực tuyến

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| LIVE-01 | Tạo buổi học online | Giảng viên | Zoom/Meet/Teams link |
| LIVE-02 | Hẹn lịch buổi học | Giảng viên | Ngày giờ |
| LIVE-03 | Gửi link tự động | Hệ thống | Cho sinh viên ghi danh |
| LIVE-04 | Tham gia lớp | Sinh viên | Bấm link vào lớp |
| LIVE-05 | Upload bản ghi | Giảng viên | Recording |
| LIVE-06 | Xem bản ghi | Sinh viên | Sau buổi học |
| LIVE-07 | Theo dõi tham gia | GV/Khoa | Ai tham gia, thời lượng |
| LIVE-08 | Điểm danh từ buổi học | Hệ thống/GV | Nếu có dữ liệu tham gia |

---

# 4.14. Module diễn đàn, tin nhắn, thông báo

## 4.14.1. Diễn đàn

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| FORUM-01 | Tạo diễn đàn môn học | Giảng viên | Forum theo lớp |
| FORUM-02 | Tạo chủ đề | SV/GV | Hỏi đáp/thảo luận |
| FORUM-03 | Bình luận | SV/GV | Reply |
| FORUM-04 | Like/hữu ích | SV/GV | Vote helpful |
| FORUM-05 | Ghim bài | Giảng viên | Pin topic |
| FORUM-06 | Khóa chủ đề | Giảng viên/Admin | Không cho comment |
| FORUM-07 | Báo cáo vi phạm | Tất cả | Report content |
| FORUM-08 | Kiểm duyệt | GV/Admin | Ẩn/xóa bài vi phạm |

## 4.14.2. Thông báo

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| NOTI-01 | Thông báo hệ thống | Admin | Toàn hệ thống |
| NOTI-02 | Thông báo theo lớp | Giảng viên | Lớp học phần |
| NOTI-03 | Thông báo theo khoa | Khoa/Phòng đào tạo | Sinh viên/GV trong khoa |
| NOTI-04 | Nhắc deadline | Hệ thống | Bài tập/quiz |
| NOTI-05 | Thông báo điểm mới | Hệ thống | Khi công bố điểm |
| NOTI-06 | Email notification | Hệ thống | Gửi qua SMTP/Resend |
| NOTI-07 | Notification center | Tất cả | Bell trong hệ thống |
| NOTI-08 | Đánh dấu đã đọc | Tất cả | Read/unread |
| NOTI-09 | Cấu hình nhận thông báo | Tất cả | Email/web/app |

## 4.14.3. Tin nhắn

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| MSG-01 | Nhắn tin cá nhân | SV/GV/Cố vấn | Trao đổi riêng |
| MSG-02 | Nhắn tin nhóm | GV/Cố vấn/SV | Nhóm lớp/nhóm học tập |
| MSG-03 | Lịch sử trao đổi | Người tham gia | Xem lại messages |
| MSG-04 | Báo cáo tin nhắn | Người dùng | Report vi phạm |
| MSG-05 | Chính sách lưu tin | Admin | Retention policy |

---

# 4.15. Module nhóm học tập

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| GROUP-01 | Tạo nhóm | GV | Nhóm bài tập/đồ án |
| GROUP-02 | Gán sinh viên vào nhóm | GV | Thủ công/random/import |
| GROUP-03 | Chọn trưởng nhóm | GV | Leader |
| GROUP-04 | Trao đổi nhóm | SV | Chat/forum nhóm |
| GROUP-05 | Nộp bài nhóm | SV | Đại diện nộp |
| GROUP-06 | Chấm điểm nhóm | GV | Điểm chung/cá nhân |
| GROUP-07 | Peer review | SV | Đánh giá thành viên |
| GROUP-08 | Theo dõi đóng góp | GV/SV | Nếu có task log |

---

# 4.16. Module cố vấn học tập & cảnh báo học vụ

## 4.16.1. Chức năng cố vấn

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| ADV-01 | Dashboard cố vấn | Cố vấn | Tổng quan sinh viên phụ trách |
| ADV-02 | Xem hồ sơ sinh viên | Cố vấn | Điểm, chuyên cần, tiến độ |
| ADV-03 | Theo dõi sinh viên rủi ro | Cố vấn | Điểm thấp, vắng nhiều |
| ADV-04 | Nhận cảnh báo tự động | Cố vấn | Từ hệ thống |
| ADV-05 | Tạo lịch tư vấn | Cố vấn | Online/offline |
| ADV-06 | Ghi biên bản tư vấn | Cố vấn | Nội dung buổi tư vấn |
| ADV-07 | Kế hoạch cải thiện | Cố vấn | Study plan |
| ADV-08 | Task sau tư vấn | Cố vấn/SV | Việc cần làm |
| ADV-09 | Gửi tài liệu hỗ trợ | Cố vấn | Link/file |
| ADV-10 | Chuyển tuyến hỗ trợ | Cố vấn | GV/Khoa/Admin |
| ADV-11 | Báo cáo cố vấn | Cố vấn | Sinh viên rủi ro, buổi tư vấn |

## 4.16.2. Cảnh báo học vụ

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| RISK-01 | Cấu hình ngưỡng rủi ro | Admin/Khoa | Điểm thấp, vắng nhiều, ít login |
| RISK-02 | Sinh cảnh báo tự động | Hệ thống | Theo rule |
| RISK-03 | Phân loại mức độ | Hệ thống | Thấp/trung bình/cao |
| RISK-04 | Gán cảnh báo cho cố vấn | Hệ thống/Khoa | Cố vấn xử lý |
| RISK-05 | Cập nhật trạng thái cảnh báo | Cố vấn | Mới/đang xử lý/đã xử lý |
| RISK-06 | Đóng cảnh báo | Cố vấn/Khoa | Sau can thiệp |
| RISK-07 | Lịch sử cảnh báo | Cố vấn/Khoa/Admin | Audit và báo cáo |

---

# 4.17. Module khảo sát & đánh giá chất lượng

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| SURV-01 | Tạo khảo sát môn học | Khoa/GV/Admin | Feedback môn |
| SURV-02 | Tạo đánh giá giảng viên | Khoa/Phòng đào tạo | Teaching evaluation |
| SURV-03 | Tạo khảo sát CTĐT | Khoa | Chương trình đào tạo |
| SURV-04 | Làm khảo sát | Sinh viên | Submit response |
| SURV-05 | Ẩn danh phản hồi | Khoa/Admin | Bảo vệ sinh viên |
| SURV-06 | Xem kết quả | GV/Khoa/Admin | Theo quyền |
| SURV-07 | Export kết quả | Khoa/Admin | Excel/PDF |
| SURV-08 | Theo dõi cải tiến | Khoa | Action sau khảo sát |

---

# 4.18. Module báo cáo & dashboard

| Mã | Báo cáo | Vai trò | Nội dung |
|---|---|---|---|
| REP-01 | Báo cáo cá nhân | Sinh viên | Điểm, tiến độ, bài tập, chuyên cần |
| REP-02 | Báo cáo lớp | Giảng viên | Tiến độ, điểm, nộp bài, quiz |
| REP-03 | Báo cáo sinh viên rủi ro | GV, Cố vấn, Khoa | Điểm thấp, vắng nhiều, ít tương tác |
| REP-04 | Báo cáo giảng viên | Khoa | Tải giảng, tiến độ chấm bài |
| REP-05 | Báo cáo môn học | Khoa | Tỷ lệ đạt/rớt, phổ điểm |
| REP-06 | Báo cáo khoa | Khoa/Admin | Tổng quan đào tạo |
| REP-07 | Báo cáo toàn hệ thống | Admin | User, course, traffic, storage |
| REP-08 | Báo cáo khảo thí | Khoa/Phòng đào tạo | Kết quả thi, phân tích câu hỏi |
| REP-09 | Báo cáo điểm danh | GV/Khoa/Cố vấn | Chuyên cần |
| REP-10 | Export báo cáo | Theo quyền | Excel/PDF/CSV |

---

# 4.19. Module quản trị hệ thống

| Mã | Chức năng | Vai trò | Mô tả |
|---|---|---|---|
| SYS-01 | Cấu hình branding | Admin | Tên trường, logo, màu sắc |
| SYS-02 | Cấu hình email | Admin | Resend SMTP/API |
| SYS-03 | Cấu hình file upload | Admin | Dung lượng, MIME type |
| SYS-04 | Cấu hình timezone | Admin | Asia/Ho_Chi_Minh |
| SYS-05 | Cấu hình SSO | Admin | Google/Microsoft/LDAP nếu có |
| SYS-06 | Cấu hình Redis cache | Admin/DevOps | Cache/session/queue |
| SYS-07 | Audit log | Admin | Theo dõi thao tác quan trọng |
| SYS-08 | Error log | Admin | Lỗi hệ thống |
| SYS-09 | Backup database | Admin/DevOps | Tự động/thủ công |
| SYS-10 | Restore database | Admin/DevOps | Khôi phục |
| SYS-11 | Maintenance mode | Admin | Chế độ bảo trì |
| SYS-12 | Health check | Admin/DevOps | Kiểm tra app/db/redis |

---

# 5. Luồng nghiệp vụ chính

## 5.1. Luồng tạo lớp học phần

1. Phòng đào tạo/Khoa tạo lớp học phần từ môn học và học kỳ.
2. Gán giảng viên phụ trách.
3. Cấu hình sĩ số, lịch học, trạng thái.
4. Ghi danh sinh viên bằng import hoặc chọn thủ công.
5. Giảng viên nhận lớp trong dashboard.
6. Giảng viên tạo đề cương, bài giảng, bài tập, quiz.
7. Sinh viên thấy lớp trong danh sách học phần.

## 5.2. Luồng học và hoàn thành bài học

1. Sinh viên mở học phần.
2. Hệ thống hiển thị các chương/bài đã được công bố.
3. Sinh viên xem video/tài liệu/bài đọc.
4. Hệ thống ghi learning log.
5. Sinh viên đánh dấu hoàn thành hoặc hệ thống tự ghi nhận theo điều kiện.
6. Tiến độ môn học được cập nhật.
7. Giảng viên/cố vấn có thể xem tiến độ.

## 5.3. Luồng giao và nộp bài tập

1. Giảng viên tạo bài tập, deadline, điểm tối đa, loại bài nộp.
2. Sinh viên nhận thông báo.
3. Sinh viên nộp file/text/link.
4. Hệ thống ghi timestamp và trạng thái.
5. Giảng viên xem danh sách bài nộp.
6. Giảng viên chấm điểm, feedback, rubric.
7. Công bố điểm.
8. Sinh viên xem điểm/feedback.
9. Nếu cần, sinh viên gửi phúc khảo.

## 5.4. Luồng quiz/thi

1. Giảng viên tạo ngân hàng câu hỏi.
2. Giảng viên tạo quiz/thi và cấu hình thời gian, attempt, random.
3. Khoa/Phòng đào tạo duyệt nếu là bài thi quan trọng.
4. Đến thời gian mở, sinh viên làm bài.
5. Hệ thống autosave và ghi log.
6. Hết giờ tự nộp bài.
7. Hệ thống tự chấm câu khách quan.
8. Giảng viên chấm tự luận.
9. Công bố điểm.
10. Sinh viên xem kết quả theo cấu hình.

## 5.5. Luồng cảnh báo học vụ

1. Hệ thống định kỳ kiểm tra điểm, chuyên cần, bài chưa nộp, mức độ đăng nhập.
2. Nếu vượt ngưỡng rủi ro, tạo cảnh báo.
3. Cảnh báo được gửi đến cố vấn/khoa/giảng viên liên quan.
4. Cố vấn xem hồ sơ sinh viên.
5. Cố vấn tạo lịch tư vấn hoặc gửi thông báo.
6. Cố vấn ghi biên bản và kế hoạch cải thiện.
7. Hệ thống theo dõi trạng thái cảnh báo.
8. Sau khi xử lý, cố vấn đóng cảnh báo.

---

# 6. Yêu cầu phi chức năng

## 6.1. Hiệu năng

| Yêu cầu | Mô tả |
|---|---|
| Thời gian tải dashboard | Dưới 3 giây với dữ liệu thông thường |
| API thường | P95 dưới 500ms cho truy vấn đơn giản |
| API báo cáo | Có thể xử lý async nếu truy vấn lớn |
| Upload file | Hỗ trợ upload theo giới hạn cấu hình |
| Quiz đồng thời | Thiết kế để chịu được nhiều sinh viên làm bài cùng lúc |
| Caching | Redis cache cho dữ liệu ít thay đổi như role, permission, course list |

## 6.2. Bảo mật

| Yêu cầu | Mô tả |
|---|---|
| JWT | Access token ngắn hạn, refresh token an toàn |
| Hash mật khẩu | bcrypt cost 12 |
| RBAC | Kiểm tra quyền ở backend, không chỉ frontend |
| Audit log | Ghi thao tác quan trọng: điểm, quyền, xóa dữ liệu |
| Upload security | Kiểm tra MIME type, extension, dung lượng |
| SQL injection | Dùng ORM SQLAlchemy và parameterized queries |
| XSS | Sanitize nội dung HTML nếu cho soạn rich text |
| CSRF | Nếu dùng cookie auth phải có CSRF protection |
| Rate limit | Login, forgot password, API nhạy cảm |

## 6.3. Khả dụng & tin cậy

| Yêu cầu | Mô tả |
|---|---|
| Backup | Backup database định kỳ |
| Recovery | Có quy trình restore |
| Health check | Kiểm tra API, DB, Redis |
| Error tracking | Ghi log lỗi backend/frontend |
| Queue job | Email/report xử lý nền bằng Celery/Redis |

## 6.4. Khả năng mở rộng

- Frontend Next.js tách khỏi backend FastAPI.
- API-first để sau này thêm mobile app.
- Database PostgreSQL chuẩn hóa dữ liệu.
- Redis cho cache, queue, rate limit.
- Docker hóa để triển khai nhất quán local/staging/production.

## 6.5. Khả năng sử dụng

- Giao diện responsive cho desktop/tablet/mobile.
- Điều hướng theo vai trò.
- Màn hình lỗi rõ ràng.
- Form có validation tức thời.
- Trạng thái loading/empty/error đầy đủ.
- Hỗ trợ tiếng Việt trước, có khả năng mở rộng tiếng Anh.

---

# 7. Yêu cầu dữ liệu

## 7.1. Nhóm bảng chính

PRD này giả định ERD có các nhóm bảng sau:

1. Người dùng & phân quyền: users, roles, permissions, user_roles, role_permissions.
2. Tổ chức trường học: campuses, faculties, departments, majors, cohorts, administrative_classes.
3. Đào tạo: academic_years, terms, courses, curriculums, curriculum_courses, course_outcomes.
4. Lớp học phần: course_sections, section_lecturers, enrollments.
5. Học liệu: lesson_modules, lessons, lesson_resources, lesson_progress, notes, bookmarks.
6. Bài tập: assignments, assignment_submissions, assignment_grades, rubrics, rubric_criteria.
7. Quiz/Thi: question_banks, questions, answers, exams, exam_questions, exam_attempts, exam_responses.
8. Điểm: grade_items, grades, grade_formulas, grade_reviews.
9. Điểm danh: attendance_sessions, attendance_records, absence_requests.
10. Giao tiếp: announcements, notifications, forum_topics, forum_posts, messages.
11. Nhóm học tập: study_groups, group_members, peer_reviews.
12. Cố vấn/cảnh báo: advisor_assignments, academic_warnings, advising_sessions, advising_notes.
13. Khảo sát: surveys, survey_questions, survey_responses.
14. Vận hành: audit_logs, system_settings, file_assets, background_jobs.

## 7.2. Quy tắc dữ liệu quan trọng

- Không hard delete dữ liệu học tập quan trọng như điểm, bài nộp, attempt thi.
- Mọi thay đổi điểm cần lưu audit log.
- Enrollment là nguồn xác định sinh viên thuộc lớp học phần.
- Permission backend phải kiểm tra theo role và phạm vi dữ liệu.
- File upload lưu metadata trong database, file vật lý/object storage lưu riêng.

---

# 8. API yêu cầu tổng quan

## 8.1. Nhóm API chính

| Nhóm API | Prefix gợi ý |
|---|---|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Roles/Permissions | `/api/v1/rbac` |
| Organizations | `/api/v1/orgs` |
| Academic terms | `/api/v1/academic` |
| Courses | `/api/v1/courses` |
| Sections | `/api/v1/sections` |
| Lessons | `/api/v1/lessons` |
| Assignments | `/api/v1/assignments` |
| Exams/Quiz | `/api/v1/exams` |
| Grades | `/api/v1/grades` |
| Attendance | `/api/v1/attendance` |
| Forums | `/api/v1/forums` |
| Notifications | `/api/v1/notifications` |
| Reports | `/api/v1/reports` |
| Advising | `/api/v1/advising` |
| Surveys | `/api/v1/surveys` |
| Files | `/api/v1/files` |
| System | `/api/v1/system` |

## 8.2. Chuẩn response

### Thành công

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "meta": {}
}
```

### Lỗi

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

## 8.3. HTTP status code

| Code | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 204 | Xóa/cập nhật không trả body |
| 400 | Request sai |
| 401 | Chưa đăng nhập |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 409 | Xung đột dữ liệu |
| 422 | Validation error |
| 429 | Rate limit |
| 500 | Lỗi server |

---

# 9. UI/UX Requirements

## 9.1. Layout theo vai trò

| Vai trò | Dashboard cần có |
|---|---|
| Sinh viên | Môn đang học, deadline, điểm mới, tiến độ, thông báo |
| Giảng viên | Lớp đang dạy, bài cần chấm, sinh viên rủi ro, lịch dạy |
| Admin | User, lớp, hoạt động, cảnh báo hệ thống, storage |
| Khoa/Phòng đào tạo | Lớp theo khoa, tiến độ giảng dạy, duyệt điểm, báo cáo |
| Cố vấn | Sinh viên rủi ro, lịch tư vấn, cảnh báo mới, báo cáo lớp |

## 9.2. Trạng thái UI bắt buộc

Mỗi màn hình quan trọng cần có:

- Loading state.
- Empty state.
- Error state.
- Permission denied state.
- Form validation error.
- Success toast.
- Confirm dialog cho thao tác nguy hiểm.

## 9.3. Component chính

- Data table có search/filter/sort/pagination.
- Form có validation bằng React Hook Form + Zod.
- Modal/dialog xác nhận.
- Tabs cho chi tiết lớp học.
- Card thống kê dashboard.
- File uploader.
- Rich text editor cho bài giảng/thông báo.
- Calendar view cho lịch học/deadline.
- Badge trạng thái: draft, published, overdue, submitted, graded.

---

# 10. Tiêu chí nghiệm thu tổng thể

## 10.1. Sinh viên

- Đăng nhập thành công.
- Xem được lớp học phần đã ghi danh.
- Xem bài giảng và tài liệu.
- Nộp bài tập đúng hạn.
- Làm quiz và xem kết quả theo cấu hình.
- Xem điểm và feedback.
- Nhận thông báo deadline/điểm mới.
- Xem tiến độ học tập.

## 10.2. Giảng viên

- Xem lớp được phân công.
- Tạo bài giảng, upload tài liệu.
- Tạo bài tập, nhận bài nộp, chấm điểm.
- Tạo quiz, cấu hình câu hỏi, chấm bài.
- Điểm danh sinh viên.
- Gửi thông báo cho lớp.
- Xem báo cáo lớp và sinh viên rủi ro.

## 10.3. Admin

- Quản lý user, role, permission.
- Quản lý khoa, ngành, học kỳ, môn, lớp.
- Cấu hình hệ thống, email, upload, bảo mật.
- Xem audit log và báo cáo hệ thống.
- Backup/restore theo quy trình.

## 10.4. Khoa/Bộ môn/Phòng đào tạo

- Quản lý chương trình đào tạo.
- Tạo/quản lý lớp học phần trong phạm vi.
- Phân công giảng viên.
- Theo dõi tiến độ giảng dạy.
- Duyệt/chốt điểm.
- Xem báo cáo chất lượng đào tạo.

## 10.5. Cố vấn học tập

- Xem danh sách sinh viên phụ trách.
- Xem hồ sơ học tập, điểm, chuyên cần, tiến độ.
- Nhận và xử lý cảnh báo học vụ.
- Tạo lịch tư vấn, ghi chú tư vấn.
- Xuất báo cáo sinh viên rủi ro.

---

# 11. Ưu tiên phát triển theo giai đoạn

## Phase 1 — MVP cốt lõi

| Module | Chức năng |
|---|---|
| Auth/RBAC | Đăng nhập, role, permission cơ bản |
| User | Quản lý user, import/export |
| Organization | Khoa, ngành, lớp hành chính |
| Course/Section | Môn học, lớp học phần, ghi danh |
| Lesson | Bài giảng, tài liệu |
| Assignment | Giao bài, nộp bài, chấm bài |
| Grade | Bảng điểm cơ bản |
| Notification | Thông báo web/email cơ bản |

## Phase 2 — Đào tạo nâng cao

| Module | Chức năng |
|---|---|
| Quiz/Exam | Ngân hàng câu hỏi, quiz, tự động chấm |
| Attendance | Điểm danh thủ công/QR |
| Forum | Thảo luận lớp học |
| Reports | Báo cáo lớp, tiến độ, điểm |
| Academic Staff | Duyệt điểm, phân công giảng viên |
| Advisor | Cảnh báo học vụ cơ bản |

## Phase 3 — Hoàn thiện hệ sinh thái

| Module | Chức năng |
|---|---|
| Survey | Đánh giá môn học/giảng viên |
| Online class | Zoom/Meet link, recording |
| Advanced analytics | Sinh viên rủi ro, dashboard BI |
| Integrations | SSO, SIS, Turnitin, cloud storage |
| Operations | Backup, audit, monitoring, maintenance mode |

---

# 12. Rủi ro và phương án xử lý

| Rủi ro | Tác động | Phương án |
|---|---|---|
| Phân quyền phức tạp | Lộ dữ liệu/sai quyền | Thiết kế RBAC + data scope ngay từ đầu |
| Quiz nhiều sinh viên đồng thời | Quá tải hệ thống | Autosave, Redis, tối ưu DB, test tải |
| Upload file lớn | Tốn storage/băng thông | Giới hạn dung lượng, object storage, async processing |
| Sửa điểm không kiểm soát | Mất minh bạch | Audit log bắt buộc, khóa điểm |
| Import dữ liệu lỗi | Sai dữ liệu hàng loạt | Preview, validate, rollback |
| Báo cáo chậm | Trải nghiệm kém | Background job + cache report |
| Tích hợp bên thứ ba lỗi | Gián đoạn chức năng | Retry, log, fallback thủ công |

---

# 13. Definition of Done

Một chức năng được coi là hoàn thành khi:

1. Có UI đầy đủ loading/empty/error/success.
2. Có API backend đúng spec.
3. Có validation frontend và backend.
4. Có kiểm tra quyền backend.
5. Có test case chính hoặc checklist nghiệm thu.
6. Có audit log nếu là chức năng nhạy cảm.
7. Có migration database nếu cần.
8. Có tài liệu API hoặc mô tả endpoint.
9. Không có lỗi nghiêm trọng khi chạy local/staging.
10. Được nghiệm thu theo Acceptance Criteria.

---

# 14. Phụ lục: Danh sách màn hình đề xuất

## Sinh viên

- Dashboard sinh viên.
- Danh sách học phần.
- Chi tiết học phần.
- Bài giảng/học liệu.
- Danh sách bài tập.
- Nộp bài tập.
- Quiz/thi.
- Bảng điểm.
- Lịch học/deadline.
- Diễn đàn môn học.
- Tin nhắn/thông báo.
- Hồ sơ cá nhân.
- Ticket hỗ trợ/phúc khảo.

## Giảng viên

- Dashboard giảng viên.
- Danh sách lớp giảng dạy.
- Quản lý nội dung lớp.
- Quản lý bài giảng.
- Quản lý bài tập.
- Danh sách bài nộp/chấm bài.
- Quản lý ngân hàng câu hỏi.
- Quản lý quiz/thi.
- Bảng điểm lớp.
- Điểm danh.
- Diễn đàn lớp.
- Báo cáo lớp.

## Admin

- Dashboard admin.
- Quản lý người dùng.
- Quản lý role/permission.
- Quản lý khoa/bộ môn/ngành/lớp.
- Quản lý năm học/học kỳ.
- Quản lý môn học/lớp học phần.
- Quản lý file/học liệu.
- Quản lý thông báo toàn hệ thống.
- Quản lý cấu hình hệ thống.
- Audit logs.
- Backup/restore.
- Báo cáo toàn hệ thống.

## Khoa/Bộ môn/Phòng đào tạo

- Dashboard đào tạo.
- Quản lý chương trình đào tạo.
- Quản lý môn học trong khoa.
- Quản lý lớp học phần.
- Phân công giảng viên.
- Theo dõi tiến độ giảng dạy.
- Quản lý khảo thí.
- Duyệt/chốt điểm.
- Báo cáo chất lượng đào tạo.
- Khảo sát/đánh giá.

## Cố vấn học tập

- Dashboard cố vấn.
- Danh sách sinh viên phụ trách.
- Hồ sơ học tập sinh viên.
- Cảnh báo học vụ.
- Lịch tư vấn.
- Biên bản tư vấn.
- Kế hoạch cải thiện.
- Báo cáo sinh viên rủi ro.

---

# 15. Kết luận

Tài liệu PRD này mô tả đầy đủ yêu cầu sản phẩm cho hệ thống LMS đại học với 5 đối tượng sử dụng chính. Đây là nền tảng để tiếp tục xây dựng:

- SRS chi tiết theo từng module.
- API Specification.
- ERD chi tiết.
- SAD kiến trúc hệ thống.
- Sequence/Data Flow Diagram.
- UI/UX Wireframes và Design System.
- Test plan và backlog phát triển.

---

*Document này là nguồn sự thật cho tất cả tính năng. Mọi thay đổi phải update tài liệu này đồng thời với code.*
