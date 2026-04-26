# LMS AI Agent

Trợ lý AI có trí nhớ dài hạn cho sinh viên LMS.

Sprint 0 hiện tại: vẫn là agent loop cơ bản (kế thừa từ ``src/`` trước đây),
gọi Anthropic API, có 3 tool placeholder. Sprint 4 sẽ chuyển sang LangGraph
state machine và Sprint 5 sẽ thêm memory layer.

## Run (CLI mode)

```bash
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # điền ANTHROPIC_API_KEY

python -m agent.agent
```

## Run (qua docker-compose ở root)

```bash
make dev
docker attach lms-agent      # vào shell tương tác
```

## Layout (sẽ phình ra theo sprint)

```
agent/
├── agent.py            # main loop (Sprint 0)
├── tools.py            # tool registry (Sprint 0)
├── config.py           # env config
├── server.py           # FastAPI /chat SSE endpoint (Sprint 4)
├── graph/              # LangGraph state machine (Sprint 4)
│   ├── nodes.py        # classify_intent, retrieve_kb, call_tool, generate
│   └── tools_lms.py    # 4 tool gọi LMS API: get_my_grades, ...
├── memory/             # Sprint 5
│   ├── extractor.py    # extract memory từ hội thoại
│   ├── retriever.py    # hybrid search (vector + filter)
│   └── consolidator.py # job tuần
├── workers/            # Sprint 6
│   ├── weekly_report.py
│   └── deadline_alert.py
└── tests/
```

## Tool calls vào LMS API

Agent gọi backend qua ``LMS_API_URL`` (mặc định ``http://backend:8000`` trong
docker-compose) bằng JWT của user hiện tại. Xem ``graph/tools_lms.py`` (sẽ
được tạo trong Sprint 4).
