// Tooth instance segmentation using the bundled YOLO11n-seg ONNX model.
// Runs fully in the browser via onnxruntime-web (WASM, single-threaded so it
// needs no cross-origin-isolation headers). Model: single class "tooth",
// input 1x3x576x576, outputs output0 [1,37,6804] (4 box + 1 score + 32 mask
// coeffs) and output1 [1,32,144,144] (mask prototypes).
import * as ort from 'onnxruntime-web';

// NOTE: wasm assets are auto-resolved by Vite (import.meta.url), same as
// ToothScanner — do not override ort.env.wasm.wasmPaths globally.

// Respect Vite's base URL so it resolves under any deploy path.
const MODEL_URL = `${import.meta.env.BASE_URL}Dental_Segmentation_with_YOLOv11.onnx`;
const IMGSZ = 576;
const PROTO = 144;      // IMGSZ / 4
const NM = 32;          // mask coefficients / prototypes
const NA = 6804;        // anchors
const ATTRS = 37;       // 4 + 1 + 32

let sessionPromise = null;
function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }
  return sessionPromise;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for segmentation.'));
    img.src = src;
  });
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

function iou(a, b) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-6);
}

// Returns { teeth: [...], transform, W, H }.
// Each tooth: { score, box (original-image px), mask144 (Float32Array 144*144),
//               cx, cy, area }. Use toothValueAt() to sample the mask in
//               original-image coordinates.
export async function detectTeeth(imageSrc, { conf = 0.25, iou: iouThr = 0.5, maxDet = 12 } = {}) {
  const session = await getSession();
  const img = await loadImage(imageSrc);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  // Letterbox into a square, preserving aspect ratio.
  const scale = Math.min(IMGSZ / W, IMGSZ / H);
  const nw = Math.round(W * scale);
  const nh = Math.round(H * scale);
  const padx = Math.floor((IMGSZ - nw) / 2);
  const pady = Math.floor((IMGSZ - nh) / 2);

  const lb = document.createElement('canvas');
  lb.width = IMGSZ;
  lb.height = IMGSZ;
  const lctx = lb.getContext('2d');
  lctx.fillStyle = '#000000';
  lctx.fillRect(0, 0, IMGSZ, IMGSZ);
  lctx.drawImage(img, 0, 0, W, H, padx, pady, nw, nh);

  const { data } = lctx.getImageData(0, 0, IMGSZ, IMGSZ);
  const area = IMGSZ * IMGSZ;
  const input = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) {
    input[i] = data[i * 4] / 255;
    input[i + area] = data[i * 4 + 1] / 255;
    input[i + 2 * area] = data[i * 4 + 2] / 255;
  }

  const tensor = new ort.Tensor('float32', input, [1, 3, IMGSZ, IMGSZ]);
  const out = await session.run({ images: tensor });
  const o0 = out.output0.data; // length ATTRS*NA, layout attr*NA + anchor
  const o1 = out.output1.data; // length NM*PROTO*PROTO, layout m*PROTO*PROTO + y*PROTO + x

  // Collect candidate detections above threshold (boxes in letterboxed 576 space).
  const cands = [];
  for (let a = 0; a < NA; a++) {
    const score = o0[4 * NA + a];
    if (score < conf) continue;
    const cx = o0[0 * NA + a];
    const cy = o0[1 * NA + a];
    const w = o0[2 * NA + a];
    const h = o0[3 * NA + a];
    const coeffs = new Float32Array(NM);
    for (let k = 0; k < NM; k++) coeffs[k] = o0[(5 + k) * NA + a];
    cands.push({
      score,
      x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2,
      coeffs,
    });
  }
  cands.sort((p, q) => q.score - p.score);

  // Non-max suppression.
  const kept = [];
  for (const c of cands) {
    if (kept.length >= maxDet) break;
    if (kept.some((k) => iou(k, c) > iouThr)) continue;
    kept.push(c);
  }

  // Build each tooth's prototype-resolution mask and map box back to original px.
  const undo = (x, y) => [(x - padx) / scale, (y - pady) / scale];
  const teeth = kept.map((c) => {
    const mask144 = new Float32Array(PROTO * PROTO);
    for (let p = 0; p < PROTO * PROTO; p++) {
      let s = 0;
      for (let k = 0; k < NM; k++) s += c.coeffs[k] * o1[k * PROTO * PROTO + p];
      mask144[p] = sigmoid(s);
    }
    const [ox1, oy1] = undo(c.x1, c.y1);
    const [ox2, oy2] = undo(c.x2, c.y2);
    const box = {
      x1: Math.max(0, ox1), y1: Math.max(0, oy1),
      x2: Math.min(W, ox2), y2: Math.min(H, oy2),
    };
    return {
      score: c.score,
      box,
      mask144,
      cx: (box.x1 + box.x2) / 2,
      cy: (box.y1 + box.y2) / 2,
      area: (box.x2 - box.x1) * (box.y2 - box.y1),
    };
  });

  return { teeth, transform: { scale, padx, pady }, W, H };
}

// Sample a tooth's mask at original-image coordinate (ox, oy) -> 0..1.
// Applies the box crop the same way Ultralytics does.
export function toothValueAt(tooth, transform, ox, oy) {
  if (ox < tooth.box.x1 || ox > tooth.box.x2 || oy < tooth.box.y1 || oy > tooth.box.y2) return 0;
  const { scale, padx, pady } = transform;
  const lx = ox * scale + padx; // letterboxed 576 space
  const ly = oy * scale + pady;
  const px = Math.min(PROTO - 1, Math.max(0, Math.round((lx / IMGSZ) * PROTO)));
  const py = Math.min(PROTO - 1, Math.max(0, Math.round((ly / IMGSZ) * PROTO)));
  return tooth.mask144[py * PROTO + px];
}
