#!/bin/bash
set -e

# Blot.ai Full-Stack Service Orchestrator
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Ensure directories for logs and pids exist
mkdir -p .pids logs

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}        🚀 Starting Blot.ai Enterprise Stack        ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Start Docker Infrastructure (Postgres with pgvector & Redis)
echo -e "${BLUE}[1/5] Starting Database (pgvector) & Redis containers...${NC}"
docker compose up -d postgres redis

# Wait for Postgres readiness
echo -e "${YELLOW}      Waiting for PostgreSQL to be ready...${NC}"
until docker exec blot-postgres-1 pg_isready -U postgres -d blot > /dev/null 2>&1; do
    sleep 1
done

# Ensure pgvector extension is activated
docker exec blot-postgres-1 psql -U postgres -d blot -c "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null 2>&1 || true
echo -e "${GREEN}      Database & Redis ready.${NC}"

# 2. Check virtual environment
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}Error: backend/venv not found. Please set up the backend virtualenv first.${NC}"
    exit 1
fi

# 3. Start Backend API
echo -e "${BLUE}[2/5] Starting FastAPI Backend Gateway (Port 8080)...${NC}"
(
    cd backend
    source venv/bin/activate
    export PYTHONPATH="$(pwd):$PYTHONPATH"
    uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload > ../logs/backend.log 2>&1 &
    echo $! > ../.pids/api.pid
)
echo -e "${GREEN}      Backend API running (PID: $(cat .pids/api.pid)).${NC}"

# 4. Start Celery Worker (heavy, default, publishing queues)
echo -e "${BLUE}[3/5] Starting Celery Agent & Publishing Worker...${NC}"
(
    cd backend
    source venv/bin/activate
    export PYTHONPATH="$(pwd):$PYTHONPATH"
    celery -A app.core.celery_app worker --loglevel=info -Q heavy,default,publishing -c 4 > ../logs/celery.log 2>&1 &
    echo $! > ../.pids/celery.pid
)
echo -e "${GREEN}      Celery Worker running (PID: $(cat .pids/celery.pid)).${NC}"

# 5. Start Frontend
echo -e "${BLUE}[4/5] Starting React / Vite Frontend (Port 5173)...${NC}"
(
    cd frontend
    npm run dev -- --port 5173 > ../logs/frontend.log 2>&1 &
    echo $! > ../.pids/frontend.pid
)
echo -e "${GREEN}      Frontend running (PID: $(cat .pids/frontend.pid)).${NC}"

echo -e ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✨ All Blot.ai Services Started Successfully!      ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "  🌐 Frontend App:     http://localhost:5173"
echo -e "  📖 API Swagger Docs: http://localhost:8080/docs"
echo -e "  🐘 PostgreSQL:       localhost:5433 (blot / pgvector)"
echo -e "  ⚡ Redis Broker:     localhost:6379"
echo -e "  📋 Logs Directory:   $PROJECT_ROOT/logs/"
echo -e ""
echo -e "  Run ${YELLOW}./stop.sh${NC} anytime to stop all services cleanly."
echo -e "${GREEN}====================================================${NC}"
