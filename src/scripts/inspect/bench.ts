// Drives every [data-insp] on the page with one passive scroll listener (batched to rAF).
// Models load only when an inspector gets near the viewport; offscreen ones don't draw.
import type { Exploded, Model } from './engine';
import { reducedMotion, finePointer, swapText } from '../env';

const models: Record<string, () => Promise<{ default: Model }>> = {
  tallbike: () => import('./models/tallbike'),
  helmet: () => import('./models/helmet'),
  xwing: () => import('./models/xwing'),
  printer: () => import('./models/printer'),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const colorsOf = (el: Element) => {
  const cs = getComputedStyle(el);
  return { ink: cs.getPropertyValue('--ink').trim(), accent: cs.getPropertyValue('--accent').trim() };
};

type Item = {
  el: HTMLElement;
  mode: 'scroll' | 'auto';
  view: HTMLElement;
  photo: HTMLElement | null;
  xray: HTMLElement | null;
  scan: HTMLElement;
  partEl: HTMLElement;
  pctEl: HTMLElement;
  bar: HTMLElement;
  rows: HTMLElement[];
  engine: Exploded | null;
  part: string;
  loading: boolean;
  near: boolean;
  p: number;
  played: boolean;
  seen: boolean;
  out: { clip: string; scan: string; scanOn: boolean; pct: number; bar: string; rows: number; done: boolean }; // auto mode: has it been on screen (enough) yet
};

export function initBench() {
  const reduced = reducedMotion();
  const items: Item[] = [...document.querySelectorAll<HTMLElement>('[data-insp]')].map((el) => ({
    el,
    mode: (el.dataset.mode as 'scroll' | 'auto') ?? 'scroll',
    view: el.querySelector('[data-insp-view]')!,
    photo: el.querySelector('[data-insp-photo]'),
    xray: el.querySelector('[data-insp-xray]'),
    scan: el.querySelector('[data-insp-scan]')!,
    partEl: el.querySelector('[data-insp-part]')!,
    pctEl: el.querySelector('[data-insp-pct]')!,
    bar: el.querySelector('[data-insp-bar]')!,
    rows: [...el.querySelectorAll<HTMLElement>('[data-insp-row]')],
    engine: null,
    part: '',
    loading: false,
    near: false,
    p: -1,
    played: false,
    seen: false,
    out: { clip: '', scan: '', scanOn: false, pct: -1, bar: '', rows: -1, done: false },
  }));
  if (!items.length) return;

  async function load(it: Item) {
    if (it.engine || it.loading || !it.el.dataset.model) return;
    it.loading = true;
    const [{ createExploded }, mod] = await Promise.all([import('./engine'), models[it.el.dataset.model]()]);
    const { ink, accent } = colorsOf(it.el);
    it.engine = createExploded({
      container: it.el.querySelector('[data-insp-canvas]')!,
      overlay: it.el.querySelector<HTMLElement>('[data-insp-overlay]')!,
      model: mod.default,
      ink,
      accent,
      reduced,
      onStatus: (s) => {
        it.part = s.part ? `Fitting ${s.part.code} · ${s.part.name}` : '';
        status(it);
      },
    });
    new ResizeObserver(() => it.engine?.resize()).observe(it.view);
    it.p = -1;
    if (reduced) apply(it, 1);
    else if (it.mode === 'auto') {
      apply(it, 0);
      if (it.seen) play(it);
    } else update(it);
  }

  // writes only: every value is compared with what's already on the page, so an idle frame
  // touches nothing and a scroll frame only touches what changed
  function apply(it: Item, p: number, viewW = it.view.clientWidth) {
    if (p === it.p) return;
    it.p = p;
    const o = it.out;
    it.engine?.setProgress(p / 0.7);
    const wipe = clamp01((p - 0.74) / 0.18);
    if (it.photo) {
      const clip = `inset(0 0 0 ${((1 - wipe) * 100).toFixed(1)}%)`;
      if (clip !== o.clip) it.photo.style.clipPath = o.clip = clip;
      const on = wipe > 0 && wipe < 1;
      if (on !== o.scanOn) it.scan.style.opacity = (o.scanOn = on) ? '1' : '0';
      const scan = `translateX(${((1 - wipe) * viewW).toFixed(0)}px)`;
      if (on && scan !== o.scan) it.scan.style.transform = o.scan = scan;
    }
    const done = wipe >= 1;
    if (done !== o.done) {
      it.el.classList.toggle('is-done', (o.done = done));
      it.engine?.setActive(!done && it.near); // the photo covers the drawing: stop drawing it
    }
    status(it);
    const pct = Math.round(p * 100);
    if (pct !== o.pct) {
      it.pctEl.textContent = String((o.pct = pct));
      it.bar.style.transform = `scaleX(${(pct / 100).toFixed(2)})`;
    }
    const rows = it.rows.filter((_, i) => p > 0.1 + i * 0.1).length;
    if (rows !== o.rows) {
      o.rows = rows;
      it.rows.forEach((r, i) => r.classList.toggle('is-on', i < rows));
    }
  }

  // what the HUD says: the inspection reads like a log
  function status(it: Item) {
    const p = it.p;
    const text =
      p <= 0.01
        ? 'Exploded view'
        : it.part && p < 0.48
          ? it.part
          : p < 0.48
            ? 'Assembling'
            : p < 0.72
              ? 'Assembled · measuring'
              : p < 0.95
                ? 'Scanning'
                : finePointer()
                  ? 'As built · hover for x-ray'
                  : 'As built · tap X-ray';
    swapText(it.partEl, text);
  }

  function update(it: Item) {
    if (it.mode !== 'scroll' || reduced) return;
    const r = it.el.getBoundingClientRect();
    const total = r.height - innerHeight;
    apply(it, total > 0 ? clamp01(-r.top / total) : 1);
  }

  // all reads first, then all writes: no read-after-write layout in the scroll frame
  let viewH = innerHeight;
  function updateAll() {
    const live = items.filter((it) => it.near && it.engine && it.mode === 'scroll' && !reduced);
    const reads = live.map((it) => [it.el.getBoundingClientRect(), it.view.clientWidth] as const);
    live.forEach((it, i) => {
      const [r, vw] = reads[i];
      const total = r.height - viewH;
      apply(it, total > 0 ? clamp01(-r.top / total) : 1, vw);
    });
  }

  function play(it: Item) {
    if (it.played) return;
    it.played = true;
    const t0 = performance.now();
    const dur = 3800;
    const step = (now: number) => {
      const k = clamp01((now - t0) / dur);
      apply(it, k);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const it = items.find((i) => i.el === e.target)!;
        it.near = e.isIntersecting;
        if (it.near) load(it);
        it.engine?.setActive(it.near && !it.el.classList.contains('is-done'));
      }
    },
    { rootMargin: '60% 0px' },
  );
  items.forEach((it) => io.observe(it.el));

  // auto mode plays once, when at least half of it is actually on screen
  const playIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const it = items.find((i) => i.el === e.target)!;
        it.seen = true;
        if (it.engine) play(it);
        playIO.unobserve(e.target);
      }
    },
    { threshold: 0.5 },
  );
  items.filter((it) => it.mode === 'auto').forEach((it) => playIO.observe(it.el));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateAll();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => {
    viewH = innerHeight;
    onScroll();
  });

  // cursor: tilt the model; over the finished photo it's an x-ray lens
  for (const it of items) {
    if (finePointer()) {
      it.view.addEventListener('pointermove', (e) => {
        const r = it.view.getBoundingClientRect();
        const x = e.clientX - r.left,
          y = e.clientY - r.top;
        it.engine?.pointer((x / r.width) * 2 - 1, (y / r.height) * 2 - 1);
        if (it.xray) {
          it.xray.style.setProperty('--mx', `${x}px`);
          it.xray.style.setProperty('--my', `${y}px`);
        }
      });
      it.view.addEventListener('pointerleave', () => it.engine?.pointer(0, 0));
    }
    const btn = it.el.querySelector<HTMLButtonElement>('[data-insp-xbtn]');
    btn?.addEventListener('click', () => {
      const on = !it.el.classList.contains('is-xray');
      it.el.classList.toggle('is-xray', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  const recolor = () =>
    items.forEach((it) => {
      const { ink, accent } = colorsOf(it.el);
      it.engine?.setColors(ink, accent);
    });
  addEventListener('themechange', recolor);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
}
