/**
 * The hero: a Rube Goldberg machine drawn as a live technical schematic.
 *
 *   S-01 hopper → S-02 Alps run (+ backflip strobe from real footage) → S-03 skate pop
 *   (+ Trocadéro rail strobe) → S-04 Iron Man helmet servo (traced from the real helmet)
 *   → S-05 tallbike wheel → S-06 3D printer prints a paper plane → S-07 plane flies the
 *   trip route and lands at EIN → headline gets inked.
 *
 * Everything in the scripted run is a pure function of time, so it can replay, jump to the
 * end (reduced motion) and re-trigger from S-03 when a visitor's ball hits the skateboard.
 * Drawn on a 2D canvas in a 1600×640 design space. Static linework is cached to an
 * offscreen canvas after the plotter intro, so a frame is one drawImage + the moving parts.
 */
import helmet from '../../data/hero/helmet.json';
import snowStrobe from '../../data/strobes/snow-backflip.json';
import skateStrobe from '../../data/strobes/skate-rail.json';

type Pt = [number, number];
type Kind = 'ink' | 'faint' | 'accent';
type Shape = { pts: Pt[]; closed?: boolean; kind: Kind; dash?: number[]; width?: number };

export const W = 1600;
export const H = 640;
const GROUND = 600;
const G = 1340; // gravity, design units / s²
const BALL_R = 10;
const LW = 1.35; // base stroke width in screen px

/* ------------------------------------------------------------------ helpers */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const rot = ([x, y]: Pt, [cx, cy]: Pt, a: number): Pt => {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};
const circlePts = (cx: number, cy: number, r: number, n = 48, a0 = 0, a1 = Math.PI * 2): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
};
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
/** point at arc length s along a polyline */
function along(pl: Pt[], s: number): { p: Pt; dir: Pt } {
  for (let i = 0; i < pl.length - 1; i++) {
    const [ax, ay] = pl[i];
    const [bx, by] = pl[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (s <= len || i === pl.length - 2) {
      const k = Math.min(1, s / len);
      return { p: [ax + (bx - ax) * k, ay + (by - ay) * k], dir: [(bx - ax) / len, (by - ay) / len] };
    }
    s -= len;
  }
  return { p: pl[pl.length - 1], dir: [1, 0] };
}
const polyLen = (pl: Pt[]) => pl.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pl[i][0], p[1] - pl[i][1]), 0);
const bez = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};

/* ------------------------------------------------------------------ the layout */
// S-01 hopper
const HOPPER: Pt[] = [
  [62, 40],
  [100, 104],
  [100, 118],
];
const HOPPER_R: Pt[] = [
  [150, 40],
  [124, 104],
  [124, 118],
];
const BALL_START: Pt = [112, 66];

// S-02 Alps run: the slope is the mountain's right flank, ending in a snowboard kicker
const SLOPE: Pt[] = [
  [112, 150],
  [330, 418],
  [372, 445],
  [410, 453],
  [445, 445],
  [464, 434],
];
const LIP: Pt = [464, 434];

// S-03 skate box + board
const BOX = { x0: 560, x1: 760, top: 560 };
const BOARD_C: Pt = [640, 549]; // deck centre at rest
const BOARD_LEN = 132;
const TRIGGER: Pt = [713, 468]; // button on a post, the board's nose hits it

// S-04 helmet (traced), 170 units tall
const HX = 790,
  HY = 352,
  HS = 210;
const hp = ([x, y]: number[]): Pt => [HX + x * HS, HY + y * HS];
const FACE_PIVOT: Pt = hp([0.45, 0.03]);
const CHIN = [0.39, 0.86];
const EYES = [
  [
    [0.04, 0.334],
    [0.13, 0.336],
    [0.12, 0.36],
    [0.04, 0.366],
  ],
  [
    [0.32, 0.352],
    [0.55, 0.36],
    [0.53, 0.398],
    [0.46, 0.402],
    [0.33, 0.39],
  ],
];
const PULLEY: Pt = [992, 352];

// S-05 tallbike wheel
const WHEEL: Pt = [1106, 494];
const WHEEL_R = 104;
const HUB_R = 28;

// S-06 printer
const PR = { x0: 1236, x1: 1426, y0: 352, y1: 600, gantry: 396, bed: 558 };
const PRINT_PULLEY: Pt = [1264, 578];
const PLANE_PRINT: Pt[] = [
  [1276, 556],
  [1392, 548],
  [1330, 516],
  [1302, 538],
];
const LAYERS = 14;

// S-07 route
const ROUTE_Y = 54;
export const STOPS = [
  { code: 'RAI', at: '14.92°N 23.51°W' },
  { code: 'RAK', at: '31.63°N 8.00°W' },
  { code: 'CDG', at: '49.01°N 2.55°E' },
  { code: 'IST', at: '41.26°N 28.74°E' },
  { code: 'DEL', at: '28.56°N 77.10°E' },
  { code: 'LOP', at: '8.76°S 116.28°E' },
  { code: 'HND', at: '35.55°N 139.78°E' },
  { code: 'EIN', at: '51.45°N 5.37°E' },
].map((s, i) => ({ ...s, x: 770 + i * 110 }));

