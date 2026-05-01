#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$ROOT_DIR/scripts/install-linux.sh"
RUNNER="$ROOT_DIR/run-all.sh"

install_args=()
install_only=0

usage() {
  cat <<'EOF'
Usage: ./scripts/linux-install-run.sh [options]

This combined entrypoint installs Verilearn on Linux and then launches the stack.

Options:
  --install-only       Install dependencies and exit before launching services
  --no-start           Alias for --install-only
  --skip-mongo         Forwarded to the Linux installer
  --mongo-uri URI      Forwarded to the Linux installer
  --force              Forwarded to the Linux installer
  --create-repo        Forwarded to the Linux installer
  --repo-url URL       Forwarded to the Linux installer
  --repo-slug SLUG     Forwarded to the Linux installer
  --node-major N       Forwarded to the Linux installer
  --python-version X.Y Forwarded to the Linux installer
  -h, --help           Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-only)
      install_only=1
      ;;
    --no-start)
      install_only=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      install_args+=("$1")
      ;;
  esac
  shift
done

if [[ ! -x "$INSTALLER" ]]; then
  chmod +x "$INSTALLER"
fi

if [[ ! -x "$RUNNER" ]]; then
  chmod +x "$RUNNER"
fi

echo "🚀 Installing Verilearn on Linux..."
"$INSTALLER" --no-start "${install_args[@]}"

if [[ "$install_only" -eq 1 ]]; then
  echo "✅ Installation complete. Start the stack later with: ./run-all.sh"
  exit 0
fi

echo "🚀 Launching the full stack..."
exec "$RUNNER"