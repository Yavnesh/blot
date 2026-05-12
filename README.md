# Blot.ai: The Bionic Content Orchestrator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-orange.svg)](https://python.langchain.com/docs/langgraph)

**Blot** is an enterprise-grade, multi-agent RAG platform that transforms the way organizations create content. It moves beyond "simple prompting" by utilizing a specialized swarm of AI agents that collaborate within a **Bionic Workspace** to produce research-backed, brand-aligned, and SEO-optimized articles.

---

## 📖 Table of Contents
1.  [Overview](#-overview)
2.  [The Problem](#-the-problem)
3.  [Core Features](#-core-features)
4.  [Tech Stack](#-tech-stack)
5.  [Architecture](#-architecture)
6.  [Installation](#-installation)
7.  [Running Locally](#-running-locally)
8.  [RAG & Agent Workflow](#-rag--agent-workflow)
9.  [API Reference](#-api-reference)
10. [Roadmap](#-roadmap)
11. [License](#-license)

---

## 🌟 Overview
Blot isn't just an AI writer; it's a content engine. It features a **Bionic Workspace** where users can "ignite" a pipeline that autonomously handles discovery, research, fact-checking, and prose hardening. By integrating a **Knowledge Vault (RAG)**, Blot ensures that every piece of content is anchored in your organization's unique data, eliminating the "hallucination" problem typical of LLMs.

## ⚠️ The Problem
Traditional AI content suffers from:
- **Generic Output**: Lack of brand-specific nuance.
- **Hallucinations**: Inventing facts that damage credibility.
- **Surface-Level SEO**: Writing for keywords, not for users.
- **Linear Workflows**: Simple "Input -> Output" loops that miss the complexity of professional editorial standards.

**Blot solves this** by treating content generation as a multi-stage **consensus protocol** between specialized agents.

---

## ✨ Core Features
- **Bionic Workspace**: Real-time visualization of the AI's internal "Logic Stream."
- **Knowledge Vault (RAG)**: Organization-scoped vector storage (`pgvector`) for PDFs, Docs, and Assets.
- **Agent Swarm**: 
    - `TrendAgent`: Discovers high-intent editorial topics.
    - `CredibilityAgent`: Verifies claims against web and internal data.
    - `VoiceAgent`: Applies few-shot style alignment using the **Data Flywheel**.
    - `LegalAgent`: Performs defamation and brand-safety risk checks.
- **Real-Time Telemetry**: UI state streaming via Redis Pub/Sub for 0-latency pipeline updates.
- **HITL (Human-In-The-Loop)**: Seamless intervention gates for editorial approval before finalization.

---

## 🛠 Tech Stack
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend** | Python / FastAPI | High-performance API Gateway |
| **Orchestration** | LangGraph / LangChain | Multi-agent state management |
| **Database** | PostgreSQL + `pgvector` | Structured data & Semantic search |
| **Intelligence** | Google Gemini (v1.5 Flash/Pro) | Core LLM & Multimodal analysis |
| **Task Queue** | Celery + Redis | Asynchronous background processing |
| **Frontend** | React / Zustand / Framer Motion | Bionic Dashboard & Editor |

---

## 🏗 Architecture
Blot follows a **Decoupled Agentic Architecture**:

1.  **Ingestion**: Assets are uploaded to the Vault, vectorized (768d), and stored in `pgvector`.
2.  **Orchestration**: LangGraph manages the state machine, transitioning between nodes (Discovery -> Research -> Writing -> Assess).
3.  **Validation**: A consensus node ensures the `LegalAgent` and `OriginalityAgent` approve the draft before the user sees it.
4.  **Streaming**: Progress is pushed from Celery workers to a Redis channel, where WebSockets broadcast it to the React frontend.

---

## 🚀 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (with `pgvector` extension)
- Redis

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/blot.git
cd blot
```

### 2. Backend Configuration
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Configure your GEMINI_API_KEY and DATABASE_URL
```

### 3. Frontend Configuration
```bash
cd ../frontend
npm install
```

---

## 💻 Running Locally

### Start Infrastructure
Ensure PostgreSQL and Redis are running. You can use Docker for quick setup:
```bash
docker-compose up -d redis db
```

### Start Services
We recommend using the included `start_dev.sh` script or running manually:

**Terminal 1: Backend**
```bash
cd backend && uvicorn app.main:app --reload --port 8080
```

**Terminal 2: Worker**
```bash
cd backend && celery -A app.core.celery_app worker --loglevel=info -Q heavy,default
```

**Terminal 3: Frontend**
```bash
cd frontend && npm run dev
```

---

## 🧠 RAG & Agent Workflow
Blot's RAG pipeline is optimized for **Brand Authority**:
- **Chunking**: Recursive character splitting with context awareness.
- **Vectorization**: Strict 768-dimension enforcement using Gemini embeddings.
- **Retrieval**: Hybrid strategy (SERP + Internal) ensuring content is "Bionic"—half machine-efficient, half human-expert.

### Node Logic:
- `research_node`: Queries the Knowledge Vault using L2 distance.
- `optimization_node`: Parallel execution of SEO, Readability, and Compliance agents.

---

## 📂 Folder Structure
```text
blot/
├── backend/            # FastAPI Engine & Agent Registry
│   ├── app/
│   │   ├── agents/     # specialized Agent logic
│   │   ├── core/       # Security, DB, and GenAI clients
│   │   ├── models/     # SQLAlchemy & Vector models
│   │   └── modules/    # LangGraph Orchestrator
├── frontend/           # Bionic React Dashboard
├── documentation/      # Architectural specs & strategy
└── scripts/            # Database & Setup utilities
```

---

## 🛡 Security & Scalability
- **Multi-Tenancy**: Data is strictly isolated at the SQL level using `org_id`.
- **Key Rotation**: Built-in GenAI client supports rotating multiple API keys to bypass rate limits.
- **Observability**: Prometheus metrics and structured JSON logging are integrated for production monitoring.

---

## 🗺 Roadmap
- [ ] **Multi-Model Support**: Integration with Claude 3.5 and GPT-4o for agent specialized tasks.
- [ ] **Asset Analysis**: Video-to-Post generation via Gemini Multimodal.
- [ ] **Internal Linking Engine**: Automatic semantic linking between your organization's published posts.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Maintained by the Blot Team.**
