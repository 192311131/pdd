# Deploying to Vercel

This is a static Vite + React app. The tooth-restoration feature (YOLOv11
segmentation + local fill) runs entirely in the browser — no backend, no API
keys required. Everything ships inside the built `dist/` folder.

## Option A — Vercel CLI (fastest)

```bash
npm install
npm install -g vercel      # once
vercel                     # first run: link/create project, then deploys a preview
vercel --prod              # promote to your production URL
```

Vercel reads `vercel.json` (framework: vite, build: `npm run build`, output:
`dist`). Nothing else to configure.

## Option B — Git / Vercel dashboard

1. Push this repo to GitHub/GitLab/Bitbucket.
   - `.env` is gitignored — your keys will NOT be committed. Good.
2. On vercel.com → **Add New → Project → Import** the repo.
3. Vercel auto-detects the settings from `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy. You get an HTTPS URL automatically.

## Environment variables (optional)

The restoration panel needs none. Only the optional Gemini shade-matching step
in `ToothScanner` uses a key. If you want it in production, add it in
**Vercel → Project → Settings → Environment Variables**:

- `VITE_GEMINI_API_KEY = <your key>`

Because Vite inlines `VITE_*` at build time, this value becomes visible in the
public JS bundle. Only use a key you're comfortable exposing, or remove that
step.

## Notes

- **HTTPS** is automatic on Vercel — required for the "Open Web Camera" feature.
- **First load ~38 MB** (ORT wasm + ONNX model), cached by the browser after.
- Runs single-threaded; no special headers needed.
