# BRD — Business Requirements Document
## AI20K-015: LMS Chatbot Có Trí Nhớ (LMS with Memory AI Agent)
**Version:** 3.0 | **Date:** 2026-04-29 | **Status:** Approved

---

**Phạm vi người dùng:** Sinh viên, Giảng viên, Quản trị viên hệ thống, Khoa/Bộ môn/Phòng đào tạo, Cố vấn học tập  
**Công nghệ định hướng:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, FastAPI, PostgreSQL 15, Redis 7, Docker, Railway, GitHub Actions  
**Ghi chú:** Tài liệu này tập trung vào yêu cầu nghiệp vụ, mục tiêu kinh doanh, phạm vi hệ thống, giá trị cốt lõi, quy trình vận hành và tiêu chí thành công. Các phần chi tiết kỹ thuật như API, ERD, kiến trúc triển khai sẽ nằm trong tài liệu riêng.

---

## 1. Mục đích tài liệu

Tài liệu BRD này dùng để mô tả bài toán nghiệp vụ và định hướng xây dựng hệ thống LMS dành cho môi trường đại học. Mục tiêu là giúp các bên liên quan thống nhất về:

- Vì sao cần xây dựng hệ thống LMS.
- Hệ thống phục vụ những nhóm người dùng nào.
- Hệ thống cần giải quyết các vấn đề nghiệp vụ nào.
- Chức năng nào là giá trị cốt lõi, chức năng nào là mở rộng.
- Các quy trình nghiệp vụ chính trong quá trình dạy, học, quản lý và cố vấn.
- Các chỉ số đánh giá thành công của hệ thống.
- Phạm vi triển khai theo từng giai đoạn.

BRD không đi sâu vào code, cấu trúc database chi tiết hoặc endpoint API. Những nội dung đó thuộc các tài liệu SRS/PRD, ERD, SAD và API Specification.

---

## 2. Bối cảnh dự án

### 2.1. Bối cảnh chung

Trong môi trường đại học, hoạt động dạy và học thường bao gồm nhiều quy trình khác nhau như quản lý môn học, lớp học phần, giảng viên, sinh viên, bài giảng, bài tập, bài thi, điểm số, điểm danh, phản hồi, thông báo, cố vấn học tập và báo cáo đào tạo.

Nếu các quy trình này được thực hiện rời rạc bằng nhiều công cụ như email, Google Drive, Excel, nhóm chat, giấy tờ hoặc hệ thống nội bộ thiếu đồng bộ, sẽ phát sinh nhiều vấn đề:

- Sinh viên khó theo dõi đầy đủ bài giảng, deadline, điểm số và thông báo.
- Giảng viên mất nhiều thời gian quản lý bài nộp, chấm điểm, điểm danh và phản hồi.
- Khoa, bộ môn và phòng đào tạo thiếu dữ liệu tập trung để theo dõi tiến độ giảng dạy.
- Cố vấn học tập khó phát hiện sớm sinh viên có nguy cơ học vụ.
- Admin khó kiểm soát phân quyền, dữ liệu, bảo mật và vận hành hệ thống.
- Dữ liệu học tập phân tán, khó thống kê, khó truy xuất lịch sử.

Vì vậy, hệ thống LMS cần được xây dựng như một nền tảng tập trung để hỗ trợ toàn bộ vòng đời học tập trong đại học.

### 2.2. Vấn đề nghiệp vụ hiện tại

| Mã vấn đề | Vấn đề | Tác động |
|---|---|---|
| BP-01 | Dữ liệu lớp học, bài tập, điểm và tài liệu phân tán | Khó quản lý, dễ mất thông tin |
| BP-02 | Sinh viên không nắm rõ deadline và tiến độ học tập | Tăng tỷ lệ nộp trễ, bỏ sót bài |
| BP-03 | Giảng viên phải xử lý nhiều thao tác thủ công | Tốn thời gian, dễ sai sót |
| BP-04 | Chấm điểm và phản hồi chưa tập trung | Khó minh bạch, khó truy xuất |
| BP-05 | Phòng đào tạo thiếu dashboard theo dõi lớp học phần | Khó kiểm soát chất lượng đào tạo |
| BP-06 | Cố vấn học tập thiếu dữ liệu cảnh báo sớm | Can thiệp chậm với sinh viên yếu |
| BP-07 | Phân quyền người dùng chưa rõ ràng | Rủi ro bảo mật và sai phạm dữ liệu |
| BP-08 | Thi trực tuyến và quiz chưa được chuẩn hóa | Khó tổ chức, khó kiểm soát gian lận |
| BP-09 | Báo cáo đào tạo phụ thuộc Excel thủ công | Tốn công tổng hợp, dễ sai lệch |
| BP-10 | Không có lịch sử hoạt động rõ ràng | Khó audit, khó xử lý tranh chấp |

### 2.3. Cơ hội cải thiện

Hệ thống LMS mới sẽ tạo ra một môi trường học tập số tập trung, giúp:

- Sinh viên học tập chủ động hơn.
- Giảng viên quản lý lớp học hiệu quả hơn.
- Khoa và phòng đào tạo có dữ liệu thời gian thực.
- Cố vấn học tập phát hiện sớm sinh viên cần hỗ trợ.
- Admin quản trị hệ thống chặt chẽ, an toàn và có khả năng mở rộng.
- Nhà trường chuẩn hóa quy trình dạy, học, kiểm tra, đánh giá và báo cáo.

---

## 3. Mục tiêu kinh doanh

### 3.1. Mục tiêu tổng quát

Xây dựng một hệ thống LMS đại học hiện đại, tập trung, dễ sử dụng, có phân quyền rõ ràng, hỗ trợ đầy đủ quy trình dạy học trực tuyến/kết hợp, quản lý học phần, bài giảng, bài tập, quiz, điểm, điểm danh, thông báo, báo cáo và cố vấn học tập.

### 3.2. Mục tiêu cụ thể

| Mã mục tiêu | Mục tiêu | Mô tả |
|---|---|---|
| BO-01 | Tập trung hóa dữ liệu học tập | Tất cả dữ liệu lớp học, bài giảng, bài tập, điểm, điểm danh được quản lý trong một nền tảng |
| BO-02 | Tăng hiệu quả giảng dạy | Giảng viên có công cụ tạo nội dung, giao bài, chấm điểm, theo dõi lớp |
| BO-03 | Tăng trải nghiệm học tập của sinh viên | Sinh viên dễ xem bài học, nộp bài, làm quiz, theo dõi điểm và deadline |
| BO-04 | Nâng cao quản lý đào tạo | Khoa/phòng đào tạo theo dõi được lớp học, giảng viên, tiến độ, chất lượng |
| BO-05 | Hỗ trợ cảnh báo học vụ sớm | Cố vấn phát hiện sinh viên có rủi ro qua điểm, chuyên cần, hoạt động học tập |
| BO-06 | Chuẩn hóa đánh giá học tập | Bài tập, quiz, điểm, rubric, phúc khảo được quản lý minh bạch |
| BO-07 | Tăng tính bảo mật | Phân quyền RBAC, audit log, xác thực, kiểm soát truy cập |
| BO-08 | Giảm thao tác thủ công | Hạn chế dùng Excel, email rời rạc và quy trình giấy tờ |
| BO-09 | Tạo nền tảng mở rộng | Có thể tích hợp SSO, email, Zoom/Meet, hệ thống đào tạo, AI hoặc analytics |
| BO-10 | Cải thiện báo cáo và ra quyết định | Dữ liệu được tổng hợp thành báo cáo theo thời gian thực |

