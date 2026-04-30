# Verilearn CNIC OCR Integration

This workspace contains three services wired together for CNIC verification:

- `frontend` (Next.js + React Router)
- `backend` (Node.js/Express API)
- `cnic-ocr-service` (Flask + EasyOCR microservice)

## Architecture

1. Frontend uploads CNIC image to backend endpoint: `POST /api/auth/cnic/verify`
2. Backend validates auth + file and forwards image to OCR service: `POST /ocr`
3. OCR service extracts CNIC/DOB/text and returns structured response
4. Backend returns OCR response to frontend for CNIC match validation

## Runtime Dependencies

### OCR service (`cnic-ocr-service/requirements.txt`)
- `Flask`
- `gunicorn`
- `numpy`
- `opencv-python-headless`
- `easyocr`
- `python-dotenv`
- `Pillow`

### Backend (`backend/package.json`)
- `express`, `multer`, `axios`, `form-data`
- auth/security stack (`jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`)
- database (`mongoose`)

### Frontend (`frontend/package.json`)
- `next`, `react`, `react-router`
- CNIC upload form uses the backend base URL from `NEXT_PUBLIC_API_BASE_URL`

## Environment Setup

### Backend `.env`
Use `backend/.env.example` as reference:

- `PORT=5000`
- `CLIENT_ORIGIN=http://localhost:3000`
- `MONGODB_URI=mongodb://127.0.0.1:27017`
- `JWT_SECRET=...`
- `CNIC_OCR_SERVICE_URL=http://127.0.0.1:8001/ocr`
- `CNIC_OCR_TIMEOUT_MS=15000`

### Frontend `.env`
Use `frontend/.env.example`:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`

## Run All Services (Recommended)

From repo root:

```bash
./run-all.sh
```

This script:
- checks/install OCR dependencies if missing
- starts OCR (`:8001`), backend (`:5000`), frontend (`:3000`)
- waits for health checks
- writes logs to `.logs/`

## macOS one-shot setup

If you are on macOS and want the machine to bootstrap itself from scratch, use:

```bash
chmod +x scripts/install-macos.sh
./scripts/install-macos.sh
```

That installer:

- installs Homebrew packages and local MongoDB
- creates missing `.env` files from the examples
- installs backend, frontend, and OCR dependencies
- optionally creates/pushes a GitHub repo
- launches the full stack at the end

If you only want the services to start after everything is installed, keep using:

```bash
./run-all.sh
```

## Manual Run

### 1) OCR service
```bash
cd cnic-ocr-service
./setup.sh
./run.sh
```

### 2) Backend
```bash
cd backend
npm install
npm run dev
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

## Health Checks

- OCR: `http://localhost:8001/health`
- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3000`

## Notes

- OCR model files download on first run; this is expected.
- The OCR service now starts non-blocking and reports initialization status in `/health`.
- CNIC matching is normalized to canonical format (`XXXXX-XXXXXXX-X`) for better OCR tolerance.
