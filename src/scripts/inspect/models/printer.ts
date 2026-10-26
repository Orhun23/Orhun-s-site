// B-04 Own 3D printer: CoreXY, aluminium extrusion frame, build area ≈ 390 × 400 mm.
// Units: metres. x right, y up, z back.
import { type Model, type Seg, type V3, bar, box, loop, path, ring, p } from '../engine';

const X = 0.47,
  Y = 0.5,
  Z = 0.48; // outer frame
const TOP = Y - 0.025;
const BED_Y = 0.2;

const frame: Seg[] = [];
const corners: [V3, V3][] = [
  // bottom
  [p(0, 0, 0), p(X, 0, 0)],
  [p(0, 0, Z), p(X, 0, Z)],
  [p(0, 0, 0), p(0, 0, Z)],
  [p(X, 0, 0), p(X, 0, Z)],
  // top
  [p(0, Y, 0), p(X, Y, 0)],
  [p(0, Y, Z), p(X, Y, Z)],
  [p(0, Y, 0), p(0, Y, Z)],
  [p(X, Y, 0), p(X, Y, Z)],
  // uprights
  [p(0, 0, 0), p(0, Y, 0)],
  [p(X, 0, 0), p(X, Y, 0)],
  [p(0, 0, Z), p(0, Y, Z)],
  [p(X, 0, Z), p(X, Y, Z)],
];
for (const [a, b] of corners) frame.push(...bar(a, b, 0.01));

const bed: Seg[] = [
  ...loop([p(0.04, BED_Y, 0.04), p(X - 0.04, BED_Y, 0.04), p(X - 0.04, BED_Y, Z - 0.04), p(0.04, BED_Y, Z - 0.04)]),
  ...loop([p(0.04, BED_Y - 0.012, 0.04), p(X - 0.04, BED_Y - 0.012, 0.04), p(X - 0.04, BED_Y - 0.012, Z - 0.04), p(0.04, BED_Y - 0.012, Z - 0.04)]),
  // build area, marked out on the plate
  ...loop([p(0.04 + 0.0, BED_Y + 0.001, 0.04), p(0.43, BED_Y + 0.001, 0.04), p(0.43, BED_Y + 0.001, 0.44), p(0.04, BED_Y + 0.001, 0.44)]).map(
    ([a, b]) => [a, b] as Seg,
  ),
];

const zRods: Seg[] = [];
for (const [x, z] of [
  [0.06, 0.42],
  [X - 0.06, 0.42],
  [X / 2, 0.06],
]) {
  zRods.push(...bar(p(x, 0.02, z), p(x, TOP - 0.02, z), 0.004));
  zRods.push(...ring(p(x, 0.04, z), 0.016, [1, 0, 0], [0, 0, 1], 14));
}

const GY = TOP - 0.01; // gantry height
const GZ = 0.24; // gantry position (front-back)
const rails: Seg[] = [...bar(p(0.035, TOP, 0.02), p(0.035, TOP, Z - 0.02), 0.006), ...bar(p(X - 0.035, TOP, 0.02), p(X - 0.035, TOP, Z - 0.02), 0.006)];
const gantry: Seg[] = [
  ...bar(p(0.035, GY, GZ), p(X - 0.035, GY, GZ), 0.007),
  ...box(p(0.02, GY - 0.015, GZ - 0.025), p(0.05, GY + 0.015, GZ + 0.025)),
  ...box(p(X - 0.05, GY - 0.015, GZ - 0.025), p(X - 0.02, GY + 0.015, GZ + 0.025)),
];

const HX = 0.25;
const toolhead: Seg[] = [
  ...box(p(HX - 0.03, GY - 0.075, GZ - 0.035), p(HX + 0.03, GY + 0.01, GZ + 0.02)),
  ...ring(p(HX, GY - 0.035, GZ - 0.036), 0.018, [1, 0, 0], [0, 1, 0], 18), // part-cooling fan
];
const nozzle: Seg[] = [
  [p(HX - 0.006, GY - 0.075, GZ), p(HX, GY - 0.092, GZ)],
  [p(HX + 0.006, GY - 0.075, GZ), p(HX, GY - 0.092, GZ)],
];