---

## 4. Phạm vi dự án

### 4.1. Phạm vi trong dự án

Hệ thống LMS cần bao gồm các nhóm chức năng chính sau:

1. Quản lý tài khoản, người dùng, vai trò và phân quyền.
2. Quản lý cơ cấu tổ chức: khoa, bộ môn, phòng đào tạo, ngành, lớp hành chính.
3. Quản lý năm học, học kỳ, môn học, lớp học phần.
4. Quản lý ghi danh sinh viên vào lớp học phần.
5. Quản lý bài giảng, học liệu, video, tài liệu, liên kết.
6. Quản lý bài tập cá nhân, bài tập nhóm, nộp bài, chấm bài, rubric.
7. Quản lý quiz, bài kiểm tra, ngân hàng câu hỏi, làm bài và chấm điểm.
8. Quản lý điểm số, trọng số, công thức điểm, công bố điểm, phúc khảo.
9. Quản lý điểm danh, chuyên cần và cảnh báo vắng học.
10. Quản lý lịch học, lịch thi, deadline, sự kiện học tập.
11. Quản lý thông báo, email, notification trong hệ thống.
12. Quản lý diễn đàn, thảo luận, phản hồi và khảo sát.
13. Quản lý lớp học trực tuyến và link meeting.
14. Quản lý cố vấn học tập, cảnh báo học vụ, tư vấn sinh viên.
15. Dashboard và báo cáo cho từng vai trò.
16. Quản trị hệ thống, cấu hình, backup, audit log, bảo mật.

### 4.2. Phạm vi ngoài dự án giai đoạn đầu

Các hạng mục sau có thể chưa triển khai ở giai đoạn đầu, nhưng cần thiết kế để có thể mở rộng:

| Hạng mục | Lý do chưa ưu tiên |
|---|---|
| Mobile app native | Có thể dùng responsive web trước |
| AI tutor/chatbot học tập | Nên triển khai sau khi dữ liệu LMS ổn định |
| Proctoring webcam nâng cao | Phức tạp về pháp lý, quyền riêng tư và kỹ thuật |
| Thanh toán học phí | Không phải trọng tâm của LMS đại học nội bộ |
| Tích hợp đầy đủ ERP/SIS | Cần phụ thuộc hệ thống trường hiện có |
| SCORM/xAPI nâng cao | Có thể hỗ trợ sau nếu cần chuẩn e-learning quốc tế |
| Video streaming chuyên dụng | Ban đầu có thể dùng file/video link, sau mới tối ưu CDN |
| Data warehouse/BI nâng cao | Giai đoạn sau khi dữ liệu đủ lớn |

---

## 5. Đối tượng sử dụng

### 5.1. Sinh viên

Sinh viên là người học trong hệ thống. Sinh viên sử dụng LMS để xem khóa học, học bài, tải tài liệu, làm bài tập, làm quiz, tham gia thảo luận, theo dõi điểm, điểm danh, deadline và nhận thông báo.

### 5.2. Giảng viên

Giảng viên là người phụ trách giảng dạy lớp học phần. Giảng viên sử dụng LMS để quản lý nội dung học tập, bài giảng, bài tập, quiz, điểm, điểm danh, giao tiếp với sinh viên và theo dõi tiến độ lớp học.

### 5.3. Quản trị viên hệ thống

Admin là người vận hành hệ thống LMS. Admin quản lý người dùng, phân quyền, tổ chức, học kỳ, môn học, lớp học phần, cấu hình hệ thống, bảo mật, tích hợp, backup, log và báo cáo toàn hệ thống.

### 5.4. Khoa / Bộ môn / Phòng đào tạo

Nhóm này quản lý hoạt động đào tạo ở cấp đơn vị. Họ theo dõi môn học, lớp học phần, phân công giảng viên, duyệt đề cương, duyệt điểm, theo dõi tiến độ giảng dạy, chất lượng đào tạo, khảo thí và báo cáo.

### 5.5. Cố vấn học tập

Cố vấn học tập theo dõi và hỗ trợ nhóm sinh viên được phân công. Họ xem tiến độ học tập, điểm, chuyên cần, cảnh báo học vụ, tạo lịch tư vấn, ghi nhận tư vấn và đề xuất hỗ trợ.

---

## 6. Giá trị cốt lõi của hệ thống

### 6.1. Giá trị cốt lõi bắt buộc

| Mã | Giá trị | Ý nghĩa |
|---|---|---|
| CV-01 | Quản lý lớp học phần tập trung | Đây là trung tâm của LMS đại học |
| CV-02 | Học liệu và bài giảng số | Giúp sinh viên học online/blended learning |
| CV-03 | Bài tập và nộp bài | Quy trình dạy học cốt lõi |
| CV-04 | Quiz/kiểm tra trực tuyến | Đánh giá thường xuyên và tự động |
| CV-05 | Điểm số và phản hồi | Minh bạch kết quả học tập |
| CV-06 | Điểm danh và chuyên cần | Phù hợp mô hình đại học có yêu cầu tham gia lớp |
| CV-07 | Thông báo và deadline | Giảm bỏ sót thông tin |
| CV-08 | Phân quyền theo vai trò | Đảm bảo dữ liệu đúng người, đúng quyền |
| CV-09 | Báo cáo đào tạo | Hỗ trợ quản lý khoa/phòng đào tạo |
| CV-10 | Cảnh báo học vụ | Giúp cố vấn can thiệp sớm |

### 6.2. Giá trị không nên ưu tiên quá sớm

| Hạng mục | Lý do |
|---|---|
| Dashboard quá phức tạp ngay từ đầu | Cần dữ liệu thực tế trước khi phân tích sâu |
| AI agent/RAG | Không nên làm trước khi nghiệp vụ LMS ổn định |
| Chống gian lận webcam phức tạp | Phát sinh rủi ro pháp lý và quyền riêng tư |
| Gamification nâng cao | Không phải yêu cầu cốt lõi của LMS đại học |
| Marketplace khóa học | Không phù hợp nếu LMS phục vụ nội bộ trường |

---

## 7. Stakeholders

| Nhóm liên quan | Vai trò trong dự án | Quan tâm chính |
|---|---|---|
| Ban giám hiệu | Chủ trương, phê duyệt | Hiệu quả đào tạo, quản trị dữ liệu |
| Phòng đào tạo | Quản lý học kỳ, lớp, điểm | Chuẩn hóa quy trình đào tạo |
| Khoa/Bộ môn | Quản lý chuyên môn | Tiến độ giảng dạy, chất lượng môn học |
| Giảng viên | Người dạy | Dễ tạo bài, giao bài, chấm điểm |
| Sinh viên | Người học | Dễ học, dễ nộp bài, xem điểm, nhận thông báo |
| Cố vấn học tập | Hỗ trợ sinh viên | Cảnh báo sớm, hồ sơ học tập, tư vấn |
| Admin hệ thống | Vận hành | Phân quyền, bảo mật, backup, cấu hình |
| Bộ phận IT | Triển khai kỹ thuật | Hiệu năng, bảo mật, uptime |
| Khảo thí | Quản lý thi/đánh giá | Đề thi, log thi, điểm, phúc khảo |

