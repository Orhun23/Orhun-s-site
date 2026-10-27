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
  return {
    ink: cs.getPropertyValue('--ink').trim(),
    accent: cs.getPropertyValue('--accent').trim(),
    line: cs.getPropertyValue('--ink-3').trim(),
  };
};

type Item = {
  el: HTMLElement;
  mode: 'scroll' | 'auto';
  view: HTMLElement;
  photo: HTMLElement | null;
  photoIn: HTMLElement | null;
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
  sp: number; // touch: the smoothed progress actually drawn (-1 = not started)
  top: number; // touch: cached page geometry, so a scroll frame never reads layout
  h: number;
  vw: number;
  played: boolean;
  seen: boolean;
  out: { clip: string; scan: string; scanOn: boolean; pct: number; bar: string; rows: number; done: boolean }; // auto mode: has it been on screen (enough) yet
};

export function initBench() {
  const reduced = reducedMotion();
  const touch = !finePointer();
  const items: Item[] = [...document.querySelectorAll<HTMLElement>('[data-insp]')].map((el) => ({
    el,
    mode: (el.dataset.mode as 'scroll' | 'auto') ?? 'scroll',
    view: el.querySelector('[data-insp-view]')!,
    photo: el.querySelector('[data-insp-photo]'),
    photoIn: el.querySelector('[data-insp-photo-in]'),
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
    sp: -1,
    top: 0,
    h: 0,
    vw: 0,
    played: false,
    seen: false,
    out: { clip: '', scan: '', scanOn: false, pct: -1, bar: '', rows: -1, done: false },
  }));
  if (!items.length) return;

  async function load(it: Item) {
    if (it.engine || it.loading || !it.el.dataset.model) return;
    it.loading = true;
    const [{ createExploded }, mod] = await Promise.all([import('./engine'), models[it.el.dataset.model]()]);
    const { ink, accent, line } = colorsOf(it.el);
    it.engine = createExploded({
      container: it.el.querySelector('[data-insp-canvas]')!,
      overlay: it.el.querySelector<HTMLElement>('[data-insp-overlay]')!,
      model: mod.default,
      ink,
      accent,
      reduced,
      lean: finePointer() ? undefined : { line },
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
    } else if (touch) {
      it.sp = -1;
      glideKick();
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
      const x = ((1 - wipe) * 100).toFixed(1);
      if (x !== o.clip) {
        o.clip = x;
        if (touch) {
          // touch: two counter-moving transforms (window slides, photo stays put), GPU-only,
          // where a clip-path would repaint the whole photo every frame
          it.photo.style.transform = `translate3d(${x}%,0,0)`;
          if (it.photoIn) it.photoIn.style.transform = `translate3d(-${x}%,0,0)`;
        } else it.photo.style.clipPath = `inset(0 0 0 ${x}%)`;
      }
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
                  : 'As built · hold for x-ray';
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

  // ---- touch: phones hand out scroll positions at different rates and in uneven steps
  // (60/90/120 Hz, iOS momentum), so the drawing never follows the raw value. It glides
  // toward it at the same pace on every refresh rate, from cached geometry (no layout reads).
  let clientH = document.documentElement.clientHeight; // stable while the URL bar slides
  // the scroll position, taken in the scroll event: it fires before the frame's animation
  // callbacks write anything, and in Chrome reading scrollY after a write forces a layout
  let sy = scrollY;
  function measure() {
    clientH = document.documentElement.clientHeight;
    const y = (sy = scrollY);
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      it.top = r.top + y;
      it.h = r.height;
      it.vw = it.view.clientWidth;
    }
  }
  const targetOf = (it: Item, y: number) => {
    const total = it.h - clientH;
    return total > 0 ? clamp01((y - it.top) / total) : 1;
  };
  let glideRaf = 0,
    glideLast = 0;
  function glide(now: number) {
    glideRaf = 0;
    const dt = glideLast ? Math.min(0.1, (now - glideLast) / 1000) : 1 / 60;
    glideLast = now;
    const k = 1 - Math.exp(-dt / 0.085); // ~85 ms time constant, whatever the refresh rate
    const y = sy;
    let moving = false;
    for (const it of items) {
      if (reduced || !it.near || !it.engine || it.mode !== 'scroll') continue;
      const t = targetOf(it, y);
      let c = it.sp < 0 ? t : it.sp + (t - it.sp) * k;
      if (Math.abs(t - c) < 0.0006) c = t;
      else moving = true;
      it.sp = c;
      apply(it, c, it.vw);
    }
    if (moving) glideRaf = requestAnimationFrame(glide);
    else glideLast = 0;
  }
  const glideKick = () => {
    if (!glideRaf) glideRaf = requestAnimationFrame(glide);
  };

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
        it.el.classList.toggle('is-near', it.near);
        if (it.near && touch) {
          // arriving from elsewhere (a jump, a fast fling): start where the scroll is, no glide from 0
          it.sp = -1;
          glideKick();
        }
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
  const onScroll = touch
    ? () => {
        sy = scrollY;
        glideKick();
      }
    : () => {
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
    if (touch) measure();
    onScroll();
  });
  if (touch) {
    measure();
    // lazy images and fonts above the bench move it: re-measure when the page changes height
    new ResizeObserver(() => {
      measure();
      glideKick();
    }).observe(document.body);
  }

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
    } else if (!reduced) {
      // touch: drag the drawing to turn it; press and hold the finished photo for the x-ray lens
      let start: { x: number; y: number } | null = null;
      let hold = 0;
      const local = (e: PointerEvent) => {
        const r = it.view.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top, r.width, r.height] as const;
      };
      const lensAt = (x: number, y: number) => {
        it.xray?.style.setProperty('--mx', `${x}px`);
        it.xray?.style.setProperty('--my', `${y}px`);
      };
      const holdScroll = (e: TouchEvent) => e.preventDefault(); // the finger steers the lens
      const end = () => {
        start = null;
        clearTimeout(hold);
        it.view.removeEventListener('touchmove', holdScroll);
        it.el.classList.remove('is-lens');
        it.engine?.pointer(0, 0);
      };
      it.view.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const [x, y] = local(e);
        start = { x: e.clientX, y: e.clientY };
        if (it.xray && it.el.classList.contains('is-done')) {
          lensAt(x, y);
          hold = window.setTimeout(() => {
            it.el.classList.add('is-lens');
            // a blocking touch listener only while the lens is up: anywhere else it would make
            // every scroll that starts on the bench wait for the main thread
            it.view.addEventListener('touchmove', holdScroll, { passive: false });
          }, 260);
        }
      });
      it.view.addEventListener('pointermove', (e) => {
        if (!start || e.pointerType === 'mouse') return;
        const [x, y, w, h] = local(e);
        const dx = e.clientX - start.x,
          dy = e.clientY - start.y;
        if (it.el.classList.contains('is-lens')) lensAt(x, y);
        else if (Math.hypot(dx, dy) > 10) clearTimeout(hold);
        // a sideways drag turns the model, about one full tilt per half the view's width
        it.engine?.pointer(Math.max(-1, Math.min(1, dx / (w * 0.5))), Math.max(-1, Math.min(1, dy / (h * 0.8))));
      });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const) it.view.addEventListener(ev, end);
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
      const { ink, accent, line } = colorsOf(it.el);
      it.engine?.setColors(ink, accent, line);
    });
  addEventListener('themechange', recolor);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
}
