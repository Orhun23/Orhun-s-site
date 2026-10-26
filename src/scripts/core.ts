// Site-wide behaviour. Everything cheap runs right away; smooth scroll, GSAP and the
// magnetic buttons load at idle so they never sit between the user and the first paint.
import { reducedMotion, swapText } from './env';

const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);

/* ---------- reveals ---------- */
// Chrome's IntersectionObserver honours the target's own clip-path, and a wipe element starts
// fully clipped, so it would never intersect. Watch its (unclipped) parent instead.
const revealTargets = new Map<Element, Element[]>(); // watched element → elements to reveal
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      revealTargets.get(e.target)?.forEach((el) => el.classList.add('is-in'));
      revealIO.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
);
document.querySelectorAll('[data-reveal], [data-draw]').forEach((el) => {
  const watch = el.getAttribute('data-reveal') === 'wipe' && el.parentElement ? el.parentElement : el;
  const list = revealTargets.get(watch);
  if (list) list.push(el);
  else revealTargets.set(watch, [el]);
  revealIO.observe(watch);
});

/* ---------- title block: which sheet are we on ---------- */
const tbNo = document.querySelector('[data-tb-no]');
const tbTitle = document.querySelector('[data-tb-title]');
const sheets = [...document.querySelectorAll<HTMLElement>('[data-sheet]')];
if (tbNo && tbTitle && sheets.length) {
  const sheetIO = new IntersectionObserver(
    (entries) => {
      // a fast jump can deliver several sheets in one batch: only the last one counts
      const hit = entries.filter((e) => e.isIntersecting).at(-1);
      if (!hit) return;
      const el = hit.target as HTMLElement;
      swapText(tbNo, el.dataset.sheet ?? '');
      swapText(tbTitle, el.dataset.sheetTitle ?? '');
    },
    // a thin band across the middle of the viewport decides the "current" sheet
    { rootMargin: '-50% 0px -50% 0px' },
  );
  sheets.forEach((s) => sheetIO.observe(s));
}

/* ---------- chrome over the dark bench: header (top band) and title block (bottom band) ---------- */
const benches = document.querySelectorAll('.on-bench');
if (benches.length) {
  const root = document.documentElement;
  const band = (attr: string, margin: string) => {
    const hits = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? hits.add(e.target) : hits.delete(e.target);
        root.toggleAttribute(attr, hits.size > 0);
      },
      { rootMargin: margin },
    );
    benches.forEach((b) => io.observe(b));
  };
  band('data-bench-top', '0px 0px -94% 0px');
  band('data-bench-bottom', '-94% 0px 0px 0px');
}

/* ---------- local time in Eindhoven ---------- */
const clocks = document.querySelectorAll<HTMLTimeElement>('[data-clock]');
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const tick = () => {
    const s = fmt.format(new Date());
    clocks.forEach((c) => (c.textContent = s));
  };
  tick();
  setInterval(tick, 15_000);
}

/* ---------- video plates: play only while visible, never for reduced motion ---------- */
const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')];
const setBtn = (v: HTMLVideoElement) => {
  const btn = v.closest('[data-plate]')?.querySelector<HTMLButtonElement>('[data-play]');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(!v.paused));
  btn.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
};
const userPaused = new WeakSet<HTMLVideoElement>();
const videoIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting && !reducedMotion() && !userPaused.has(v)) {
        if (v.preload === 'none') v.preload = 'auto';
        v.play().catch(() => {});
      } else if (!e.isIntersecting) {
        v.pause();
      }
    }
  },
  { threshold: 0.25 },
);
// posters are big-ish images; only fetch them when the video gets near the viewport
const posterIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const v = e.target as HTMLVideoElement;
      if (v.dataset.poster) v.poster = v.dataset.poster;
      posterIO.unobserve(v);
    }
  },
  { rootMargin: '800px 0px' },
);
document.querySelectorAll<HTMLVideoElement>('video[data-poster]').forEach((v) => posterIO.observe(v));

videos.forEach((v) => {
  videoIO.observe(v);
  v.addEventListener('play', () => setBtn(v));
  v.addEventListener('pause', () => setBtn(v));
  const btn = v.closest('[data-plate]')?.querySelector<HTMLButtonElement>('[data-play]');
  btn?.addEventListener('click', () => {
    if (v.paused) {
      userPaused.delete(v);
      delete v.dataset.userPaused;
      v.play().catch(() => {});
    } else {
      userPaused.add(v);
      v.dataset.userPaused = '1';
      v.pause();
    }
  });
});

/* ---------- copy email ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('[data-copy-label]');
  const original = label?.textContent ?? '';
  let t: number | undefined;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      if (label) swapText(label, 'Copied');
    } catch {
      if (label) swapText(label, 'Copy failed — select it');
    }
    clearTimeout(t);
    t = window.setTimeout(() => label && swapText(label, original), 1800);
  });
});

idle(() => import('./motion').then((m) => m.start()));
