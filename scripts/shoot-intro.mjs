// Screenshot the first-visit intro at moments in time, then the settled hero.
// node scripts/shoot-intro.mjs <url> <outDir> [--w 1440] [--times 150,500,900,1300,2400] [--reduced] [--dark]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [url, out] = args;
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const flag = (k) => args.includes(k);
const w = Number(opt('--w', 1440));
const heights = { 1440: 900, 768: 1024, 390: 844 };
const times = opt('--times', '150,500,900,1300,2400').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: w, height: heights[w] ?? 900 },
  deviceScaleFactor: w < 800 ? 2 : 1,
  colorScheme: flag('--dark') ? 'dark' : 'light',
  reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
  isMobile: w < 500,
  hasTouch: w < 800,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'commit' });
await page.waitForSelector('main');
const start = Date.now();
for (const t of times) {
  const wait = t - (Date.now() - start);
  if (wait > 0) await page.waitForTimeout(wait);
  const tag = `${w}${flag('--dark') ? '-dark' : ''}${flag('--reduced') ? '-rm' : ''}`;
  await page.screenshot({ path: path.join(out, `${tag}-${t}.png`) });
}
console.log('intro attr now:', await page.evaluate(() => document.documentElement.hasAttribute('data-intro')), errors);
await browser.close();
