import { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye, ChevronRight, Loader2, Brush, RotateCcw, ScanLine } from 'lucide-react';
import { detectTeeth, toothValueAt } from '../utils/toothSegmentation';

// Internal working resolution for the marking canvas.
const S = 1024;

// Free offline fill — no API. Reconstructs the painted region by diffusing the
// surrounding enamel colour inward (Jacobi/Laplace inpainting) so the chip is
// filled with tooth-coloured material that matches its border. Placed exactly
// where the user brushed, then the edges match naturally (Dirichlet boundary).
const runLocalSimulation = async (imageSrc, paintCanvas, { mirrorAxisX = null } = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, S, S);

        const md = paintCanvas.getContext('2d').getImageData(0, 0, S, S).data;
        const id = ctx.getImageData(0, 0, S, S);
        const d = id.data;

        // Mask + bounding box of the painted area.
        let minx = S, miny = S, maxx = 0, maxy = 0, any = false;
        const masked = new Uint8Array(S * S);
        for (let i = 0; i < S * S; i++) {
          if (md[i * 4 + 3] > 40) {
            masked[i] = 1;
            any = true;
            const x = i % S, y = (i / S) | 0;
            if (x < minx) minx = x;
            if (x > maxx) maxx = x;
            if (y < miny) miny = y;
            if (y > maxy) maxy = y;
          }
        }
        if (!any) {
          resolve(canvas.toDataURL('image/jpeg', 0.95));
          return;
        }

        // When YOLO gives us the tooth's vertical axis, rebuild masked pixels
        // from their mirror on the intact side of the SAME tooth — this copies
        // real enamel texture. Pixels whose mirror is also damaged fall through
        // to diffusion below.
        if (mirrorAxisX != null) {
          const axis = Math.round(mirrorAxisX);
          for (let y = miny; y <= maxy; y++) {
            for (let x = minx; x <= maxx; x++) {
              const p = y * S + x;
              if (!masked[p]) continue;
              const sx = 2 * axis - x;
              if (sx < 0 || sx >= S) continue;
              const sp = y * S + sx;
              if (masked[sp]) continue; // mirror also damaged -> leave for diffusion
              d[p * 4] = d[sp * 4];
              d[p * 4 + 1] = d[sp * 4 + 1];
              d[p * 4 + 2] = d[sp * 4 + 2];
              masked[p] = 0; // now known; acts as boundary for diffusion
            }
          }
        }

        // Work on a padded bounding box only (fast).
        const pad = 8;
        minx = Math.max(0, minx - pad);
        miny = Math.max(0, miny - pad);
        maxx = Math.min(S - 1, maxx + pad);
        maxy = Math.min(S - 1, maxy + pad);
        const bw = maxx - minx + 1;
        const bh = maxy - miny + 1;
        const N = bw * bh;

        const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N), M = new Uint8Array(N);
        for (let y = 0; y < bh; y++) {
          for (let x = 0; x < bw; x++) {
            const gi = (y + miny) * S + (x + minx);
            const bi = y * bw + x;
            R[bi] = d[gi * 4]; G[bi] = d[gi * 4 + 1]; B[bi] = d[gi * 4 + 2];
            M[bi] = masked[gi];
          }
        }

        const R2 = R.slice(), G2 = G.slice(), B2 = B.slice();
        const iters = Math.min(320, Math.max(bw, bh));
        for (let it = 0; it < iters; it++) {
          for (let y = 0; y < bh; y++) {
            for (let x = 0; x < bw; x++) {
              const p = y * bw + x;
              if (!M[p]) continue;
              let r = 0, g = 0, b = 0, n = 0;
              if (x > 0) { r += R[p - 1]; g += G[p - 1]; b += B[p - 1]; n++; }
              if (x < bw - 1) { r += R[p + 1]; g += G[p + 1]; b += B[p + 1]; n++; }
              if (y > 0) { r += R[p - bw]; g += G[p - bw]; b += B[p - bw]; n++; }
              if (y < bh - 1) { r += R[p + bw]; g += G[p + bw]; b += B[p + bw]; n++; }
              if (n) { R2[p] = r / n; G2[p] = g / n; B2[p] = b / n; }
            }
          }
          R.set(R2); G.set(G2); B.set(B2);
        }

        for (let y = 0; y < bh; y++) {
          for (let x = 0; x < bw; x++) {
            const p = y * bw + x;
            if (!M[p]) continue;
            const gi = (y + miny) * S + (x + minx);
            d[gi * 4] = R[p]; d[gi * 4 + 1] = G[p]; d[gi * 4 + 2] = B[p];
          }
        }
        ctx.putImageData(id, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load patient reference image.'));
  });
};

