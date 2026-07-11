import express from 'express';
import cors from 'cors';

// AestheticShade AI — backend API (deploy on Render).
// Its job today: proxy the Gemini shade-analysis call so the API key stays on
// the server instead of being exposed in the public frontend bundle. Add more
// routes here as the app grows.

const app = express();
app.use(express.json({ limit: '15mb' })); // base64 photos are large

// CORS: restrict to your frontend origins in production.
// Set ALLOWED_ORIGINS="https://your-app.vercel.app,http://localhost:5173"
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed } : {}));

const SHADE_PROMPT =
  "You are a clinical dental spectrophotometer AI. Analyze this tooth photograph. " +
  "Focus only on the target tooth (Maxillary Central Incisor, Tooth #8). Output a JSON object containing: " +
  "cervical_shade (e.g. 'A3'), middle_shade (e.g. 'A2'), incisal_shade (e.g. 'A1'), confidence_pct (e.g. 97), " +
  "dentin_thickness_mm (e.g. 1.4), body_thickness_mm (e.g. 0.8), enamel_thickness_mm (e.g. 0.5), " +
  "incisal_thickness_mm (e.g. 0.2), and estimated_color_match_pct (e.g. 95). " +
  "Only return the raw JSON block, no markdown formatting.";

app.get('/health', (_req, res) => res.json({ ok: true, service: 'aestheticshade-api' }));

// POST /api/shade { imageBase64 } -> parsed shade JSON
app.post('/api/shade', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  const { imageBase64 } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required.' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SHADE_PROMPT },
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return res.status(502).json({ error: `Gemini error ${r.status}`, detail });
    }

    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Gemini returned no content.' });

    return res.json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Shade proxy failed.' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`AestheticShade API listening on :${port}`));
