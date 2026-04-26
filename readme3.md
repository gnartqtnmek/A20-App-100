# Hướng dẫn test chatbot

## Chạy app

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
docker compose up -d
uvicorn src.api:app --reload
```

Mở:

- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`

## Test nhanh bằng API

1. `POST /v1/conversations`
2. Copy `id`
3. `POST /v1/conversations/{conversation_id}/messages`
4. `GET /v1/conversations/{conversation_id}/messages?user_id=...`

Body tạo conversation:

```json
{
  "user_id": "u001",
  "title": "Chat test bot",
  "context": {
    "source": "manual-test"
  }
}
```

Body gửi message:

```json
{
  "user_id": "u001",
  "content": "Chào bạn, hãy giới thiệu ngắn về khả năng của bạn."
}
```

## Test nhanh bằng CLI

Chạy:

```powershell
python chat_cli.py
```

Hoặc:

```powershell
python chat_cli.py --user-id vinai
```

CLI hiện mỗi turn:

- `Tool`
- `Action`
- `Bot`

Tool hiện có:

- `personalization_read`
- `personalization_upsert`
- `personalization_delete`
- `search_chat_history`

Thoát CLI:

```text
/quit
```

## Xem dữ liệu trong DB

Bảng chính:

- `conversations`
- `messages`
- `user_personalization`

Query:

```sql
select id, user_id, title, updated_at
from conversations
order by updated_at desc;
```

```sql
select conversation_id, turn_index, role, content, metadata, created_at
from messages
order by created_at desc
limit 50;
```

```sql
select user_id, data, updated_at
from user_personalization;
```

## Lỗi hay gặp

- DB không lên: kiểm tra `docker compose up -d`
- Không connect được DB trên DBeaver: dùng đúng host `localhost`, port `5432`, db `a20db`, user `postgres`, password `postgres`
- Thiếu API key: kiểm tra `.env`
