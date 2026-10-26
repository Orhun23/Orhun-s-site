// Screenshot the hero machine at moments in its run.
// node scripts/shoot-timeline.mjs <url> <outDir> [--w 1440] [--times 0.8,2,3.3,4.2,5.5,7,9] [--dark] [--reduced] [--clip]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [url, out] = args;
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const flag = (k) => args.includes(k);
const w = Number(opt('--w', 1440));
const heights = { 1440: 900, 768: 1024, 390: 844 };
const times = opt('--times', '0.8,2,3.3,4.2,5.5,7,9').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: w, height: heights[w] ?? 900 },
  deviceScaleFactor: w < 800 ? 2 : 1,
  colorScheme: flag('--dark') ? 'dark' : 'light',
  reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
  hasTouch: w < 800,
  isMobile: w < 500,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-machine-canvas] canvas', { timeout: 15000 });
const start = Date.now();
for (const t of times) {
  const wait = t * 1000 - (Date.now() - start);
  if (wait > 0) await page.waitForTimeout(wait);
  const file = path.join(out, `${w}${flag('--dark') ? '-dark' : ''}${flag('--reduced') ? '-rm' : ''}-t${String(t).replace('.', '_')}.png`);
  if (flag('--clip')) await page.locator('[data-hero]').screenshot({ path: file });
  else await page.screenshot({ path: file });
}
console.log('load→canvas', start - t0, 'ms');
if (errors.length) console.log('errors:\n  ' + errors.join('\n  '));
await browser.close();
