// B-01 Tallbike: same geometry as the 404 drawing (src/scripts/hero/tallbike.ts).
import type { Model } from '../engine';
import { parts, groundSegs, dimSegs, DIM_X, DIM_Y } from '../../hero/tallbike';

const model: Model = {
  parts: parts.map((q) => ({ ...q, start: q.start * 1.25 })),
  ground: groundSegs,
  dims: dimSegs,
  dimLabels: [
    { at: [DIM_X - 0.07, 0.9, 0], text: 'H ≈ 2× a normal bike', rotate: true },
    { at: [0.53, DIM_Y - 0.06, 0], text: 'Wheelbase: 1× a normal bike' },
  ],
  centre: [0.5, 0.88, 0],
  width: 2.1,
  height: 2.05,
  view: { x: 0.14, y: -0.5, turn: -0.7 },
};
export default model;