---

## 8. Quy trình nghiệp vụ tổng thể

### 8.1. Quy trình khởi tạo học kỳ

1. Admin hoặc phòng đào tạo tạo năm học và học kỳ.
2. Phòng đào tạo cấu hình thời gian học kỳ, tuần học, đợt thi.
3. Khoa/bộ môn xác nhận danh sách môn học được mở.
4. Phòng đào tạo tạo lớp học phần.
5. Khoa/bộ môn phân công giảng viên.
6. Admin hoặc phòng đào tạo ghi danh sinh viên vào lớp học phần.
7. Hệ thống gửi thông báo lớp học mới cho sinh viên và giảng viên.

### 8.2. Quy trình chuẩn bị lớp học phần

1. Giảng viên nhận lớp được phân công.
2. Giảng viên cập nhật đề cương, lịch trình, quy định lớp.
3. Giảng viên tạo chương, bài học, tài liệu, video, bài đọc.
4. Giảng viên cấu hình bài tập, quiz, điểm danh nếu cần.
5. Khoa/bộ môn hoặc phòng đào tạo có thể kiểm tra/duyệt nội dung nếu có quy trình duyệt.
6. Sinh viên bắt đầu truy cập lớp học.

### 8.3. Quy trình học tập của sinh viên

1. Sinh viên đăng nhập hệ thống.
2. Sinh viên xem danh sách lớp học phần đã ghi danh.
3. Sinh viên mở bài học, xem video, tải tài liệu.
4. Sinh viên đánh dấu hoàn thành, ghi chú, bookmark.
5. Sinh viên nhận thông báo deadline và lịch học.
6. Sinh viên làm quiz, nộp bài tập, tham gia thảo luận.
7. Sinh viên xem điểm, feedback và tiến độ học tập.

### 8.4. Quy trình giao và nộp bài tập

1. Giảng viên tạo bài tập.
2. Giảng viên cấu hình mô tả, deadline, điểm tối đa, loại nộp bài, rubric.
3. Hệ thống gửi thông báo đến sinh viên.
4. Sinh viên xem bài tập và nộp bài.
5. Hệ thống ghi nhận thời gian nộp và trạng thái đúng hạn/trễ hạn.
6. Giảng viên xem danh sách bài nộp, tải bài hoặc chấm trực tiếp.
7. Giảng viên nhập điểm, feedback, file phản hồi.
8. Sinh viên nhận thông báo điểm mới.
9. Sinh viên có thể gửi khiếu nại/phúc khảo nếu được phép.

### 8.5. Quy trình quiz/kiểm tra

1. Giảng viên tạo ngân hàng câu hỏi hoặc nhập câu hỏi trực tiếp.
2. Giảng viên tạo quiz/bài kiểm tra.
3. Giảng viên cấu hình thời gian mở/đóng, số lần làm, thời lượng, random câu hỏi, hiển thị kết quả.
4. Sinh viên làm bài trong khung thời gian cho phép.
5. Hệ thống tự động lưu tiến trình và nộp khi hết giờ.
6. Hệ thống tự chấm câu hỏi khách quan.
7. Giảng viên chấm câu tự luận nếu có.
8. Hệ thống công bố điểm theo cấu hình.
9. Khoa/phòng đào tạo có thể xem thống kê và log bài thi.

### 8.6. Quy trình điểm danh

1. Giảng viên tạo buổi điểm danh theo lịch học.
2. Giảng viên chọn phương thức điểm danh: thủ công, QR, mã lớp hoặc online.
3. Sinh viên thực hiện điểm danh.
4. Hệ thống ghi nhận trạng thái có mặt/vắng/trễ.
5. Giảng viên có thể chỉnh sửa kèm lý do.
6. Sinh viên xem trạng thái điểm danh.
7. Cố vấn/khoa nhận cảnh báo nếu sinh viên vắng vượt ngưỡng.

### 8.7. Quy trình quản lý điểm

1. Giảng viên tạo các cột điểm hoặc hệ thống sinh từ bài tập/quiz.
2. Giảng viên cấu hình trọng số nếu được phân quyền.
3. Giảng viên nhập/chấm điểm.
4. Giảng viên công bố hoặc ẩn điểm.
5. Sinh viên xem điểm thành phần và feedback.
6. Giảng viên gửi điểm cuối kỳ cho khoa/phòng đào tạo.
7. Khoa/phòng đào tạo duyệt điểm.
8. Hệ thống khóa điểm sau khi chốt.
9. Nếu có phúc khảo, hệ thống ghi nhận và xử lý theo quy trình.

### 8.8. Quy trình cảnh báo học vụ

1. Hệ thống thu thập dữ liệu điểm, bài nộp, tiến độ học, chuyên cần, đăng nhập.
2. Hệ thống so sánh với ngưỡng cảnh báo.
3. Sinh viên rủi ro được đưa vào danh sách cảnh báo.
4. Cố vấn học tập nhận thông báo.
5. Cố vấn xem hồ sơ sinh viên, liên hệ và tạo lịch tư vấn.
6. Cố vấn ghi nhận biên bản tư vấn, kế hoạch cải thiện.
7. Hệ thống theo dõi trạng thái cảnh báo: mới, đang xử lý, đã xử lý.
8. Khoa/phòng đào tạo xem báo cáo tổng hợp.

### 8.9. Quy trình báo cáo đào tạo

1. Hệ thống tổng hợp dữ liệu theo kỳ, khoa, môn, lớp, giảng viên, sinh viên.
2. Người dùng có quyền truy cập dashboard phù hợp với vai trò.
3. Khoa/phòng đào tạo xem báo cáo tiến độ, điểm, chuyên cần, bài tập, quiz.
4. Admin xem báo cáo toàn hệ thống.
5. Cố vấn xem báo cáo sinh viên phụ trách.
6. Báo cáo có thể xuất Excel/PDF/CSV.

---

## 9. Yêu cầu nghiệp vụ theo đối tượng

## 9.1. Sinh viên

### 9.1.1. Mục tiêu nghiệp vụ

Sinh viên cần một không gian học tập tập trung để theo dõi toàn bộ lớp học phần, nội dung học, bài tập, quiz, điểm, lịch, thông báo và trao đổi học tập.

### 9.1.2. Yêu cầu nghiệp vụ chi tiết

