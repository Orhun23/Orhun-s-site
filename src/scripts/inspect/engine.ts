/**
 * Exploded-view line renderer for the build inspectors.
 *
 * A model is a list of parts made of 3D line segments. Progress 0 shows the exploded
 * diagram with every part labelled; as progress goes to 1 the parts fly home one after the
 * other (the moving part is drawn in the accent colour), the model turns on a slow turntable,
 * and the dimension lines draw in at the end. The cursor tilts it on a spring.
 *
 * Plain 2D canvas, orthographic projection, redraws only when something changed.
 */

export type V3 = [number, number, number];
export type Seg = [V3, V3];

export type Part = {
  code: string;
  name: string;
  segs: Seg[];
  accent?: Seg[];
  explode: V3;
  rot?: V3;
  start: number; // 0..1, when in the assembly this part starts moving home
  labelSide?: 1 | -1;
  mobile?: boolean; // keep the label on small screens
};

export type Model = {
  parts: Part[];
  ground?: Seg[];
  dims?: Seg[];
  dimLabels?: { at: V3; text: string; rotate?: boolean }[];
  centre: V3;
  width: number; // assembled extents in model units, used to fit the view
  height: number;
  view?: { x?: number; y?: number; turn?: number };
};

/* ---------------------------------------------------------------- geometry helpers */
export const p = (x: number, y: number, z = 0): V3 => [x, y, z];

/** a bar drawn as two parallel strokes, offset sideways so it reads as a tube */
export function bar(a: V3, b: V3, w = 0.008): Seg[] {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const along = d.map(Math.abs);
  // offset along the axis the bar is least aligned with (but not y for horizontal bars → z)
  const off: V3 = along[2] >= along[0] && along[2] >= along[1] ? [w, 0, 0] : [0, 0, w];
  return [
    [
      [a[0] - off[0], a[1] - off[1], a[2] - off[2]],
      [b[0] - off[0], b[1] - off[1], b[2] - off[2]],
    ],
    [
      [a[0] + off[0], a[1] + off[1], a[2] + off[2]],
      [b[0] + off[0], b[1] + off[1], b[2] + off[2]],
    ],
  ];
}

/** circle of radius r around c, in the plane spanned by unit vectors u and v */
export function ring(c: V3, r: number, u: V3 = [1, 0, 0], v: V3 = [0, 1, 0], n = 32): Seg[] {
  const out: Seg[] = [];
  const at = (t: number): V3 => {
    const cs = Math.cos(t) * r,
      sn = Math.sin(t) * r;
    return [c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn];
  };
  for (let i = 0; i < n; i++) out.push([at((i / n) * Math.PI * 2), at(((i + 1) / n) * Math.PI * 2)]);
  return out;
}

/** closed polyline */
export function loop(pts: V3[]): Seg[] {
  return pts.map((q, i) => [q, pts[(i + 1) % pts.length]] as Seg);
}

/** open polyline */
export function path(pts: V3[]): Seg[] {
  return pts.slice(1).map((q, i) => [pts[i], q] as Seg);
}

/** axis-aligned box edges */
export function box(a: V3, b: V3): Seg[] {
  const [x0, y0, z0] = a,
    [x1, y1, z1] = b;
  const c: V3[] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  const e = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  return e.map(([i, j]) => [c[i], c[j]] as Seg);
}

