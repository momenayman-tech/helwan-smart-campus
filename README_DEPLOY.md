# Helwan Smart Campus — Quick deploy guide (what this package does for you)

Files added to repo to automate deployment:
- `render.yaml`  : instructs Render how to create the backend (web) and frontend (static) services when you import the repo.
- `deploy.ps1`   : PowerShell helper to init/commit/push and (optionally) set GitHub secrets using gh CLI.
- `.gitignore`   : ignores node_modules, uploads, env files, etc.

## What I CAN'T do (for security reasons)
- I cannot log into your GitHub, Render, or MongoDB accounts or run commands in your environment that require your credentials.
- You must perform the Git push and Render import steps from your machine or Render dashboard (very small manual steps).

## Minimal actions YOU must do (fast)
1. Create MongoDB Atlas cluster and get the connection string (MONGO_URI). Make sure Network Access allows Render (0.0.0.0/0 temporarily).
2. Run `deploy.ps1` from the root of the project in PowerShell. The script will:
   - Initialize git (if needed), commit, and push to GitHub (or create the repo via gh CLI).
   - Optionally set GitHub secrets (if `gh` CLI is installed and you choose to use it).
3. Visit Render → New → Import from Git → choose your repo. Render will read `render.yaml` and create the services.
4. In Render service settings, set environment variables:
   - Backend service (`helwan-backend`): `MONGO_URI`, `JWT_SECRET`
   - Frontend service (`helwan-frontend`): `VITE_API_URL` (e.g. https://helwan-backend.onrender.com/api)
5. Deploy and wait. Test the endpoints (I included test curl/PowerShell commands in earlier instructions).

If you want, I can now rezip the project including these files and give you a download link so you can run `deploy.ps1` locally.