/* ------------------------------------------------------------------ timeline (seconds) */
const T = {
  intro: 1.1,
  gate: 1.15,
  fall: [1.2, 1.52] as const,
  slope: [1.52, 2.42] as const,
  flight: [2.42, 3.17] as const,
};
const CHAIN0 = T.flight[1]; // S-03 starts when the ball lands on the tail
// offsets relative to the chain start (also used when a visitor's ball re-triggers it)
const C = {
  pop: 0,
  hit: 0.17,
  signal: [0.17, 0.42] as const,
  eyes: 0.42,
  lift: [0.5, 1.15] as const,
  wheel: [0.55, 2.5] as const,
  print: [0.95, 2.35] as const,
  takeoff: [2.35, 3.2] as const,
  hops: [3.2, 4.6] as const,
  stamp: 4.6,
  done: 5.2,
};
export const RUN_END = CHAIN0 + C.done;

/* ------------------------------------------------------------------ static drawing */
function staticShapes(): Shape[] {
  const s: Shape[] = [];
  const ink = (pts: Pt[], closed = false, width?: number) => s.push({ pts, closed, kind: 'ink', width });
  const faint = (pts: Pt[], closed = false, dash?: number[]) => s.push({ pts, closed, kind: 'faint', dash });

  // ground with hatching
  ink([
    [0, GROUND],
    [W, GROUND],
  ]);
  for (let x = 6; x < W; x += 14)
    faint([
      [x, GROUND],
      [x - 8, GROUND + 8],
    ]);

  // S-01 hopper
  ink(HOPPER);
  ink(HOPPER_R);
  faint([
    [56, 40],
    [156, 40],
  ]);

  // S-02 mountain: left flank, slope (right flank), kicker body, snow line, trees, contour hatching
  ink([[24, GROUND], [64, 360], [92, 230], [112, 150]]);
  ink(SLOPE, false, 1.6);
  ink([LIP, [472, GROUND]]);
  faint([[60, 380], [96, 352], [130, 372], [170, 330], [206, 346], [246, 312]], false, [5, 5]);
  for (const [tx, ty, h] of [
    [70, 560, 34],
    [104, 548, 46],
    [140, 566, 30],
    [176, 552, 40],
    [214, 570, 26],
  ] as [number, number, number][]) {
    ink([
      [tx - h * 0.32, ty],
      [tx, ty - h],
      [tx + h * 0.32, ty],
      [tx - h * 0.32, ty],
    ]);
    ink([
      [tx, ty],
      [tx, ty + 10],
    ]);
  }
  for (let i = 1; i < 7; i++) {
    const y = 210 + i * 54;
    const xl = 92 - (y - 230) * 0.22;
    const xr = 112 + (y - 150) * 0.81;
    faint([
      [xl + 10, y],
      [Math.min(xr - 6, 460), y],
    ]);
  }
  // snowboard on the kicker lip (drawn over the last slope segments)
  const sbA: Pt = [374, 451],
    sbB: Pt = [462, 431];
  ink([sbA, sbB], false, 3);
  faint([
    [400, 466],
    [440, 457],
  ]);

  // S-03 grind box with a flat rail on top
  ink(rect(BOX.x0, BOX.top, BOX.x1, GROUND), true);
  faint([
    [BOX.x0 + 6, BOX.top + 8],
    [BOX.x1 - 6, BOX.top + 8],
  ]);
  for (let x = BOX.x0 + 20; x < BOX.x1; x += 40)
    faint([
      [x, BOX.top + 8],
      [x, GROUND],
    ]);
  // trigger post + button + signal wire to the helmet stand
  ink([
    [TRIGGER[0], BOX.top],
    [TRIGGER[0], TRIGGER[1] + 6],
  ]);
  s.push({
    pts: [
      [TRIGGER[0], GROUND - 4],
      [TRIGGER[0], BOX.top + 2],
    ],
    kind: 'faint',
    dash: [3, 4],
  });
  s.push({
    pts: [
      [TRIGGER[0], GROUND - 4],
      [870, GROUND - 4],
    ],
    kind: 'faint',
    dash: [3, 4],
  });

  // S-04 helmet: shell, details; stand
  ink(helmet.shell.map(hp), true, 1.4);
  for (const d of helmet.details) faint(d.map(hp));
  ink([
    [870, HY + HS * 0.99],
    [870, GROUND],
  ]);
  ink([
    [828, GROUND],
    [912, GROUND],
  ]);
  // pulley on its own post
  ink(circlePts(PULLEY[0], PULLEY[1], 8, 18), true);
  ink([
    [PULLEY[0], PULLEY[1] + 8],
    [PULLEY[0], GROUND],
  ]);
  ink([
    [PULLEY[0] - 14, GROUND],
    [PULLEY[0] + 14, GROUND],
  ]);

  // S-05 wheel stand
  ink([
    [WHEEL[0] - 40, GROUND],
    [WHEEL[0], WHEEL[1]],
    [WHEEL[0] + 40, GROUND],
  ]);

  // S-06 printer frame (double-line extrusions), gantry rail, bed
  ink(rect(PR.x0, PR.y0, PR.x1, PR.y1), true, 1.4);
  faint(rect(PR.x0 + 8, PR.y0 + 8, PR.x1 - 8, PR.y1 - 8), true);
  ink([
    [PR.x0 + 8, PR.gantry],
    [PR.x1 - 8, PR.gantry],
  ]);
  ink([
    [PR.x0 + 16, PR.bed],
    [PR.x1 - 16, PR.bed],
  ]);
  faint([
    [PR.x0 + 30, PR.bed],
    [PR.x0 + 30, PR.y1 - 8],
  ]);
  faint([
    [PR.x1 - 30, PR.bed],
    [PR.x1 - 30, PR.y1 - 8],
  ]);
  ink(circlePts(PRINT_PULLEY[0], PRINT_PULLEY[1], 12, 20), true);

  // S-07 route line
  s.push({
    pts: [
      [740, ROUTE_Y],
      [1560, ROUTE_Y],
    ],
    kind: 'faint',
    dash: [2, 5],
  });
  for (const st of STOPS) ink(circlePts(st.x, ROUTE_Y, 4, 14), true);

  return s;
}

