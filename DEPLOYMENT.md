Deployment instructions for Render (API) and Vercel (frontend)

1) Deploy the API service to Render using the repository root

- In Render, create a new Web Service.
- Connect your GitHub repo and pick the `main` branch.
- Leave the "Build Command" empty (Docker will build). For the "Root Directory" keep it as the repository root ("/"). The root `Dockerfile` now builds `apps/api`.
- Set the Name to a unique value (e.g., `flowbit-api-yourname`).
- Set the service Port to `3001`.
- Add Environment Variables:
  - `VANNA_API_BASE_URL` = https://<your-vanna-url>
  - `VANNA_API_KEY` = <optional>
  - `DATABASE_URL` = <postgres-connection-string> (if you use a real DB)

2) Or deploy API using Build Context `apps/api`

- If you prefer not to use the root `Dockerfile`, in Render create the service and set the "Root Directory" to `apps/api` — Render will use the `apps/api/Dockerfile`.

3) Verify after deployment

- Health endpoint: `https://<your-api>.onrender.com/health` should return `{ "ok": true }`.

4) Deploy frontend to Vercel

- Connect the same GitHub repo.
- Set the project Root to the repository root (the included `vercel.json` will route builds to `apps/web`).
- Add Environment Variables in Vercel:
  - `NEXT_PUBLIC_API_URL` = https://<your-api>.onrender.com
  - `NEXT_PUBLIC_VANNA_URL` = https://<your-vanna>.onrender.com

5) Quick local health check script (PowerShell)

See `scripts/deploy-check.ps1` for a tiny script that waits for `/health` to respond.

If you want, I can also add a `render.yaml` to fully automate Render service creation, or create a small GitHub Actions workflow to build and push images to a container registry.
Deployment guide — Flowbit Analytics monorepo

Goal: Deploy the web frontend to Vercel and host the Vanna mock service and API on a lightweight host (Render / Railway / Fly / DigitalOcean App Platform). The `apps/web` Next.js app includes API routes and can be deployed standalone to Vercel.

1) Prepare repo for Vercel
- We already include `vercel.json` at the repo root which sets the build command to `cd apps/web && pnpm install && pnpm build` and output directory to `apps/web/.next`.
- Ensure your repository is pushed to GitHub (or GitLab / Bitbucket) and Vercel has access.

2) Recommended Vercel settings
- Create a new Project in Vercel and import your repository.
- When prompted for the Project Root, use the repository root (the `vercel.json` will build `apps/web`).
- Environment variables (if you will use a remote Vanna/API):
  - VANNA_API_BASE_URL — e.g. `https://your-vanna-host.example`
  - VANNA_API_KEY — if you enable API-key enforcement in `services/vanna`.
- Build & Output
  - Framework Preset: Next.js (auto-detected)
  - Build Command: (ignored, comes from `vercel.json`)
  - Output Directory: (ignored, `vercel.json` declares it)

3) Hosting the Vanna service
- Vercel does not run long-lived Python services. Host `services/vanna` on one of these options:
  - Render (recommended for simplicity): create a Web Service, point to repo, set the service path to `services/vanna`, start command: `py run_server.py` (or `python run_server.py`), set environment variables `VANNA_PORT` optional, `VANNA_API_KEY` if using keys. Use a `requirements.txt` in that folder.
  - Railway / Fly / DigitalOcean App Platform — similar steps.
  - Docker container on any host (Dockerfile exists under `services/vanna` if needed).

4) Hosting the Express API (`apps/api`) (optional)
- If you want the Prisma-backed API (`apps/api`) deployed, host it on Render / Railway / Fly. Make sure to configure the `DATABASE_URL` env var and run `pnpm build` then `pnpm start` (or use node host to run `tsx src/index.ts`).
- Alternatively, port only the API endpoints you need into Next.js serverless API routes (under `apps/web/app/api`) and deploy the frontend-only app to Vercel.

5) Post-deploy checks
- After deployment, visit your Vercel URL (e.g. `https://your-project.vercel.app`) and test the chat flow in the UI.
- If the UI needs to call your hosted Vanna or API, ensure `VANNA_API_BASE_URL` is set in Vercel envs.

6) Quick deploy using Vercel CLI (manual)
- Install Vercel CLI: `npm i -g vercel`
- Login: `vercel login`
- From repo root: `vercel --prod` and select project/repo settings as prompted. If needed, set `--local-config=vercel.json` and ensure the project root is repository root.

Notes & caveats
- Prisma and serverless: If deploying `apps/api` with Prisma to a serverless environment, follow Prisma's docs for serverless (or host on a containerized host such as Render).
- Vanna must be hosted separately (not on Vercel) unless you run it as a serverless function (not recommended for long-lived FastAPI).

If you'd like, I can:
- Create a small `render.yaml` or Dockerfile for the Vanna service to simplify one-click deploy on Render.
- Prepare GitHub Actions that deploy the frontend to Vercel using Vercel CLI on push to `main`.

Tell me which of the above you'd like me to implement next (create Render deploy config for Vanna, add GitHub Action for Vercel deployment, or guide you step-by-step through Vercel's web UI).