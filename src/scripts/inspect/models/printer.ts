// B-04 Own 3D printer: CoreXY, aluminium extrusion frame.
// Proportions from the frame CAD (photos/.../IMG_5948): top bars 390 mm, uprights 400 mm,
// a second ring of extrusions just above the base, cantilevered bed on a carrier.
// Units: metres. x right, y up, z back.
import { type Model, type Seg, type V3, bar, box, loop, path, ring, p } from '../engine';

const X = 0.39,
  Y = 0.4,
  Z = 0.39;
const RING2 = 0.065; // the upper base ring (UB1–UB4)

const frame: Seg[] = [];
const ringAt = (y: number): [V3, V3][] => [
  [p(0, y, 0), p(X, y, 0)],
  [p(0, y, Z), p(X, y, Z)],
  [p(0, y, 0), p(0, y, Z)],
  [p(X, y, 0), p(X, y, Z)],
];
for (const [a, b] of [
  ...ringAt(0),
  ...ringAt(RING2),
  ...ringAt(Y),
  [p(0, 0, 0), p(0, Y, 0)],
  [p(X, 0, 0), p(X, Y, 0)],
  [p(0, 0, Z), p(0, Y, Z)],
  [p(X, 0, Z), p(X, Y, Z)],
] as [V3, V3][])
  frame.push(...bar(a, b, 0.009));

// Z: two smooth rods and a lead screw at the back, the bed carrier rides on them
const ZB = Z - 0.05;
const zAxis: Seg[] = [
  ...bar(p(X / 2 - 0.07, RING2, ZB), p(X / 2 - 0.07, Y - 0.01, ZB), 0.003),
  ...bar(p(X / 2 + 0.07, RING2, ZB), p(X / 2 + 0.07, Y - 0.01, ZB), 0.003),
  [p(X / 2, RING2, ZB), p(X / 2, Y - 0.03, ZB)],
  ...ring(p(X / 2, RING2 + 0.02, ZB), 0.014, [1, 0, 0], [0, 0, 1], 14),
];

// bed: plate on a carrier whose two arms reach back to the Z axis
const BY = 0.27;
const bed: Seg[] = [
  ...loop([p(0.05, BY, 0.04), p(X - 0.05, BY, 0.04), p(X - 0.05, BY, Z - 0.08), p(0.05, BY, Z - 0.08)]),
  ...loop([p(0.05, BY - 0.008, 0.04), p(X - 0.05, BY - 0.008, 0.04), p(X - 0.05, BY - 0.008, Z - 0.08), p(0.05, BY - 0.008, Z - 0.08)]),
  ...path([p(0.08, BY - 0.02, 0.07), p(X / 2 - 0.07, BY - 0.02, ZB), p(X / 2 + 0.07, BY - 0.02, ZB), p(X - 0.08, BY - 0.02, 0.07)]),
  [p(X / 2 - 0.07, BY - 0.02, ZB), p(X / 2 - 0.07, BY - 0.06, ZB)],
  [p(X / 2 + 0.07, BY - 0.02, ZB), p(X / 2 + 0.07, BY - 0.06, ZB)],
];

// CoreXY gantry on top: two Y rods along the sides, X rods between the carriages
const TY = Y - 0.025;
const GZ = 0.2;
const yRods: Seg[] = [
  [p(0.03, TY, 0.02), p(0.03, TY, Z - 0.02)],
  [p(X - 0.03, TY, 0.02), p(X - 0.03, TY, Z - 0.02)],
  ...box(p(0.012, TY - 0.012, 0.004), p(0.048, TY + 0.012, 0.03)),
  ...box(p(X - 0.048, TY - 0.012, 0.004), p(X - 0.012, TY + 0.012, 0.03)),
];
const gantry: Seg[] = [
  [p(0.03, TY - 0.006, GZ - 0.012), p(X - 0.03, TY - 0.006, GZ - 0.012)],
  [p(0.03, TY - 0.006, GZ + 0.012), p(X - 0.03, TY - 0.006, GZ + 0.012)],
  ...box(p(0.015, TY - 0.02, GZ - 0.03), p(0.055, TY + 0.012, GZ + 0.03)),
  ...box(p(X - 0.055, TY - 0.02, GZ - 0.03), p(X - 0.015, TY + 0.012, GZ + 0.03)),
];
const HX = X / 2;
const toolhead: Seg[] = [
  ...box(p(HX - 0.028, TY - 0.07, GZ - 0.03), p(HX + 0.028, TY + 0.008, GZ + 0.022)),
  ...ring(p(HX, TY - 0.035, GZ - 0.031), 0.016, [1, 0, 0], [0, 1, 0], 16),
];
const nozzle: Seg[] = [
  [p(HX - 0.006, TY - 0.07, GZ), p(HX, TY - 0.086, GZ)],
  [p(HX + 0.006, TY - 0.07, GZ), p(HX, TY - 0.086, GZ)],
];