/* ---------------------------------------------------------------- maths */
type M3 = [number, number, number, number, number, number, number, number, number];
const euler = (x: number, y: number, z: number): M3 => {
  const a = Math.cos(x),
    b = Math.sin(x),
    c = Math.cos(y),
    d = Math.sin(y),
    e = Math.cos(z),
    f = Math.sin(z);
  const ae = a * e,
    af = a * f,
    be = b * e,
    bf = b * f;
  return [c * e, -c * f, d, af + be * d, ae - bf * d, -b * c, bf - ae * d, be + af * d, a * c];
};
const mul = (m: M3, v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function centroid(segs: Seg[]): V3 {
  let x = 0,
    y = 0,
    z = 0;
  for (const [a, b] of segs) {
    x += a[0] + b[0];
    y += a[1] + b[1];
    z += a[2] + b[2];
  }
  const n = segs.length * 2 || 1;
  return [x / n, y / n, z / n];
}

/* ---------------------------------------------------------------- renderer */
export type Status = { part: Part | null; assembled: number; dims: number };

export type ExplodedOptions = {
  container: HTMLElement;
  overlay?: HTMLElement; // part labels go here
  model: Model;
  ink: string;
  accent: string;
  reduced: boolean;
  onStatus?: (s: Status) => void;
};

export type Exploded = {
  setProgress(v: number): void;
  pointer(nx: number, ny: number): void;
  setColors(ink: string, accent: string): void;
  setActive(on: boolean): void;
  resize(): void;
  destroy(): void;
};

export function createExploded(o: ExplodedOptions): Exploded {
  const { container, overlay, model, reduced } = o;
  let ink = o.ink,
    accent = o.accent;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = overlay ? document.createElementNS(svgNS, 'svg') : null;
  if (svg && overlay) {
    svg.classList.add('xl-leaders');
    overlay.appendChild(svg);
  }

  // segments as flat [ax, ay, az, bx, by, bz, …]: no per-vertex allocation while drawing
  const flat = (segs: Seg[]) => {
    const f = new Float32Array(segs.length * 6);
    segs.forEach(([a, b], i) => f.set([a[0], a[1], a[2], b[0], b[1], b[2]], i * 6));
    return f;
  };
  const groundF = flat(model.ground ?? []);
  const dimsF = flat(model.dims ?? []);

  const parts = model.parts.map((def) => {
    const home = centroid(def.segs.length ? def.segs : (def.accent ?? []));
    const rel = (s: Seg[]) =>
      s.map(([a, b]) => [
        [a[0] - home[0], a[1] - home[1], a[2] - home[2]],
        [b[0] - home[0], b[1] - home[1], b[2] - home[2]],
      ]) as Seg[];
    let label: HTMLElement | null = null;
    let leader: SVGLineElement | null = null;
    if (overlay && svg) {
      label = document.createElement('div');
      label.className = 'xl-label mono';
      if (!def.mobile) label.dataset.desktopOnly = '';
      label.innerHTML = `<span class="accent">${def.code}</span> ${def.name}`;
      overlay.appendChild(label);
      leader = document.createElementNS(svgNS, 'line');
      if (!def.mobile) leader.dataset.desktopOnly = '';
      svg.appendChild(leader);
    }
    return {
      def,
      home,
      local: flat(rel(def.segs)),
      localAccent: flat(rel(def.accent ?? [])),
      label,
      leader,
      t: 0,
      at: home,
      lw: 0,
      lastOp: -1,
      lastKey: '',
    };
  });
  const dimLabels = (model.dimLabels ?? []).map((d) => {
    const el = document.createElement('div');
    el.className = 'xl-dim mono';
    el.textContent = d.text;
    overlay?.appendChild(el);
    return { ...d, el };
  });

  let progress = reduced ? 1 : 0;
  let width = 1,
    height = 1,
    dpr = 1,
    scale = 1;
  let small = false;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let R: M3 = euler(0, 0, 0);
  let active = true,
    raf = 0,
    last = 0,
    lastPart: Part | null | undefined;

  const project = (v: V3): [number, number] => {
    const w = mul(R, [v[0] - model.centre[0], v[1] - model.centre[1], v[2] - model.centre[2]]);
    return [width / 2 + w[0] * scale, height / 2 - w[1] * scale];
  };

  function fit() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    small = width < 520;
    // 1.5× is crisp enough for 1px lines and ~45% fewer pixels to push per frame than 2×
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    svg?.setAttribute('viewBox', `0 0 ${width} ${height}`);
    parts.forEach((q) => {
      q.lw = 0;
      q.lastKey = '';
    });
  }

  // One affine map per part: screen = centre + scale·(M·v + t), only the x/y rows are needed.
  // M = view rotation · part rotation, t = view rotation · (part position − model centre).
  const M = new Float64Array(6);
  const T = new Float64Array(2);
  function compose(rm: M3 | null, pos: V3) {
    const r = R;
    if (rm) {
      for (let row = 0; row < 2; row++)
        for (let c = 0; c < 3; c++) M[row * 3 + c] = r[row * 3] * rm[c] + r[row * 3 + 1] * rm[3 + c] + r[row * 3 + 2] * rm[6 + c];
    } else {
      M[0] = r[0]; M[1] = r[1]; M[2] = r[2]; M[3] = r[3]; M[4] = r[4]; M[5] = r[5];
    }
    const px = pos[0] - model.centre[0],
      py = pos[1] - model.centre[1],
      pz = pos[2] - model.centre[2];
    T[0] = r[0] * px + r[1] * py + r[2] * pz;
    T[1] = r[3] * px + r[4] * py + r[5] * pz;
  }

  function stroke(f: Float32Array, n: number, color: string, alpha: number, lw = 1.15) {
    if (n <= 0 || alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const cx = width / 2,
      cy = height / 2,
      s = scale;
    const [m0, m1, m2, m3, m4, m5] = M;
    const t0 = T[0],
      t1 = T[1];
    for (let i = 0, o = 0; i < n; i++, o += 6) {
      ctx.moveTo(cx + s * (m0 * f[o] + m1 * f[o + 1] + m2 * f[o + 2] + t0), cy - s * (m3 * f[o] + m4 * f[o + 1] + m5 * f[o + 2] + t1));
      ctx.lineTo(cx + s * (m0 * f[o + 3] + m1 * f[o + 4] + m2 * f[o + 5] + t0), cy - s * (m3 * f[o + 3] + m4 * f[o + 4] + m5 * f[o + 5] + t1));
    }
    ctx.stroke();
  }

  function frame() {
    const a = clamp01(progress / 0.68); // assembly
    const d = clamp01((progress - 0.66) / 0.24); // dimensions
    const ea = easeInOut(a);
    // exploded needs more room; zoom in as it assembles
    const zoom = lerp(small ? 1.55 : 1.45, 1.12, ea);
    scale = Math.min(width / (model.width * zoom), height / (model.height * zoom));
    const view = model.view ?? {};
    R = euler((view.x ?? 0.2) + tilt.x, (view.y ?? -0.55) + (1 - ea) * (view.turn ?? -0.6) + tilt.y, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    compose(null, model.centre);
    stroke(groundF, groundF.length / 6, ink, 0.3);
    stroke(dimsF, Math.floor((dimsF.length / 6) * d), accent, 0.95);

    let moving: Part | null = null;
    for (const q of parts) {
      const local = easeOut(clamp01((a - q.def.start) / 0.32));
      q.t = local;
      const k = 1 - local;
      const pos: V3 = [q.home[0] + q.def.explode[0] * k, q.home[1] + q.def.explode[1] * k, q.home[2] + q.def.explode[2] * k];
      compose(q.def.rot && k > 0 ? euler(q.def.rot[0] * k, q.def.rot[1] * k, q.def.rot[2] * k) : null, pos);
      q.at = pos;
      const inFlight = local > 0.001 && local < 0.999;
      if (inFlight) moving = q.def;
      // the part being fitted is highlighted; parts still waiting are drawn lighter
      const color = inFlight ? accent : ink;
      const alpha = local <= 0.001 && a > 0.001 ? 0.55 : 1;
      stroke(q.local, q.local.length / 6, color, alpha, inFlight ? 1.5 : 1.15);
      stroke(q.localAccent, q.localAccent.length / 6, accent, alpha);
    }
    ctx.globalAlpha = 1;
    placeLabels(d);

    if (moving !== lastPart) {
      lastPart = moving;
      o.onStatus?.({ part: moving, assembled: a, dims: d });
    }
  }

  function placeLabels(d: number) {
    if (!overlay) return;
    for (const q of parts) {
      if (!q.label || !q.leader) continue;
      if (small && !q.def.mobile) continue; // hidden by CSS on phones: don't write to it
      // labels belong to the exploded diagram: each one fades as its part arrives
      const op = clamp01((1 - q.t) * 2.2);
      if (op === 0 && q.lastOp === 0) continue; // hidden and staying hidden: no DOM writes
      const [x, y] = project(q.at);
      const side = q.def.labelSide ?? (x > width / 2 ? 1 : -1);
      const off = small ? 40 : 76;
      const lw = (q.lw ||= q.label.offsetWidth);
      const lx = side > 0 ? Math.min(x + off, width - lw - 6) : Math.max(x - off, lw + 6);
      const ly = Math.max(14, Math.min(height - 14, y - (small ? 14 : 26)));
      const key = `${lx.toFixed(1)},${ly.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)},${op.toFixed(2)}`;
      if (key === q.lastKey) continue;
      q.lastKey = key;
      q.lastOp = op;
      q.label.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(${side > 0 ? '0' : '-100%'}, -50%)`;
      q.label.style.opacity = op.toFixed(3);
      q.leader.setAttribute('x1', x.toFixed(1));
      q.leader.setAttribute('y1', y.toFixed(1));
      q.leader.setAttribute('x2', (lx - side * 4).toFixed(1));
      q.leader.setAttribute('y2', ly.toFixed(1));
      q.leader.style.opacity = op.toFixed(3);
    }
    for (const dl of dimLabels) {
      const [x, y] = project(dl.at);
      dl.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)${dl.rotate ? ' rotate(-90deg)' : ''}`;
      dl.el.style.opacity = clamp01((d - 0.6) * 2.5).toFixed(3);
    }
  }

  function loopFn(now: number) {
    raf = 0;
    const steps = last ? Math.min((now - last) / 16.67, 4) : 1;
    last = now;
    const k = 1 - Math.pow(1 - 0.09, steps);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    frame();
    const moving = Math.abs(tilt.tx - tilt.x) > 1e-4 || Math.abs(tilt.ty - tilt.y) > 1e-4;
    if (moving && active) raf = requestAnimationFrame(loopFn);
    else last = 0;
  }
  const kick = () => {
    if (!raf && active) raf = requestAnimationFrame(loopFn);
  };

  fit();
  frame();

  return {
    setProgress(v) {
      // quantised: sub-pixel progress changes aren't worth a redraw
      const next = reduced ? 1 : Math.round(clamp01(v) * 600) / 600;
      if (next === progress) return;
      progress = next;
      kick();
    },
    pointer(nx, ny) {
      if (reduced) return;
      tilt.ty = nx * 0.38;
      tilt.tx = ny * 0.16;
      kick();
    },
    setColors(i, a) {
      ink = i;
      accent = a;
      frame();
    },
    setActive(on) {
      active = on;
      if (on) kick();
    },
    resize() {
      fit();
      frame();
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.remove();
      overlay?.replaceChildren();
    },
  };
}
