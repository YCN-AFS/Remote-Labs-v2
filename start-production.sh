#!/bin/bash

# Remote Labs v2 - Production Start Script
# This script starts both backend and frontend in production mode

echo "🚀 Starting Remote Labs v2 Production..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node index.js" 2>/dev/null
pkill -f "node .output/server/index.mjs" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "nuxt dev" 2>/dev/null

# Wait a moment
sleep 2

# Start Backend
echo "🔧 Starting Backend API (Port 8000)..."
cd /home/foxcode/Remote-Labs-v2/remote-lab-backend
node index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "🌐 Starting Frontend (Port 8080)..."
cd /home/foxcode/Remote-Labs-v2/remote-lab-landing
PORT=8080 HOST=0.0.0.0 node .output/server/index.mjs &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if services are running
echo "✅ Checking services..."

# Check Backend
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend API: http://localhost:8000/ (http://103.218.122.188:8000/)"
else
    echo "❌ Backend API failed to start"
fi

# Check Frontend
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✅ Frontend: http://localhost:8080/ (http://103.218.122.188:8080/)"
else
    echo "❌ Frontend failed to start"
fi

echo ""
echo "🎉 Remote Labs v2 is running in production mode!"
echo "📱 Frontend: http://103.218.122.188:8080/"
echo "🔧 Backend API: http://103.218.122.188:8000/"
echo ""
echo "To stop the services, run: ./stop-production.sh"
echo "Process IDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"

# Save PIDs for stop script
echo "$BACKEND_PID" > /tmp/remote-labs-backend.pid
echo "$FRONTEND_PID" > /tmp/remote-labs-frontend.pid