| Mã yêu cầu | Yêu cầu | Mức ưu tiên |
|---|---|---|
| STU-BR-01 | Sinh viên có thể đăng nhập bằng tài khoản trường hoặc tài khoản được cấp | Must |
| STU-BR-02 | Sinh viên xem được danh sách lớp học phần đã ghi danh | Must |
| STU-BR-03 | Sinh viên xem được đề cương, mô tả và quy định của từng học phần | Must |
| STU-BR-04 | Sinh viên xem được bài giảng theo chương, tuần hoặc chủ đề | Must |
| STU-BR-05 | Sinh viên tải được tài liệu học tập được phép tải | Must |
| STU-BR-06 | Sinh viên xem video, link tham khảo và học liệu trực tuyến | Must |
| STU-BR-07 | Sinh viên theo dõi tiến độ học tập của từng học phần | Must |
| STU-BR-08 | Sinh viên xem được danh sách bài tập, deadline và trạng thái nộp | Must |
| STU-BR-09 | Sinh viên nộp bài bằng file, text hoặc link theo cấu hình | Must |
| STU-BR-10 | Sinh viên xem được điểm và feedback bài tập sau khi công bố | Must |
| STU-BR-11 | Sinh viên làm quiz/bài kiểm tra trong thời gian được mở | Must |
| STU-BR-12 | Sinh viên xem kết quả quiz theo cấu hình của giảng viên | Must |
| STU-BR-13 | Sinh viên xem bảng điểm thành phần và điểm tổng kết nếu đã công bố | Must |
| STU-BR-14 | Sinh viên thực hiện điểm danh QR/mã lớp/online nếu lớp yêu cầu | Should |
| STU-BR-15 | Sinh viên xem lịch học, lịch thi, deadline theo ngày/tuần/tháng | Must |
| STU-BR-16 | Sinh viên nhận thông báo từ hệ thống, giảng viên, khoa/phòng đào tạo | Must |
| STU-BR-17 | Sinh viên tham gia diễn đàn, bình luận, hỏi đáp trong lớp | Should |
| STU-BR-18 | Sinh viên nhắn tin hoặc liên hệ giảng viên/cố vấn theo quyền | Should |
| STU-BR-19 | Sinh viên gửi phúc khảo hoặc khiếu nại điểm nếu được mở | Should |
| STU-BR-20 | Sinh viên gửi ticket hỗ trợ khi gặp lỗi hệ thống | Should |
| STU-BR-21 | Sinh viên tham gia khảo sát đánh giá môn học/giảng viên | Should |
| STU-BR-22 | Sinh viên xem cảnh báo học vụ và phản hồi kế hoạch cải thiện | Should |

### 9.1.3. Kết quả mong muốn

- Sinh viên không bỏ sót deadline.
- Sinh viên biết rõ tiến độ và kết quả học tập.
- Sinh viên dễ tiếp cận tài liệu và hoạt động học tập.
- Sinh viên có kênh trao đổi chính thức với giảng viên/cố vấn.

---

## 9.2. Giảng viên

### 9.2.1. Mục tiêu nghiệp vụ

Giảng viên cần công cụ để quản lý lớp học phần, chuẩn bị học liệu, giao bài, tổ chức quiz, chấm điểm, điểm danh, phản hồi sinh viên và theo dõi chất lượng học tập của lớp.

### 9.2.2. Yêu cầu nghiệp vụ chi tiết

| Mã yêu cầu | Yêu cầu | Mức ưu tiên |
|---|---|---|
| LEC-BR-01 | Giảng viên xem được các lớp học phần được phân công | Must |
| LEC-BR-02 | Giảng viên cập nhật thông tin lớp, đề cương, lịch trình học | Must |
| LEC-BR-03 | Giảng viên tạo chương, chủ đề, bài học theo tuần/buổi | Must |
| LEC-BR-04 | Giảng viên upload tài liệu, video, link tham khảo | Must |
| LEC-BR-05 | Giảng viên ẩn/hiện hoặc hẹn giờ công bố học liệu | Should |
| LEC-BR-06 | Giảng viên theo dõi lượt xem và tiến độ học của sinh viên | Should |
| LEC-BR-07 | Giảng viên tạo bài tập cá nhân/nhóm | Must |
| LEC-BR-08 | Giảng viên cấu hình deadline, loại nộp bài, điểm tối đa, rubric | Must |
| LEC-BR-09 | Giảng viên xem, tải và chấm bài nộp | Must |
| LEC-BR-10 | Giảng viên trả điểm, feedback và file phản hồi | Must |
| LEC-BR-11 | Giảng viên tạo quiz/bài kiểm tra | Must |
| LEC-BR-12 | Giảng viên quản lý ngân hàng câu hỏi | Should |
| LEC-BR-13 | Giảng viên cấu hình random câu hỏi, thời gian làm bài, số lần làm | Should |
| LEC-BR-14 | Giảng viên xem log làm bài và xử lý sự cố quiz | Should |
| LEC-BR-15 | Giảng viên tạo và quản lý cột điểm | Must |
| LEC-BR-16 | Giảng viên nhập, import, export điểm | Must |
| LEC-BR-17 | Giảng viên công bố hoặc ẩn điểm | Must |
| LEC-BR-18 | Giảng viên gửi điểm cuối kỳ để duyệt/chốt | Should |
| LEC-BR-19 | Giảng viên tạo buổi điểm danh và ghi nhận chuyên cần | Should |
| LEC-BR-20 | Giảng viên gửi thông báo cho lớp hoặc sinh viên cụ thể | Must |
| LEC-BR-21 | Giảng viên quản lý diễn đàn lớp học | Should |
| LEC-BR-22 | Giảng viên tạo lớp học online và đăng bản ghi | Should |
| LEC-BR-23 | Giảng viên xem dashboard lớp: tiến độ, điểm, chuyên cần, bài nộp | Should |
| LEC-BR-24 | Giảng viên phát hiện sinh viên yếu và gửi cảnh báo/cố vấn | Should |

### 9.2.3. Kết quả mong muốn

- Giảng viên giảm thao tác thủ công khi quản lý lớp.
- Dữ liệu bài tập, quiz, điểm và feedback được lưu tập trung.
- Việc giảng dạy minh bạch, có thể theo dõi và báo cáo.

---

## 9.3. Quản trị viên hệ thống

### 9.3.1. Mục tiêu nghiệp vụ

Admin cần đảm bảo hệ thống hoạt động ổn định, đúng phân quyền, dữ liệu nhất quán, bảo mật, có khả năng backup, cấu hình, tích hợp và giám sát toàn bộ nền tảng.

### 9.3.2. Yêu cầu nghiệp vụ chi tiết

| Mã yêu cầu | Yêu cầu | Mức ưu tiên |
|---|---|---|
| ADM-BR-01 | Admin quản lý toàn bộ tài khoản người dùng | Must |
| ADM-BR-02 | Admin import/export người dùng bằng Excel/CSV | Must |
| ADM-BR-03 | Admin khóa/mở khóa/reset mật khẩu tài khoản | Must |
| ADM-BR-04 | Admin quản lý vai trò và quyền truy cập RBAC | Must |
| ADM-BR-05 | Admin cấu hình phân quyền theo menu, module, dữ liệu | Must |
| ADM-BR-06 | Admin quản lý khoa, bộ môn, phòng ban, ngành, lớp hành chính | Must |
| ADM-BR-07 | Admin quản lý năm học, học kỳ, tuần học, đợt thi | Must |
| ADM-BR-08 | Admin quản lý môn học, môn tiên quyết, chương trình đào tạo | Must |
| ADM-BR-09 | Admin quản lý lớp học phần, giảng viên, sinh viên ghi danh | Must |
| ADM-BR-10 | Admin xem toàn bộ khóa học và nội dung LMS | Must |
| ADM-BR-11 | Admin cấu hình loại file, dung lượng upload, lưu trữ | Should |
| ADM-BR-12 | Admin quản lý ngân hàng câu hỏi và đề thi ở cấp hệ thống | Should |
| ADM-BR-13 | Admin cấu hình thang điểm, trọng số, làm tròn điểm | Must |
| ADM-BR-14 | Admin khóa/mở bảng điểm và theo dõi lịch sử sửa điểm | Must |
| ADM-BR-15 | Admin cấu hình điểm danh và ngưỡng cảnh báo chuyên cần | Should |
| ADM-BR-16 | Admin gửi thông báo toàn hệ thống hoặc theo nhóm | Must |
| ADM-BR-17 | Admin quản lý diễn đàn, bình luận, báo cáo vi phạm | Should |
| ADM-BR-18 | Admin cấu hình SSO, SMTP, Zoom/Meet/Teams, SIS nếu có | Should |
| ADM-BR-19 | Admin cấu hình bảo mật: password policy, 2FA, session, audit log | Must |
| ADM-BR-20 | Admin xem log đăng nhập, log thao tác, log lỗi | Must |
| ADM-BR-21 | Admin backup/restore database và file upload | Must |
| ADM-BR-22 | Admin theo dõi hiệu năng, dung lượng, queue, trạng thái hệ thống | Should |
| ADM-BR-23 | Admin xem báo cáo toàn hệ thống và xuất báo cáo | Must |
| ADM-BR-24 | Admin cấu hình thông số vận hành, giao diện, ngôn ngữ, branding | Should |

