/**
 * "Plotted": the hero is Orhun drawn as ~110 horizontal pen-plotter lines, each one lifted by a
 * height map of a photo (scripts/media/make-plot.py). Lines are drawn back to front and each one
 * hides what's behind it, so the subject reads as relief.
 *
 *  - load:   the lines plot in, top to bottom
 *  - cursor: a lens that spreads the lines apart on springs (orange inside the lens)
 *  - click:  the next subject; heights sweep from one to the other, left to right
 *  - scroll: heights flatten and the lines collapse onto the sheet's 32 px ruled grid
 *
 * Plain 2D canvas. The loop only runs while something is actually moving.
 */

export type Subject = { name: string; label: string; src: string; w: number; h: number };

export type PlottedOptions = {
  canvas: HTMLCanvasElement;
  subjects: Subject[];
  reduced: boolean;
  colors: () => { ink: string; accent: string; bg: string };
  onSubject?: (i: number) => void;
};

export type Plotted = {
  next(): void;
  lens(x: number, y: number): void; // canvas-relative px
  lensOff(): void;
  setScroll(p: number): void; // 0..1 through the sticky hero
  setActive(on: boolean): void;
  recolor(): void;
  resize(): void;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const GRID = 32; // matches body::before in global.css

async function loadMap(s: Subject): Promise<Float32Array> {
  const img = new Image();
  img.decoding = 'async';
  img.src = s.src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = s.w;
  c.height = s.h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, s.w, s.h).data;
  const out = new Float32Array(s.w * s.h);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4] / 255;
  return out;
}

