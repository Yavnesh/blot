# blot.ai - Autonomous AI Content Engine

## 🆕 Latest Changes & Updates
- **Pipeline Configurations & Providers**: Added dynamic configuration for image generation providers (Google API, Horde Client), cached vs. fresh data source selection, and conditional execution logging.
- **Enhanced Pipeline Tracking**: Introduced inline timeline progress tracking directly within UI topic cards. View agent execution states in real-time (Running, Completed, Failed) along with start and end timestamps.
- **UX Improvements**: Refined the posts dashboard functionality, verified proper topic card population, and implemented a split-view layout for posts to allow simultaneous content and reference reading.
- **Architecture Migration**: Completely migrated the core blog generation pipeline from Django into a high-performance FastAPI + Celery architecture, utilizing React and Tailwind CSS on the frontend.

---

## 📖 About blot.ai 

**blot.ai** is a state-of-the-art, hyper-agentic AI platform that fully automates the lifecycle of professional content creation. By leveraging a coordinated multi-agent orchestration pipeline, blot.ai handles everything from real-time trend discovery and semantic SEO research to generating premium, production-ready blog content.

### Key Capabilities
- **Hyper-Agentic Orchestration**: A deterministic 6-layer pipeline spanning Discovery, Research, Drafting, Editing, Formatting, and Governance stages.
- **Semantic Coverage Engine**: Real-time vector analysis to optimize SEO ranking predictions and semantic data point matching.
- **Flexible Image Provisioning**: Broadened support for varying image generation pipelines, integrating easily with Google's API or decentralized networks like the Stable Horde Client.
- **Pipeline Observability**: Deep tracking of each AI agent's performance, execution time, and potential LLM cost analysis, fed via Prometheus and displayed dynamically on the admin UI.

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
4. Watch the **Celery Terminal** logs to verify agent handoffs, pipeline success states, and stage-level telemetry.

---

## 🛠️ Tech Stack
- **Backend Architecture**: FastAPI, SQLAlchemy, Alembic, Celery, Redis
- **Database Layer**: PostgreSQL + pgvector
- **AI & Integrations**: Gemini 1.5 Pro, Scikit-learn (Semantic Engine)
- **Frontend Systems**: React, Vite, Tailwind CSS
- **Monitoring & CI/CD**: Prometheus, Sentry (Metrics)
