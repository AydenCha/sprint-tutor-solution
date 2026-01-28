#!/bin/bash

# Start all services (PostgreSQL, Backend, Frontend)

echo "Starting all services..."
echo ""

# Color codes for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start PostgreSQL and MailHog
echo -e "${YELLOW}Starting PostgreSQL and MailHog...${NC}"
cd backend
docker-compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}PostgreSQL and MailHog started${NC}"
    echo -e "${YELLOW}MailHog Web UI: http://localhost:8025${NC}"
else
    echo -e "${RED}Failed to start services${NC}"
    exit 1
fi
cd ..

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 3

# Check if backend is already running and stop it if needed
BACKEND_PID=""
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Backend is already running (PID: $BACKEND_PID). Stopping...${NC}"
        kill $BACKEND_PID
        rm backend.pid
    else
        echo -e "${YELLOW}Backend PID file found but process not running. Cleaning up...${NC}"
        rm backend.pid
    fi
fi

# Also check by port - kill all processes on port 8080
PORT_PIDS=$(lsof -ti:8080 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
    for PORT_PID in $PORT_PIDS; do
        if [ -z "$BACKEND_PID" ] || [ "$PORT_PID" != "$BACKEND_PID" ]; then
            echo -e "${YELLOW}Backend process found on port 8080 (PID: $PORT_PID). Stopping...${NC}"
            kill $PORT_PID 2>/dev/null || true
        fi
    done
fi

# Wait for backend to fully stop
if [ ! -z "$BACKEND_PID" ] || [ ! -z "$PORT_PIDS" ]; then
    echo -e "${YELLOW}Waiting for backend to stop...${NC}"
    MAX_WAIT=30
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if ! lsof -ti:8080 > /dev/null 2>&1; then
            echo -e "${GREEN}Backend stopped${NC}"
            break
        fi
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
    done
    
    # Force kill if still running
    REMAINING_PIDS=$(lsof -ti:8080 2>/dev/null)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${YELLOW}Force killing remaining processes on port 8080...${NC}"
        for PID in $REMAINING_PIDS; do
            kill -9 $PID 2>/dev/null || true
        done
        sleep 2
    fi
    
    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo -e "${RED}WARNING: Backend did not stop within $MAX_WAIT seconds. Force killed.${NC}"
    fi
fi

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
echo -e "${YELLOW}(This will run in the background)${NC}"
cd backend
# Set Java 17 for Maven
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
nohup mvn spring-boot:run -DskipTests > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}Logs: tail -f backend.log${NC}"

# Wait for backend to be ready and verify it's running
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
MAX_WAIT=60
WAIT_COUNT=0
BACKEND_READY=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    # Try both /actuator/health and /api/actuator/health
    if curl -s http://localhost:8080/api/actuator/health > /dev/null 2>&1 || \
       curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ "$BACKEND_READY" = true ]; then
    echo -e "${GREEN}✓ Backend is ready and running!${NC}"
else
    echo -e "${RED}WARNING: Backend may not be fully ready yet. Check logs: tail -f backend.log${NC}"
fi

# Check if frontend is already running
if lsof -ti:5173 > /dev/null 2>&1 || lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: Frontend is already running${NC}"
else
    echo -e "${YELLOW}Starting frontend...${NC}"
    echo -e "${YELLOW}(This will run in the background)${NC}"
    cd frontend
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
    echo -e "${YELLOW}Logs: tail -f frontend.log${NC}"
fi

echo ""
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Service URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080/api"
echo "   Health:   http://localhost:8080/actuator/health"
echo "   MailHog:  http://localhost:8025 (이메일 확인용)"
echo ""
echo "Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "To stop all services:"
echo "   ./stop-all.sh"
