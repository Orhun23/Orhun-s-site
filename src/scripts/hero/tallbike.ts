/**
 * The hero: an exploded-view line drawing of the tallbike that assembles as you scroll.
 *
 * It's all straight lines under an orthographic projection, so instead of shipping a
 * 500 KB 3D engine this is a small projector onto a 2D canvas: crisp strokes, proper DPR,
 * and it only redraws when scroll, pointer, the intro "plotter" pass or the tilt spring
 * actually changed something.
 */
type V3 = [number, number, number];
type Seg = [V3, V3];

/* ---------- geometry helpers (metres; x forward, y up, z lateral) ---------- */
const p = (x: number, y: number, z = 0): V3 => [x, y, z];

const tube = (a: V3, b: V3, w = 0.016): Seg[] => [
  // two parallel strokes read as a tube once the drawing is rotated
  [
    [a[0], a[1], a[2] - w],
    [b[0], b[1], b[2] - w],
  ],
  [
    [a[0], a[1], a[2] + w],
    [b[0], b[1], b[2] + w],
  ],
];

const circle = (c: V3, r: number, n = 48, z = 0): Seg[] => {
  const out: Seg[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    out.push([
      [c[0] + Math.cos(a0) * r, c[1] + Math.sin(a0) * r, c[2] + z],
      [c[0] + Math.cos(a1) * r, c[1] + Math.sin(a1) * r, c[2] + z],
    ]);
  }
  return out;
};

const wheel = (c: V3, cog = false): Seg[] => {
  const segs: Seg[] = [...circle(c, 0.34, 64), ...circle(c, 0.31, 64), ...circle(c, 0.035, 16)];
  // spokes, laced alternately to each hub flange so the wheel has depth when rotated
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const z = i % 2 ? 0.035 : -0.035;
    segs.push([
      [c[0] + Math.cos(a + 0.3) * 0.035, c[1] + Math.sin(a + 0.3) * 0.035, z],
      [c[0] + Math.cos(a) * 0.31, c[1] + Math.sin(a) * 0.31, 0],
    ]);
  }
  segs.push([
    [c[0], c[1], -0.06],
    [c[0], c[1], 0.06],
  ]);
  if (cog) segs.push(...circle(c, 0.045, 18, 0.06));
  return segs;
};

const cross = (c: V3, s = 0.035): Seg[] => [
  [
    [c[0] - s, c[1] - s, c[2]],
    [c[0] + s, c[1] + s, c[2]],
  ],
  [
    [c[0] - s, c[1] + s, c[2]],
    [c[0] + s, c[1] - s, c[2]],
  ],
];

/* ---------- the bike ---------- */
// lower frame (donor #1)
const RA = p(0, 0.34);
const FA = p(1.06, 0.34);
const BB1 = p(0.42, 0.28);
const ST1 = p(0.3, 0.86);
const HT1t = p(0.984, 0.86);
const HT1b = p(1.0, 0.7);
// upper frame (donor #2) = lower frame lifted 0.72 m along the head axis
const lift = (v: V3): V3 => [v[0] - 0.07, v[1] + 0.72, v[2]];
const BB2 = lift(BB1);
const ST2 = lift(ST1);
const HT2t = lift(HT1t);
const HT2b = lift(HT1b);
const R2 = lift(RA);

const frame = (rear: V3, bb: V3, st: V3, ht: V3, hb: V3): Seg[] => [
  ...tube(bb, st),
  ...tube(st, ht),
  ...tube(bb, hb),
  ...tube(rear, bb, 0.03),
  ...tube(rear, st, 0.03),
  ...tube(ht, hb, 0.022),
];

export type PartDef = {
  code: string;
  name: string;
  segs: Seg[];
  accent?: Seg[]; // drawn in orange (weld marks)
  explode: V3;
  rot: V3;
  start: number; // when in the assembly timeline (0..1) this part starts moving home
  labelSide: 1 | -1;
  mobile?: boolean; // show label on small screens
};