### 9.3.3. Kết quả mong muốn

- Hệ thống được quản trị tập trung, có kiểm soát.
- Dữ liệu đúng quyền, đúng phạm vi, có khả năng audit.
- Admin có thể xử lý sự cố và duy trì vận hành ổn định.

---

## 9.4. Khoa / Bộ môn / Phòng đào tạo

### 9.4.1. Mục tiêu nghiệp vụ

Nhóm quản lý đào tạo cần theo dõi và điều phối hoạt động giảng dạy, lớp học phần, chương trình đào tạo, phân công giảng viên, chất lượng môn học, điểm số, khảo thí, chuyên cần và báo cáo.

### 9.4.2. Yêu cầu nghiệp vụ chi tiết

| Mã yêu cầu | Yêu cầu | Mức ưu tiên |
|---|---|---|
| FAC-BR-01 | Xem dashboard tổng quan khoa/bộ môn/phòng đào tạo | Must |
| FAC-BR-02 | Quản lý hoặc đề xuất ngành, chuyên ngành, chương trình đào tạo | Should |
| FAC-BR-03 | Quản lý khung chương trình, môn bắt buộc, môn tự chọn | Should |
| FAC-BR-04 | Quản lý chuẩn đầu ra CLO/PLO và mapping môn học | Could |
| FAC-BR-05 | Duyệt đề cương môn học | Should |
| FAC-BR-06 | Quản lý danh sách môn học thuộc khoa/bộ môn | Must |
| FAC-BR-07 | Tạo/đề xuất/mở/đóng lớp học phần | Must |
| FAC-BR-08 | Phân công giảng viên và trợ giảng | Must |
| FAC-BR-09 | Quản lý sĩ số, tách/gộp/chuyển lớp học phần | Should |
| FAC-BR-10 | Xem danh sách sinh viên theo khoa/ngành/lớp | Must |
| FAC-BR-11 | Theo dõi sinh viên yếu, nợ môn, nghỉ nhiều, ít tương tác | Must |
| FAC-BR-12 | Theo dõi hoạt động giảng viên: đăng bài, chấm bài, phản hồi | Should |
| FAC-BR-13 | Theo dõi tiến độ giảng dạy từng lớp | Must |
| FAC-BR-14 | Theo dõi tỷ lệ nộp bài, điểm trung bình, chuyên cần | Must |
| FAC-BR-15 | Lập kế hoạch thi, quản lý lịch thi | Should |
| FAC-BR-16 | Duyệt đề thi hoặc ngân hàng câu hỏi cấp khoa | Should |
| FAC-BR-17 | Theo dõi bài thi đang diễn ra và xử lý sự cố | Could |
| FAC-BR-18 | Duyệt điểm cuối kỳ, khóa/mở điểm theo quy trình | Must |
| FAC-BR-19 | Quản lý phúc khảo và phân công xử lý | Should |
| FAC-BR-20 | Gửi thông báo đào tạo theo khoa/lớp/nhóm đối tượng | Must |
| FAC-BR-21 | Tạo và xem khảo sát đánh giá môn học/giảng viên | Should |
| FAC-BR-22 | Xuất báo cáo đào tạo: lớp, môn, giảng viên, sinh viên, điểm, chuyên cần | Must |
| FAC-BR-23 | Chuyển danh sách sinh viên rủi ro cho cố vấn học tập | Must |

### 9.4.3. Kết quả mong muốn

- Khoa/phòng đào tạo có dữ liệu quản lý học kỳ và lớp học phần chính xác.
- Có thể theo dõi chất lượng giảng dạy theo từng môn, lớp, giảng viên.
- Quy trình duyệt điểm, khảo thí, cảnh báo học vụ minh bạch hơn.

---

## 9.5. Cố vấn học tập

### 9.5.1. Mục tiêu nghiệp vụ

Cố vấn học tập cần công cụ để theo dõi tình hình học tập của sinh viên phụ trách, nhận cảnh báo sớm, tư vấn, ghi nhận hỗ trợ và báo cáo tình trạng sinh viên.

### 9.5.2. Yêu cầu nghiệp vụ chi tiết

| Mã yêu cầu | Yêu cầu | Mức ưu tiên |
|---|---|---|
| ADV-BR-01 | Cố vấn xem danh sách sinh viên được phân công | Must |
| ADV-BR-02 | Cố vấn xem hồ sơ cá nhân và hồ sơ học tập của sinh viên | Must |
| ADV-BR-03 | Cố vấn xem điểm, tiến độ học, chuyên cần, bài tập chưa nộp | Must |
| ADV-BR-04 | Cố vấn xem cảnh báo học vụ tự động từ hệ thống | Must |
| ADV-BR-05 | Cố vấn phân loại mức độ rủi ro của sinh viên | Should |
| ADV-BR-06 | Cố vấn gửi cảnh báo/nhắc nhở cho sinh viên | Must |
| ADV-BR-07 | Cố vấn tạo lịch hẹn tư vấn online/offline | Should |
| ADV-BR-08 | Cố vấn ghi biên bản tư vấn và kế hoạch cải thiện | Must |
| ADV-BR-09 | Cố vấn tạo task theo dõi sau tư vấn | Should |
| ADV-BR-10 | Cố vấn chuyển tuyến hỗ trợ đến khoa/phòng đào tạo/giảng viên/admin | Should |
| ADV-BR-11 | Cố vấn theo dõi đăng ký học phần, môn nợ, môn học lại | Should |
| ADV-BR-12 | Cố vấn cảnh báo sinh viên đăng ký sai lộ trình hoặc quá tải tín chỉ | Could |
| ADV-BR-13 | Cố vấn theo dõi chuyên cần và lý do vắng | Must |
| ADV-BR-14 | Cố vấn tiếp nhận yêu cầu hỗ trợ/phúc khảo từ sinh viên | Should |
| ADV-BR-15 | Cố vấn theo dõi trạng thái xử lý yêu cầu hỗ trợ | Should |
| ADV-BR-16 | Cố vấn tạo báo cáo sinh viên rủi ro, tư vấn, chuyên cần, điểm thấp | Must |
| ADV-BR-17 | Cố vấn xuất báo cáo gửi khoa/phòng đào tạo | Must |