/* ------------------------------------------------------------------ scripted ball */
const SLOPE_LEN = polyLen(SLOPE);
const SLOPE_V0 = 160;
const SLOPE_DUR = T.slope[1] - T.slope[0];
const SLOPE_A = (2 * (SLOPE_LEN - SLOPE_V0 * SLOPE_DUR)) / (SLOPE_DUR * SLOPE_DUR);
const FLIGHT_DUR = T.flight[1] - T.flight[0];
const TAIL: Pt = [BOARD_C[0] - BOARD_LEN / 2 + 8, BOARD_C[1] - 14];
const FLIGHT_VY = (TAIL[1] - BALL_R - LIP[1] + BALL_R - 0.5 * G * FLIGHT_DUR * FLIGHT_DUR) / FLIGHT_DUR;
const REST: Pt = [528, GROUND - BALL_R];

function scriptedBall(t: number): Pt | null {
  if (t < T.gate) return BALL_START;
  if (t < T.fall[1]) {
    const k = t - T.fall[0];
    if (k < 0) return BALL_START;
    const y = BALL_START[1] + 0.5 * G * k * k;
    return [BALL_START[0], Math.min(y, SLOPE[0][1] - BALL_R)];
  }
  if (t < T.slope[1]) {
    const k = t - T.slope[0];
    const { p, dir } = along(SLOPE, SLOPE_V0 * k + 0.5 * SLOPE_A * k * k);
    return [p[0] + dir[1] * BALL_R, p[1] - dir[0] * BALL_R]; // sit on the line, not in it
  }
  if (t < T.flight[1]) {
    const k = t - T.flight[0];
    const x = lerp(LIP[0], TAIL[0], k / FLIGHT_DUR);
    const y = LIP[1] - BALL_R + FLIGHT_VY * k + 0.5 * G * k * k;
    return [x, y];
  }
  // bounce off the tail, drop to the ground, roll to rest
  const k = t - T.flight[1];
  const bounce = 0.55;
  if (k < bounce) {
    const u = k / bounce;
    const x = lerp(TAIL[0], REST[0] + 6, u);
    const y = TAIL[1] - BALL_R - 160 * k + 0.5 * G * k * k;
    return [x, Math.min(y, REST[1])];
  }
  return [lerp(REST[0] + 6, REST[0], easeOut((k - bounce) / 0.4)), REST[1]];
}

/* ------------------------------------------------------------------ stage states */
function boardPose(c: number): { center: Pt; angle: number } {
  // ollie in place: tail snaps, nose rises into the trigger, lands back
  if (c < 0 || c > 0.55) return { center: BOARD_C, angle: 0 };
  const lift = 72 * Math.sin((Math.PI * c) / 0.55);
  const angle = -0.42 * Math.sin(Math.PI * Math.min(1, c / 0.4)) * (c < 0.4 ? 1 : 0);
  return { center: [BOARD_C[0] + 10 * Math.sin((Math.PI * c) / 0.55), BOARD_C[1] - lift], angle };
}
const faceLift = (c: number) => easeInOut(span(c, C.lift[0], C.lift[1]));
const wheelAngle = (c: number) => {
  const k = span(c, C.wheel[0], C.wheel[1]);
  return Math.PI * 2 * 2.6 * (1 - Math.pow(1 - k, 2.4)); // spins up hard, coasts down
};
const printProgress = (c: number) => span(c, C.print[0], C.print[1]);

function planePose(c: number): { p: Pt; a: number; visible: boolean; atStop: number } {
  const start: Pt = [1334, 536];
  if (c < C.takeoff[0]) return { p: start, a: 0, visible: false, atStop: -1 };
  if (c < C.takeoff[1]) {
    const k = easeInOut(span(c, C.takeoff[0], C.takeoff[1]));
    const p = bez(start, [1334, 280], [1000, 70], [STOPS[0].x, ROUTE_Y - 16], k);
    const q = bez(start, [1334, 280], [1000, 70], [STOPS[0].x, ROUTE_Y - 16], Math.min(1, k + 0.02));
    return { p, a: Math.atan2(q[1] - p[1], q[0] - p[0]), visible: true, atStop: -1 };
  }
  const hops = STOPS.length - 1;
  const k = span(c, C.hops[0], C.hops[1]) * hops;
  const i = Math.min(hops - 1, Math.floor(k));
  const u = k - i;
  const a = STOPS[i].x,
    b = STOPS[i + 1].x;
  const x = lerp(a, b, u);
  const y = ROUTE_Y - 16 - Math.sin(Math.PI * u) * 22;
  const slope = Math.cos(Math.PI * u) * -22 * Math.PI;
  return { p: [x, y], a: Math.atan2(slope, b - a) * 0.6, visible: true, atStop: k >= hops ? hops : i };
}

