# UVision

UV-aware sunscreen reminders — a mobile-first Progressive Web App.

## Quick start

```bash
cd ~/Projects/uvision
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Build & deploy

```bash
npm run build
npm run preview
```

Deploy the `dist` folder to [Vercel](https://vercel.com) — zero config for Vite.

## Features (v1)

- UV forecast via [Open-Meteo](https://open-meteo.com/) (no API key)
- Today hourly + 4-day forecast with cloud-adjusted UV
- Location via GPS or city search
- Sunscreen tracker with skin type, SPF, and activity modes
- Application history and sun safety tips
- PWA installable on iPhone (Add to Home Screen)
- White-first UI with orange accents

## Coming next

- Push notifications (Railway backend + Web Push)
- Morning UV check at user-configured time
- Optional account sync

## Privacy

Location is used only for UV forecasts. Preferences and logs are stored locally in your browser.