### 9.5.3. Kết quả mong muốn

- Sinh viên có nguy cơ được phát hiện sớm.
- Cố vấn có dữ liệu đầy đủ để tư vấn thay vì dựa vào thông tin rời rạc.
- Nhà trường có lịch sử can thiệp và hỗ trợ sinh viên rõ ràng.

---

## 10. Yêu cầu nghiệp vụ theo module

## 10.1. Module người dùng và phân quyền

### Mục tiêu

Đảm bảo mọi người dùng truy cập đúng vai trò, đúng phạm vi dữ liệu và đúng chức năng được cấp quyền.

### Yêu cầu chính

- Hỗ trợ nhiều vai trò: Student, Lecturer, Admin, Faculty/Department/Training Office, Advisor.
- Một người dùng có thể có nhiều vai trò nếu được cấp quyền.
- Quyền cần kiểm soát theo module, hành động và phạm vi dữ liệu.
- Cần có audit log cho thao tác cấp quyền, thu hồi quyền, sửa dữ liệu quan trọng.
- Hỗ trợ khóa/mở tài khoản, reset mật khẩu, bắt buộc đổi mật khẩu.
- Hỗ trợ import/export người dùng.

### Giá trị nghiệp vụ

- Giảm rủi ro truy cập trái phép.
- Phù hợp với mô hình tổ chức phức tạp của đại học.

## 10.2. Module tổ chức đào tạo

### Mục tiêu

Quản lý đầy đủ cấu trúc trường học, bao gồm khoa, bộ môn, phòng ban, ngành, chuyên ngành, lớp hành chính, niên khóa.

### Yêu cầu chính

- Cho phép tạo, sửa, ẩn/xóa mềm các đơn vị tổ chức.
- Cho phép gán người phụ trách cho khoa/bộ môn/phòng đào tạo.
- Cho phép liên kết sinh viên và giảng viên với đơn vị tổ chức.
- Hỗ trợ báo cáo theo cơ cấu tổ chức.

## 10.3. Module học kỳ, môn học, lớp học phần

### Mục tiêu

Quản lý vòng đời lớp học phần theo từng học kỳ.

### Yêu cầu chính

- Tạo năm học, học kỳ, tuần học, đợt thi.
- Quản lý môn học, mã môn, tín chỉ, mô tả, điều kiện tiên quyết.
- Tạo lớp học phần theo học kỳ.
- Gán giảng viên, trợ giảng, sinh viên.
- Theo dõi trạng thái lớp: nháp, sắp mở, đang học, đã kết thúc, đã lưu trữ.

## 10.4. Module bài giảng và học liệu

### Mục tiêu

Cho phép giảng viên tổ chức nội dung học tập khoa học, sinh viên dễ truy cập và hệ thống theo dõi được tiến độ học tập.

### Yêu cầu chính

- Nội dung được chia theo chương, tuần, chủ đề hoặc buổi học.
- Hỗ trợ nhiều loại học liệu: text, file, video, link, slide.
- Hỗ trợ ẩn/hiện, hẹn giờ công bố, điều kiện mở bài.
- Ghi nhận trạng thái xem/học của sinh viên.
- Hỗ trợ tìm kiếm trong khóa học.

## 10.5. Module bài tập

### Mục tiêu

Chuẩn hóa quy trình giao bài, nộp bài, chấm bài, phản hồi và khiếu nại điểm.

### Yêu cầu chính

- Bài tập cá nhân và nhóm.
- Nộp file, text, link, code.
- Deadline, nộp muộn, gia hạn.
- Rubric chấm điểm.
- Feedback dạng text/file.
- Kiểm tra đạo văn nếu tích hợp.
- Báo cáo nộp bài, trễ hạn, điểm trung bình.

## 10.6. Module quiz/bài thi

### Mục tiêu

Hỗ trợ kiểm tra đánh giá trực tuyến với câu hỏi đa dạng, tự động chấm và thống kê kết quả.

### Yêu cầu chính

- Ngân hàng câu hỏi theo môn/chương/mức độ.
- Loại câu hỏi: single choice, multiple choice, true/false, fill blank, matching, ordering, essay, numeric.
- Random câu hỏi và đáp án.
- Giới hạn thời gian, số lần làm, thời gian mở/đóng.
- Tự động chấm câu khách quan.
- Chấm thủ công câu tự luận.
- Log làm bài, IP, thiết bị, thời gian.
- Xử lý sự cố làm bài.

## 10.7. Module điểm số

### Mục tiêu

Quản lý đầy đủ điểm thành phần, điểm tổng kết, trọng số, công bố điểm, khóa điểm và phúc khảo.

### Yêu cầu chính

- Tạo cột điểm thủ công hoặc tự động từ bài tập/quiz.
- Cấu hình trọng số và công thức điểm.
- Nhập/import/export điểm.
- Công bố/ẩn điểm.
- Lưu lịch sử sửa điểm.
- Khóa điểm sau khi duyệt.
- Phúc khảo và xử lý khiếu nại điểm.

## 10.8. Module điểm danh

### Mục tiêu

Theo dõi chuyên cần của sinh viên và tạo dữ liệu cảnh báo học vụ.

### Yêu cầu chính

- Điểm danh thủ công, QR, mã lớp, online.
- Trạng thái: có mặt, vắng, trễ, có phép.
- Lý do vắng và minh chứng.
- Thống kê chuyên cần theo sinh viên/lớp/môn.
- Cảnh báo vắng vượt ngưỡng.

## 10.9. Module thông báo và giao tiếp

### Mục tiêu

Đảm bảo thông tin học tập, deadline, điểm, lịch học, cảnh báo được gửi đúng người, đúng thời điểm.

### Yêu cầu chính

- Thông báo trong hệ thống.
- Email notification.
- Gửi theo vai trò, khoa, lớp, cá nhân.
- Lên lịch thông báo.
- Mẫu thông báo.
- Theo dõi trạng thái đã đọc/chưa đọc.

## 10.10. Module diễn đàn và phản hồi

### Mục tiêu

Tạo không gian trao đổi học thuật có kiểm soát trong từng lớp học phần.

### Yêu cầu chính

- Forum theo lớp/môn.
- Chủ đề, bình luận, trả lời.
- Ghim bài, khóa bài.
- Báo cáo vi phạm.
- Kiểm duyệt nội dung.
- Tìm kiếm thảo luận.

## 10.11. Module cố vấn học tập và cảnh báo học vụ

### Mục tiêu

Phát hiện sớm và hỗ trợ sinh viên có nguy cơ học vụ.

### Yêu cầu chính

- Cấu hình tiêu chí cảnh báo: điểm thấp, vắng nhiều, không nộp bài, ít đăng nhập.
- Danh sách sinh viên rủi ro.
- Lịch tư vấn.
- Biên bản tư vấn.
- Kế hoạch cải thiện.
- Theo dõi trạng thái cảnh báo.
- Báo cáo sau can thiệp.

## 10.12. Module báo cáo

### Mục tiêu

Cung cấp dữ liệu tổng hợp cho từng vai trò để ra quyết định.

### Yêu cầu chính

