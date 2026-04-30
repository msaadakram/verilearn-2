# macOS bootstrap helper

This folder contains the one-shot macOS installer for the full Verilearn stack.

## What it does

- installs Homebrew packages needed for development
- ensures Node.js, Python, Git, `curl`, and `jq` are present
- installs and starts MongoDB locally on `localhost:27017`
- creates `backend/.env` and `frontend/.env` from their examples when missing
- sets a fresh `JWT_SECRET` for the backend
- installs backend, frontend, and OCR Python dependencies
- optionally creates/pushes a GitHub repo
- starts the full stack with `run-all.sh`

## Usage

```bash
chmod +x scripts/install-macos.sh
./scripts/install-macos.sh
```

## Useful flags

- `--no-start` — install everything but stop before launching services
- `--create-repo` — create/push the GitHub repository with `gh` if authenticated
- `--repo-url <url>` — set a different Git remote URL
- `--repo-slug <owner/repo>` — repository slug used with `gh repo create`
- `--force` — overwrite generated `.env` files

## Notes

- `backend/.env` and `frontend/.env` are kept out of git by the repo `.gitignore` files.
- The backend still needs a real `GEMINI_API_KEY` and any Supabase / Mailersend values you want to use.
- The OCR service downloads heavy model dependencies on the first run; that’s normal and may take a while.