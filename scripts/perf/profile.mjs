// Scroll-through frame profiler.
// node scripts/perf/profile.mjs <url> [--mobile] [--cpu 4] [--out file.json]
// Loads the page, lets the hero run, then wheels through the whole page. Reports frame times
// (from rAF deltas) per section, long tasks, and the hottest functions from a CPU profile.
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const url = args[0];
const mobile = args.includes('--mobile');
const cpu = Number(args.includes('--cpu') ? args[args.indexOf('--cpu') + 1] : mobile ? 4 : 1);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

const browser = await chromium.launch({ args: process.env.GPU ? ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-gpu-rasterization'] : ['--enable-gpu-rasterization'] });
const ctx = await browser.newContext(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

await page.addInitScript(() => {
  const w = window;
  w.__frames = [];
  w.__lt = [];
  let last = 0;
  const tick = (t) => {
    if (last) w.__frames.push([Math.round(t), +(t - last).toFixed(2), Math.round(scrollY), w.__phase || '']);
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) w.__lt.push([Math.round(e.startTime), Math.round(e.duration), Math.round(scrollY)]);
  }).observe({ type: 'longtask', buffered: true });
});

await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');

await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => (window.__phase = 'hero-run'));
await page.waitForTimeout(8000);

// map scroll positions to sections
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('main > section, main > *')]
    .map((s) => ({ id: s.id || s.className.split(' ')[0], top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight }))
    .filter((s) => s.h > 0),
);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.evaluate(() => (window.__phase = 'scroll'));
// wheel through at a realistic pace: ~1200 px/s, 100 px per notch
const vh = mobile ? 844 : 900;
await page.mouse.move(200, vh / 2);
const t0 = Date.now();
for (let y = 0; y < total; y += 100) {
  if (mobile) await page.evaluate((d) => scrollBy(0, d), 100);
  else await page.mouse.wheel(0, 100);
  await page.waitForTimeout(80);
}
await page.waitForTimeout(1500);
const scrollMs = Date.now() - t0;

const { profile } = await cdp.send('Profiler.stop');
const { frames, lt } = await page.evaluate(() => ({ frames: window.__frames, lt: window.__lt }));
await browser.close();

const sectionOf = (y) => {
  const mid = y + vh / 2;
  return (sections.find((s) => mid >= s.top && mid < s.top + s.h) ?? { id: '?' }).id;
};
const stats = (arr) => {
  const d = arr.map((f) => f[1]).sort((a, b) => a - b);
  const n = d.length || 1;
  return {
    frames: d.length,
    p50: d[Math.floor(n * 0.5)] ?? 0,
    p95: d[Math.floor(n * 0.95)] ?? 0,
    max: d[n - 1] ?? 0,
    over20: d.filter((x) => x > 20).length,
    over33: d.filter((x) => x > 33.4).length,
    pctSmooth: +((100 * d.filter((x) => x <= 20).length) / n).toFixed(1),
  };
};

const report = { url, mobile, cpu, scrollMs, phases: {}, sections: {}, longTasks: [], hot: [] };
for (const ph of ['hero-run', 'scroll']) report.phases[ph] = stats(frames.filter((f) => f[3] === ph));
const bySec = {};
for (const f of frames.filter((f) => f[3] === 'scroll')) (bySec[sectionOf(f[2])] ??= []).push(f);
for (const [k, v] of Object.entries(bySec)) report.sections[k] = stats(v);
report.longTasks = lt.map(([t, d, y]) => ({ t, d, at: sectionOf(y) }));

// hottest functions by self time
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => {
  const n = byId.get(id);
  const cf = n.callFrame;
  const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`;
  self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0) / 1000);
});
report.hot = [...self.entries()]
  .filter(([k]) => !k.startsWith('(idle)') && !k.startsWith('(program)'))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 18)
  .map(([k, ms]) => [k, +ms.toFixed(1)]);

if (out) fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ phases: report.phases, sections: report.sections }, null, 1));
console.log('long tasks:', JSON.stringify(report.longTasks.slice(0, 20)));
console.log('hot:', report.hot.map(([k, ms]) => `\n  ${ms}ms  ${k}`).join(''));
