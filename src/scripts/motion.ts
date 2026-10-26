// Loaded at idle by core.ts: smooth scroll + GSAP-driven micro-interactions.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion, finePointer } from './env';

export function start() {
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll (off for reduced motion: native scroll is the respectful default)
  if (!reducedMotion()) {
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -64 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  }

  // magnetic buttons: short pull, springs back
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

  // trigger positions depend on images/fonts; re-measure once everything has settled
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
