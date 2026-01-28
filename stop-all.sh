#!/bin/bash

# Stop all services (Frontend, Backend, PostgreSQL)

echo "Stopping all services..."
echo ""

# Color codes for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        rm frontend.pid
        echo -e "${GREEN}Frontend stopped${NC}"
    else
        echo -e "${YELLOW}WARNING: Frontend process not found${NC}"
        rm frontend.pid
    fi
else
    # Try to find and kill frontend process
    FRONTEND_PID=$(lsof -ti:5173 2>/dev/null || lsof -ti:3000 2>/dev/null)
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        echo -e "${GREEN}Frontend stopped${NC}"
    fi
fi

# Stop backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        rm backend.pid
        echo -e "${GREEN}Backend stopped${NC}"
    else
        echo -e "${YELLOW}WARNING: Backend process not found${NC}"
        rm backend.pid
    fi
else
    # Try to find and kill backend process
    BACKEND_PID=$(lsof -ti:8080 2>/dev/null)
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}Backend stopped${NC}"
    fi
fi

# Stop PostgreSQL
echo -e "${YELLOW}Stopping PostgreSQL...${NC}"
cd backend
docker-compose down
cd ..
echo -e "${GREEN}PostgreSQL stopped${NC}"

echo ""
echo -e "${GREEN}All services stopped!${NC}"