/* ------------------------------------------------------------------ physics for visitor balls */
type Seg = [Pt, Pt];
type Ball = { p: Pt; v: Pt; rest: number; born: number };
function colliders(): Seg[] {
  const segs: Seg[] = [];
  const poly = (pts: Pt[], closed = false) => {
    for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
    if (closed) segs.push([pts[pts.length - 1], pts[0]]);
  };
  poly([
    [-200, GROUND],
    [W + 200, GROUND],
  ]);
  poly(HOPPER);
  poly(HOPPER_R);
  poly([[24, GROUND], [64, 360], [92, 230], [112, 150]]);
  poly(SLOPE);
  poly([LIP, [472, GROUND]]);
  poly(rect(BOX.x0, BOX.top, BOX.x1, GROUND), true);
  poly([
    [TRIGGER[0], BOX.top],
    [TRIGGER[0], TRIGGER[1]],
  ]);
  poly(helmet.shell.map(hp), true);
  poly([
    [870, HY + HS],
    [870, GROUND],
  ]);
  poly(rect(PR.x0, PR.y0, PR.x1, PR.y1), true);
  poly([
    [-2, -400],
    [-2, GROUND],
  ]);
  poly([
    [W + 2, -400],
    [W + 2, GROUND],
  ]);
  return segs;
}

/* ------------------------------------------------------------------ public API */
export type MachineOptions = {
  container: HTMLElement;
  labels: HTMLElement[]; // elements with data-at="x,y" (design coords) and data-stage
  ink: string;
  accent: string;
  reduced: boolean;
  onStage?: (stage: string) => void;
  onFinale?: () => void;
};

export type Machine = {
  replay(): void;
  drop(clientX: number, clientY: number): void;
  pan(dx: number): void;
  setColors(ink: string, accent: string): void;
  setActive(on: boolean): void;
  resize(): void;
  destroy(): void;
};

type Sheet = {
  img: HTMLImageElement | null;
  outlineImg: HTMLImageElement | null; // pre-made by scripts/media/make-strobes.py
  tinted: HTMLCanvasElement | null; // solid ink silhouettes
  outline: HTMLCanvasElement | null; // the same, as drawn outlines
  data: typeof snowStrobe;
};

