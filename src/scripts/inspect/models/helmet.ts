// B-02 Iron Man helmet: traced from the photo (scripts/media/trace-helmet.py), built up as
// layers like a CAD exploded view. Units: metres, ≈ 0.3 m tall.
import { type Model, type Seg, type V3, loop, path, box } from '../engine';
import helmet from '../../../data/hero/helmet.json';

const SZ = 0.3;
const cx = helmet.w / 2;
// scale s shrinks around the helmet's centre (for the rear outline)
const pt = ([x, y]: number[], z = 0, s = 1): V3 => [(x - cx) * SZ * s, ((helmet.h / 2 - y) * s + helmet.h / 2) * SZ, z];

// shell: a front outline, a smaller rear outline, and ribs between them so it reads as a volume
const front = helmet.shell.map((q) => pt(q, 0));
const rear = helmet.shell.map((q) => pt(q, -0.09, 0.86));
const shell: Seg[] = [...loop(front), ...loop(rear)];
for (let i = 0; i < front.length; i += 7) shell.push([front[i], rear[i]]);

const details: Seg[] = helmet.details.flatMap((d) => path(d.map((q) => pt(q, 0.006))));
const faceplate: Seg[] = loop(helmet.faceplate.map((q) => pt(q, 0.02)));
const eyes: Seg[] = helmet.eyes.flatMap((e) => loop(e.map((q) => pt(q, 0.026))));

// the mechanism: one 360° servo inside the shell, two arms that lift the faceplate up and over
const SY = helmet.h * SZ * 0.62;
const servo = box([0.07, SY - 0.02, -0.11], [0.11, SY + 0.02, -0.07]);
const arms: Seg[] = [
  [
    [0.09, SY, -0.07],
    [0.09, helmet.h * SZ * 0.92, 0.0],
  ],
  [
    [-0.09, SY, -0.07],
    [-0.09, helmet.h * SZ * 0.92, 0.0],
  ],
  [
    [0.09, SY, -0.07],
    [-0.09, SY, -0.07],
  ],
];

const model: Model = {
  parts: [
    { code: 'P-01', name: 'Shell, 100% printed', segs: shell, explode: [0, 0, -0.2], start: 0, mobile: true },
    { code: 'P-02', name: 'Cheeks + jaw', segs: details, explode: [0, -0.04, 0.12], start: 0.12 },
    { code: 'P-03', name: 'Servo + 2 arms', segs: [...servo, ...arms], explode: [0.26, 0.02, -0.06], start: 0.26, mobile: true },
    { code: 'P-04', name: 'Faceplate (lifts up + over)', segs: faceplate, explode: [0, 0.16, 0.26], rot: [-0.5, 0, 0], start: 0.4, mobile: true },
    { code: 'P-05', name: 'Eyes', segs: [], accent: eyes, explode: [0, 0.18, 0.4], start: 0.52 },
  ],
  centre: [0, (helmet.h * SZ) / 2, -0.05],
  width: 0.46,
  height: 0.4,
  view: { x: 0.08, y: -0.22, turn: -0.55 },
};
export default model;
