// Records a Chrome trace while scrolling one section and breaks main-thread time down by event.
// node scripts/perf/trace.mjs <url> <selector> [--mobile] [--cpu 4]
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const [url, selector] = args;
const mobile = args.includes('--mobile');
const cpu = Number(args.includes('--cpu') ? args[args.indexOf('--cpu') + 1] : mobile ? 4 : 1);

const browser = await chromium.launch();
const ctx = await browser.newContext(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const [top, h] = await page.evaluate((s) => {
  const el = document.querySelector(s);
  return [el.getBoundingClientRect().top + scrollY, el.offsetHeight];
}, selector);
await page.evaluate((y) => scrollTo(0, y), top);
await page.waitForTimeout(800);

await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink'] });
const steps = Math.floor(h / 60);
for (let i = 0; i < steps; i++) {
  if (mobile) await page.evaluate(() => scrollBy(0, 60));
  else await page.mouse.wheel(0, 60);
  await page.waitForTimeout(33);
}
const buf = await browser.stopTracing();
await browser.close();

const { traceEvents } = JSON.parse(buf.toString());
const main = traceEvents.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
const evs = traceEvents.filter((e) => e.ph === 'X' && e.pid === main.pid && e.tid === main.tid && e.dur);
const sum = {};
for (const e of evs) sum[e.name] = (sum[e.name] ?? 0) + e.dur / 1000;
const pick = ['FunctionCall', 'FireAnimationFrame', 'EventDispatch', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'PaintImage', 'Layerize', 'Commit', 'ParseHTML', 'TimerFire', 'IntersectionObserverController::computeIntersections', 'HitTest', 'ScrollLayer', 'GPUTask', 'RasterTask', 'DecodeImage', 'ImageDecodeTask', 'v8.run'];
console.log('steps', steps);
for (const [k, v] of Object.entries(sum).sort((a, b) => b[1] - a[1]).slice(0, 22)) if (v > 2) console.log(String(v.toFixed(1)).padStart(8), 'ms ', k);
// forced layouts/style: those with a JS stack
const forced = evs.filter((e) => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.args?.beginData?.stackTrace);
const byFn = {};
for (const e of forced) {
  const f = e.args.beginData.stackTrace[0];
  const k = `${e.name} ← ${f.functionName || '(anon)'} ${f.url.split('/').pop()}`;
  byFn[k] = (byFn[k] ?? 0) + e.dur / 1000;
}
console.log('\nforced (from JS):');
for (const [k, v] of Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(String(v.toFixed(1)).padStart(8), 'ms ', k);
void pick;
