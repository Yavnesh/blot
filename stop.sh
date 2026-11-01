#!/bin/bash

# Blot.ai Service Teardown Orchestrator
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}====================================================${NC}"
echo -e "${YELLOW}        🛑 Stopping Blot.ai Enterprise Stack        ${NC}"
echo -e "${YELLOW}====================================================${NC}"

# Function to stop process by PID file
stop_process() {
    local name=$1
    local pid_file=".pids/$2"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            echo -e "${GREEN}✓ $name stopped.${NC}"
        else
            echo -e "${BLUE}ℹ $name was not running.${NC}"
        fi
        rm -f "$pid_file"
    fi
}

# 1. Stop Frontend
stop_process "Frontend (Vite)" "frontend.pid"

# 2. Stop Celery Worker
stop_process "Celery Worker" "celery.pid"

# 3. Stop Backend API
stop_process "FastAPI Backend" "api.pid"

# Clean up any orphaned uvicorn or celery processes matching blot
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "celery -A app.core.celery_app" 2>/dev/null || true

# 4. Stop Docker Infrastructure
echo -e "${YELLOW}Stopping Docker Infrastructure (Postgres & Redis)...${NC}"
docker compose stop postgres redis > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Docker containers stopped.${NC}"

# Clean up PID directory
rm -rf .pids

echo -e ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ All Blot.ai Services Stopped Cleanly!           ${NC}"
echo -e "${GREEN}====================================================${NC}"
