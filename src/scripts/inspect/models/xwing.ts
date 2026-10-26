// B-03 X-wing. Proportions from Orhun's own drawings (exploded view + "Overall measures"):
// 460 mm long, 385 mm span, 83 mm tall. Nose along +x. Units: metres.
// Same six part groups as before; the drawing's 26 parts would be far too busy to animate.
import { type Model, type Seg, type V3, loop, path, ring, p } from '../engine';

const L = 0.46;
const HALF_SPAN = 0.385 / 2;

// fuselage: a short box at the back, then a long wedge that tapers to the nose
const sec = (x: number, w: number, h: number, dy = 0): V3[] => [p(x, h + dy, w), p(x, h + dy, -w), p(x, -h + dy, -w), p(x, -h + dy, w)];
const back = sec(0.0, 0.03, 0.026),
  mid = sec(0.17, 0.032, 0.028),
  shoulder = sec(0.26, 0.026, 0.024, -0.002),
  front = sec(0.4, 0.012, 0.011, -0.008);
const fuselage: Seg[] = [...loop(back), ...loop(mid), ...loop(shoulder)];
for (let i = 0; i < 4; i++) fuselage.push([back[i], mid[i]], [mid[i], shoulder[i]]);
fuselage.push(...path([p(0.06, 0.026, -0.03), p(0.06, 0.026, 0.03)]), ...path([p(0.11, 0.028, -0.032), p(0.11, 0.028, 0.032)]));

// nose: the long tapering section (parts 12–15 in the drawing) + cockpit (11) and canopy frame (18)
const tip = p(L, -0.012, 0);
const nose: Seg[] = [...loop(front)];
for (let i = 0; i < 4; i++) nose.push([shoulder[i], front[i]], [front[i], tip]);
nose.push(
  ...path([p(0.2, 0.028, -0.02), p(0.23, 0.05, -0.014), p(0.29, 0.043, -0.01), p(0.32, 0.022, -0.012)]),
  ...path([p(0.2, 0.028, 0.02), p(0.23, 0.05, 0.014), p(0.29, 0.043, 0.01), p(0.32, 0.022, 0.012)]),
  [p(0.23, 0.05, -0.014), p(0.23, 0.05, 0.014)],
  [p(0.29, 0.043, -0.01), p(0.29, 0.043, 0.01)],
);

// wings: four, in an X. The real model is only 83 mm tall (foils nearly closed); in this
// 3/4 view that makes wings and engines overlap into a mess, so the foils are drawn open.
const ANG = (20 * Math.PI) / 180;
const dir = (sy: number, sz: number): V3 => [0, sy * Math.sin(ANG), sz * Math.cos(ANG)];
const at = (x: number, r: number, d: V3): V3 => [x, d[1] * r, d[2] * r];
function wing(sy: number, sz: number) {
  const d = dir(sy, sz);
  const outline = loop([at(0.0, 0.03, d), at(0.15, 0.03, d), at(0.13, HALF_SPAN - 0.012, d), at(0.03, HALF_SPAN - 0.012, d)]);
  const stripe = path([at(0.05, 0.1, d), at(0.135, 0.1, d)]);
  // engine: long cylinder at the wing root, intake ring at the front (parts 8–10, 16–17)
  const c = (x: number): V3 => [x, d[1] * 0.062 + sy * 0.014, d[2] * 0.062];
  const R = 0.022;
  const engine: Seg[] = [
    ...ring(c(-0.03), R * 0.85, [0, 1, 0], [0, 0, 1], 16),
    ...ring(c(0.17), R * 1.15, [0, 1, 0], [0, 0, 1], 16),
    ...[0, 1, 2, 3].map((k) => {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const o: V3 = [0, Math.cos(a), Math.sin(a)];
      const a0 = c(-0.03),
        a1 = c(0.17);
      return [
        [a0[0], a0[1] + o[1] * R * 0.85, a0[2] + o[2] * R * 0.85],
        [a1[0], a1[1] + o[1] * R * 1.15, a1[2] + o[2] * R * 1.15],
      ] as Seg;
    }),
  ];
  // laser cannon at the tip, reaching well forward (23–25)
  const tc = at(0.08, HALF_SPAN, d);
  const cannon: Seg[] = [
    [p(0.02, tc[1], tc[2]), p(0.33, tc[1], tc[2])],
    ...ring(p(0.12, tc[1], tc[2]), 0.008, [0, 1, 0], [0, 0, 1], 10),
    ...ring(p(0.2, tc[1], tc[2]), 0.005, [0, 1, 0], [0, 0, 1], 10),
  ];
  return { outline, stripe, engine, cannon };
}
const wings = [wing(1, 1), wing(1, -1), wing(-1, 1), wing(-1, -1)];

const model: Model = {
  parts: [
    { code: 'P-01', name: 'Fuselage', segs: fuselage, explode: [0, -0.1, 0], start: 0, mobile: true },
    { code: 'P-02', name: 'Nose + cockpit', segs: nose, explode: [0.22, 0.04, 0], start: 0.08 },
    { code: 'P-03', name: 'Upper wings', segs: [...wings[0].outline, ...wings[1].outline], accent: [...wings[0].stripe, ...wings[1].stripe], explode: [0, 0.18, 0], rot: [0, 0, 0.15], start: 0.18, mobile: true },
    { code: 'P-04', name: 'Lower wings', segs: [...wings[2].outline, ...wings[3].outline], accent: [...wings[2].stripe, ...wings[3].stripe], explode: [0, -0.2, 0], rot: [0, 0, -0.15], start: 0.28 },
    { code: 'P-05', name: 'Engines ×4, weathered', segs: wings.flatMap((w) => w.engine), explode: [-0.22, 0, 0], start: 0.38, mobile: true },
    { code: 'P-06', name: 'Laser cannons ×4', segs: wings.flatMap((w) => w.cannon), explode: [0.2, 0, 0], start: 0.5 },
  ],
  dims: [
    [p(-0.03, -0.12, 0), p(L, -0.12, 0)],
    [p(-0.03, -0.135, 0), p(-0.03, -0.105, 0)],
    [p(L, -0.135, 0), p(L, -0.105, 0)],
  ],
  dimLabels: [{ at: [0.215, -0.15, 0], text: 'L 460 mm · span 385 mm' }],
  centre: [0.2, 0, 0],
  width: 0.62,
  height: 0.5,
  view: { x: 0.42, y: -0.5, turn: -0.8 },
};
export default model;