- Dashboard theo vai trò.
- Báo cáo sinh viên, giảng viên, lớp, môn, khoa, học kỳ.
- Báo cáo bài tập, quiz, điểm, chuyên cần, tiến độ.
- Export Excel/PDF/CSV.
- Lọc theo học kỳ, khoa, môn, lớp, giảng viên, trạng thái.

---

## 11. Quy tắc nghiệp vụ

| Mã quy tắc | Quy tắc |
|---|---|
| BRULE-01 | Mỗi tài khoản phải có ít nhất một vai trò hợp lệ |
| BRULE-02 | Sinh viên chỉ xem được dữ liệu các lớp đã ghi danh |
| BRULE-03 | Giảng viên chỉ quản lý được lớp được phân công, trừ khi có quyền bổ sung |
| BRULE-04 | Cố vấn chỉ xem được sinh viên được phân công |
| BRULE-05 | Khoa/bộ môn/phòng đào tạo chỉ xem dữ liệu trong phạm vi được cấp quyền |
| BRULE-06 | Admin có quyền cao nhất nhưng mọi thao tác quan trọng phải ghi audit log |
| BRULE-07 | Bài tập quá hạn vẫn có thể nộp nếu cấu hình cho phép nộp muộn |
| BRULE-08 | Bài quiz phải tự động nộp khi hết giờ |
| BRULE-09 | Điểm đã khóa chỉ được sửa bởi người có quyền mở khóa hoặc theo quy trình phúc khảo |
| BRULE-10 | Sinh viên chỉ xem điểm khi điểm được công bố |
| BRULE-11 | File upload phải tuân thủ loại file và dung lượng cho phép |
| BRULE-12 | Mọi thay đổi điểm phải lưu lịch sử người sửa, thời điểm, giá trị cũ, giá trị mới |
| BRULE-13 | Cảnh báo học vụ phải có trạng thái xử lý rõ ràng |
| BRULE-14 | Thông báo gửi theo nhóm phải lưu lịch sử gửi và đối tượng nhận |
| BRULE-15 | Lớp học phần đã lưu trữ không cho phép chỉnh sửa nghiệp vụ thường xuyên |
| BRULE-16 | Người dùng bị khóa tài khoản không thể đăng nhập |
| BRULE-17 | Dữ liệu học tập quan trọng không được xóa cứng nếu chưa có quyền quản trị đặc biệt |
| BRULE-18 | Hệ thống phải phân biệt bài tập cá nhân và bài tập nhóm |
| BRULE-19 | Bài nộp nhóm phải ghi nhận người nộp đại diện và thành viên nhóm |
| BRULE-20 | Phúc khảo phải có lịch sử trạng thái và người xử lý |

---

## 12. Mức ưu tiên chức năng

### 12.1. Must Have — Bắt buộc

- Đăng nhập, đăng xuất, hồ sơ người dùng.
- Quản lý người dùng, vai trò, phân quyền.
- Quản lý khoa, ngành, môn học, học kỳ, lớp học phần.
- Ghi danh sinh viên vào lớp.
- Giảng viên tạo bài giảng, tài liệu.
- Sinh viên xem bài giảng, tài liệu.
- Giảng viên tạo bài tập.
- Sinh viên nộp bài.
- Giảng viên chấm bài, trả feedback.
- Quiz cơ bản.
- Bảng điểm.
- Thông báo.
- Báo cáo cơ bản.
- Dashboard theo vai trò.
- Audit log cho thao tác quan trọng.

### 12.2. Should Have — Nên có

- Điểm danh QR/mã lớp.
- Rubric chấm điểm.
- Ngân hàng câu hỏi.
- Random câu hỏi/đáp án.
- Phúc khảo điểm.
- Diễn đàn lớp học.
- Cố vấn học tập và cảnh báo học vụ.
- Lớp học trực tuyến qua link Zoom/Meet/Teams.
- Import/export Excel.
- Email notification.

### 12.3. Could Have — Có thể có

- SCORM/xAPI.
- Proctoring nâng cao.
- Phân tích học tập nâng cao.
- Survey nâng cao.
- Tích hợp Turnitin.
- Tích hợp sâu SIS/ERP.
- Mobile app.
- AI tutor/RAG.

### 12.4. Won't Have trong giai đoạn đầu

- Marketplace bán khóa học.
- Thanh toán học phí phức tạp.
- Social network nội bộ đầy đủ.
- AI agent tự động ra quyết định học vụ.
- Video CDN chuyên dụng quy mô lớn.

---

## 13. Chỉ số thành công

| Nhóm chỉ số | KPI đề xuất |
|---|---|
| Sử dụng hệ thống | 80% sinh viên đăng nhập ít nhất 1 lần/tuần trong học kỳ |
| Giảng dạy | 90% lớp học phần có bài giảng/tài liệu được đăng theo kế hoạch |
| Bài tập | 90% bài tập được nộp qua LMS thay vì email ngoài |
| Điểm số | 100% điểm thành phần có lịch sử và trạng thái công bố rõ ràng |
| Thông báo | 95% thông báo quan trọng được gửi đúng nhóm người nhận |
| Cố vấn | 100% sinh viên rủi ro cao được cố vấn ghi nhận xử lý |
| Báo cáo | Giảm ít nhất 50% thời gian tổng hợp báo cáo đào tạo thủ công |
| Hệ thống | Uptime production đạt từ 99% trở lên trong học kỳ |
| Hỗ trợ | 80% ticket hỗ trợ được xử lý trong SLA |
| Bảo mật | 100% thao tác nhạy cảm được ghi audit log |

---

## 14. Giả định nghiệp vụ

| Mã | Giả định |
|---|---|
| ASM-01 | Mỗi sinh viên có mã sinh viên duy nhất |
| ASM-02 | Mỗi giảng viên có mã giảng viên hoặc email trường duy nhất |
| ASM-03 | Mỗi lớp học phần thuộc một học kỳ cụ thể |
| ASM-04 | Một môn học có thể có nhiều lớp học phần trong cùng học kỳ |
| ASM-05 | Một sinh viên có thể học nhiều lớp học phần trong một học kỳ |
| ASM-06 | Một giảng viên có thể dạy nhiều lớp học phần |
| ASM-07 | Một cố vấn có thể phụ trách nhiều sinh viên |
| ASM-08 | Dữ liệu người dùng có thể import ban đầu bằng Excel/CSV |
| ASM-09 | Hệ thống email SMTP có thể được cấu hình để gửi thông báo |
| ASM-10 | Giai đoạn đầu không bắt buộc tích hợp SIS thực tế, nhưng cần thiết kế mở rộng |

---

## 15. Ràng buộc nghiệp vụ

| Mã | Ràng buộc |
|---|---|
| CON-01 | Hệ thống phải hỗ trợ tiếng Việt trước, có thể mở rộng tiếng Anh |
| CON-02 | Hệ thống phải chạy tốt trên desktop và responsive trên mobile |
| CON-03 | Dữ liệu học tập cần bảo mật theo vai trò |
| CON-04 | Không được để sinh viên xem điểm chưa công bố |
| CON-05 | Không được để giảng viên sửa điểm đã khóa nếu không có quyền |
| CON-06 | File upload phải giới hạn dung lượng và loại file |
| CON-07 | Mọi lỗi nộp bài/quiz quan trọng phải có log để kiểm tra |
| CON-08 | Admin cần có khả năng backup và restore dữ liệu |
| CON-09 | Dữ liệu quan trọng nên xóa mềm thay vì xóa vĩnh viễn |
| CON-10 | Hệ thống cần có cơ chế phân trang, tìm kiếm và lọc với dữ liệu lớn |

