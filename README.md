# blot.ai - Autonomous AI Content Engine

## 🆕 Latest Changes & Updates (2026 Resilience Update)
- **Dynamic Topic Refinement**: Improved the `CredibilityAgent` to analyze raw research and suggest a refined, search-optimized editorial topic, ensuring the articles are highly relevant and fact-based.
- **Intelligent Image Reuse**: Orchestrator now detects existing visual assets for a given topic and reuses them for regenerated posts, reducing API costs and maintaining visual consistency.
- **Orchestrator 2.0 Resilience Upgrade**: Upgraded the core engine to support **Parallel Execution** using `asyncio.gather`. This reduces pipeline latency by 30-50% by running refinement and metadata agents concurrently.
- **Resilient AI Pipelines**: Integrated intelligent logic to distinguish between transient (retryable) and permanent (fatal) errors, coupled with namespaced state management to prevent data collisions.
- **Precision Content & Telemetry**: Standardized `confidence_score` in every agent (`Writer`, `Image`, `Dataset`, etc.) and harvested them into a unified `agent_telemetry` object for real-time UI transparency.
- **Core Reorganization**: Centralized all project documentation into `/documentation` and moved all verification/testing scripts to `/tests` for a cleaner root architecture.

---

## 📖 About blot.ai 

**blot.ai** is a state-of-the-art, hyper-agentic AI platform that fully automates the lifecycle of professional content creation. By leveraging a coordinated multi-agent orchestration pipeline, blot.ai handles everything from real-time trend discovery and semantic SEO research to generating premium, production-ready blog content.

### Key Capabilities
- **Hyper-Agentic Orchestration 2.0**: A parallelized 6-layer pipeline spanning Discovery, Research, Strategy, Creation, Improvement, and Governance stages.
- **Semantic Coverage Engine**: Real-time vector analysis to optimize SEO ranking predictions and semantic data point matching.
- **High-Fidelity Writing**: Specialised agents for long-form articles, X (Twitter) threads, and LinkedIn posts with automated emojis and platform-specific formatting.
- **Pipeline Telemetry**: Deep tracking of agent execution, including fact counts, SEO scores, and readability metrics, displayed via a real-time progress timeline.

---

## 🏗️ System Architecture & Port Map

The system runs as a coordinated suite of micro-services:

| Port | Service | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **8080** | **Backend API** | Core Engine | FastAPI server handling agent orchestration, API requests, and database logic. |
| **5173** | **Admin CMS** | Internal Management | Internal React dashboard for the editorial team to track pipelines and configure agents. |
| **5174** | **Public Blog** | Reader Platform | Premium NYT-style blog site frontend where published content is consumed. |
| **5432** | **PostgreSQL** | Database | Persistent storage for relational data and semantic vectors (`pgvector`). |
| **6379** | **Redis** | Message Broker | Task queue for Celery to handle long-running autonomous editorial jobs. |
| **9090** | **Metrics** | Observability | Prometheus endpoint targeting agent latency, costs, and pipeline efficiency metrics. |
| **N/A** | **Celery Worker** | Execution Engine | Background worker pool executing the multi-agent editorial workflows asynchronously. |

---

## 📁 Project Structure
- **/backend**: FastAPI application, database models, and the AI agent fleet.
- **/frontend**: Internal React Admin CMS ("Blot Intelligence Hub").
- **/blog_site**: Public-facing React blog site.
- **/documentation**: Detailed architecture guides, rebrand logs, and strategic analysis.
- **/tests**: Centralized suite of verification and performance tests.

---

## 🚀 Local Development & Testing

Follow these steps to spin up the full environment for local testing and development.

### 1. Start Infrastructure (Required)
Ensure PostgreSQL and Redis are active. On macOS with Homebrew:
```bash
brew services start postgresql@14
brew services start redis
```
Verify the DB has the `vector` extension and your target database schema is created:
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

### A. Core API Health & Agent Verification
Ensure the backend, DB, and Agent registry are communicating correctly:
```bash
# Run the centralized verification suite
python3 tests/verify_agent_pipeline.py
python3 tests/verify_api.py
```

### B. Manual Pipeline Trigger
1. Go to **[http://localhost:8080/docs](http://localhost:8080/docs)**.
2. Open `POST /api/v1/generation/trigger`.
3. Payload: `{"user_topic": "Future of Generative AI", "include_images": false}`.
4. Watch the **Celery Terminal** logs to verify agent handoffs, parallel execution groups, and stage-level telemetry.

---

## 🛠️ Tech Stack
- **Backend Architecture**: FastAPI, SQLAlchemy, Alembic, Celery, Redis
- **Database Layer**: PostgreSQL + pgvector
- **AI & Orchestration**: Gemini 1.5 Pro, Asyncio Parallel Pipelines
- **Frontend Systems**: React, Vite, Tailwind CSS v4
- **Monitoring & CI/CD**: Prometheus, Sentry (Metrics)
