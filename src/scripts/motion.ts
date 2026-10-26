// Loaded at idle by core.ts: smooth scroll + magnetic buttons.
// No GSAP: nothing on the site needs ScrollTrigger any more, so Lenis drives itself and the
// magnetic pull is a tiny spring that writes `transform` on the button only while it moves.
import Lenis from 'lenis';
import { reducedMotion, finePointer } from './env';

export function start() {
  if (!reducedMotion()) {
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -64 }, autoRaf: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  }

  if (finePointer() && !reducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(magnetic);
  }
}

/** Short pull towards the cursor, springs back with a little overshoot when it leaves. */
function magnetic(el: HTMLElement) {
  const strength = Number(el.dataset.magnetic) || 0.25;
  let x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    tx = 0,
    ty = 0,
    raf = 0,
    last = 0;
  // stiff while following, softer (and bouncier) on release
  let k = 260,
    c = 26;

  const step = (now: number) => {
    const dt = Math.min(0.032, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    vx += (k * (tx - x) - c * vx) * dt;
    vy += (k * (ty - y) - c * vy) * dt;
    x += vx * dt;
    y += vy * dt;
    el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    const settled = Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05 && Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05;
    if (settled) {
      raf = 0;
      last = 0;
      if (tx === 0 && ty === 0) el.style.transform = '';
      return;
    }
    raf = requestAnimationFrame(step);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(step);
  };

  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width / 2)) * strength;
    ty = (e.clientY - (r.top + r.height / 2)) * strength;
    k = 260;
    c = 26;
    kick();
  });
  el.addEventListener('pointerleave', () => {
    tx = ty = 0;
    k = 170;
    c = 11;
    kick();
  });
}
