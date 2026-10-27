// Hero review shots: rest, cursor over the line (kinetic type), cursor over the frames, scrolled.
// node scripts/shoot-hero.mjs <url> <outDir> [--w 1440] [--dark] [--reduced]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [url, out] = args;
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const flag = (k) => args.includes(k);
const w = Number(opt('--w', 1440));
const h = { 1440: 900, 768: 1024, 390: 844 }[w] ?? 900;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: w < 800 ? 2 : 1,
  colorScheme: flag('--dark') ? 'dark' : 'light',
  reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
  isMobile: w < 500,
  hasTouch: w < 800,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const tag = `${w}${flag('--dark') ? '-dark' : ''}${flag('--reduced') ? '-rm' : ''}`;
const shot = (n) => page.screenshot({ path: path.join(out, `${tag}-${n}.png`) });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await shot('1-rest');
if (w > 800) {
  // glide along line 2 and stop mid-word
  const lines = await page.$$eval('[data-k-line]', (ls) => ls.map((l) => { const r = l.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
  const [x, y, lw, lh] = lines[1];
  await page.mouse.move(x + lw * 0.1, y + lh / 2);
  for (let i = 0; i <= 14; i++) {
    await page.mouse.move(x + lw * (0.1 + i * 0.03), y + lh * 0.5);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(350);
  await shot('2-type');
  const [x1, y1, lw1, lh1] = lines[0];
  await page.mouse.move(x1 + lw1 * 0.25, y1 + lh1 / 2, { steps: 14 });
  await page.waitForTimeout(400);
  await shot('3-type-line1');
  // over the frames, top right
  await page.mouse.move(w * 0.72, h * 0.22, { steps: 16 });
  await page.waitForTimeout(900);
  await shot('4-frames');
} else {
  await page.waitForTimeout(2200); // touch auto-develop
  await shot('2-touch');
}
await page.mouse.move(w - 5, h - 5);
await page.evaluate(() => scrollTo(0, innerHeight * 0.35));
await page.waitForTimeout(700);
await shot('5-scroll35');
await page.evaluate(() => scrollTo(0, innerHeight * 0.75));
await page.waitForTimeout(700);
await shot('6-scroll75');
console.log(tag, errors.length ? errors : 'ok');
await browser.close();