export function createMachine(opts: MachineOptions): Machine {
  const { container, labels, reduced } = opts;
  let ink = opts.ink;
  let accent = opts.accent;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const cache = document.createElement('canvas');
  const cctx = cache.getContext('2d')!;

  const shapes = staticShapes();
  const segs = colliders();
  // plotter order: sweep left to right
  shapes.forEach((sh) => ((sh as Shape & { x: number }).x = Math.min(...sh.pts.map((p) => p[0]))));

  /* view */
  let width = 1,
    height = 1,
    dpr = 1,
    scale = 1,
    offX = 0,
    offY = 0,
    camX = 0,
    camTarget = 0,
    pannable = false,
    userPanned = false;

  /* time */
  let clock = reduced ? RUN_END + 1 : 0; // seconds into the scripted run
  let chain: number = CHAIN0; // when the S-03… chain last started (visitor balls move this)
  let running = !reduced;
  let cacheValid = false;
  let finaleFired = false;
  let lastStage = '';
  let active = true;
  let raf = 0;
  let last = 0;
  const balls: Ball[] = [];

  /* strobes */
  const sheets: Record<'snow' | 'skate', Sheet> = {
    snow: { img: null, outlineImg: null, tinted: null, outline: null, data: snowStrobe },
    skate: { img: null, outlineImg: null, tinted: null, outline: null, data: skateStrobe as typeof snowStrobe },
  };
  const idle = (fn: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 50);
  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  const loadSheet = async (key: 'snow' | 'skate') => {
    const sh = sheets[key];
    const [img, outlineImg] = await Promise.all([loadImg(sh.data.src), loadImg(sh.data.outline)]);
    await Promise.all([img.decode?.(), outlineImg.decode?.()]).catch(() => {});
    sh.img = img;
    sh.outlineImg = outlineImg;
    idle(() => {
      tint(key);
      kick();
    });
  };
  // recolour both sprites to the current ink: one fill each, no per-pixel work
  const paint = (src: HTMLImageElement, into: HTMLCanvasElement | null) => {
    const c = into ?? document.createElement('canvas');
    c.width = src.naturalWidth;
    c.height = src.naturalHeight;
    const x = c.getContext('2d')!;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = ink;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };
  const tint = (key: 'snow' | 'skate') => {
    const sh = sheets[key];
    if (!sh.img || !sh.outlineImg) return;
    sh.tinted = paint(sh.img, sh.tinted);
    sh.outline = paint(sh.outlineImg, sh.outline);
  };
  loadSheet('snow');
  loadSheet('skate');

  // where each strobe frame sits (design coords): the backflip arcs over the kicker,
  // the skate frames ride along the box
  // every other exposure: five frames read as a sequence, nine pile into a cloud
  const snowSlots = snowStrobe.frames
    .filter((_, i) => i % 2 === 0)
    .map((f, i, all) => {
      const u = i / (all.length - 1);
      const s = 122 / snowStrobe.height;
      return { f, x: lerp(452, 742, u), base: 330 - Math.sin(Math.PI * u) * 150 + (1 - u) * 14, s, t: T.flight[0] + u * 0.68 };
    });
  const skateSlots = skateStrobe.frames.map((f, i, all) => {
    const u = i / (all.length - 1);
    const s = 128 / skateStrobe.height;
    return { f, x: lerp(566, 690, u), base: 548, s, t: CHAIN0 + u * 0.42 };
  });

  /* ---------------------------------------------------------- layout */
  function fit() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const fitW = width / W;
    const fitH = height / H;
    // phones: fit the height and pan along the machine; wide screens: fit everything
    pannable = fitW < fitH * 0.72;
    scale = pannable ? Math.min(fitH, 0.78) : Math.min(fitW, fitH);
    container.parentElement?.toggleAttribute('data-pannable', pannable);
    offY = (height - H * scale) / 2;
    offX = pannable ? 0 : (width - W * scale) / 2;
    cache.width = Math.round(W * scale * dpr);
    cache.height = Math.round(H * scale * dpr);
    cacheValid = false;
    camX = clampCam(camX);
    // not running (reduced motion): park the camera on the middle of the machine
    if (pannable && !running && !userPanned) camX = camTarget = clampCam(760 * scale - width / 2);
  }
  const maxCam = () => Math.max(0, W * scale - width);
  const clampCam = (x: number) => Math.min(maxCam(), Math.max(0, x));

  /* ---------------------------------------------------------- drawing */
  function strokeShapes(c: CanvasRenderingContext2D, progress: number) {
    for (const sh of shapes) {
      const sx = (sh as Shape & { x: number }).x;
      const local = clamp01(progress * 1.6 - (sx / W) * 0.6); // left-to-right plotter sweep, all done at 1
      if (local <= 0) continue;
      c.globalAlpha = sh.kind === 'faint' ? 0.38 : 1;
      c.strokeStyle = sh.kind === 'accent' ? accent : ink;
      c.lineWidth = ((sh.width ?? 1) * LW) / scale;
      c.setLineDash(sh.dash ? sh.dash.map((d) => d / 1) : []);
      c.beginPath();
      const pts = sh.pts;
      const n = Math.max(2, Math.ceil(pts.length * local));
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n && i < pts.length; i++) {
        if (i === n - 1 && local < 1) {
          // partial last segment
          const f = pts.length * local - (n - 1);
          c.lineTo(lerp(pts[i - 1][0], pts[i][0], clamp01(f)), lerp(pts[i - 1][1], pts[i][1], clamp01(f)));
        } else c.lineTo(pts[i][0], pts[i][1]);
      }
      if (sh.closed && local >= 1) c.closePath();
      c.stroke();
    }
    c.setLineDash([]);
    c.globalAlpha = 1;
  }

  function buildCache() {
    cctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    cctx.clearRect(0, 0, W, H);
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';
    strokeShapes(cctx, 1);
    cacheValid = true;
  }

  function line(c: CanvasRenderingContext2D, pts: Pt[], closed = false, w = 1) {
    c.lineWidth = (w * LW) / scale;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (closed) c.closePath();
    c.stroke();
  }

  function drawStrobe(c: CanvasRenderingContext2D, key: 'snow' | 'skate', slots: typeof snowSlots, now: number, shift: number) {
    const sh = sheets[key];
    if (!sh.tinted || !sh.outline) return;
    let newest = -1;
    slots.forEach((s, i) => now >= s.t + shift && (newest = i));
    const settled = now > slots[slots.length - 1].t + shift + 0.35;
    const keyFrame = Math.floor(slots.length / 2); // the peak of the trick
    slots.forEach((slot, i) => {
      const t0 = slot.t + shift;
      if (now < t0) return;
      // chronophotography: every exposure stays as a light ghost with a drawn edge;
      // the newest (or, once settled, the peak frame) is solid
      const solid = settled ? i === keyFrame : i === newest;
      const fade = clamp01((now - t0) / 0.06);
      const f = slot.f;
      const w = f.w * slot.s,
        h = f.h * slot.s;
      const dx = slot.x - w / 2,
        dy = slot.base - h;
      c.globalAlpha = fade * (solid ? 0.92 : 0.16);
      c.drawImage(sh.tinted!, f.x, f.y, f.w, f.h, dx, dy, w, h);
      if (!solid) {
        c.globalAlpha = fade * 0.55;
        c.drawImage(sh.outline!, f.x, f.y, f.w, f.h, dx, dy, w, h);
      }
    });
    c.globalAlpha = 1;
  }

  function frame() {
    // camera
    camX = clampCam(lerp(camX, clampCam(camTarget), 0.12));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const intro = reduced ? 1 : clamp01(clock / T.intro);
    if (intro < 1) {
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX - camX), dpr * offY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokeShapes(ctx, intro);
    } else {
      if (!cacheValid) buildCache();
      ctx.drawImage(cache, Math.round((offX - camX) * dpr) / dpr, offY, W * scale, H * scale);
    }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX - camX), dpr * offY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const t = clock;
    const c = t - chain; // chain-local time (S-03 onwards)
    const cStrobe = chain - CHAIN0; // shift skate strobe when re-triggered

    /* hopper gate */
    ctx.strokeStyle = ink;
    const gate = easeOut(span(t, T.gate - 0.15, T.gate));
    line(ctx, [
      [100, 118],
      rot([124, 118], [100, 118], gate * 1.2),
    ]);

    /* strobes */
    drawStrobe(ctx, 'snow', snowSlots, t, 0);
    drawStrobe(ctx, 'skate', skateSlots, t, cStrobe);

    /* board */
    const pose = boardPose(c);
    const half = BOARD_LEN / 2;
    const deck: Pt[] = [
      [-half + 10, 0],
      [half - 10, 0],
    ].map(([x, y]) => rot([pose.center[0] + x, pose.center[1] + y], pose.center, pose.angle));
    const tail = rot([pose.center[0] - half, pose.center[1] - 9], pose.center, pose.angle);
    const nose = rot([pose.center[0] + half, pose.center[1] - 9], pose.center, pose.angle);
    ctx.strokeStyle = ink;
    line(ctx, [tail, deck[0], deck[1], nose], false, 2.4);
    for (const wx of [-40, 40]) {
      const w = rot([pose.center[0] + wx, pose.center[1] + 6], pose.center, pose.angle);
      ctx.beginPath();
      ctx.arc(w[0], w[1], 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* trigger button + signal pulse */
    const pressed = c >= C.hit && c < C.hit + 0.25;
    ctx.fillStyle = c >= C.hit ? accent : 'transparent';
    ctx.strokeStyle = c >= C.hit ? accent : ink;
    ctx.beginPath();
    ctx.rect(TRIGGER[0] - 9, TRIGGER[1] - (pressed ? 4 : 8), 18, pressed ? 6 : 10);
    ctx.fill();
    ctx.stroke();
    const sig = span(c, C.signal[0], C.signal[1]);
    if (sig > 0 && sig < 1) {
      const path: Pt[] = [
        [TRIGGER[0], BOX.top],
        [TRIGGER[0], GROUND - 4],
        [870, GROUND - 4],
      ];
      const { p } = along(path, sig * polyLen(path));
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fill();
    }

    /* helmet faceplate (lifts up and over), eyes, string to the wheel */
    const lift = faceLift(c);
    const faceXf = (p: Pt): Pt => {
      const r = rot(p, FACE_PIVOT, -0.32 * lift);
      return [r[0] + 10 * lift, FACE_PIVOT[1] + (r[1] - FACE_PIVOT[1]) * (1 - 0.62 * lift) - 58 * lift];
    };
    if (lift > 0.01) {
      // phantom line: where the faceplate was (engineering convention for a moved part)
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([5, 4]);
      line(ctx, helmet.faceplate.map(hp), true);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = c >= C.eyes ? accent : ink;
    line(ctx, helmet.faceplate.map((p) => faceXf(hp(p))), true, 1.3);
    const glow = c >= C.eyes ? clamp01((c - C.eyes) / 0.15) : 0;
    for (const e of EYES) {
      const pts = e.map((p) => faceXf(hp(p)));
      ctx.fillStyle = accent;
      ctx.globalAlpha = glow;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const chin = faceXf(hp(CHIN));
    const wa = wheelAngle(c);
    const spool: Pt = [WHEEL[0] - 14, WHEEL[1]];
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.8;
    line(ctx, [chin, [PULLEY[0], PULLEY[1] - 7], [PULLEY[0] + 7, PULLEY[1]], spool]);
    ctx.globalAlpha = 1;

    /* wheel: rim, tyre, 24 spokes, hub, chainring */
    ctx.strokeStyle = ink;
    ctx.lineWidth = (1.3 * LW) / scale;
    ctx.beginPath();
    ctx.arc(WHEEL[0], WHEEL[1], WHEEL_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WHEEL[0], WHEEL[1], WHEEL_R - 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = (0.75 * LW) / scale;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = wa + (i / 24) * Math.PI * 2;
      const ha = a + (i % 2 ? 0.25 : -0.25);
      ctx.moveTo(WHEEL[0] + Math.cos(ha) * 8, WHEEL[1] + Math.sin(ha) * 8);
      ctx.lineTo(WHEEL[0] + Math.cos(a) * (WHEEL_R - 7), WHEEL[1] + Math.sin(a) * (WHEEL_R - 7));
    }
    ctx.stroke();
    ctx.lineWidth = LW / scale;
    ctx.beginPath();
    ctx.arc(WHEEL[0], WHEEL[1], HUB_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = wa + (i / 5) * Math.PI * 2;
      ctx.moveTo(WHEEL[0], WHEEL[1]);
      ctx.lineTo(WHEEL[0] + Math.cos(a) * HUB_R, WHEEL[1] + Math.sin(a) * HUB_R);
    }
    ctx.stroke();

    /* chain to the printer: dashes travel with the wheel */
    ctx.setLineDash([5 / scale, 3 / scale]);
    ctx.lineDashOffset = (-wa * HUB_R) / scale;
    line(ctx, [
      [WHEEL[0], WHEEL[1] - HUB_R],
      [PRINT_PULLEY[0], PRINT_PULLEY[1] - 12],
    ]);
    line(ctx, [
      [WHEEL[0], WHEEL[1] + HUB_R],
      [PRINT_PULLEY[0], PRINT_PULLEY[1] + 12],
    ]);
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    /* printer: toolhead zigzags, the plane prints layer by layer */
    const pp = printProgress(c);
    const layersDone = pp * LAYERS;
    const ys = PLANE_PRINT.map((p) => p[1]);
    const yBottom = Math.max(...ys),
      yTop = Math.min(...ys);
    let head: Pt = [PR.x1 - 24, PR.gantry];
    const planeGone = c >= C.takeoff[0];
    if (!planeGone) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = (1.5 * LW) / scale;
      ctx.beginPath();
      for (let j = 0; j < Math.ceil(layersDone); j++) {
        const y = lerp(yBottom - 1, yTop + 1, j / (LAYERS - 1));
        const [xa, xb] = xExtent(PLANE_PRINT, y);
        const part = j < Math.floor(layersDone) ? 1 : layersDone - j;
        const dir = j % 2 ? -1 : 1;
        const from = dir > 0 ? xa : xb;
        const to = lerp(from, dir > 0 ? xb : xa, part);
        ctx.moveTo(from, y);
        ctx.lineTo(to, y);
        if (j === Math.ceil(layersDone) - 1 && pp < 1) head = [to, y - 10];
      }
      ctx.stroke();
      if (pp >= 1) {
        ctx.strokeStyle = ink;
        line(ctx, PLANE_PRINT, true, 1.2);
      }
    }
    if (pp > 0 && pp < 1) {
      // gantry follows the nozzle height
      ctx.strokeStyle = ink;
      line(ctx, [
        [PR.x0 + 8, head[1] - 12],
        [PR.x1 - 8, head[1] - 12],
      ]);
    } else head = [PR.x1 - 24, PR.gantry + 12];
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.rect(head[0] - 11, head[1] - 22, 22, 16);
    ctx.stroke();
    line(ctx, [
      [head[0] - 4, head[1] - 6],
      [head[0], head[1]],
      [head[0] + 4, head[1] - 6],
    ]);

    /* plane + route */
    const plane = planePose(c);
    STOPS.forEach((st, i) => {
      if (plane.atStop >= i && plane.visible) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(st.x, ROUTE_Y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (plane.visible && c < C.stamp + 0.05) drawPlane(plane.p, plane.a);
    if (c >= C.stamp) {
      const k = clamp01((c - C.stamp) / 0.5);
      const ein = STOPS[STOPS.length - 1].x;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 1 - k * 0.6;
      ctx.beginPath();
      ctx.arc(ein, ROUTE_Y, 6 + 22 * easeOut(k), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      drawPlane([ein, ROUTE_Y - 12], 0);
    }

    /* balls: scripted one + visitor balls, with a short strobe trail */
    ctx.fillStyle = accent;
    ctx.strokeStyle = ink;
    const sb = scriptedBall(t);
    if (sb && !(chain !== CHAIN0 && t > RUN_END)) {
      if (t > T.slope[0] && t < T.flight[1] + 0.1) {
        for (let k = 1; k <= 5; k++) {
          const q = scriptedBall(t - k * 0.06);
          if (!q) continue;
          ctx.globalAlpha = 0.5 - k * 0.08;
          ctx.beginPath();
          ctx.arc(q[0], q[1], BALL_R * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ball(sb);
    }
    for (const b of balls) ball(b.p);

    placeLabels(t, c);
  }

  function ball(p: Pt) {
    ctx.fillStyle = accent;
    ctx.strokeStyle = ink;
    ctx.lineWidth = LW / scale;
    ctx.beginPath();
    ctx.arc(p[0], p[1], BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawPlane(p: Pt, a: number) {
    const shape: Pt[] = [
      [16, 0],
      [-12, -9],
      [-6, 0],
      [-12, 8],
    ].map(([x, y]) => rot([p[0] + x, p[1] + y], p, a));
    ctx.strokeStyle = ink;
    ctx.fillStyle = 'transparent';
    line(ctx, shape, true, 1.3);
    line(ctx, [shape[2], shape[0]]);
  }

  function xExtent(poly: Pt[], y: number): [number, number] {
    const xs: number[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      if ((a[1] <= y && b[1] >= y) || (b[1] <= y && a[1] >= y)) {
        if (a[1] === b[1]) continue;
        xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : [poly[0][0], poly[0][0]];
  }

  /* ---------------------------------------------------------- labels (DOM) */
  const stageAt: Record<string, number> = {
    s1: T.gate,
    s2: T.slope[0],
    s2b: T.flight[0] + 0.1,
    s3: CHAIN0,
    s3b: CHAIN0 + 0.15,
    s4: CHAIN0 + C.eyes,
    s5: CHAIN0 + C.wheel[0],
    s6: CHAIN0 + C.print[0],
    s7: CHAIN0 + C.takeoff[0] + 0.3,
    home: CHAIN0 + C.stamp,
  };
  const labelPos = labels.map((el) => {
    const [x, y] = (el.dataset.at ?? '0,0').split(',').map(Number);
    return { el, x, y, stage: el.dataset.stage ?? '', stop: el.dataset.stop ? Number(el.dataset.stop) : -1, on: false, w: 0 };
  });
  let lastLabelCam = NaN;
  function placeLabels(t: number, c: number) {
    const plane = planePose(c);
    for (const l of labelPos) {
      const on = l.stop >= 0 ? plane.visible && plane.atStop >= l.stop : t >= (stageAt[l.stage] ?? 0);
      if (on !== l.on) {
        l.on = on;
        l.el.classList.toggle('is-on', on);
      }
    }
    // the active stage (for the phone caption + camera)
    const order = ['s1', 's2', 's2b', 's3', 's3b', 's4', 's5', 's6', 's7', 'home'];
    const current = order.filter((k) => t >= stageAt[k]).pop() ?? '';
    if (current !== lastStage) {
      lastStage = current;
      opts.onStage?.(current);
      labelsDirty = true;
    }
    if (camX === lastLabelCam && !labelsDirty) return;
    lastLabelCam = camX;
    labelsDirty = false;
    for (const l of labelPos) {
      let x = offX - camX + l.x * scale;
      const y = offY + l.y * scale;
      if (pannable && l.stop < 0 && running) {
        // phones: keep the active callout fully on screen while the drawing pans
        const box = l.el.firstElementChild as HTMLElement | null;
        const w = (l.w ||= box?.offsetWidth ?? 0);
        const right = l.el.classList.contains('mlabel--right');
        x = right ? Math.min(Math.max(x, w + 8), width - 8) : Math.min(Math.max(x, 8), width - w - 8);
      }
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }
  let labelsDirty = true;

  /* ---------------------------------------------------------- camera focus (phones) */
  function focusX(t: number): number {
    const c = t - chain;
    if (t < T.flight[1]) return (scriptedBall(t) ?? BALL_START)[0];
    if (c < C.lift[1]) return 780;
    if (c < C.print[0]) return 1080;
    if (c < C.takeoff[0]) return 1330;
    const pl = planePose(c);
    if (c < C.done) return pl.p[0];
    return 760; // landed: drift back to the middle of the machine
  }

  /* ---------------------------------------------------------- physics */
  function stepBalls(dt: number) {
    for (const b of balls) {
      const sub = 4;
      const h = dt / sub;
      for (let k = 0; k < sub; k++) {
        b.v[1] += G * h;
        b.p[0] += b.v[0] * h;
        b.p[1] += b.v[1] * h;
        for (const [a, q] of segs) collide(b, a, q);
        // the board is a live collider: hitting the tail hard enough re-runs the chain
        const tailZone = b.p[0] > BOX.x0 && b.p[0] < BOARD_C[0] - 20 && Math.abs(b.p[1] - (BOARD_C[1] - BALL_R)) < 12;
        if (tailZone && b.v[1] > 260 && clock - chain > C.done) retrigger();
        if (b.p[0] > BOX.x0 && b.p[0] < BOX.x1 && b.p[1] > BOARD_C[1] - BALL_R - 6 && b.p[1] < BOX.top) {
          b.p[1] = BOARD_C[1] - BALL_R - 6;
          if (b.v[1] > 0) b.v[1] *= -0.45;
        }
      }
      const speed = Math.hypot(b.v[0], b.v[1]);
      b.rest = speed < 12 ? b.rest + dt : 0;
    }
    // tidy: settled balls fade after a while, never more than eight
    for (let i = balls.length - 1; i >= 0; i--) if (balls[i].rest > 6 || balls[i].p[1] > H + 100) balls.splice(i, 1);
    while (balls.length > 8) balls.shift();
  }
  function collide(b: Ball, a: Pt, q: Pt) {
    const dx = q[0] - a[0],
      dy = q[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const u = clamp01(((b.p[0] - a[0]) * dx + (b.p[1] - a[1]) * dy) / len2);
    const cx = a[0] + dx * u,
      cy = a[1] + dy * u;
    let nx = b.p[0] - cx,
      ny = b.p[1] - cy;
    const d = Math.hypot(nx, ny);
    if (d >= BALL_R || d === 0) return;
    nx /= d;
    ny /= d;
    b.p[0] = cx + nx * BALL_R;
    b.p[1] = cy + ny * BALL_R;
    const vn = b.v[0] * nx + b.v[1] * ny;
    if (vn < 0) {
      const e = 0.42; // restitution
      b.v[0] -= (1 + e) * vn * nx;
      b.v[1] -= (1 + e) * vn * ny;
      // rolling friction along the surface
      b.v[0] *= 0.992;
      b.v[1] *= 0.992;
    }
  }
  function retrigger() {
    chain = clock;
    finaleFired = true; // headline is already inked; don't re-fire
  }

  /* ---------------------------------------------------------- loop */
  function loop(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (running) clock += dt;
    if (balls.length) stepBalls(dt);
    if (pannable && !userPanned) camTarget = (running ? focusX(clock) : 760) * scale - width / 2;
    frame();
    if (!finaleFired && clock >= CHAIN0 + C.stamp) {
      finaleFired = true;
      opts.onFinale?.();
    }
    const chainBusy = clock - chain < C.done + 0.2;
    const moving = (running && (clock < RUN_END + 0.2 || chainBusy)) || balls.length > 0 || Math.abs(camX - clampCam(camTarget)) > 0.5;
    if (moving && active) raf = requestAnimationFrame(loop);
    else last = 0;
  }
  const kick = () => {
    if (!raf && active) raf = requestAnimationFrame(loop);
  };

  fit();
  if (reduced) {
    if (pannable) camTarget = camX = clampCam(760 * scale - width / 2);
    finaleFired = true;
    opts.onFinale?.();
  }
  kick();

  return {
    replay() {
      clock = 0;
      chain = CHAIN0;
      running = true;
      finaleFired = false;
      userPanned = false;
      balls.length = 0;
      cacheValid = false;
      kick();
    },
    drop(clientX, clientY) {
      const r = container.getBoundingClientRect();
      const x = (clientX - r.left - offX + camX) / scale;
      const y = Math.max(20, (clientY - r.top - offY) / scale);
      if (x < 0 || x > W || y > GROUND - BALL_R) return;
      running = true;
      if (clock < RUN_END) clock = RUN_END; // a click during the intro skips to the playground
      balls.push({ p: [x, y], v: [0, 0], rest: 0, born: clock });
      kick();
    },
    pan(dx) {
      if (!pannable) return;
      userPanned = true;
      camTarget = clampCam(camTarget - dx);
      camX = camTarget;
      labelsDirty = true;
      kick();
    },
    setColors(i, a) {
      ink = i;
      accent = a;
      tint('snow');
      tint('skate');
      cacheValid = false;
      kick();
      if (!raf) frame();
    },
    setActive(on) {
      active = on;
      if (on) kick();
    },
    resize() {
      fit();
      labelPos.forEach((l) => (l.w = 0));
      labelsDirty = true;
      kick();
      if (!raf) frame();
    },
    destroy() {
      cancelAnimationFrame(raf);
      canvas.remove();
    },
  };
}
