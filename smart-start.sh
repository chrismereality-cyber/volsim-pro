#!/bin/bash

API_DIR="$HOME/volsim-api"
cd "$API_DIR" || exit 1

# Function to start the API
start_api() {
  # Kill any existing Volsim API Node processes
  PIDS=$(pgrep -f "node $API_DIR/index.js")
  if [ -n "$PIDS" ]; then
    echo "Killing existing Volsim API process(es): $PIDS"
    kill -9 $PIDS
    sleep 1
  fi

  # Check port and free if busy
  PORT=$(grep PORT "$API_DIR/.env" 2>/dev/null | cut -d'=' -f2)
  PORT=${PORT:-8080}

  while lsof -i :$PORT >/dev/null 2>&1; do
    PORT_PID=$(lsof -ti :$PORT)
    echo "Port $PORT busy (PID $PORT_PID), killing process..."
    kill -9 $PORT_PID
    sleep 1
  done

  echo "Starting Volsim API on port $PORT..."
  nohup node index.js > "$API_DIR/api.log" 2>&1 &
  echo $! > "$API_DIR/api.pid"
  echo "Volsim API started with PID $(cat $API_DIR/api.pid)"
}

# Trap Ctrl+C to restart API
trap "echo 'Ctrl+C detected, restarting Volsim API...'; start_api" SIGINT

# Start the API for the first time
start_api

# Watch API and auto-restart if it crashes
while true; do
  PID=$(cat "$API_DIR/api.pid" 2>/dev/null)
  if [ -z "$PID" ] || ! kill -0 $PID 2>/dev/null; then
    echo "Volsim API crashed or stopped. Restarting..."
    start_api
  fi
  sleep 5
done