export async function createPlotted(o: PlottedOptions): Promise<Plotted> {
  const { canvas, subjects, reduced } = o;
  const ctx = canvas.getContext('2d')!;
  const maps = await Promise.all(subjects.map(loadMap));
  let col = o.colors();

  // layout
  let W = 1,
    H = 1,
    dpr = 1,
    spacing = 7,
    lines = 0,
    step = 4,
    samples = 0,
    amp = 30,
    x0 = 0,
    x1 = 1;
  let fields: Float32Array[] = []; // per subject: height at [line * samples + s]
  let spans: Int32Array[] = []; // per subject: [first, last] sample with relief on each line, -1 if flat
  let rowDirty = new Uint8Array(0); // lines whose springs are still moving
  let anyOffset = false;
  let off = new Float32Array(0); // spring offset per point
  let vel = new Float32Array(0);
  let base = new Float32Array(0); // resting y per line
  let gridY = new Float32Array(0); // where each line lands on the ruled grid

  // state
  let cur = 0,
    nxt = 0,
    morph = 1; // 0..1 from cur to nxt
  let morphStart = 0;
  const MORPH_MS = 1100;
  let intro = reduced ? 1 : 0;
  let introStart = 0;
  const INTRO_MS = 1500;
  let scroll = 0;
  let lx = -1e4,
    ly = -1e4,
    lensOn = 0, // eased 0..1
    lensTarget = 0;
  let active = true,
    raf = 0,
    last = 0;

  function sampleMap(i: number, u: number, v: number) {
    // u, v in 0..1 of the subject box; bilinear
    const s = subjects[i],
      m = maps[i];
    const fx = u * (s.w - 1),
      fy = v * (s.h - 1);
    const ix = Math.floor(fx),
      iy = Math.floor(fy);
    const tx = fx - ix,
      ty = fy - iy;
    const at = (x: number, y: number) => m[Math.min(s.h - 1, y) * s.w + Math.min(s.w - 1, x)];
    return (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
  }

  function fit() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    // phones: 1.25× is plenty for 1px lines and saves ~30% of the pixels to push per frame
    dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.25 : 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const small = W < 700;
    spacing = small ? 6 : 7;
    step = small ? 3 : 4;
    amp = spacing * (small ? 4.6 : 5.4);
    // lines run edge to edge of the sheet, leaving room above for the lifted relief
    // leave a clean strip at the bottom for the hint + scroll cue
    const top = H * 0.17,
      bottom = H * (small ? 0.86 : 0.88);
    lines = Math.floor((bottom - top) / spacing);
    x0 = 0;
    x1 = W;
    samples = Math.floor((x1 - x0) / step) + 1;
    base = new Float32Array(lines);
    gridY = new Float32Array(lines);
    const top0 = bottom - (lines - 1) * spacing;
    // the canvas sits at the top of the page, so page-y == canvas-y: snap to the body grid
    for (let i = 0; i < lines; i++) {
      base[i] = top0 + i * spacing;
      gridY[i] = Math.round(base[i] / GRID) * GRID - 1;
    }
    off = new Float32Array(lines * samples);
    vel = new Float32Array(lines * samples);

    // subject box: portrait-ish, centred, as tall as the line field allows
    fields = subjects.map((s, k) => {
      const aspect = s.h / s.w;
      let bh = (bottom - top) * (small ? 0.78 : 0.86);
      let bw = bh / aspect;
      const maxW = W * (small ? 0.94 : 0.56);
      if (bw > maxW) {
        bw = maxW;
        bh = bw * aspect;
      }
      const bx = (W - bw) / 2,
        by = bottom - bh - spacing * 2;
      const f = new Float32Array(lines * samples);
      for (let i = 0; i < lines; i++) {
        const v = (base[i] - by) / bh;
        if (v < 0 || v > 1) continue;
        for (let j = 0; j < samples; j++) {
          const u = (x0 + j * step - bx) / bw;
          if (u < 0 || u > 1) continue;
          f[i * samples + j] = sampleMap(k, u, v);
        }
      }
      return f;
    });
    // where on each line the relief actually is: everything else is a straight segment
    spans = fields.map((f) => {
      const sp = new Int32Array(lines * 2).fill(-1);
      for (let i = 0; i < lines; i++) {
        let a = -1,
          b = -1;
        for (let j = 0; j < samples; j++)
          if (f[i * samples + j] > 0.002) {
            if (a < 0) a = j;
            b = j;
          }
        if (a >= 0) {
          sp[i * 2] = Math.max(0, a - 2);
          sp[i * 2 + 1] = Math.min(samples - 1, b + 2);
        }
      }
      return sp;
    });
    rowDirty = new Uint8Array(lines);
    anyOffset = false;
  }

  function frame(now: number) {
    const fa = fields[cur],
      fb = fields[nxt];
    const mt = morph >= 1 ? 1 : morph;
    const flat = 1 - easeInOut(clamp01(scroll * 1.15));
    const collapse = easeInOut(clamp01((scroll - 0.15) / 0.75));
    const lensR = W < 700 ? 90 : 150;
    const lensA = lensOn;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const ink = col.ink,
      bg = col.bg;
    const shown = intro >= 1 ? lines : Math.floor(intro * lines * 1.08);
    const ys = new Float32Array(samples);
    const spA = spans[cur],
      spB = spans[nxt];
    const morphing = mt < 1;
    const lineAlpha = 0.9 - collapse * 0.82;
    const inv2 = 1 / (2 * lensR * lensR);
    const xEnd = x0 + (samples - 1) * step;

    // straight lines are batched into one path; it's flushed before every relief line so the
    // back-to-front order (and with it the occlusion) is kept
    let pendingFlat = false;
    const flushFlat = () => {
      if (!pendingFlat) return;
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      pendingFlat = false;
    };

    for (let i = 0; i < lines && i <= shown; i++) {
      // the newest line plots in left to right
      const along = intro >= 1 ? 1 : clamp01(intro * lines * 1.08 - i);
      const n = Math.max(2, Math.ceil(samples * along));
      const by = base[i] + (gridY[i] - base[i]) * collapse;
      const dyl = by - ly;
      const nearLens = lensA > 0.01 && Math.abs(dyl) < lensR * 2.2;

      // detail range on this line: the relief (both subjects while morphing), or the whole
      // line while the lens or its springs are touching it
      let a = spA[i * 2],
        b = spA[i * 2 + 1];
      if (morphing && spB[i * 2] >= 0) {
        a = a < 0 ? spB[i * 2] : Math.min(a, spB[i * 2]);
        b = Math.max(b, spB[i * 2 + 1]);
      }
      if (rowDirty[i] || (nearLens && a >= 0)) {
        a = 0;
        b = samples - 1;
      }
      b = Math.min(b, n - 1);
      const xe = x0 + (n - 1) * step;

      if (a < 0 || a > b || flat <= 0.001) {
        if (!pendingFlat) ctx.beginPath();
        ctx.moveTo(x0, by);
        ctx.lineTo(xe, by);
        pendingFlat = true;
        continue;
      }
      flushFlat();

      for (let j = a; j <= b; j++) {
        const k = i * samples + j;
        let h = fa[k];
        if (morphing) {
          // morph sweeps left to right
          const local = clamp01(mt * 1.6 - (j / samples) * 0.6);
          h += (fb[k] - fa[k]) * easeInOut(local);
        }
        // the lens magnifies the relief under it: 'look closer'
        if (nearLens && h > 0) {
          const dx = x0 + j * step - lx;
          h *= 1 + 1.25 * lensA * Math.exp(-(dx * dx + dyl * dyl) * inv2);
        }
        ys[j] = by - h * amp * flat + off[k];
      }
      const xa = x0 + a * step,
        xb = x0 + b * step;
      const relief = () => {
        ctx.moveTo(x0, a === 0 ? ys[0] : by);
        if (a > 0) ctx.lineTo(xa, ys[a]);
        for (let j = a + 1; j <= b; j++) ctx.lineTo(x0 + j * step, ys[j]);
        if (xb < xe) ctx.lineTo(xe, by);
      };
      // occlusion: paper under the relief part only, then the line
      ctx.beginPath();
      ctx.moveTo(xa, ys[a]);
      for (let j = a + 1; j <= b; j++) ctx.lineTo(x0 + j * step, ys[j]);
      ctx.lineTo(xb, by + 1.5);
      ctx.lineTo(xa, by + 1.5);
      ctx.closePath();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.beginPath();
      relief();
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      // inside the lens the same line is redrawn in the accent
      if (lensA > 0.02 && Math.abs(dyl) < lensR * 1.4) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, lensR * 0.62, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        relief();
        ctx.globalAlpha = lensA * (1 - collapse);
        ctx.strokeStyle = col.accent;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
    }
    flushFlat();
    void xEnd;
    ctx.globalAlpha = 1;
    void now;
  }

  // springs: the lens spreads lines apart vertically, they ripple back when it leaves
  function stepSprings(dt: number) {
    const lensR = W < 700 ? 90 : 150;
    const strength = (W < 700 ? 5 : 7) * lensOn; // a slight spread; the magnifying does the rest
    const k = 180,
      c = 14;
    let moving = false;
    if (strength <= 0.01 && !anyOffset) return false;
    anyOffset = false;
    const inv2 = 1 / (2 * lensR * lensR);
    for (let i = 0; i < lines; i++) {
      const dyl = base[i] - ly;
      const rowFar = Math.abs(dyl) > lensR * 3;
      let dirty = 0;
      for (let j = 0; j < samples; j++) {
        const idx = i * samples + j;
        let target = 0;
        if (!rowFar && strength > 0.01) {
          const dx = x0 + j * step - lx;
          const g = Math.exp(-(dx * dx + dyl * dyl) * inv2);
          target = (dyl / lensR) * strength * g * 1.6;
        }
        const o = off[idx],
          v = vel[idx];
        if (target === 0 && o === 0 && v === 0) continue;
        const nv = v + ((target - o) * k - v * c) * dt;
        const no = o + nv * dt;
        if (Math.abs(no - target) < 0.02 && Math.abs(nv) < 0.02) {
          off[idx] = target;
          vel[idx] = 0;
        } else {
          off[idx] = no;
          vel[idx] = nv;
          moving = true;
        }
        if (off[idx] !== 0) dirty = 1;
      }
      rowDirty[i] = dirty;
      if (dirty) anyOffset = true;
    }
    return moving;
  }

  function loop(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = false;
    if (intro < 1) {
      introStart ||= now;
      intro = clamp01((now - introStart) / INTRO_MS);
      moving = true;
    }
    if (morph < 1) {
      morphStart ||= now;
      morph = clamp01((now - morphStart) / MORPH_MS);
      if (morph >= 1) cur = nxt;
      moving = true;
    }
    const le = 1 - Math.pow(1 - 0.14, dt * 60);
    lensOn += (lensTarget - lensOn) * le;
    if (Math.abs(lensTarget - lensOn) > 0.003) moving = true;
    else lensOn = lensTarget;
    if (!reduced && stepSprings(dt)) moving = true;
    frame(now);
    if (moving && active) raf = requestAnimationFrame(loop);
    else last = 0;
  }
  const kick = () => {
    if (!raf && active) raf = requestAnimationFrame(loop);
  };

  fit();
  frame(0);
  kick();

  return {
    next() {
      if (morph < 1) cur = nxt; // a fast second click jumps straight on
      nxt = (cur + 1) % subjects.length;
      morph = reduced ? 1 : 0;
      morphStart = 0;
      if (reduced) cur = nxt;
      o.onSubject?.(nxt);
      kick();
      if (reduced) frame(0);
    },
    lens(x, y) {
      if (reduced) return;
      lx = x;
      ly = y;
      lensTarget = 1;
      kick();
    },
    lensOff() {
      lensTarget = 0;
      kick();
    },
    setScroll(p) {
      const v = clamp01(p);
      if (v === scroll) return;
      scroll = v;
      kick();
    },
    setActive(on) {
      active = on;
      if (on) kick();
    },
    recolor() {
      col = o.colors();
      frame(0);
    },
    resize() {
      fit();
      frame(0);
      kick();
    },
  };
}
