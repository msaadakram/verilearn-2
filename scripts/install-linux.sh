#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
OCR_DIR="$ROOT_DIR/cnic-ocr-service"
LOG_DIR="$ROOT_DIR/.logs"
MONGO_DATA_DIR="$ROOT_DIR/.mongo-data"
MONGO_CONTAINER_NAME="verilearn-mongo"

DEFAULT_REMOTE_URL="git@github.com:msaadakram/verilearn-2.git"
DEFAULT_REPO_SLUG="msaadakram/verilearn-2"
DEFAULT_NODE_MAJOR="20"
DEFAULT_PYTHON_VERSION="3.11"
DEFAULT_MONGODB_URI="mongodb://127.0.0.1:27017"

NO_START=0
CREATE_REPO=0
FORCE_ENV=0
SKIP_MONGO=0
REMOTE_URL="$DEFAULT_REMOTE_URL"
REPO_SLUG="$DEFAULT_REPO_SLUG"
NODE_MAJOR="$DEFAULT_NODE_MAJOR"
PYTHON_VERSION="$DEFAULT_PYTHON_VERSION"
MONGODB_URI="$DEFAULT_MONGODB_URI"

info() { printf 'ℹ️  %s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
die() { printf '❌ %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: ./scripts/install-linux.sh [options]

Options:
  --no-start           Install everything but do not launch services
  --create-repo        Create/push GitHub repo with gh (if authenticated)
  --repo-url URL       Remote URL to add/set as origin (default: git@github.com:msaadakram/verilearn-2.git)
  --repo-slug SLUG     GitHub repo slug used with --create-repo (default: msaadakram/verilearn-2)
  --force              Overwrite generated .env files
  --node-major N       Required Node.js major version (default: 20)
  --python-version X.Y Python version to install via apt when needed (default: 3.11)
  --mongo-uri URI      MongoDB connection string to write into backend/.env
  --skip-mongo         Do not try to start a local MongoDB runtime
  -h, --help           Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-start) NO_START=1 ;;
    --create-repo) CREATE_REPO=1 ;;
    --repo-url)
      REMOTE_URL="${2:-}"
      shift
      ;;
    --repo-slug)
      REPO_SLUG="${2:-}"
      shift
      ;;
    --force) FORCE_ENV=1 ;;
    --node-major)
      NODE_MAJOR="${2:-}"
      shift
      ;;
    --python-version)
      PYTHON_VERSION="${2:-}"
      shift
      ;;
    --mongo-uri)
      MONGODB_URI="${2:-}"
      shift
      ;;
    --skip-mongo) SKIP_MONGO=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
  shift
done

if [[ "$(uname -s)" != "Linux" ]]; then
  die "This installer is for Linux only. Use scripts/install-macos.sh on macOS."
fi

mkdir -p "$LOG_DIR"

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

run_as_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif have_cmd sudo; then
    sudo "$@"
  else
    die "Root privileges are required to run: $*"
  fi
}

apt_install_if_missing() {
  local package="$1"
  if dpkg -s "$package" >/dev/null 2>&1; then
    info "$package already installed"
    return 0
  fi

  info "Installing $package via apt..."
  run_as_root apt-get install -y "$package"
}

install_base_packages() {
  if ! have_cmd apt-get; then
    warn "apt-get not available; skipping OS package installation"
    return 0
  fi

  info "Refreshing apt package lists..."
  run_as_root apt-get update

  local packages=(
    ca-certificates
    curl
    git
    jq
    build-essential
    python3
    python3-venv
    python3-pip
    python3-dev
    openssl
    netcat-openbsd
  )

  for package in "${packages[@]}"; do
    apt_install_if_missing "$package"
  done
}

ensure_node() {
  if have_cmd node; then
    local major
    major="$(node -p 'process.versions.node.split(".")[0]')"
    if [[ "$major" -ge "$NODE_MAJOR" ]]; then
      info "Node.js $major detected"
      return 0
    fi

    warn "Node.js $major detected, but $NODE_MAJOR+ is recommended. Upgrading via NodeSource..."
  else
    info "Node.js not found, installing from NodeSource..."
  fi

  if ! have_cmd apt-get; then
    die "Node.js is missing and apt-get is unavailable. Install Node.js $NODE_MAJOR+ manually and rerun."
  fi

  run_as_root bash -lc "curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -"
  run_as_root apt-get install -y nodejs
}

