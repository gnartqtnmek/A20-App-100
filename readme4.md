# 1. Ghi chú
- Nội dung trong `src` cũ được copy ->   `apps/agent-api`
- `src` cũ được đổi tên thành `src2`
- FastAPI: `apps/agent-api/src/api/`  
- Frontend: `apps/agent-web`
- Hiện tại toàn bộ nội dung cần check lại...


# 2. Cây thư mục:
``` bash
monorepo/
  apps/
    lms-api/        # Python/FastAPI — backend LMS (code LMS của bạn)
    lms-web/        # Next.js/React — web app chính cho sinh viên
    agent-api/      # Python/FastAPI — code agent hiện tại
    agent-web/      # (optional) Next.js — chat UI đứng riêng, cho dev/admin
  libs/
    shared_auth/          # Python: JWT verify (cho 2 backend)
    lms_client/           # Python SDK: agent-api gọi lms-api
    api_types/            # TypeScript types generate từ OpenAPI (FE dùng)
    ui_kit/               # React components dùng chung (nếu có 2 FE)
  db/
    lms/migrations/
    agent/migrations/
```

Chi tiết trong `agent-api`
```
monorepo/
  apps/
    agent-api/
      src/
        api/                    # FastAPI layer
          __init__.py
          app.py                # create FastAPI app, lifespan, DI
          routes/
            conversations.py    # POST /conversations, GET /messages, ...
            health.py
          schemas.py            # Pydantic request/response (cái hiện ở schemas.py)
          deps.py               # dependency injection helpers

        agent/                  # Agent runtime + tools + prompts
          __init__.py
          runtime.py            # AgentRuntimeService (cái hiện ở agent.py)
          prompts.py            # _SYSTEM_PROMPT_TEMPLATE + builder
          context.py            # AgentContext TypedDict (đang nằm trong tools.py)
          tools/
            __init__.py         # build_tools(services)
            personalization.py
            chat_history.py
            course.py           # tương lai
            assignment.py       # tương lai

        services/               # Business logic — không biết LLM
          __init__.py
          personalization.py
          conversation.py
          summary.py
          retrieval.py
          course.py             # wrapper gọi lms_client (không đụng DB LMS!)

        infra/                  # Kết nối hạ tầng
          __init__.py
          db.py                 # AsyncConnectionPool
          llm.py                # create_llm factory + cache
          checkpointer.py       # PostgresSaver setup
          cache.py              # Redis client
          lms.py                # khởi tạo LmsClient từ lib
          settings.py           # Pydantic Settings (cái hiện ở config.py)

        workers/                # Process phụ (nếu có)
          embedding_worker.py   # consume embedding_jobs → sinh vector
          summary_worker.py     # sinh conversation/memory summary

        __main__.py             # uvicorn entrypoint
        __init__.py

      tests/
        unit/
          test_personalization_service.py
          test_tools.py
        integration/
          test_conversations_api.py
          test_agent_flow.py
        conftest.py             # fixture DB test, mock LLM

      migrations/               # Alembic (hoặc để ở monorepo/db/agent/)
        versions/
        env.py

      pyproject.toml            # deps riêng của agent-api
      Dockerfile
      .env.example
      README.md
```









# 3. Tạo lại database
``` bash
docker compose down -v
docker compose up -d
```




# 4. Run
## Backend (port 8000):
``` bash
uvicorn src.api.app:app --reload  
```

Ví dụ: `K:\A20-App-100\apps\agent-api>uvicorn src.api.app:app --reload  # trong apps/agent-api`

## Frontend:
``` bash
npm --prefix apps/agent-web run dev 
``` 

Ví dụ: `K:\A20-App-100>npm --prefix apps/agent-web run dev`

→ http://localhost:5173
