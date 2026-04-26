# Tóm tắt ý tưởng
- Dữ liêu cá nhân hóa của từng user lấy từ _PersonalizationMemory.get_context(), chèn ngay dưới system prompt.
- _PersonalizationMemory.upsert() và _PersonalizationMemory.delete() làm nhiệm vụ thêm, sửa xóa nội dung cá nhân hóa đã lưu. 2 hàm này được wrap lại thành tool để LLM chủ động gọi.
- LLM hiện tại đã có thể chủ động lưu, ghi nhớ, xóa nội dung.
- Cần viết lại system prompt để LLM sử lý tốt hơn. nhưng hiện tại chưa viêt.

# Ghi chú thay đổi
- src/memory.py: class _PersonalizationMemory cá nhân hóa cho từng user
- src/db.py: tương tác với db PostgreSQL (cài đặt phần lấy dữ liệu từ database của các hàm trong class Memory)
- src/agent.py: viết lại agent thành class, truyền vào user_id khi khởi tạo
- src/tools.py: bổ sung thêm các hàm tương tác với _PersonalizationMemory
- db/init.sql: chứa schema bảng lưu dữ liệu các nhân hóa
- docker-compose.yml


# Cài đặt PostgreSQL với Docker
Hướng dẫn cho các thành viên trong nhóm để chạy database PostgreSQL trên local bằng Docker.

---

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài đặt và đang chạy

---

## Bước 1 — Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env` (nếu chưa có):

```bash
cp .env.example .env
```

File `.env` đã có sẵn các biến cần thiết cho PostgreSQL:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=a20db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/a20db
```

> Không cần thay đổi gì thêm cho môi trường local.

---

## Bước 2 — Khởi động PostgreSQL

```bash
docker compose up -d
```

Docker sẽ tự động:
- Tải image PostgreSQL 16
- Tạo database `a20db`
- Chạy `db/init.sql` để tạo bảng `user_personalization`

---

## Bước 3 — Kiểm tra trạng thái

```bash
docker compose ps
```

Kết quả mong muốn:

```
NAME            STATUS
a20_postgres    Up
```

## Bước 4 — Cài dependencies Python

```bash
pip install -r requirements.txt
```

Package `psycopg2-binary` đã được thêm vào `requirements.txt` — đây là driver để Python kết nối với PostgreSQL.

---

## Xem dữ liệu bằng DBeaver (tùy chọn)

Kết nối DBeaver với thông tin sau:

| Field | Giá trị |
|-------|---------|
| Host | `localhost` |
| Port | `5432` |
| Database | `a20db` |
| Username | `postgres` |
| Password | `postgres` |

**Các bước:**

1. Mở DBeaver → **New Database Connection** (Ctrl+Shift+N)
2. Chọn **PostgreSQL** → Next
3. Điền thông tin như bảng trên
4. Click **Test Connection** — lần đầu sẽ tự download driver
5. **Finish**

Sau khi kết nối, bảng `user_personalization` nằm tại:

```
a20db → Schemas → public → Tables → user_personalization
```

---

## Cấu trúc bảng

Bảng `user_personalization` lưu toàn bộ memory (sở thích, context) của từng user trong 1 cột JSONB:

```
user_id    VARCHAR(255)  PRIMARY KEY -- ID của user
data       JSONB                     -- toàn bộ key-value (vd: {"language": "vi", "level": "beginner"})
updated_at TIMESTAMP                 -- thời điểm cập nhật gần nhất
```

Mỗi user tương ứng đúng 1 row. Các key bên trong `data` do agent tự trích xuất và quản lý.

---