const SADDLE_TOP = 1.77;
export const parts: PartDef[] = [
  {
    code: 'P-03',
    name: 'Lower frame, donor #1',
    segs: frame(RA, BB1, ST1, HT1t, HT1b),
    explode: p(0, -0.3, 0),
    rot: p(0, 0, 0),
    start: 0,
    labelSide: 1,
    mobile: true,
  },
  {
    code: 'P-01',
    name: 'Rear wheel',
    segs: wheel(RA, true),
    explode: p(-0.8, -0.2, 0.4),
    rot: p(0, 0.6, 0),
    start: 0.08,
    labelSide: -1,
  },
  {
    code: 'P-02',
    name: 'Front wheel',
    segs: wheel(FA),
    explode: p(0.85, -0.2, 0.3),
    rot: p(0, -0.6, 0),
    start: 0.12,
    labelSide: 1,
  },
  {
    code: 'P-05',
    name: 'Weld struts + steerer',
    segs: [
      ...tube(R2, RA, 0.045), // extended stays down to the rear axle
      ...tube(BB2, ST1, 0.02),
      ...tube(HT1t, HT2b, 0.014), // long steerer through both head tubes
      ...tube(HT1b, FA, 0.05), // fork
    ],
    accent: [...cross(ST1), ...cross(R2), ...cross(HT2b), ...cross(BB2)],
    explode: p(0.3, 0.1, 0.65),
    rot: p(0, 0, -0.08),
    start: 0.24,
    labelSide: 1,
    mobile: true,
  },
  {
    code: 'P-04',
    name: 'Upper frame, donor #2',
    segs: frame(R2, BB2, ST2, HT2t, HT2b),
    explode: p(-0.3, 0.3, -0.3),
    rot: p(0, 0, 0.1),
    start: 0.34,
    labelSide: -1,
    mobile: true,
  },
  {
    code: 'P-06',
    name: 'Drivetrain, very long chain',
    segs: [
      ...circle(BB2, 0.1, 40, 0.07),
      // cranks + pedals
      [
        [BB2[0], BB2[1], 0.08],
        [BB2[0] + 0.12, BB2[1] - 0.12, 0.08],
      ],
      [
        [BB2[0], BB2[1], -0.08],
        [BB2[0] - 0.12, BB2[1] + 0.12, -0.08],
      ],
      [
        [BB2[0] + 0.12, BB2[1] - 0.12, 0.08],
        [BB2[0] + 0.12, BB2[1] - 0.12, 0.17],
      ],
      [
        [BB2[0] - 0.12, BB2[1] + 0.12, -0.08],
        [BB2[0] - 0.12, BB2[1] + 0.12, -0.17],
      ],
      // the chain: chainring up top, cog down at the rear axle
      [
        [BB2[0] + 0.02, BB2[1] + 0.1, 0.07],
        [RA[0] + 0.01, RA[1] + 0.045, 0.06],
      ],
      [
        [BB2[0] - 0.02, BB2[1] - 0.1, 0.07],
        [RA[0] - 0.01, RA[1] - 0.045, 0.06],
      ],
    ],
    explode: p(-0.6, 0.3, 0.7),
    rot: p(0, 0.2, 0.25),
    start: 0.44,
    labelSide: -1,
  },
  {
    code: 'P-07',
    name: 'Saddle, way up',
    segs: [
      ...tube(ST2, p(ST2[0] - 0.04, SADDLE_TOP - 0.02), 0.012),
      // saddle outline
      [p(ST2[0] - 0.16, SADDLE_TOP, -0.08), p(ST2[0] - 0.16, SADDLE_TOP, 0.08)],
      [p(ST2[0] - 0.16, SADDLE_TOP, 0.08), p(ST2[0] + 0.1, SADDLE_TOP - 0.005, 0.02)],
      [p(ST2[0] - 0.16, SADDLE_TOP, -0.08), p(ST2[0] + 0.1, SADDLE_TOP - 0.005, -0.02)],
      [p(ST2[0] + 0.1, SADDLE_TOP - 0.005, -0.02), p(ST2[0] + 0.1, SADDLE_TOP - 0.005, 0.02)],
    ],
    explode: p(-0.6, 0.28, 0),
    rot: p(0, 0, -0.15),
    start: 0.5,
    labelSide: -1,
  },
  {
    code: 'P-08',
    name: 'Cockpit',
    segs: [
      ...tube(HT2t, p(HT2t[0] - 0.02, 1.78), 0.012),
      ...tube(p(HT2t[0] - 0.02, 1.78), p(HT2t[0] + 0.07, 1.8), 0.012),
      [p(HT2t[0] + 0.07, 1.8, -0.28), p(HT2t[0] + 0.07, 1.8, 0.28)],
      [p(HT2t[0] + 0.07, 1.8, 0.28), p(HT2t[0] - 0.02, 1.8, 0.3)],
      [p(HT2t[0] + 0.07, 1.8, -0.28), p(HT2t[0] - 0.02, 1.8, -0.3)],
    ],
    explode: p(0.7, 0.24, 0.25),
    rot: p(0, 0.35, 0),
    start: 0.55,
    labelSide: 1,
  },
];

