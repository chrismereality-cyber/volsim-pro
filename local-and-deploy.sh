#!/bin/bash

<<<<<<< HEAD
# 1️⃣ Start local dashboard + engine
echo "🟢 Starting local VOLSIM PRO..."
node web-dashboard.js &
LOCAL_PID=$!
sleep 3

# 2️⃣ Open dashboard in browser
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:10000
elif command -v open >/dev/null 2>&1; then
  open http://localhost:10000
else
  echo "🌐 Dashboard URL: http://localhost:10000"
fi

# 3️⃣ Ping API to verify engine
echo "🔍 Checking engine status..."
curl -s http://localhost:10000/api/data

# 4️⃣ Tail logs
echo "📜 Tailing primary.log..."
touch primary.log
tail -f primary.log &

# 5️⃣ Git add, commit, push
git add .
COMMIT_MSG=${1:-"Automated engine + dashboard update"}
git commit -m "$COMMIT_MSG" || echo "Nothing to commit"
git push origin main

echo "✅ Deployment pushed. Render will auto-deploy."
echo "💡 Local server PID: $LOCAL_PID, Log tailing PID: $!"
=======
# VOLSIM PRO Local Update & Start Script

PORT=10000
GIT_REMOTE="origin"
BRANCH="main"

echo "🚀 Stopping any running dashboard on port $PORT..."

# Find PID on port
PID=$(sudo lsof -ti tcp:$PORT)
if [ ! -z "$PID" ]; then
    echo "Found process $PID using port $PORT, killing..."
    sudo kill -9 $PID
else
    echo "No process found on port $PORT."
fi

echo "📥 Pulling latest changes from GitHub..."
git fetch $GIT_REMOTE
git reset --hard $GIT_REMOTE/$BRANCH

echo "📦 Installing dependencies..."
npm install

echo "▶️ Starting VOLSIM PRO on port $PORT..."
PORT=$PORT node web-dashboard.js &

echo "✅ VOLSIM PRO should be running!"
echo "Check logs with: tail -f primary.log"
echo "Access API locally: http://localhost:$PORT/api/data"
>>>>>>> 63c02ebdf9a72c0ded7b4048af9a6ccd6cb9a8e0
