# UVision API (Railway)

Node/Express backend for web push notifications and scheduled morning UV reminders.

Frontend stays on **Vercel**. This service runs on **Railway** with PostgreSQL.

## What it does

- Stores push subscriptions (Web Push / VAPID)
- Sends **morning UV reminders** (English) via cron
- Syncs location, home zone, and reminder time from the app
- `GET /health` for Railway health checks

## Railway CLI setup

### 1. Install CLI

```bash
npm install -g @railway/cli
# or: brew install railway
```

### 2. Automated setup (recommended)

```bash
chmod +x scripts/railway-setup.sh
./scripts/railway-setup.sh
```

### 3. Manual setup

```bash
cd server
npm install
railway login
railway init --name uvision-api   # or: railway link
railway add --database postgres
npm run generate-vapid
```

Copy the public/private keys, then:

```bash
railway variables set \
  CORS_ORIGINS="http://localhost:5173,https://uvision-theta.vercel.app" \
  VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY" \
  VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY" \
  VAPID_SUBJECT="mailto:you@example.com"
```

`DATABASE_URL` is injected automatically when PostgreSQL is linked.

Deploy:

```bash
railway up
```

Public URL:

```bash
railway domain
# or check: railway status
```

Local dev with Railway env vars:

```bash
railway run npm run dev
```

## Connect Vercel frontend

In the Vercel project (UVision frontend):

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://your-app.up.railway.app` |

Redeploy Vercel after setting the variable.

Local frontend (`.env`):

```
VITE_API_URL=http://localhost:3001
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/push/vapid-public-key` | VAPID public key |
| POST | `/api/push/subscribe` | Register push subscription |
| PUT | `/api/push/subscription` | Update prefs (location, time, home) |
| DELETE | `/api/push/subscribe` | Unsubscribe |
| POST | `/api/push/test` | Send test notification |

## Useful CLI commands

```bash
cd server
railway logs          # live logs
railway variables     # list env vars
railway open          # open dashboard
railway redeploy      # redeploy latest
```

## Project layout on Railway

Set the **Root Directory** to `server` if you deploy from the GitHub repo (monorepo):

- Railway dashboard → Service → Settings → Root Directory → `server`

Or deploy only the `server/` folder via CLI from that directory (`railway up`).
