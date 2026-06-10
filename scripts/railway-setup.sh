#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/server"

echo "==> UVision Railway setup"
echo "This script uses the Railway CLI from the server/ folder."
echo

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI not found. Install it first:"
  echo "  npm install -g @railway/cli"
  echo "  # or: brew install railway"
  exit 1
fi

cd "$SERVER"

if [ ! -d node_modules ]; then
  echo "==> Installing server dependencies"
  npm install
fi

echo "==> Log in to Railway (opens browser if needed)"
railway login

if ! railway status >/dev/null 2>&1; then
  echo "==> Create or link a Railway project"
  echo "Choose: 1) new project  2) link existing"
  read -r -p "> " choice
  if [ "$choice" = "2" ]; then
    railway link
  else
    railway init --name uvision-api
  fi
fi

echo "==> Add PostgreSQL (skip if already added)"
railway add --database postgres || true

echo "==> Generate VAPID keys for web push"
read -r -p "Your email for VAPID (e.g. you@gmail.com): " VAPID_EMAIL
VAPID_OUTPUT=$(npx web-push generate-vapid-keys)
PUBLIC_KEY=$(echo "$VAPID_OUTPUT" | sed -n '/Public Key/,$p' | sed -n '2p' | xargs)
PRIVATE_KEY=$(echo "$VAPID_OUTPUT" | sed -n '/Private Key/,$p' | sed -n '2p' | xargs)

if [ -z "$PUBLIC_KEY" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "Could not parse VAPID keys. Run manually:"
  echo "  cd server && npm run generate-vapid"
  exit 1
fi

echo "==> Set Railway variables"
railway variables set \
  CORS_ORIGINS="http://localhost:5173,https://uvision-theta.vercel.app" \
  VAPID_PUBLIC_KEY="$PUBLIC_KEY" \
  VAPID_PRIVATE_KEY="$PRIVATE_KEY" \
  VAPID_SUBJECT="mailto:${VAPID_EMAIL}"

echo "==> Deploy backend"
railway up --detach

echo
echo "Done. Next steps:"
echo "1. Get your Railway URL:"
echo "     cd server && railway domain"
echo "     # or: railway status"
echo "2. On Vercel, set environment variable:"
echo "     VITE_API_URL=https://YOUR-RAILWAY-URL"
echo "3. Redeploy Vercel frontend"
echo "4. In UVision Settings → Enable notifications → Send test push"
