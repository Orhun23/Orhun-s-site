// Site-wide behaviour: smooth scroll, reveals, title block, clock, videos, magnetic buttons, copy email.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion, finePointer } from './env';

gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll (off for reduced motion: native scroll is the respectful default) ---------- */
let lenis: Lenis | null = null;
if (!reducedMotion()) {
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, anchors: { offset: -64 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
(window as any).__lenis = lenis;

/* ---------- reveals ---------- */
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
);
document.querySelectorAll('[data-reveal], [data-draw]').forEach((el) => revealIO.observe(el));

/* ---------- title block: which sheet are we on ---------- */
const tbNo = document.querySelector('[data-tb-no]');
const tbTitle = document.querySelector('[data-tb-title]');
const sheets = [...document.querySelectorAll<HTMLElement>('[data-sheet]')];
if (tbNo && tbTitle && sheets.length) {
  const sheetIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        tbNo.textContent = el.dataset.sheet ?? '';
        tbTitle.textContent = el.dataset.sheetTitle ?? '';
      }
    },
    // a thin band across the middle of the viewport decides the "current" sheet
    { rootMargin: '-50% 0px -50% 0px' },
  );
  sheets.forEach((s) => sheetIO.observe(s));
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
videos.forEach((v) => {
  videoIO.observe(v);
  v.addEventListener('play', () => setBtn(v));
  v.addEventListener('pause', () => setBtn(v));
  const btn = v.closest('[data-plate]')?.querySelector<HTMLButtonElement>('[data-play]');
  btn?.addEventListener('click', () => {
    if (v.paused) {
      userPaused.delete(v);
      v.play().catch(() => {});
    } else {
      userPaused.add(v);
      v.pause();
    }
  });
});

/* ---------- magnetic buttons: short pull, springs back ---------- */
if (finePointer() && !reducedMotion()) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.25;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

/* ---------- copy email ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('[data-copy-label]');
  const original = label?.textContent ?? '';
  let t: number | undefined;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      if (label) label.textContent = 'Copied';
    } catch {
      if (label) label.textContent = 'Copy failed — select it';
    }
    clearTimeout(t);
    t = window.setTimeout(() => label && (label.textContent = original), 1800);
  });
});

/* refresh trigger positions once images/fonts have settled */
window.addEventListener('load', () => ScrollTrigger.refresh());
