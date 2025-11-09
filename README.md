# Flowbit Analytics — Full-Stack Monorepo

**Stack**: Next.js (TS) + Tailwind + Recharts • Express (TS) + Prisma + PostgreSQL • FastAPI (Python) for "Chat with Data".

## Structure
```
/apps
  /api        # Express + Prisma REST API
  /web        # Next.js dashboard + chat
/services
  /vanna      # FastAPI service (placeholder Vanna AI)
/data         # Analytics_Test_Data.json (seed source)
```

## Quick Start (VS Code)

### 1) Prereqs
- Node 18+ and **pnpm** (`npm i -g pnpm`)
- Python 3.10+
- Docker (optional, for Postgres)

### 2) Postgres
Either start Docker:
```bash
docker compose up -d db
```
Or use your local instance:
```
postgresql://flowbit:flowbit@localhost:5432/flowbit
```

### 3) API (.env)
Create `apps/api/.env`:
```properties
DATABASE_URL="postgresql://flowbit:flowbit@localhost:5432/flowbit"
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
VANNA_API_BASE_URL=http://localhost:8000
VANNA_API_KEY=
```

Install & migrate:
```bash
pnpm i
pnpm --filter @flowbit/api prisma:generate
pnpm --filter @flowbit/api prisma:migrate
pnpm --filter @flowbit/api seed
pnpm --filter @flowbit/api dev
```

### 4) Vanna Service
Create `services/vanna/.env` (optional):
```properties
DATABASE_URL=postgresql+psycopg://flowbit:flowbit@localhost:5432/flowbit
GROQ_API_KEY=
PORT=8000
```
Install deps and run:
```bash
cd services/vanna
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python server.py
```

### 5) Frontend (.env)
Create `apps/web/.env.local`:
```properties
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Run:
```bash
pnpm --filter @flowbit/web dev
```

## REST Endpoints
- `GET /stats`
- `GET /invoice-trends`
- `GET /vendors/top10`
- `GET /category-spend`
- `GET /cash-outflow`
- `GET /invoices?search=&status=`
- `POST /chat-with-data` → proxies to Vanna `/chat`

## Notes
- The Vanna service currently includes a **naive SQL generator** for demo. Plug in Groq to productionize.
- Seed script normalizes the provided JSON into Vendors, Customers, Invoices, Payments, LineItems.

## Deploy
- Frontend/Backend: Vercel (set envs accordingly)
- Vanna: Render/Railway/Fly/DO — enable CORS for Vercel domain
```