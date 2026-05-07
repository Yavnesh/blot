# blot.ai - Premium Multi-Tenant SaaS Content Engine

## 🆕 Latest Changes & Updates (Architecture Hardening & Stabilization)
- **Redis Pub/Sub & WebSockets**: Transitioned the real-time UI from heavy database polling to a high-performance, organization-scoped Redis message bus.
- **Asynchronous GenAI SDK**: Refactored the entire model layer to use the modern `google-genai` SDK with native `async/await` and structured output validation.
- **Circuit Breakers & Resilience**: Integrated `tenacity` retries with exponential backoff across all external AI clients (Gemini, Stable Horde) to mitigate 429s and transient API failures.
- **Atomic Observability**: Standardized over 15+ specialized agents under a unified `BaseAgent` execution pattern, enabling centralized telemetry and error wrapping.
- **Hardened CI/CD & Tooling**: Configured a strict CI/CD pipeline in GitHub Actions using **Ruff** for linting and **PyTest** for mandatory health checks.
- **Persistence Foundation**: Configured LangGraph state management with memory checkpointers to support thread-bound workflow snapshots and future long-running recovery.

---

## 🏗️ System Architecture & Port Map

The Blot.ai platform operates as a coordinated fleet of micro-services:

| Port | Service | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **8080** | **Backend API** | Core Engine | FastAPI server handling agent orchestration and multi-tenant logic. |
| **5173** | **Admin CMS** | Discovery Hub | Modern React dashboard for monitoring autonomous editorial pipelines. |
| **5174** | **Public Blog** | Reader Platform | High-performance blog site where finalized articles are published. |
| **5432** | **PostgreSQL** | Database | Persistent storage with `pgvector` for enterprise RAG. |
| **6379** | **Redis** | Broker & Pub/Sub | Celery task coordination and 0-latency UI state streaming. |
| **N/A** | **Celery Engine** | Execution | Dedicated worker pool (Queues: `heavy` for AI, `default` for RAG). |

---

## 📁 Project Structure
- **/backend**: FastAPI engine, Pydantic models, and the standardized Agent registry.
- **/frontend**: Internal React Admin Dashboard with real-time pipeline visualization.
- **/blog_site**: Public-facing content delivery platform.
- **/documentation**: Strategic reports, architectural diagrams, and research logs.
- **/tests**: Pytest-driven verification suite with async support.

---

## 🚀 Local Development

### 1. Environment Configuration
Copy the template and configure your API keys (Gemini, Stable Horde, etc.):
```bash
cp backend/.env.example backend/.env
```

### 2. Infrastructure
Ensure PostgreSQL and Redis are running. On macOS:
```bash
brew services start postgresql@14
brew services start redis
```
Initialize the database:
```bash
psql blot_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
cd backend && alembic upgrade head
```

### 3. Execution
Run the following in separate terminal sessions:
```bash
# API Server
uvicorn app.main:app --reload --port 8080

# Celery Worker (Processing Engine)
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app worker --loglevel=info -Q heavy,default
```

---

## 🧪 Quality & Tests

Run the full validation suite before contributing:
```bash
cd backend
# Run Linter
ruff check app/

# Run Tests
pytest
```

---

## 🛠️ Tech Stack
- **Backend Architecture**: FastAPI, SQLAlchemy, Alembic, Celery, Redis
- **Database Layer**: PostgreSQL + pgvector
- **AI & Orchestration**: Google GenAI (Gemini 1.5 Pro), LangGraph (Stateful Workflows)
- **Frontend Systems**: React, Vite, Tailwind CSS v4, Zustand 
- **Quality Control**: Ruff, PyTest, Tenacity (Resilience)