ensure_python() {
  if have_cmd python3; then
    local current
  current="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"

    local is_sufficient
    is_sufficient="$(python3 - "$current" "$PYTHON_VERSION" <<'PY'
import sys

current = tuple(int(part) for part in sys.argv[1].split('.')[:2])
required = tuple(int(part) for part in sys.argv[2].split('.')[:2])
print(int(current >= required))
PY
)"

    if [[ "$is_sufficient" == "1" ]]; then
      info "Python $current detected"
      return 0
    fi

    warn "Python $current detected, but $PYTHON_VERSION+ is recommended."
  fi

  info "Installing Python tools via apt..."
  apt_install_if_missing python3
  apt_install_if_missing python3-venv
  apt_install_if_missing python3-pip
}

ensure_jq_git() {
  apt_install_if_missing git
  apt_install_if_missing curl
  apt_install_if_missing jq
}

port_open() {
  local host="$1"
  local port="$2"

  if have_cmd nc; then
    nc -z "$host" "$port" >/dev/null 2>&1
    return $?
  fi

  python3 - "$host" "$port" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
s = socket.socket()
s.settimeout(1)
try:
    s.connect((host, port))
except OSError:
    raise SystemExit(1)
finally:
    s.close()
PY
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  local max_wait="${4:-120}"
  local waited=0

  while [[ "$waited" -lt "$max_wait" ]]; do
    if port_open "$host" "$port"; then
      info "$label is accepting connections on ${host}:${port}"
      return 0
    fi

    sleep 2
    waited=$((waited + 2))
  done

  return 1
}

ensure_mongodb() {
  if [[ "$SKIP_MONGO" -eq 1 ]]; then
    warn "Skipping MongoDB startup; make sure backend/.env points at a running database"
    return 0
  fi

  if port_open 127.0.0.1 27017; then
    info "MongoDB is already reachable on localhost:27017"
    return 0
  fi

  mkdir -p "$MONGO_DATA_DIR"

  if have_cmd mongod; then
    info "Starting local mongod daemon..."
    local log_file="$LOG_DIR/mongod.log"
    if ! pgrep -x mongod >/dev/null 2>&1; then
      mongod \
        --dbpath "$MONGO_DATA_DIR" \
        --bind_ip 127.0.0.1 \
        --port 27017 \
        --logpath "$log_file" \
        --fork >/dev/null 2>&1 || die "mongod failed to start; see $log_file"
    fi

    wait_for_port 127.0.0.1 27017 "MongoDB" 60 || die "MongoDB did not become ready on localhost:27017"
    return 0
  fi

  if have_cmd docker; then
    if ! docker info >/dev/null 2>&1; then
      warn "Docker CLI is available but the daemon is not responding"
    else
      info "Starting MongoDB in Docker..."
      if docker ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER_NAME"; then
        docker start "$MONGO_CONTAINER_NAME" >/dev/null
      else
        docker run -d \
          --name "$MONGO_CONTAINER_NAME" \
          -p 27017:27017 \
          -v "$MONGO_DATA_DIR:/data/db" \
          --restart unless-stopped \
          mongo:7 \
          --bind_ip_all >/dev/null
      fi

      wait_for_port 127.0.0.1 27017 "MongoDB" 90 || die "MongoDB container did not become ready on localhost:27017"
      return 0
    fi
  fi

  die "No local MongoDB runtime found. Install mongod or Docker, or rerun with --mongo-uri to target a remote database."
}

ensure_env_file() {
  local example="$1"
  local target="$2"
  local label="$3"

  if [[ -f "$target" && "$FORCE_ENV" -ne 1 ]]; then
    info "$label already exists; leaving it untouched"
    return 0
  fi

  cp "$example" "$target"

  if [[ "$label" == "backend/.env" ]]; then
    local jwt_secret
    if have_cmd openssl; then
      jwt_secret="$(openssl rand -hex 32)"
    else
      jwt_secret="$(python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
)"
    fi

    python3 - "$target" "$jwt_secret" "$MONGODB_URI" <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1])
secret = sys.argv[2]
mongo_uri = sys.argv[3]
lines = target.read_text().splitlines()
updated = []
replaced_secret = False
replaced_mongo = False

