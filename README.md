# Exchange Hub (Annex-Ebank)

Monorepo: **frontend** (Vite + React) and **backend** (Express + Drizzle + PostgreSQL).

## Project structure

```
exchange-hub/
├── frontend/       # Vite + React + shadcn + Tailwind
├── backend/        # Express API, auth, KYC, Drizzle schema
├── package.json    # Workspace root (Bun workspaces)
└── node_modules/   # Single install (Bun)
```

**Package manager:** This repo uses **Bun** only. Do not use npm/yarn/pnpm here to avoid lockfile and resolution conflicts.

**Frontend:** The app is still built with **Vite** (in `frontend/`). It was not removed. If the dev server or first load feels slow, run only the frontend with `bun run dev:frontend`, or from the frontend folder: `cd frontend && bun run dev`. The optional Lovable tagger plugin is disabled unless you set `VITE_LOVABLE_TAGGER=1`.

## Commands (run from repo root)

| Command | Description |
|--------|-------------|
| `bun install` | Install all dependencies (frontend + backend) |
| `bun run dev` | Run frontend (port 8080) and backend (port 3000) together |
| `bun run dev:frontend` | Run **only** the frontend (Vite dev server – faster if you’re not touching the API) |
| `bun run dev:backend` | Run only backend |
| `bun run build` | Build both packages |
| `bun run lint` | Lint both packages |
| `bun run db:studio` | Open **Drizzle Studio** (Postgres GUI – browse tables, run SQL) |

## Database (PostgreSQL) – GUI and connection

**Built-in GUI (like MongoDB Compass for Postgres):**  
From repo root run:

```sh
bun run db:studio
```

This opens **Drizzle Studio** in the browser. It uses `DATABASE_URL` from `backend/.env`, so you can inspect users, KYC submissions, etc. in a table/JSON-like view. Safe for local and staging; for production see below.

**Connection string** (for any Postgres GUI):

- Local:  
  `postgresql://USER:PASSWORD@localhost:5432/exchange_hub`
- Production (use env var, never commit):  
  `postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require`

Set in `backend/.env`:

```env
DATABASE_URL=postgresql://...
```

### Admin-managed balances

Balances are ledger-managed. The backend does not auto-credit deposits from chain polling. Run the seed SQL below to make PAXG and common crypto asset-network rows available for admin credits:

```sh
# paste/run in Supabase SQL editor or your Postgres client
backend/drizzle/manual-admin-balances.sql
```

Admin credit/update endpoint:

```http
POST /admin/users/:id/balance-adjustments
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "assetSymbol": "PAXG",
  "chainSlug": "ethereum",
  "amount": 0.25,
  "note": "PAXG deposit confirmed"
}
```

Positive amounts create a completed deposit record plus a ledger entry. Negative amounts create an admin adjustment and are rejected if they would make the selected asset/network balance negative.

**Other GUIs** (connect with the same URL when going live):

| Tool | Notes |
|------|--------|
| [pgAdmin](https://www.pgadmin.org/) | Free, full-featured; run locally and connect to prod over SSL. |
| [TablePlus](https://tableplus.com/) | Desktop app, clean UI; free tier available. |
| [Beekeeper Studio](https://www.beekeeperstudio.io/) | Free, open-source desktop. |

**Going live:** Keep `DATABASE_URL` in env only, use SSL (`?sslmode=require`) for production. Don’t expose Drizzle Studio or any DB admin UI on a public URL; run GUIs from your machine and connect to the prod DB over a secure connection (VPN or allowed IPs).

**Backend `.env`:** The API server uses `API_PORT` or `SERVER_PORT` (default `3000`). Postgres connection uses `USER`, `PASSWORD`, `HOST`, `PGPORT`/`DB_PORT`/`PORT`, `DATABASE` — or a single `DATABASE_URL`. If your password contains `&`, `#`, `?`, etc., it is encoded automatically when building the URL from `USER`/`PASSWORD`; or set `DATABASE_URL` yourself with the password already URL-encoded.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having **Bun** installed – [install Bun](https://bun.sh/docs/installation) (Node is not required; Bun includes it).

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun install

# Step 4: Start the app (frontend + backend).
bun run dev
```

Frontend: http://localhost:8080 — Backend API: http://localhost:3000

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
