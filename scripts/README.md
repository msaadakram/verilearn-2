# bootstrap helpers

This folder contains one-shot installers for the full Verilearn stack on both macOS and Linux.

## What it does

- installs Homebrew packages needed for development
- ensures Node.js, Python, Git, `curl`, and `jq` are present
- installs and starts MongoDB locally on `localhost:27017`
- creates `backend/.env` and `frontend/.env` from their examples when missing
- sets a fresh `JWT_SECRET` for the backend
- installs backend, frontend, and OCR Python dependencies
- optionally creates/pushes a GitHub repo
- starts the full stack with `run-all.sh`

The Linux installer follows the same flow with apt/NodeSource and starts MongoDB via a local `mongod` process or Docker when available.

## Usage

```bash
chmod +x scripts/install-macos.sh
./scripts/install-macos.sh
```

Linux:

```bash
chmod +x scripts/linux-install-run.sh
./scripts/linux-install-run.sh
```

Use `scripts/install-linux.sh --no-start` if you want setup without launching the services.

## Useful flags

- `--no-start` — install everything but stop before launching services
- `--create-repo` — create/push the GitHub repository with `gh` if authenticated
- `--repo-url <url>` — set a different Git remote URL
- `--repo-slug <owner/repo>` — repository slug used with `gh repo create`
- `--force` — overwrite generated `.env` files

Linux-only flags:

- `--mongo-uri <uri>` — write a custom MongoDB URI into `backend/.env`
- `--skip-mongo` — skip local MongoDB startup if you already have a running database

## Notes

- `backend/.env` and `frontend/.env` are kept out of git by the repo `.gitignore` files.
- The backend still needs a real `GEMINI_API_KEY` and any Supabase / Mailersend values you want to use.
- The OCR service downloads heavy model dependencies on the first run; that’s normal and may take a while.