for line in lines:
    if line.startswith('JWT_SECRET='):
        updated.append(f'JWT_SECRET={secret}')
        replaced_secret = True
    elif line.startswith('MONGODB_URI='):
        updated.append(f'MONGODB_URI={mongo_uri}')
        replaced_mongo = True
    else:
        updated.append(line)

if not replaced_secret:
    updated.append(f'JWT_SECRET={secret}')

if not replaced_mongo:
    updated.append(f'MONGODB_URI={mongo_uri}')

target.write_text('\n'.join(updated) + '\n')
PY

    info "Generated a fresh backend JWT secret"
    warn "Review backend/.env for API keys (GEMINI_API_KEY, SUPABASE_*, MAILERSEND_*) before sharing or deploying."
  fi
}

install_node_deps() {
  local dir="$1"
  local label="$2"
  local npm_flags=(--no-audit --no-fund)

  if [[ "$label" == "frontend" ]]; then
    npm_flags+=(--legacy-peer-deps)
  fi

  if [[ -f "$dir/package-lock.json" ]]; then
    info "Installing $label dependencies with npm ci..."
    if ! (cd "$dir" && npm ci "${npm_flags[@]}"); then
      warn "npm ci failed for $label; retrying with npm install..."
      (cd "$dir" && npm install "${npm_flags[@]}")
    fi
  else
    info "Installing $label dependencies with npm install..."
    (cd "$dir" && npm install "${npm_flags[@]}")
  fi
}

ensure_git_repo() {
  if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    info "Git repository already initialized"
  else
    info "Initializing git repository with main branch..."
    git -C "$ROOT_DIR" init -b main
  fi

  if ! git -C "$ROOT_DIR" config user.name >/dev/null 2>&1; then
    git -C "$ROOT_DIR" config user.name "Verilearn Installer"
  fi

  if ! git -C "$ROOT_DIR" config user.email >/dev/null 2>&1; then
    git -C "$ROOT_DIR" config user.email "verilearn@localhost"
  fi

  git -C "$ROOT_DIR" branch -M main >/dev/null 2>&1 || true

  if ! git -C "$ROOT_DIR" add -A -- . ':!.mongo-data' ':!.logs'; then
    warn "Git staging failed for generated runtime data; continuing without a bootstrap commit."
    return 0
  fi

  if ! git -C "$ROOT_DIR" diff --cached --quiet; then
    if ! git -C "$ROOT_DIR" rev-parse --verify HEAD >/dev/null 2>&1; then
      info "Creating initial commit..."
      if ! git -C "$ROOT_DIR" commit -m "chore: bootstrap Verilearn"; then
        warn "Git commit failed; continuing with the installed stack."
        return 0
      fi
    fi
  fi

  if git -C "$ROOT_DIR" remote get-url origin >/dev/null 2>&1; then
    info "Updating origin remote"
    git -C "$ROOT_DIR" remote set-url origin "$REMOTE_URL"
  else
    info "Adding origin remote"
    git -C "$ROOT_DIR" remote add origin "$REMOTE_URL"
  fi
}

push_repo() {
  if [[ "$CREATE_REPO" -eq 1 ]]; then
    if have_cmd gh && gh auth status >/dev/null 2>&1; then
      info "Creating/publishing GitHub repository with gh..."
      gh repo create "$REPO_SLUG" --source "$ROOT_DIR" --remote origin --push --private --confirm
      return 0
    fi

    warn "gh is missing or not authenticated, so the script will fall back to plain git push."
  fi

  info "Pushing current branch to origin..."
  git -C "$ROOT_DIR" push -u origin main
}

install_base_packages
ensure_jq_git
ensure_node
ensure_python
ensure_mongodb

ensure_env_file "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env" "backend/.env"
ensure_env_file "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env" "frontend/.env"

info "Installing Python OCR dependencies..."
(cd "$OCR_DIR" && ./setup.sh)

install_node_deps "$BACKEND_DIR" "backend"
install_node_deps "$FRONTEND_DIR" "frontend"

ensure_git_repo

if [[ "$CREATE_REPO" -eq 1 || "$NO_START" -eq 0 ]]; then
  push_repo || warn "Git push did not succeed; please review the remote and authentication settings."
fi

if [[ "$NO_START" -eq 1 ]]; then
  info "Setup complete. Start the stack later with: ./run-all.sh"
  exit 0
fi

info "Starting the full stack..."
exec "$ROOT_DIR/run-all.sh"