// CoreXY: two belts, each runs from a rear motor around the far front idler, crossing behind the gantry
const BY = TOP + 0.012;
const belts: Seg[] = [
  ...path([p(0.035, BY, Z - 0.03), p(0.035, BY, 0.03), p(X - 0.035, BY, GZ), p(X - 0.035, BY, Z - 0.03)]),
  ...path([p(X - 0.035, BY + 0.006, Z - 0.03), p(X - 0.035, BY + 0.006, 0.03), p(0.035, BY + 0.006, GZ), p(0.035, BY + 0.006, Z - 0.03)]),
  ...ring(p(0.035, BY, 0.03), 0.012, [1, 0, 0], [0, 0, 1], 12),
  ...ring(p(X - 0.035, BY, 0.03), 0.012, [1, 0, 0], [0, 0, 1], 12),
];

const motors: Seg[] = [
  ...box(p(0.015, TOP + 0.02, Z - 0.06), p(0.06, TOP + 0.065, Z - 0.015)),
  ...box(p(X - 0.06, TOP + 0.02, Z - 0.06), p(X - 0.015, TOP + 0.065, Z - 0.015)),
];

const board: Seg[] = [
  ...loop([p(-0.004, 0.05, 0.12), p(-0.004, 0.05, 0.34), p(-0.004, 0.16, 0.34), p(-0.004, 0.16, 0.12)]),
  ...loop([p(-0.006, 0.08, 0.15), p(-0.006, 0.08, 0.2), p(-0.006, 0.12, 0.2), p(-0.006, 0.12, 0.15)]),
  ...loop([p(-0.006, 0.07, 0.24), p(-0.006, 0.07, 0.31), p(-0.006, 0.1, 0.31), p(-0.006, 0.1, 0.24)]),
];

const model: Model = {
  parts: [
    { code: 'P-01', name: 'Frame, aluminium extrusion', segs: frame, explode: [0, -0.08, 0], start: 0, mobile: true },
    { code: 'P-02', name: 'Bed', segs: bed, explode: [0, -0.06, -0.42], start: 0.06 },
    { code: 'P-03', name: 'Z axis, 3 lead screws', segs: zRods, explode: [0, 0.44, 0], start: 0.14 },
    { code: 'P-04', name: 'Y rails', segs: rails, explode: [0, 0.2, 0.22], start: 0.22 },
    { code: 'P-05', name: 'X gantry', segs: gantry, explode: [0, 0.3, -0.18], start: 0.3 },
    { code: 'P-06', name: 'Toolhead, own design', segs: toolhead, accent: nozzle, explode: [0.32, 0.12, -0.34], start: 0.38, mobile: true },
    { code: 'P-07', name: 'CoreXY belts', segs: belts, explode: [0, 0.36, 0.06], start: 0.46, mobile: true },
    { code: 'P-08', name: 'Steppers', segs: motors, explode: [0, 0.18, 0.3], start: 0.54 },
    { code: 'P-09', name: 'BTT Manta E3EZ · Klipper', segs: board, explode: [-0.32, 0, 0], start: 0.62 },
  ],
  dims: [
    ...path([p(0.04, BED_Y, -0.03), p(0.43, BED_Y, -0.03)]),
    [p(0.04, BED_Y, -0.045), p(0.04, BED_Y, -0.015)],
    [p(0.43, BED_Y, -0.045), p(0.43, BED_Y, -0.015)],
    ...path([p(X + 0.03, BED_Y, 0.04), p(X + 0.03, BED_Y, 0.44)]),
    [p(X + 0.015, BED_Y, 0.04), p(X + 0.045, BED_Y, 0.04)],
    [p(X + 0.015, BED_Y, 0.44), p(X + 0.045, BED_Y, 0.44)],
  ],
  dimLabels: [
    { at: [0.235, BED_Y - 0.03, -0.03], text: '≈ 390 mm' },
    { at: [X + 0.09, BED_Y - 0.02, 0.24], text: '≈ 400 mm' },
  ],
  centre: [X / 2, Y / 2 + 0.02, Z / 2],
  width: 0.78,
  height: 0.78,
  view: { x: 0.36, y: -0.62, turn: -0.5 },
};
export default model;
