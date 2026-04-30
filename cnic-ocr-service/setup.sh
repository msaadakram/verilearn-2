#!/bin/bash
# CNIC OCR Service Setup — installs YOLOv8 + PaddleOCR + EasyOCR (fallback)

set -e

cd "$(dirname "$0")"

echo "📦 Setting up CNIC OCR Microservice (YOLOv8 + PaddleOCR pipeline)..."

# Check Python version (need ≥ 3.8)
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "✓ Python $PYTHON_VERSION detected"

# Create virtual environment if needed
if [ ! -d "venv" ]; then
  echo "📁 Creating virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip / setuptools / wheel
echo "🔄 Upgrading pip..."
pip install --upgrade pip "setuptools<82" wheel

# Install dependencies
echo "📥 Installing dependencies..."
echo "   This may take 10–20 minutes on first run (PaddleOCR + ultralytics download models)"
pip install --no-cache-dir -r requirements.txt

# Create models directory for custom YOLO weights
mkdir -p models

echo ""
echo "✅ Setup complete!"
echo ""
echo "Pipeline: YOLOv8 (card detection) → PaddleOCR (text extraction)"
echo ""
echo "Optional: place a custom CNIC-trained YOLOv8 model at:"
echo "  $(pwd)/models/cnic_yolov8.pt"
echo "  (without it, yolov8n.pt is used and the full image is passed to OCR)"
echo ""
echo "Next steps:"
echo "  1. Development:  ./run.sh"
echo "  2. Production:   ./run.sh prod"
echo "  3. Health check: curl http://localhost:8001/health"
