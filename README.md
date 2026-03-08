# TEWS Intelligence Engine - Autonomous Editorial Discovery

The **TEWS Intelligence Engine** is a state-of-the-art AI-driven platform that automates the entire lifecycle of professional content creation—from real-time trend discovery to premium publishing.

## 🏗️ System Architecture & Port Map

The system runs as a coordinated suite of services:

| Port | Service | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **8080** | **Backend API** | Core Engine | FastAPI server handling agent orchestration, API requests, and database logic. |
| **5173** | **Admin CMS** | Internal Management | Internal dashboard for editorial teams to track pipelines, view trends, and manage content. |
| **5174** | **Public Blog** | Reader Platform | Premium NYT-style blog site where content is consumed and SEO SaaS tools are hosted. |
| **5432** | **PostgreSQL** | Database | Persistent storage for research data and semantic vectors (pgvector). |
| **6379** | **Redis** | Task Queue | Message broker for Celery to handle long-running autonomous editorial jobs. |
| **9090** | **Metrics** | Observability | Prometheus endpoint for tracking agent latency, LLM costs, and error rates. |
| **N/A** | **Celery Worker** | Execution Engine | Background worker that runs the multi-agent editorial workflows asynchronously. |

---

## 🚀 Getting Started

## 🚀 Local Development & Testing

Follow these steps to spin up the full environment for local testing and verification.

### 1. Start Infrastructure (Required)
Ensure PostgreSQL and Redis are active. On macOS with Homebrew:
```bash
brew services start postgresql@14
brew services start redis
```
Verify the DB has the `vector` extension and the `tews` database:
```bash
psql tews -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Backend Engine Setup
Each command should ideally run in its own terminal tab:

**A. Dependency Installation:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

**B. Database Initialization:**
```bash
# Apply migrations to PostgreSQL
alembic upgrade head

# Optional: Seed the database with mock trends for testing
python3 populate_data.py
```

**C. Start API & Celery Worker:**
```bash
# Terminal 1: API Server (Access at http://localhost:8080)
uvicorn app.main:app --reload --port 8080

# Terminal 2: Celery Worker (Executes the actual AI agents)
celery -A app.core.celery_app worker --loglevel=info
```

### 3. Frontend Apps
**Admin Discovery CMS:**
```bash
cd frontend && npm install && npm run dev
# Access: http://localhost:5173
```

**Public Blog Site:**
```bash
cd blog_site && npm install && npm run dev
# Access: http://localhost:5174
```

---

## 🧪 Testing & Sanity Checks

### A. Core API Health
Ensure the backend and DB are communicating:
```bash
cd backend
python3 verify_api.py
```

### B. Agent Pipeline Verification
Test the full orchestrator logic (from Discovery to Draft) in a sandboxed mode:
```bash
cd backend
python3 verify_agent_pipeline.py
```

### C. Manual Pipeline Trigger
1. Go to **[http://localhost:8080/docs](http://localhost:8080/docs)**.
2. Open `POST /api/v1/generation/trigger`.
3. Payload: `{"user_topic": "Future of Generative AI", "include_images": false}`.
4. Watch the **Celery Terminal** logs to verify agent handoffs and stage-level cost tracking.

---

## 🛡️ Core Features
- **Hyper-Agentic Orchestration**: 6-layer pipeline from Discovery to Governance.
- **Semantic Coverage Engine**: Real-time SEO ranking predictor using centroid vector analysis.
- **Deterministic Pipeline**: Isolated stage execution with retries, timeouts, and cost tracking.
- **Production Observability**: Structured JSON logging and Prometheus telemetry.

## 🛠️ Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic, Celery, Redis.
- **Database**: PostgreSQL + pgvector.
- **AI**: Gemini 1.5 Pro, Scikit-learn (Semantic Engine).
- **Frontend**: React, Vite, Tailwind CSS.
- **Monitoring**: Prometheus, Sentry.
