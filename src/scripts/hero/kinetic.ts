/**
 * Kinetic hero line, after Mike Wilcock's: letters near the cursor swell wider and go thin,
 * neighbours make room, and everything eases back when the cursor leaves.
 *
 * His version animates variable-font axes (layout + paint every frame). This one is
 * GPU-only: each letter is two stacked layers, the solid glyph and the same glyph as a thin
 * outline. Near the cursor a letter scales wider (scaleX), crossfades solid → outline
 * (opacity) and its neighbours slide aside (translateX). Positions are measured once and on
 * resize, so a frame never reads layout.
 */

type Letter = {
  el: HTMLElement;
  solid: HTMLElement;
  line: HTMLElement;
  cx: number; // centre, relative to the root
  cy: number;
  w: number;
  row: number;
  f: number; // current influence 0..1
  last: string; // last written transform, to skip no-op writes
  lastO: number;
};

export type Kinetic = {
  move(x: number, y: number): void; // client coordinates
  leave(): void;
  setActive(on: boolean): void;
  measure(): void;
};

const STRETCH = 0.55; // extra width at full influence
const SPREAD = 1.7; // falloff, in letter widths

export function createKinetic(root: HTMLElement): Kinetic {
  const letters: Letter[] = [...root.querySelectorAll<HTMLElement>('[data-k]')].map((el) => ({
    el,
    solid: el.querySelector<HTMLElement>('.k__a')!,
    line: el.closest<HTMLElement>('[data-k-line]')!,
    cx: 0,
    cy: 0,
    w: 0,
    row: 0,
    f: 0,
    last: '',
    lastO: 1,
  }));
  let rows: Letter[][] = [];
  let ox = 0,
    oy = 0,
    lineH = 1,
    avgW = 1;
  let px = -1e4,
    py = -1e4,
    inside = false,
    active = true,
    raf = 0,
    last = 0;

  function measure() {
    // reset transforms so we measure the resting layout
    for (const l of letters) {
      l.el.style.transform = '';
      l.last = '';
    }
    const r = root.getBoundingClientRect();
    ox = r.left;
    oy = r.top;
    const tops: number[] = [];
    for (const l of letters) {
      const b = l.el.getBoundingClientRect();
      l.cx = b.left - ox + b.width / 2;
      l.cy = b.top - oy + b.height / 2;
      l.w = b.width;
      let row = tops.findIndex((t) => Math.abs(t - b.top) < b.height * 0.5);
      if (row < 0) row = tops.push(b.top) - 1;
      l.row = row;
      lineH = b.height;
    }
    rows = tops.map((_, i) => letters.filter((l) => l.row === i));
    avgW = letters.reduce((a, l) => a + l.w, 0) / Math.max(1, letters.length);
    for (const l of letters) write(l, 0);
  }

  function write(l: Letter, shift: number) {
    const s = 1 + STRETCH * l.f;
    const t = l.f < 0.001 && Math.abs(shift) < 0.05 ? '' : `translate3d(${shift.toFixed(2)}px,0,0) scaleX(${s.toFixed(4)})`;
    if (t !== l.last) {
      l.el.style.transform = t;
      l.last = t;
    }
    const o = Math.round((1 - l.f) * 1000) / 1000;
    if (o !== l.lastO) {
      // the outline layer sits underneath; only the solid one fades
      l.solid.style.opacity = o === 1 ? '' : String(o);
      l.lastO = o;
    }
  }

  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    // swell quickly, settle back a bit slower (like his ~0.7 s return)
    const up = 1 - Math.exp(-dt * 14),
      down = 1 - Math.exp(-dt * 6);
    const sx = avgW * SPREAD,
      sy = lineH * 0.75;
    let moving = false;
    for (const row of rows) {
      // influence per letter
      for (const l of row) {
        let target = 0;
        if (inside) {
          const dx = l.cx - px,
            dy = l.cy - py;
          target = Math.exp(-(dx * dx) / (2 * sx * sx) - (dy * dy) / (2 * sy * sy));
          if (target < 0.01) target = 0;
        }
        const k = target > l.f ? up : down;
        l.f += (target - l.f) * k;
        if (Math.abs(target - l.f) > 0.002) moving = true;
        else l.f = target;
      }
      // neighbours make room; the line keeps its left edge (it sits on the sheet's margin),
      // so the extra width pushes to the right
      let acc = 0;
      const pos: number[] = [];
      for (const l of row) {
        const extra = l.w * STRETCH * l.f;
        pos.push(acc + extra / 2);
        acc += extra;
      }
      row.forEach((l, i) => write(l, pos[i]));
    }
    if (moving && active) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const kick = () => {
    if (!raf && active) raf = requestAnimationFrame(frame);
  };

  measure();
  new ResizeObserver(() => measure()).observe(root);
  document.fonts?.ready.then(measure);

  return {
    move(x, y) {
      // positions are cached relative to the root; re-read only the root's offset (cheap)
      const r = root.getBoundingClientRect();
      ox = r.left;
      oy = r.top;
      px = x - ox;
      py = y - oy;
      inside = px > -avgW * 2 && px < r.width + avgW * 2 && py > -lineH && py < r.height + lineH;
      kick();
    },
    leave() {
      inside = false;
      kick();
    },
    setActive(on) {
      active = on;
      if (on) kick();
    },
    measure,
  };
}
