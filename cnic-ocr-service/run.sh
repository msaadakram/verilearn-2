#!/bin/bash
# CNIC OCR Service Launcher

set -e

cd "$(dirname "$0")"

# Activate virtual environment
if [ ! -d "venv" ]; then
  echo "❌ Virtual environment not found. Run setup.sh first."
  exit 1
fi

source venv/bin/activate

# Show startup info
echo "🚀 Starting CNIC OCR Microservice..."
echo "   Host: ${CNIC_OCR_HOST:-0.0.0.0}"
echo "   Port: ${CNIC_OCR_PORT:-8001}"
echo "   Health: http://localhost:${CNIC_OCR_PORT:-8001}/health"
echo ""

# For development: python app.py
# For production: gunicorn -w 4 -b 0.0.0.0:8001 app:app

if [ "$1" = "prod" ]; then
  echo "📦 Running in production mode (gunicorn)..."
  gunicorn -w 4 -b 0.0.0.0:${CNIC_OCR_PORT:-8001} app:app
else
  echo "🔧 Running in development mode (Flask)..."
  python3 app.py
fi
