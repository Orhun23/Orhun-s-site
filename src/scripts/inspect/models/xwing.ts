// B-03 X-wing: ≈ 500 mm long, ≈ 400 mm span. Nose along +x. Units: metres.
import { type Model, type Seg, type V3, loop, path, ring, p } from '../engine';

const F0 = 0.02,
  F1 = 0.36,
  NOSE = 0.5;
const S = 0.032; // fuselage half-size

// fuselage: a long box, slightly narrower at the back
const sec = (x: number, s: number): V3[] => [p(x, s, s), p(x, s, -s), p(x, -s, -s), p(x, -s, s)];
const back = sec(F0, S * 0.85),
  mid = sec(0.2, S),
  front = sec(F1, S * 0.95);
const fuselage: Seg[] = [...loop(back), ...loop(mid), ...loop(front)];
for (let i = 0; i < 4; i++) fuselage.push([back[i], mid[i]], [mid[i], front[i]]);
// panel lines
fuselage.push(...path([p(0.08, S * 0.92, -S * 0.92), p(0.08, S * 0.92, S * 0.92)]), ...path([p(0.14, S, -S), p(0.14, S, S)]));

// nose cone + cockpit canopy
const tip = p(NOSE, -0.004, 0);
const nose: Seg[] = front.map((c) => [c, tip] as Seg);
nose.push(...loop([p(F1 - 0.005, S * 0.6, S * 0.6), p(F1 - 0.005, S * 0.6, -S * 0.6), p(NOSE - 0.02, -0.002, -0.004), p(NOSE - 0.02, -0.002, 0.004)]));
const canopy: Seg[] = [
  ...path([p(0.24, S, -S * 0.7), p(0.27, S * 1.9, -S * 0.5), p(0.33, S * 1.6, -S * 0.4), p(0.36, S * 0.95, -S * 0.5)]),
  ...path([p(0.24, S, S * 0.7), p(0.27, S * 1.9, S * 0.5), p(0.33, S * 1.6, S * 0.4), p(0.36, S * 0.95, S * 0.5)]),
  [p(0.27, S * 1.9, -S * 0.5), p(0.27, S * 1.9, S * 0.5)],
  [p(0.33, S * 1.6, -S * 0.4), p(0.33, S * 1.6, S * 0.4)],
];
nose.push(...canopy);

// wings: four, in an X, opened ±13°
const ANG = (22 * Math.PI) / 180; // S-foils in attack position
const out = (sy: number, sz: number): V3 => [0, sy * Math.sin(ANG), sz * Math.cos(ANG)];
const at = (x: number, r: number, d: V3): V3 => [x, d[1] * r, d[2] * r];
function wing(sy: number, sz: number) {
  const d = out(sy, sz);
  const outline = loop([at(0.03, 0.03, d), at(0.17, 0.03, d), at(0.15, 0.2, d), at(0.06, 0.2, d)]);
  const stripe = path([at(0.07, 0.11, d), at(0.155, 0.11, d)]); // the red stripe
  const engineC = (x: number): V3 => [x, d[1] * 0.075 + sy * 0.018, d[2] * 0.075];
  const engine: Seg[] = [
    ...ring(engineC(-0.015), 0.021, [0, 1, 0], [0, 0, 1], 16),
    ...ring(engineC(0.15), 0.021, [0, 1, 0], [0, 0, 1], 16),
    ...[0, 1, 2, 3].map((k) => {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const o: V3 = [0, Math.cos(a) * 0.021, Math.sin(a) * 0.021];
      const c0 = engineC(-0.015),
        c1 = engineC(0.15);
      return [
        [c0[0], c0[1] + o[1], c0[2] + o[2]],
        [c1[0], c1[1] + o[1], c1[2] + o[2]],
      ] as Seg;
    }),
  ];
  const tipC = at(0.1, 0.205, d);
  const cannon: Seg[] = [
    [p(0.04, tipC[1], tipC[2]), p(0.4, tipC[1], tipC[2])],
    ...ring(p(0.17, tipC[1], tipC[2]), 0.007, [0, 1, 0], [0, 0, 1], 10),
    ...ring(p(0.3, tipC[1], tipC[2]), 0.005, [0, 1, 0], [0, 0, 1], 10),
  ];
  return { outline, stripe, engine, cannon };
}
const wings = [wing(1, 1), wing(1, -1), wing(-1, 1), wing(-1, -1)];

const model: Model = {
  parts: [
    { code: 'P-01', name: 'Fuselage', segs: fuselage, explode: [0, -0.12, 0], start: 0, mobile: true },
    { code: 'P-02', name: 'Nose + canopy', segs: nose, explode: [0.22, 0.04, 0], start: 0.08 },
    { code: 'P-03', name: 'Upper wings', segs: [...wings[0].outline, ...wings[1].outline], accent: [...wings[0].stripe, ...wings[1].stripe], explode: [0, 0.2, 0], rot: [0, 0, 0.15], start: 0.18, mobile: true },
    { code: 'P-04', name: 'Lower wings', segs: [...wings[2].outline, ...wings[3].outline], accent: [...wings[2].stripe, ...wings[3].stripe], explode: [0, -0.22, 0], rot: [0, 0, -0.15], start: 0.28 },
    { code: 'P-05', name: 'Engines ×4, weathered', segs: wings.flatMap((w) => w.engine), explode: [-0.24, 0, 0], start: 0.38, mobile: true },
    { code: 'P-06', name: 'Laser cannons ×4', segs: wings.flatMap((w) => w.cannon), explode: [0.2, 0, 0], start: 0.5 },
  ],
  dims: [
    [p(-0.015, -0.17, 0), p(NOSE, -0.17, 0)],
    [p(-0.015, -0.185, 0), p(-0.015, -0.155, 0)],
    [p(NOSE, -0.185, 0), p(NOSE, -0.155, 0)],
  ],
  dimLabels: [{ at: [0.24, -0.2, 0], text: 'L ≈ 500 mm · span ≈ 400 mm' }],
  centre: [0.22, 0, 0],
  width: 0.68,
  height: 0.5,
  view: { x: 0.42, y: -0.5, turn: -0.8 },
};
export default model;
