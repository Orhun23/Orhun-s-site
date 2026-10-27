// Hero review shots: plotting in, settled, lens, mid-morph, after morph, scrolled (flattening).
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
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: w < 800 ? 2 : 1,
  colorScheme: flag('--dark') ? 'dark' : 'light',
  reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const tag = `${w}${flag('--dark') ? '-dark' : ''}${flag('--reduced') ? '-rm' : ''}`;
const shot = (n) => page.screenshot({ path: path.join(out, `${tag}-${n}.png`) });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.hero.is-live', { timeout: 15000 });
await page.waitForTimeout(650);
await shot('1-plotting');
await page.waitForTimeout(1800);
await shot('2-settled');
// lens: glide across the face
await page.mouse.move(w * 0.3, h * 0.5);
for (let i = 0; i <= 16; i++) {
  await page.mouse.move(w * (0.3 + i * 0.015), h * (0.5 + Math.sin(i / 4) * 0.04));
  await page.waitForTimeout(16);
}
await page.waitForTimeout(250);
await shot('3-lens');
await page.mouse.move(w * 0.95, h * 0.3);
await page.waitForTimeout(200);
await page.locator('[data-hero-next]').click();
await page.waitForTimeout(450);
await shot('4-morphing');
await page.waitForTimeout(1200);
await shot('5-skate');
for (const n of ['6-surf', '7-tallbike']) {
  await page.locator('[data-hero-next]').click();
  await page.waitForTimeout(1500);
  await shot(n);
}
await page.mouse.move(w * 0.95, h * 0.95);
await page.evaluate(() => scrollTo(0, innerHeight * 0.35));
await page.waitForTimeout(700);
await shot('8-scroll35');
await page.evaluate(() => scrollTo(0, innerHeight * 0.7));
await page.waitForTimeout(700);
await shot('9-scroll70');
console.log(tag, errors.length ? errors : 'ok');
await browser.close();
