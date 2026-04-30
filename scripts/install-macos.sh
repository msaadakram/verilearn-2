#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
OCR_DIR="$ROOT_DIR/cnic-ocr-service"
LOG_DIR="$ROOT_DIR/.logs"

DEFAULT_REMOTE_URL="git@github.com:msaadakram/verilearn-2.git"
DEFAULT_REPO_SLUG="msaadakram/verilearn-2"
DEFAULT_NODE_MAJOR="20"
DEFAULT_PYTHON_VERSION="3.11"
DEFAULT_MONGODB_FORMULA="mongodb-community@7.0"

NO_START=0
CREATE_REPO=0
FORCE_ENV=0
REMOTE_URL="$DEFAULT_REMOTE_URL"
REPO_SLUG="$DEFAULT_REPO_SLUG"
NODE_MAJOR="$DEFAULT_NODE_MAJOR"
PYTHON_VERSION="$DEFAULT_PYTHON_VERSION"
MONGODB_FORMULA="$DEFAULT_MONGODB_FORMULA"

info() { printf 'ℹ️  %s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
die() { printf '❌ %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: ./scripts/install-macos.sh [options]

Options:
  --no-start           Install everything but do not launch services
  --create-repo        Create/push GitHub repo with gh (if authenticated)
  --repo-url URL       Remote URL to add/set as origin (default: git@github.com:msaadakram/verilearn-2.git)
  --repo-slug SLUG     GitHub repo slug used with --create-repo (default: msaadakram/verilearn-2)
  --force              Overwrite generated .env files
  --node-major N       Required Node.js major version (default: 20)
  --python-version X.Y  Python version to install via Homebrew when needed (default: 3.11)
  --mongodb-formula F   MongoDB Homebrew formula (default: mongodb-community@7.0)
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
    --mongodb-formula)
      MONGODB_FORMULA="${2:-}"
      shift
      ;;
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

if [[ "$(uname -s)" != "Darwin" ]]; then
  die "This installer is for macOS only. Use run-all.sh on Linux or ask for a Linux installer next."
fi

mkdir -p "$LOG_DIR"

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

ensure_brew() {
  if have_cmd brew; then
    return 0
  fi

  info "Homebrew not found, installing it now..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$('/opt/homebrew/bin/brew' shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$('/usr/local/bin/brew' shellenv)"
  else
    die "Homebrew installed but brew command is still unavailable. Open a new shell and rerun the script."
  fi
}

brew_shellenv() {
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$('/opt/homebrew/bin/brew' shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$('/usr/local/bin/brew' shellenv)"
  fi
}

brew_install_if_missing() {
  local formula="$1"
  if brew list --formula --versions "$formula" >/dev/null 2>&1; then
    info "$formula already installed"
    return 0
  fi

  info "Installing $formula via Homebrew..."
  brew install "$formula"
}

ensure_node() {
  if have_cmd node; then
    local major
    major="$(node -p 'process.versions.node.split(".")[0]')"
    if [[ "$major" -ge "$NODE_MAJOR" ]]; then
      info "Node.js $major detected"
      return 0
    fi
    warn "Node.js $major detected, but $NODE_MAJOR+ is recommended. Upgrading via Homebrew..."
  else
    info "Node.js not found, installing via Homebrew..."
  fi

  brew_install_if_missing node
}

ensure_python() {
  if have_cmd python3; then
    local current
    current="$(python3 - <<'PY'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
PY
)"
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
  fi

  info "Installing Python $PYTHON_VERSION via Homebrew..."
  brew_install_if_missing "python@${PYTHON_VERSION}"
}

ensure_jq_git() {
  brew_install_if_missing git
  brew_install_if_missing curl
  brew_install_if_missing jq
}

ensure_mongodb() {
  info "Installing MongoDB locally..."
  brew tap mongodb/brew >/dev/null 2>&1 || true
  brew_install_if_missing "$MONGODB_FORMULA"

  info "Starting MongoDB as a macOS background service..."
  brew services start "$MONGODB_FORMULA" >/dev/null 2>&1 || true

  local waited=0
  local max_wait=120
  while [[ "$waited" -lt "$max_wait" ]]; do
    if have_cmd nc; then
      if nc -z 127.0.0.1 27017 >/dev/null 2>&1; then
        info "MongoDB is accepting connections on localhost:27017"
        return 0
      fi
    else
      if python3 - <<'PY' >/dev/null 2>&1
import socket
s = socket.socket()
s.settimeout(1)
try:
    s.connect(("127.0.0.1", 27017))
except OSError:
    raise SystemExit(1)
finally:
    s.close()
PY
      then
        info "MongoDB is accepting connections on localhost:27017"
        return 0
      fi
    fi

    sleep 2
    waited=$((waited + 2))
  done

  warn "MongoDB service started but localhost:27017 did not respond within ${max_wait}s."
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
      jwt_secret="$(uuidgen | tr -d '-')$(uuidgen | tr -d '-')"
    fi

    python3 - "$target" "$jwt_secret" <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1])
secret = sys.argv[2]
lines = target.read_text().splitlines()
updated = []
replaced = False

for line in lines:
    if line.startswith('JWT_SECRET='):
        updated.append(f'JWT_SECRET={secret}')
        replaced = True
    else:
        updated.append(line)

if not replaced:
    updated.append(f'JWT_SECRET={secret}')

target.write_text('\n'.join(updated) + '\n')
PY

    info "Generated a fresh backend JWT secret"
    warn "Review backend/.env for API keys (GEMINI_API_KEY, SUPABASE_*, MAILERSEND_*) before sharing or deploying."
  fi
}

install_node_deps() {
  local dir="$1"
  local label="$2"
  if [[ -f "$dir/package-lock.json" ]]; then
    info "Installing $label dependencies with npm ci..."
    if ! (cd "$dir" && npm ci --no-audit --no-fund); then
      warn "npm ci failed for $label; retrying with npm install..."
      (cd "$dir" && npm install --no-audit --no-fund)
    fi
  else
    info "Installing $label dependencies with npm install..."
    (cd "$dir" && npm install --no-audit --no-fund)
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

  git -C "$ROOT_DIR" add -A
  if ! git -C "$ROOT_DIR" diff --cached --quiet; then
    if ! git -C "$ROOT_DIR" rev-parse --verify HEAD >/dev/null 2>&1; then
      info "Creating initial commit..."
      git -C "$ROOT_DIR" commit -m "chore: bootstrap Verilearn"
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

ensure_brew
brew_shellenv
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