/* ---------- drawing furniture: ground line + dimension lines (orange) ---------- */
export const DIM_X = -0.5;
export const DIM_Y = -0.14;
export const groundSegs: Seg[] = [[p(-0.55, 0), p(1.6, 0)]];
for (let x = -0.5; x < 1.6; x += 0.08) groundSegs.push([p(x, 0), p(x - 0.05, -0.05)]);

export const dimSegs: Seg[] = [
  // overall height
  [p(DIM_X, 0), p(DIM_X, 1.8)],
  [p(DIM_X - 0.04, 0), p(DIM_X + 0.04, 0)],
  [p(DIM_X - 0.04, 1.8), p(DIM_X + 0.04, 1.8)],
  [p(DIM_X - 0.03, 0.03), p(DIM_X + 0.03, -0.03)],
  [p(DIM_X - 0.03, 1.83), p(DIM_X + 0.03, 1.77)],
  [p(DIM_X + 0.06, 1.8), p(0.1, 1.8)], // extension line to saddle height
  // wheelbase
  [p(0, DIM_Y), p(1.06, DIM_Y)],
  [p(0, DIM_Y - 0.04), p(0, DIM_Y + 0.04)],
  [p(1.06, DIM_Y - 0.04), p(1.06, DIM_Y + 0.04)],
  [p(-0.03, DIM_Y - 0.03), p(0.03, DIM_Y + 0.03)],
  [p(1.03, DIM_Y - 0.03), p(1.09, DIM_Y + 0.03)],
];

const centroid = (segs: Seg[]): V3 => {
  let x = 0,
    y = 0,
    z = 0;
  for (const [a, b] of segs) {
    x += a[0] + b[0];
    y += a[1] + b[1];
    z += a[2] + b[2];
  }
  const n = segs.length * 2;
  return [x / n, y / n, z / n];
};

