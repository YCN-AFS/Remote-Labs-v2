#!/bin/bash

# Remote Labs v2 - Production Stop Script
# This script stops both backend and frontend production processes

echo "🛑 Stopping Remote Labs v2 Production..."

# Read PIDs from files
if [ -f /tmp/remote-labs-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/remote-labs-backend.pid)
    echo "🔧 Stopping Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm /tmp/remote-labs-backend.pid
fi

if [ -f /tmp/remote-labs-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/remote-labs-frontend.pid)
    echo "🌐 Stopping Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm /tmp/remote-labs-frontend.pid
fi

# Kill any remaining processes
echo "🧹 Cleaning up any remaining processes..."
pkill -f "node index.js" 2>/dev/null
pkill -f "node .output/server/index.mjs" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "nuxt dev" 2>/dev/null

echo "✅ Remote Labs v2 Production stopped!"