---

## 16. Rủi ro nghiệp vụ và phương án giảm thiểu

| Rủi ro | Mức ảnh hưởng | Phương án giảm thiểu |
|---|---|---|
| Người dùng không quen sử dụng LMS | Cao | Thiết kế UI đơn giản, có hướng dẫn, FAQ |
| Dữ liệu import sai | Cao | Có bước preview, validate, rollback import |
| Giảng viên không cập nhật nội dung đúng hạn | Trung bình | Dashboard cảnh báo cho khoa/bộ môn |
| Sinh viên bỏ sót deadline | Cao | Notification, calendar, reminder |
| Tranh chấp điểm | Cao | Lưu lịch sử điểm, feedback, phúc khảo |
| Quá tải khi thi online | Cao | Tối ưu backend, cache, giới hạn phiên thi, monitoring |
| Mất dữ liệu file/bài nộp | Cao | Backup file, checksum, lưu log upload |
| Lộ dữ liệu cá nhân | Cao | RBAC, audit log, mã hóa, session security |
| Tích hợp bên thứ ba lỗi | Trung bình | Fallback thủ công, retry job, log tích hợp |
| Phạm vi dự án quá lớn | Cao | Chia MVP, giai đoạn 2, giai đoạn 3 rõ ràng |

---

## 17. Phụ thuộc bên ngoài

| Phụ thuộc | Mô tả | Mức độ |
|---|---|---|
| SMTP/Email service | Gửi email thông báo, reset mật khẩu | Cao |
| SSO/LDAP/Google/Microsoft | Đăng nhập tài khoản trường | Trung bình |
| Zoom/Meet/Teams | Lớp học trực tuyến | Trung bình |
| SIS/Hệ thống đào tạo | Đồng bộ sinh viên, lớp, điểm | Cao nếu triển khai thực tế |
| Cloud storage | Lưu file/video nếu không lưu local | Trung bình |
| Turnitin/plagiarism checker | Kiểm tra đạo văn | Thấp/tuỳ chọn |
| Hosting/Railway | Môi trường production | Cao |
| PostgreSQL/Redis | Database và cache/queue | Cao |

---

## 18. Phạm vi MVP đề xuất

### 18.1. MVP cho sinh viên

- Đăng nhập.
- Xem lớp học phần.
- Xem bài giảng/tài liệu.
- Nộp bài tập.
- Làm quiz cơ bản.
- Xem điểm và feedback.
- Xem thông báo/deadline.

### 18.2. MVP cho giảng viên

- Xem lớp được phân công.
- Tạo bài giảng/tài liệu.
- Tạo bài tập.
- Chấm bài.
- Tạo quiz cơ bản.
- Nhập/công bố điểm.
- Gửi thông báo lớp.

### 18.3. MVP cho admin

- Quản lý user.
- Quản lý role/permission.
- Quản lý khoa/ngành/môn/học kỳ/lớp học phần.
- Ghi danh sinh viên.
- Cấu hình cơ bản.
- Báo cáo cơ bản.

### 18.4. MVP cho khoa/phòng đào tạo

- Xem dashboard lớp học phần.
- Phân công giảng viên.
- Theo dõi tiến độ lớp.
- Duyệt/xem điểm.
- Xuất báo cáo.

### 18.5. MVP cho cố vấn

- Xem danh sách sinh viên phụ trách.
- Xem điểm, tiến độ, chuyên cần.
- Xem cảnh báo học vụ.
- Ghi chú tư vấn.
- Xuất báo cáo sinh viên rủi ro.

---

## 19. Roadmap nghiệp vụ đề xuất

### Giai đoạn 1 — Core LMS

- Auth, user, role, permission.
- Organization, academic year, semester.
- Course, course section, enrollment.
- Lecture content, learning materials.
- Assignment submission and grading.
- Basic quiz.
- Gradebook.
- Notification.

### Giai đoạn 2 — Academic Management

- Attendance.
- Rubric.
- Question bank nâng cao.
- Faculty dashboard.
- Advisor dashboard.
- Academic warning.
- Phúc khảo.
- Import/export nâng cao.

### Giai đoạn 3 — Integration & Analytics

- SSO.
- SMTP nâng cao.
- Zoom/Meet/Teams.
- SIS sync.
- Advanced analytics.
- Survey/evaluation.
- Plagiarism integration.

### Giai đoạn 4 — Advanced Learning

- SCORM/xAPI.
- AI learning assistant.
- Recommendation.
- Mobile app.
- Proctoring nâng cao.

---

## 20. Tiêu chí nghiệm thu nghiệp vụ cấp cao

| Mã | Tiêu chí nghiệm thu |
|---|---|
| AC-BRD-01 | Hệ thống cho phép đăng nhập và phân quyền đúng theo 5 nhóm đối tượng |
| AC-BRD-02 | Admin tạo được khoa, ngành, môn học, học kỳ, lớp học phần và ghi danh sinh viên |
| AC-BRD-03 | Giảng viên tạo được bài giảng, bài tập, quiz và công bố cho sinh viên |
| AC-BRD-04 | Sinh viên xem được bài học, nộp bài, làm quiz và xem điểm sau khi công bố |
| AC-BRD-05 | Giảng viên chấm bài và trả feedback cho sinh viên |
| AC-BRD-06 | Khoa/phòng đào tạo xem được tiến độ lớp, điểm, chuyên cần và báo cáo |
| AC-BRD-07 | Cố vấn xem được sinh viên phụ trách, cảnh báo và ghi chú tư vấn |
| AC-BRD-08 | Hệ thống gửi được thông báo trong hệ thống và email cơ bản |
| AC-BRD-09 | Các thao tác sửa điểm, phân quyền, khóa dữ liệu có audit log |
| AC-BRD-10 | Báo cáo có thể lọc theo học kỳ, khoa, môn, lớp và xuất file |

---

## 21. Kết luận

Hệ thống LMS đại học cần được xem là nền tảng quản lý học tập và đào tạo tổng thể, không chỉ là nơi đăng tài liệu. Giá trị cốt lõi của hệ thống nằm ở khả năng kết nối 5 nhóm người dùng chính:

- Sinh viên học tập và theo dõi tiến độ.
- Giảng viên tổ chức giảng dạy, đánh giá và phản hồi.
- Admin vận hành, phân quyền và bảo mật hệ thống.
- Khoa/Bộ môn/Phòng đào tạo quản lý chất lượng và tiến độ đào tạo.
- Cố vấn học tập phát hiện sớm và hỗ trợ sinh viên có nguy cơ.

BRD này là nền tảng để tiếp tục xây dựng các tài liệu chi tiết hơn như PRD/SRS, UI/UX Wireframes, SAD, ERD, Sequence Diagram, API Specification và Deployment Strategy.

---

*This BRD is a living document. Major scope changes require stakeholder re-approval. Minor clarifications can be incorporated with version note and author signature.*

*Document Owner: Team AI20K-015 | Next Review: End of Sprint 4 (Week 8)*
