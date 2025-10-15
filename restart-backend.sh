#!/bin/bash

echo "🔄 Restarting Remote Labs Backend..."

# Kill existing processes
echo "🧹 Stopping existing processes..."
pkill -f "node index.js" 2>/dev/null
sleep 2

# Check if port 8000 is still in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Port 8000 still in use, force killing..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start backend
echo "🚀 Starting backend..."
cd /home/foxcode/Remote-Labs-v2/remote-lab-backend
node index.js &

# Wait for startup
sleep 3

# Test connection
echo "🧪 Testing connection..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend started successfully!"
    echo "🌐 Backend API: http://103.218.122.188:8000/"
else
    echo "❌ Backend failed to start"
    exit 1
fi
