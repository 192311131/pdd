# AestheticShade AI — Backend (Render)

Small Express API. Its purpose is to keep the Gemini API key **server-side**
instead of exposing it in the frontend bundle. Extend it with more routes as
the app grows.

## Endpoints
- `GET /health` → `{ ok: true }`
- `POST /api/shade` → body `{ imageBase64 }`, returns the parsed shade JSON.

## Run locally
```bash
cd server
cp .env.example .env      # then fill GEMINI_API_KEY
npm install
npm run dev               # http://localhost:3001
```
Point the frontend at it: set `VITE_API_BASE_URL=http://localhost:3001` in the
project-root `.env`, then restart `npm run dev`.

## Deploy on Render
1. Push this repo to GitHub (already done).
2. Render → **New + → Blueprint** → connect the repo. It reads `render.yaml`
   (root dir `server`, build `npm install`, start `npm start`, health `/health`).
   - Or **New + → Web Service** manually: Root Directory `server`,
     Build `npm install`, Start `npm start`.
3. In the service **Environment**, set:
   - `GEMINI_API_KEY` = your Google Gemini key
   - `ALLOWED_ORIGINS` = `https://<your-app>.vercel.app,http://localhost:5173`
4. Deploy → you get `https://aestheticshade-api.onrender.com`.
5. In **Vercel** (frontend), set `VITE_API_BASE_URL` to that URL and redeploy.

Note: Render's free plan sleeps after inactivity, so the first request after
idle takes ~30–50s to wake.