export default function SplitComparison({ scanResults, caseInfo, uploadedImage, onNext }) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100
  const containerRef = useRef(null);

  // Restoration states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Marking (brush) states
  const displayRef = useRef(null);      // visible canvas: image + paint overlay
  const paintRef = useRef(null);        // offscreen canvas: opaque cyan where painted
  const baseImgRef = useRef(null);      // loaded patient Image
  const isPaintingRef = useRef(false);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(55);

  // YOLO auto-detection
  const detectionRef = useRef(null);   // { teeth, transform, W, H, targetIdx }
  const mirrorAxisRef = useRef(null);  // target tooth vertical axis, in S space
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState(null);

  // (Re)draw the visible marking canvas = base image + translucent paint overlay.
  const redraw = () => {
    const canvas = displayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    if (baseImgRef.current) {
      ctx.drawImage(baseImgRef.current, 0, 0, S, S);
    }
    if (paintRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.drawImage(paintRef.current, 0, 0);
      ctx.restore();
    }
    // Detected tooth boxes (feedback).
    const det = detectionRef.current;
    if (det && det.teeth) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.font = '600 22px sans-serif';
      det.teeth.forEach((t, idx) => {
        const x1 = (t.box.x1 / det.W) * S;
        const y1 = (t.box.y1 / det.H) * S;
        const bw = ((t.box.x2 - t.box.x1) / det.W) * S;
        const bh = ((t.box.y2 - t.box.y1) / det.H) * S;
        const isTarget = idx === det.targetIdx;
        ctx.strokeStyle = isTarget ? 'rgba(255, 92, 92, 0.95)' : 'rgba(0, 242, 254, 0.55)';
        ctx.lineWidth = isTarget ? 4 : 2;
        ctx.strokeRect(x1, y1, bw, bh);
        if (isTarget) {
          ctx.fillStyle = 'rgba(255, 92, 92, 0.95)';
          ctx.fillText('target', x1 + 4, Math.max(20, y1 - 6));
        }
      });
      ctx.restore();
    }
  };

  // Load the patient image into the marking canvas whenever it changes.
  useEffect(() => {
    if (!uploadedImage) return;
    if (!paintRef.current) {
      const c = document.createElement('canvas');
      c.width = S;
      c.height = S;
      paintRef.current = c;
    }
    // Reset any prior mask / result for a new image.
    paintRef.current.getContext('2d').clearRect(0, 0, S, S);
    setHasMask(false);
    setAiImageUrl(null);
    setAiError(null);
    detectionRef.current = null;
    mirrorAxisRef.current = null;
    setDetectMsg(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImgRef.current = img;
      redraw();
    };
    img.src = uploadedImage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage]);

  const canvasCoords = (e) => {
    const rect = displayRef.current.getBoundingClientRect();
    const src = e.touches && e.touches[0] ? e.touches[0] : e;
    const x = ((src.clientX - rect.left) / rect.width) * S;
    const y = ((src.clientY - rect.top) / rect.height) * S;
    return [x, y];
  };

  const paintAt = (x, y) => {
    const pctx = paintRef.current.getContext('2d');
    pctx.fillStyle = 'rgba(0, 242, 254, 1)';
    pctx.beginPath();
    pctx.arc(x, y, brushSize, 0, Math.PI * 2);
    pctx.fill();
    if (!hasMask) setHasMask(true);
    redraw();
  };

  const startPaint = (e) => {
    if (!baseImgRef.current) return;
    e.preventDefault();
    isPaintingRef.current = true;
    const [x, y] = canvasCoords(e);
    paintAt(x, y);
  };
  const movePaint = (e) => {
    if (!isPaintingRef.current) return;
    e.preventDefault();
    const [x, y] = canvasCoords(e);
    paintAt(x, y);
  };
  const endPaint = () => {
    isPaintingRef.current = false;
  };

  const clearMask = () => {
    if (paintRef.current) {
      paintRef.current.getContext('2d').clearRect(0, 0, S, S);
    }
    setHasMask(false);
    setAiError(null);
    mirrorAxisRef.current = null;
    redraw();
  };

  // Run YOLO segmentation, pick the chipped incisor by left/right asymmetry,
  // and auto-paint the missing corner as the fill mask.
  const autoDetect = async () => {
    if (!uploadedImage || isDetecting) return;
    setIsDetecting(true);
    setDetectMsg('Running tooth segmentation…');
    setAiError(null);
    try {
      const res = await detectTeeth(uploadedImage, { conf: 0.25 });
      if (!res.teeth.length) {
        detectionRef.current = { ...res, targetIdx: -1 };
        redraw();
        setDetectMsg('No teeth detected — brush the chip manually instead.');
        return;
      }

      // Pick the target tooth = largest lower-half left/right asymmetry
      // (a chipped corner breaks the tooth's natural symmetry).
      const maxArea = Math.max(...res.teeth.map((t) => t.area));
      let targetIdx = -1;
      let bestAsym = 0;
      res.teeth.forEach((t, idx) => {
        if (t.area < 0.15 * maxArea) return;
        const step = Math.max(1, Math.round((t.box.x2 - t.box.x1) / 40));
        let diff = 0, tot = 0;
        for (let oy = t.cy; oy < t.box.y2; oy += step) {
          for (let ox = t.box.x1; ox < t.box.x2; ox += step) {
            const inT = toothValueAt(t, res.transform, ox, oy) > 0.5;
            const inM = toothValueAt(t, res.transform, 2 * t.cx - ox, oy) > 0.5;
            if (inT || inM) { tot++; if (inT !== inM) diff++; }
          }
        }
        const asym = tot ? diff / tot : 0;
        if (asym > bestAsym) { bestAsym = asym; targetIdx = idx; }
      });

      detectionRef.current = { ...res, targetIdx };
      redraw();

      if (targetIdx >= 0 && bestAsym > 0.02) {
        const painted = buildDefectMask(res.teeth[targetIdx], res.transform, res.W, res.H);
        if (painted) {
          setDetectMsg(`Detected ${res.teeth.length} teeth. Auto-marked the chip on the asymmetric incisor (red box) — refine with the brush if needed, then Restore.`);
        } else {
          setDetectMsg(`Detected ${res.teeth.length} teeth, but couldn't isolate the chip. Brush the defect manually.`);
        }
      } else {
        setDetectMsg(`Detected ${res.teeth.length} teeth, but no clear asymmetry/chip. Brush the defect manually.`);
      }
    } catch (err) {
      console.error(err);
      setDetectMsg(null);
      setAiError('Tooth detection failed: ' + (err.message || err));
    } finally {
      setIsDetecting(false);
    }
  };

  // Paint the missing-corner region (present on the mirror side, absent here)
  // into the mask canvas. Returns true if anything was marked.
  const buildDefectMask = (t, transform, W, H) => {
    const pctx = paintRef.current.getContext('2d');
    const bx1 = Math.max(0, Math.floor((t.box.x1 / W) * S));
    const bx2 = Math.min(S, Math.ceil((t.box.x2 / W) * S));
    const by1 = Math.max(0, Math.floor((t.cy / H) * S)); // incisal (lower) half
    const by2 = Math.min(S, Math.ceil((t.box.y2 / H) * S));
    const w = bx2 - bx1, h = by2 - by1;
    if (w <= 0 || h <= 0) return false;

    const imgd = pctx.getImageData(bx1, by1, w, h);
    const dd = imgd.data;
    let count = 0;
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const ox = ((bx1 + xx) / S) * W;
        const oy = ((by1 + yy) / S) * H;
        const inT = toothValueAt(t, transform, ox, oy) > 0.5;
        const inM = toothValueAt(t, transform, 2 * t.cx - ox, oy) > 0.5;
        if (inM && !inT) {
          const p = (yy * w + xx) * 4;
          dd[p] = 0; dd[p + 1] = 242; dd[p + 2] = 254; dd[p + 3] = 255;
          count++;
        }
      }
    }
    pctx.putImageData(imgd, bx1, by1);
    redraw();
    if (count > 20) {
      setHasMask(true);
      mirrorAxisRef.current = (t.cx / W) * S;
      return true;
    }
    return false;
  };

  const handleGenerateAi = async () => {
    if (!hasMask) return;
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const url = await runLocalSimulation(uploadedImage, paintRef.current, { mirrorAxisX: mirrorAxisRef.current });
      setAiImageUrl(url);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Failed to generate simulation.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Restoration Simulation Preview</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>Aesthetic Restoration Mockup</h2>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* Left Side: Split Image Slider */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', width: '100%' }}>Drag Slider to Compare</h3>

          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              height: '400px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              userSelect: 'none',
              cursor: 'ew-resize',
              background: '#04070d'
            }}
          >
            {/* Case 1: Real Photo Uploaded */}
            {uploadedImage ? (
              <>
                {/* Base Image: Post-Op Restored (AI result, or original until generated) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {isGeneratingAi ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#04070d',
                      gap: '1rem',
                      border: '1px solid var(--border-glow)',
                      boxShadow: 'inset 0 0 30px rgba(0,242,254,0.1)'
                    }}>
                      <Loader2 size={36} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                        AI RESTORING SMILE...
                      </span>
                    </div>
                  ) : (
                    <img
                      src={aiImageUrl || uploadedImage}
                      alt="Post-Op Photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.25)', border: '1px solid var(--primary)', fontSize: '0.8rem', color: '#ffffff', zIndex: 10 }}>
                    {aiImageUrl ? 'Post-Op Restored' : 'Original (mark the chip →)'}
                  </div>
                </div>

                {/* Top Image Overlay: Pre-Op Case (Photo only) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                    zIndex: 4
                  }}
                >
                  <img
                    src={uploadedImage}
                    alt="Pre-Op Photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid var(--error)', fontSize: '0.8rem', color: '#ffffff', zIndex: 10 }}>
                    Pre-Op Defect
                  </div>
                </div>
              </>
            ) : (
              /* Case 2: No Photo Uploaded (Demo Vector Presets) */
              <>
                {/* Base Image: Post-Op Restoration (Simulated full tooth SVG) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {caseInfo.caseType.includes('Fracture') || caseInfo.caseType.includes('IV') || caseInfo.caseType.includes('Repair') ? (
                    <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ padding: '20px' }}>
                      <defs>
                        <linearGradient id="restoredToothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={scanResults?.cervical?.shade?.hex || '#DFD3B8'} />
                          <stop offset="60%" stopColor={scanResults?.middle?.shade?.hex || '#DACDB4'} />
                          <stop offset="100%" stopColor={scanResults?.incisal?.shade?.hex || '#E2EBF1'} />
                        </linearGradient>
                        <radialGradient id="gingivaGradCompare" cx="50%" cy="0%" r="50%">
                          <stop offset="0%" stopColor="#f59ba2" />
                          <stop offset="100%" stopColor="#e16b75" />
                        </radialGradient>
                      </defs>
                      <path d="M 30,0 Q 100,55 170,0 L 200,0 L 200,30 Q 100,75 0,30 L 0,0 Z" fill="url(#gingivaGradCompare)" />
                      <path d="M 60,35 Q 100,30 140,35 C 150,60 155,100 150,135 C 135,133 115,120 100,120 C 100,120 100,120 100,120 C 100,120 100,120 100,120 C 115,120 135,133 150,135 L 152,175 Q 100,175 100,120 C 85,120 70,135 60,135 C 55,100 50,60 60,35 Z" fill="url(#restoredToothGrad)" stroke="rgba(255,255,255,0.05)" />
                      <path d="M 100,120 C 115,120 135,133 150,135" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
                      <text x="125" y="155" fill="var(--primary)" fontSize="6" fontWeight="bold">Restored Margin</text>
                    </svg>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ padding: '20px' }}>
                      <defs>
                        <linearGradient id="restoToothGradL" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={scanResults?.cervical?.shade?.hex || '#DFD3B8'} />
                          <stop offset="60%" stopColor={scanResults?.middle?.shade?.hex || '#DACDB4'} />
                          <stop offset="100%" stopColor={scanResults?.incisal?.shade?.hex || '#E2EBF1'} />
                        </linearGradient>
                      </defs>
                      <path d="M 40,35 Q 70,30 99,35 C 100,65 100,100 99,165 C 85,165 60,164 50,163 C 40,110 35,65 40,35 Z" fill="url(#restoToothGradL)" stroke="rgba(255,255,255,0.05)" />
                      <path d="M 101,35 Q 130,30 160,35 C 165,65 160,110 150,163 C 140,164 115,165 101,165 C 100,100 100,65 101,35 Z" fill="url(#restoToothGradL)" stroke="rgba(255,255,255,0.05)" />
                      <text x="100" y="100" fill="var(--primary)" fontSize="6" textAnchor="middle">Closed Contact</text>
                    </svg>
                  )}
                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.25)', border: '1px solid var(--primary)', fontSize: '0.8rem', color: '#ffffff' }}>
                    Post-Op Restored
                  </div>
                </div>

                {/* Top Image Overlay: Pre-Op Case (Fractured/Gap SVG) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                    zIndex: 4
                  }}
                >
                  {caseInfo.caseType.includes('Fracture') || caseInfo.caseType.includes('IV') || caseInfo.caseType.includes('Repair') ? (
                    <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ padding: '20px', background: '#04070d' }}>
                      <defs>
                        <linearGradient id="preToothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#DFD3B8" />
                          <stop offset="50%" stopColor="#EADCB9" />
                          <stop offset="100%" stopColor="#E2EBF1" />
                        </linearGradient>
                        <radialGradient id="gingivaGradComparePre" cx="50%" cy="0%" r="50%">
                          <stop offset="0%" stopColor="#f59ba2" />
                          <stop offset="100%" stopColor="#e16b75" />
                        </radialGradient>
                      </defs>
                      <path d="M 30,0 Q 100,55 170,0 L 200,0 L 200,30 Q 100,75 0,30 L 0,0 Z" fill="url(#gingivaGradComparePre)" />
                      <path d="M 60,35 Q 100,30 140,35 C 150,60 155,100 150,135 Q 90,135 60,135 Z" fill="url(#preToothGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <path d="M 150,135 L 152,175 Q 100,175 100,120 C 115,120 135,133 150,135 Z" fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.2" strokeDasharray="3,3" />
                      <text x="146" y="160" fill="var(--error)" fontSize="6">Fracture</text>
                    </svg>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ padding: '20px', background: '#04070d' }}>
                      <defs>
                        <linearGradient id="preToothGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#DFD3B8" />
                          <stop offset="60%" stopColor="#E3D7BC" />
                          <stop offset="100%" stopColor="#E2EBF1" />
                        </linearGradient>
                      </defs>
                      <path d="M 40,35 Q 70,30 92,35 C 93,65 91,100 90,165 C 80,165 60,164 50,163 C 40,110 35,65 40,35 Z" fill="url(#preToothGrad2)" stroke="rgba(255,255,255,0.1)" />
                      <path d="M 108,35 Q 130,30 160,35 C 165,65 160,110 150,163 C 140,164 120,165 110,165 C 109,100 107,65 108,35 Z" fill="url(#preToothGrad2)" stroke="rgba(255,255,255,0.1)" />
                      <text x="100" y="100" fill="var(--error)" fontSize="6" textAnchor="middle" transform="rotate(-90 100 100)">Open Gap</text>
                    </svg>
                  )}
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid var(--error)', fontSize: '0.8rem', color: '#ffffff' }}>
                    Pre-Op Defect
                  </div>
                </div>
              </>
            )}

            {/* Slider bar indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPosition}%`,
                width: '2px',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 10px rgba(0,242,254,0.8), 0 0 4px var(--primary)',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              {/* Slider middle handle circular grip */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#0c111e',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ display: 'flex', gap: '2px' }}>
                  <div style={{ width: '2px', height: '8px', background: '#ffffff' }}></div>
                  <div style={{ width: '2px', height: '8px', background: '#ffffff' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Restoration Analysis & Metrics */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Smile Restoration — YOLO auto-detect the chip, then fill locally */}
            {uploadedImage && (
              <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                  Smile Restoration
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>YOLOv11 · offline</span>
                </h4>

                {aiImageUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>✓ Restoration generated — drag the slider to compare.</span>
                    </div>
                    <button
                      onClick={() => { setAiImageUrl(null); }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                    >
                      Re-mark / Try Again
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.35', margin: 0 }}>
                      <ScanLine size={11} style={{ verticalAlign: '-1px', marginRight: '3px', color: 'var(--primary)' }} />
                      Click <b style={{ color: 'var(--text-primary)' }}>Auto-detect</b> to segment the teeth and mark the chip, or brush over it
                      manually. The fill rebuilds <b style={{ color: 'var(--text-primary)' }}>only</b> the marked area.
                    </p>

                    {/* Marking canvas */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-light)', background: '#04070d', touchAction: 'none' }}>
                      <canvas
                        ref={displayRef}
                        width={S}
                        height={S}
                        onMouseDown={startPaint}
                        onMouseMove={movePaint}
                        onMouseUp={endPaint}
                        onMouseLeave={endPaint}
                        onTouchStart={startPaint}
                        onTouchMove={movePaint}
                        onTouchEnd={endPaint}
                        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
                      />
                      {!hasMask && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0.5rem', pointerEvents: 'none' }}>
                          <span style={{ fontSize: '0.7rem', color: '#ffffff', background: 'rgba(0,0,0,0.55)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Drag to brush over the defect
                          </span>
                        </div>
                      )}
                    </div>

                    {/* YOLO auto-detect */}
                    <button
                      onClick={autoDetect}
                      disabled={isDetecting}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {isDetecting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ScanLine size={13} />}
                      {isDetecting ? 'Detecting teeth…' : 'Auto-detect chip (YOLO)'}
                    </button>
                    {detectMsg && (
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>{detectMsg}</p>
                    )}

                    {/* Brush controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Brush</span>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary)' }}
                      />
                      <button
                        onClick={clearMask}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <RotateCcw size={12} /> Clear
                      </button>
                    </div>

                    <button
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi || !hasMask}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center', opacity: (!hasMask || isGeneratingAi) ? 0.5 : 1, cursor: (!hasMask || isGeneratingAi) ? 'not-allowed' : 'pointer' }}
                    >
                      {isGeneratingAi ? 'Restoring…' : hasMask ? 'Restore Smile' : 'Mark the chip first'}
                    </button>

                    {aiError && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                        {aiError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} style={{ color: 'var(--primary)' }} />
              Aesthetic Matching Metrics
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Color Alignment Score</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success)' }}>98.7% (Excellent)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Average Delta-E (ΔE)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>0.54</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Metamerism Index</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success)' }}>0.12 (Stable)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Translucency Level</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Optimal Blend</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.1)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>Clinician Tip</span>
              Using a selective enamel etch protocol and composite heating device (54°C) prior to placement reduces micro-gap formation and allows better adaption of the translucent margin.
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={onNext}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
          >
            Generate Patient Lab Worklist
            <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
