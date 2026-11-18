# IPL Auction Ops — Deployment & Club Event Guide

This application supports three deployment targets:
1. **Local / Club Event LAN** (Recommended for live multi-device room bidding with full SSE + disk persistence)
2. **Firebase Hosting + Auth & Firestore** (Google Sign-In + Firestore profiles & static SPA hosting)
3. **Vercel** (Frontend SPA on Vercel CDN + `/api/*` Express serverless adapter)

---

## 0. Daily Captains / Delhi Capitals Logo (`delhi_captails.png`)
- **Storage path**: `public/logos/delhi_captails.png`
- **Public URL**: `/logos/delhi_captails.png`
- Replace `public/logos/delhi_captails.png` on disk (or upload a PNG inside the app at `/deploy`) to customize the crest displayed for **both** the Delhi Capitals franchise (`DC` / `IPL-T03`) and every player drafted by `DC`.

---

## 1. Local / Club Wi-Fi Run (Multi-Laptop & Phone Ready)

```bash
npm install
npm run dev
```

Or build and run in production mode:

```bash
npm run build
npm run start
```

Optional environment variables:
- `PORT=3000` — server port
- `PIN=1234` — optional Operator PIN protecting `/api/cmd`
- `PRESET=MEGA` or `PRESET=MINI` — ₹120 Cr Mega Auction or remaining-purse Mini Auction

Share across devices on the same Wi-Fi using the **Share** modal in the header (automatically lists your LAN IPv4 URLs and QR codes for `/arena`, `/bid`, and `/operator`).

---

## 2. Deploy to Firebase (Auth, Firestore Rules & Hosting)

Project ID configured in `.firebaserc` & `firebase-applet-config.json`: `test1-505115`.

1. Enable **Google** as a sign-in provider in Firebase Console → Authentication → Sign-in method (and add your deployed hostname under Authorized domains).
2. Lint security rules before deploying:

```bash
npx eslint firestore.rules
```

3. Build the Vite frontend and deploy Hosting + Firestore rules:

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules --project test1-505115
```

> **Note**: Firebase Hosting serves static SPA bundles (`dist/`). If you also want live multi-device auction bidding over `/api/stream`, host the Node/Express server (`server.ts`) on Cloud Run or run locally while using Firebase Auth/Firestore.

---

## 3. Deploy to Vercel (Frontend + `/api/index.ts` Serverless Adapter)

This repository includes `vercel.json` and `api/index.ts` wrapping `createApp()` from `server.ts`.

1. Install Vercel CLI and deploy:

```bash
npm i -g vercel
vercel --prod
```

2. Add your Vercel `.vercel.app` domain under Firebase Console → Authentication → Settings → **Authorized domains** so Google Sign-In popups work in production.

> **Important Note on Vercel Serverless**:
> Vercel serverless functions use an ephemeral `/tmp` filesystem and do not keep long-lived SSE connections indefinitely. For a 10-team live club auction room where real-time sub-second bids and permanent `data/events.json` persistence matter most, running locally (`npm run start`) or on a persistent Node container (e.g., Cloud Run / Render / Fly.io) is recommended.