// CoreXY belts: two loops crossing behind the gantry
const B = Y + 0.006;
const belts: Seg[] = [
  ...path([p(0.03, B, Z - 0.03), p(0.03, B, 0.02), p(X - 0.03, B, GZ), p(X - 0.03, B, Z - 0.03)]),
  ...path([p(X - 0.03, B + 0.005, Z - 0.03), p(X - 0.03, B + 0.005, 0.02), p(0.03, B + 0.005, GZ), p(0.03, B + 0.005, Z - 0.03)]),
];

const motors: Seg[] = [
  ...box(p(0.008, Y + 0.012, Z - 0.05), p(0.05, Y + 0.054, Z - 0.008)),
  ...box(p(X - 0.05, Y + 0.012, Z - 0.05), p(X - 0.008, Y + 0.054, Z - 0.008)),
];

const board: Seg[] = [
  ...loop([p(-0.004, RING2 + 0.02, 0.1), p(-0.004, RING2 + 0.02, 0.29), p(-0.004, RING2 + 0.11, 0.29), p(-0.004, RING2 + 0.11, 0.1)]),
  ...loop([p(-0.006, RING2 + 0.04, 0.13), p(-0.006, RING2 + 0.04, 0.18), p(-0.006, RING2 + 0.08, 0.18), p(-0.006, RING2 + 0.08, 0.13)]),
];

const model: Model = {
  parts: [
    { code: 'P-01', name: 'Frame, aluminium extrusion', segs: frame, explode: [0, -0.08, 0], start: 0, mobile: true },
    { code: 'P-02', name: 'Z axis', segs: zAxis, explode: [0, 0, 0.32], start: 0.08 },
    { code: 'P-03', name: 'Bed + carrier', segs: bed, explode: [0, -0.04, -0.4], start: 0.16 },
    { code: 'P-04', name: 'Y rods', segs: yRods, explode: [0, 0.2, 0.2], start: 0.24 },
    { code: 'P-05', name: 'X gantry', segs: gantry, explode: [0, 0.28, -0.16], start: 0.32 },
    { code: 'P-06', name: 'Toolhead, own design', segs: toolhead, accent: nozzle, explode: [0.3, 0.12, -0.32], start: 0.4, mobile: true },
    { code: 'P-07', name: 'CoreXY belts', segs: belts, explode: [0, 0.34, 0.05], start: 0.48, mobile: true },
    { code: 'P-08', name: 'Steppers', segs: motors, explode: [0, 0.16, 0.28], start: 0.56 },
    { code: 'P-09', name: 'BTT Manta E3EZ · Klipper', segs: board, explode: [-0.3, 0, 0], start: 0.62 },
  ],
  // the two numbers written on the CAD: top bar 390, upright 400
  dims: [
    // top front bar, drawn just in front of the frame
    [p(0, Y, -0.04), p(X, Y, -0.04)],
    [p(0, Y, -0.025), p(0, Y, -0.055)],
    [p(X, Y, -0.025), p(X, Y, -0.055)],
    // front-right upright
    [p(X + 0.045, 0, 0), p(X + 0.045, Y, 0)],
    [p(X + 0.03, 0, 0), p(X + 0.06, 0, 0)],
    [p(X + 0.03, Y, 0), p(X + 0.06, Y, 0)],
  ],
  dimLabels: [
    { at: [X / 2, Y + 0.025, -0.04], text: '390 mm' },
    { at: [X + 0.08, Y / 2, 0], text: '400 mm', rotate: true },
  ],
  centre: [X / 2, Y / 2 + 0.02, Z / 2],
  width: 0.68,
  height: 0.68,
  view: { x: 0.36, y: -0.62, turn: -0.5 },
};
export default model;