const recentre = (segs: Seg[], c: V3): Seg[] =>
  segs.map(([a, b]) => [
    [a[0] - c[0], a[1] - c[1], a[2] - c[2]],
    [b[0] - c[0], b[1] - c[1], b[2] - c[2]],
  ]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- tiny 3D maths: Euler XYZ (same convention as three.js) ---------- */
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

const BIKE_CENTRE: V3 = [0.53, 0.9, 0];

/* ---------- public API ---------- */
export type HeroOptions = {
  container: HTMLElement; // canvas goes in here
  overlay: HTMLElement; // labels + leader lines go in here
  ink: string;
  accent: string;
  reduced: boolean;
  small: boolean;
  /** tip the bike over around its own long axis, radians (the 404 page) */
  lie?: number;
  /** camera pitch override, radians */
  pitch?: number;
  /** where the drawing sits, as fractions of the half-width/half-height */
  anchor?: [number, number];
  /** draw ground, dimensions and part labels (default true) */
  furniture?: boolean;
};

export type HeroScene = {
  setProgress(v: number): void; // 0 exploded … 1 assembled with dimensions
  setShift(v: number): void; // 0..1, slides the drawing aside for the skate plate
  setColors(ink: string, accent: string): void;
  pointer(nx: number, ny: number): void; // -1..1
  drag(dx: number): void;
  setActive(on: boolean): void;
  resize(): void;
  destroy(): void;
};

type Part = PartDef & {
  home: V3;
  local: Seg[];
  localAccent: Seg[];
  label: HTMLElement;
  leader: SVGLineElement;
  t: number;
  labelW: number;
  anchor: V3; // current position in model space, for the label
};

export function createHero(opts: HeroOptions): HeroScene {
  const { container, overlay, reduced, lie = 0, pitch, anchor, furniture = true } = opts;
  const lieM = euler(lie, 0, 0);
  let small = opts.small;
  let ink = opts.ink;
  let accent = opts.accent;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('hero-leaders');
  overlay.appendChild(svg);

  const built: Part[] = parts.map((def) => {
    const c = centroid(def.segs);
    const label = document.createElement('div');
    label.className = 'hero-label mono';
    if (!def.mobile) label.dataset.desktopOnly = '';
    label.innerHTML = `<span class="accent">${def.code}</span> ${def.name}`;
    overlay.appendChild(label);
    const leader = document.createElementNS(svgNS, 'line');
    if (!def.mobile) leader.dataset.desktopOnly = '';
    svg.appendChild(leader);
    return {
      ...def,
      home: c,
      local: recentre(def.segs, c),
      localAccent: def.accent ? recentre(def.accent, c) : [],
      label,
      leader,
      t: 0,
      labelW: 0,
      anchor: c,
    };
  });

  const dimLabels = [
    { el: document.createElement('div'), at: [DIM_X - 0.06, 0.9, 0] as V3, text: 'H ≈ 2× a normal bike', rotate: true },
    { el: document.createElement('div'), at: [0.53, DIM_Y - 0.05, 0] as V3, text: 'Wheelbase: 1× a normal bike', rotate: false },
  ];
  dimLabels.forEach((d) => {
    d.el.className = 'hero-dim mono accent';
    d.el.textContent = d.text;
    overlay.appendChild(d.el);
  });

  /* ---------- state ---------- */
  let progress = reduced ? 1 : 0;
  let shift = 0;
  let intro = reduced ? 1 : 0; // plotter pass on first load
  const introStart = performance.now();
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, vy: 0 };
  let dragAngle = 0;
  let lastDrag = 0;
  let active = true;
  let raf = 0;
  let width = 1;
  let height = 1;
  let dpr = 1;

  const BASE_ROT_Y = -0.62;
  const BASE_ROT_X = 0.16;

  // per-frame view: rig transform + orthographic window
  let rigM: M3 = euler(0, 0, 0);
  let rigPos: V3 = [0, 0, 0];
  let rigScale = 1;
  let halfW = 1;
  let halfH = 1;

  /** model-space point → screen px */
  const project = (v: V3): [number, number] => {
    let m: V3 = [(v[0] - BIKE_CENTRE[0]) * rigScale, (v[1] - BIKE_CENTRE[1]) * rigScale, (v[2] - BIKE_CENTRE[2]) * rigScale];
    if (lie) m = mul(lieM, m);
    const w = mul(rigM, m);
    const x = w[0] + rigPos[0];
    const y = w[1] + rigPos[1];
    return [((x + halfW) / (2 * halfW)) * width, ((halfH - y) / (2 * halfH)) * height];
  };

  function fit() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  function strokeSegs(segs: Seg[], count: number, xf: (v: V3) => V3, color: string, alpha: number) {
    if (count <= 0 || alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const [a, b] = segs[i];
      const [ax, ay] = project(xf(a));
      const [bx, by] = project(xf(b));
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
  }

  const identity = (v: V3) => v;

  function frame() {
    const a = clamp01(progress / 0.64); // assembly
    const d = clamp01((progress - 0.62) / 0.2); // dimensions

    // zoom: exploded view needs room, the assembled bike can fill the sheet
    const worldH = (small ? 3.5 : 3.75) - easeInOut(a) * (small ? 0.65 : 0.55);
    const aspect = width / height;
    halfH = worldH / 2;
    halfW = halfH * aspect;
    const minHalfW = (small ? 1.25 : 1.6) + (small ? (1 - easeInOut(a)) * 0.35 : 0);
    if (halfW < minHalfW) {
      halfW = minHalfW;
      halfH = halfW / aspect;
    }

    // the headline is a banner along the bottom, so the drawing lives in the upper part of the sheet
    const anchorX = small ? 0 : halfW * 0.08;
    const anchorY = halfH * (small ? 0.26 : 0.29) - (1 - easeInOut(a)) * halfH * (small ? 0.05 : 0.17);
    rigPos = anchor
      ? [anchor[0] * halfW, anchor[1] * halfH, 0]
      : [anchorX - shift * halfW * (small ? 0 : aspect < 1 ? 0.5 : 0.3), anchorY + shift * (small ? halfH * 0.1 : 0), 0];
    rigScale = 1 - shift * (small ? 0.25 : 0.12);
    rigM = euler((pitch ?? BASE_ROT_X) + tilt.x, BASE_ROT_Y + tilt.y + dragAngle, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = small ? 1 : 1.1;
    ctx.lineCap = 'round';

    // ground + dimensions live in model space
    if (furniture) {
      strokeSegs(groundSegs, Math.floor(groundSegs.length * clamp01(intro * 1.4)), identity, ink, 0.35 * (1 - shift * 0.6));
      strokeSegs(dimSegs, Math.floor(dimSegs.length * d), identity, accent, 1 - shift * 0.5);
    }

    // parts: each moves home inside its own window of the timeline
    for (const part of built) {
      const local = easeOut(clamp01((a - part.start) / 0.45));
      part.t = local;
      const k = (1 - local) * (small ? 0.72 : 1);
      const pos: V3 = [
        part.home[0] + part.explode[0] * k,
        part.home[1] + part.explode[1] * k,
        part.home[2] + part.explode[2] * k,
      ];
      const r = euler(part.rot[0] * k, part.rot[1] * k, part.rot[2] * k);
      const xf = (v: V3): V3 => {
        const q = mul(r, v);
        return [q[0] + pos[0], q[1] + pos[1], q[2] + pos[2]];
      };
      // plotter intro: lines draw themselves part by part
      const draw = clamp01(intro * 1.6 - part.start * 1.2);
      strokeSegs(part.local, Math.floor(part.local.length * draw), xf, ink, 1 - shift * 0.55);
      strokeSegs(part.localAccent, Math.floor(part.localAccent.length * draw), xf, accent, 1 - shift * 0.5);
      part.anchor = pos;
    }
    ctx.globalAlpha = 1;

    if (furniture) placeLabels(d);
  }

  function placeLabels(d: number) {
    const introVisible = clamp01(intro * 1.4 - 0.4);
    for (const part of built) {
      const [x, y] = project(part.anchor);
      const off = small ? 54 : 110;
      // keep labels on the sheet: clamp against the measured label width
      const lw = (part.labelW ||= part.label.offsetWidth);
      const lx = part.labelSide > 0 ? Math.min(x + off, width - lw - 8) : Math.max(x - off, lw + 8);
      const ly = y - (small ? 18 : 34);
      const op = clamp01(1 - part.t * 1.6) * introVisible * (1 - shift);
      part.label.style.transform = `translate(${lx}px, ${ly}px) translate(${part.labelSide > 0 ? '0' : '-100%'}, -50%)`;
      part.label.style.opacity = String(op);
      part.leader.setAttribute('x1', String(x));
      part.leader.setAttribute('y1', String(y));
      part.leader.setAttribute('x2', String(lx - part.labelSide * 6));
      part.leader.setAttribute('y2', String(ly));
      part.leader.style.opacity = String(op);
    }
    for (const dl of dimLabels) {
      const [x, y] = project(dl.at);
      dl.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)${dl.rotate ? ' rotate(-90deg)' : ''}`;
      dl.el.style.opacity = String(clamp01((d - 0.5) * 2) * (1 - shift));
    }
  }

  /* ---------- loop: only runs while something is moving ---------- */
  let last = 0;
  function loop(now: number) {
    raf = 0;
    let moving = false;
    // normalise to 60 fps so the spring feels the same on 60 Hz and 120 Hz screens
    const steps = last ? Math.min((now - last) / 16.67, 4) : 1;
    last = now;
    if (intro < 1) {
      intro = clamp01((now - introStart) / 1900);
      moving = true;
    }
    // critically damped-ish spring towards the pointer target
    const k = 1 - Math.pow(1 - 0.085, steps);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    if (Math.abs(tilt.tx - tilt.x) > 1e-4 || Math.abs(tilt.ty - tilt.y) > 1e-4) moving = true;
    if (Math.abs(tilt.vy) > 1e-4) {
      dragAngle += tilt.vy * steps;
      tilt.vy *= Math.pow(0.92, steps);
      moving = true;
    }
    frame();
    if (moving && active) raf = requestAnimationFrame(loop);
    else last = 0;
  }
  const kick = () => {
    if (!raf && active) raf = requestAnimationFrame(loop);
  };

  fit();
  frame();
  kick();

  return {
    setProgress(v) {
      if (reduced) return;
      progress = clamp01(v);
      kick();
    },
    setShift(v) {
      shift = clamp01(v);
      kick();
    },
    setColors(i, a) {
      ink = i;
      accent = a;
      if (active) kick();
      else frame();
    },
    pointer(nx, ny) {
      if (reduced) return;
      tilt.ty = nx * 0.32;
      tilt.tx = ny * 0.12;
      kick();
    },
    drag(dx) {
      if (reduced) return;
      // velocity in radians per 60 fps frame, from real time between pointer events,
      // so a swipe spins the same on 60 Hz and 120 Hz screens
      const now = performance.now();
      const dt = Math.min(Math.max(now - lastDrag, 4), 50);
      lastDrag = now;
      tilt.vy = ((dx * 0.006) / dt) * 16.67;
      kick();
    },
    setActive(on) {
      active = on;
      if (on) kick();
    },
    resize() {
      small = window.matchMedia('(max-width: 760px)').matches;
      built.forEach((b) => (b.labelW = 0));
      fit();
      frame();
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.remove();
      overlay.replaceChildren();
    },
  };
}
