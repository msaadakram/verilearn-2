#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OCR_DIR="$ROOT_DIR/cnic-ocr-service"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$LOG_DIR"

OCR_PID=""
BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required command: $1"
    exit 1
  fi
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local max_attempts="${3:-60}"

  for ((i=1; i<=max_attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "✅ $label is ready"
      return 0
    fi

    sleep 2
  done

  echo "❌ $label failed to become ready at: $url"
  return 1
}

cleanup() {
  if [[ "$CLEANED_UP" -eq 1 ]]; then
    return
  fi

  CLEANED_UP=1
  local code=$?

  if [[ -n "$FRONTEND_PID" ]]; then
    kill -- "-$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$BACKEND_PID" ]]; then
    kill -- "-$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$OCR_PID" ]]; then
    kill -- "-$OCR_PID" >/dev/null 2>&1 || true
  fi

  if [[ $code -ne 0 ]]; then
    echo ""
    echo "Recent logs:"
    echo "- OCR:      $LOG_DIR/ocr.log"
    echo "- Backend:  $LOG_DIR/backend.log"
    echo "- Frontend: $LOG_DIR/frontend.log"
  fi

  exit "$code"
}

trap cleanup EXIT INT TERM

require_cmd curl
require_cmd npm
require_cmd python3

echo "🔎 Checking OCR Python environment..."
if [[ ! -d "$OCR_DIR/venv" ]]; then
  echo "⚙️ OCR virtualenv not found. Running setup..."
  (cd "$OCR_DIR" && ./setup.sh)
fi

if ! (cd "$OCR_DIR" && source venv/bin/activate && python -c 'import paddleocr' > /dev/null 2>&1); then
  echo "⚙️ paddleocr is missing in OCR virtualenv. Running setup..."
  (cd "$OCR_DIR" && ./setup.sh)
fi

echo "🚀 Starting CNIC OCR service on :8001..."
setsid bash -lc "cd \"$OCR_DIR\" && ./run.sh" >"$LOG_DIR/ocr.log" 2>&1 &
OCR_PID=$!

# Poll until ocr_ready:true (not just HTTP 200 — model init takes time on first run)
echo "⏳ Waiting for OCR model to initialise (first run may take up to 5 min)..."
OCR_WAIT=0
OCR_MAX=300
OCR_READY=0
while [[ $OCR_WAIT -lt $OCR_MAX ]]; do
  sleep 3
  OCR_WAIT=$((OCR_WAIT + 3))
  HEALTH=$(curl -fsS http://127.0.0.1:8001/health 2>/dev/null || true)
  if echo "$HEALTH" | grep -q '"ocr_ready": *true'; then
    OCR_READY=1
    break
  fi
done

if [[ $OCR_READY -eq 0 ]]; then
  echo "❌ CNIC OCR service failed to become ready after ${OCR_MAX}s"
  tail -n 60 "$LOG_DIR/ocr.log" || true
  exit 1
fi

echo "🔎 Checking backend dependencies..."
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo "⚙️ Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

echo "🚀 Starting backend on :5000..."
setsid bash -lc "cd \"$BACKEND_DIR\" && npm run dev" >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

wait_for_http "http://127.0.0.1:5000/api/health" "Backend API" 60 || {
  tail -n 80 "$LOG_DIR/backend.log" || true
  exit 1
}

echo "🔎 Checking frontend dependencies..."
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "⚙️ Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "🚀 Starting frontend on :3000..."
setsid bash -lc "cd \"$FRONTEND_DIR\" && npm run dev" >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

wait_for_http "http://127.0.0.1:3000" "Frontend" 90 || {
  tail -n 80 "$LOG_DIR/frontend.log" || true
  exit 1
}

echo ""
echo "✅ Verilearn stack is running"
echo "- Frontend:  http://localhost:3000"
echo "- Backend:   http://localhost:5000/api/health"
echo "- OCR:       http://localhost:8001/health"
echo "- Call API:  http://localhost:5000/api/call/token  (requires Bearer JWT)"
echo ""
echo "Logs:"
echo "- $LOG_DIR/ocr.log"
echo "- $LOG_DIR/backend.log"
echo "- $LOG_DIR/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services."

wait
