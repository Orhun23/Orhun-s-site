// Screenshot helper for reviewing the build.
// node scripts/shoot.mjs <url> <outDir> [--w 1440,768,390] [--at 0,0.3,0.6 | --full] [--reduced] [--dark] [--sel selector]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i === -1 ? d : args[i + 1];
};
const flag = (k) => args.includes(k);
const widths = opt('--w', '1440,768,390').split(',').map(Number);
const at = opt('--at', '0').split(',').map(Number);
const sel = opt('--sel', null);
fs.mkdirSync(out, { recursive: true });

const heights = { 1440: 900, 768: 1024, 390: 844 };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: heights[w] ?? 900 },
    deviceScaleFactor: w < 800 ? 2 : 1,
    reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
    colorScheme: flag('--dark') ? 'dark' : 'light',
    hasTouch: w < 800,
    isMobile: w < 500,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const tag = `${w}${flag('--reduced') ? '-rm' : ''}${flag('--dark') ? '-dark' : ''}`;
  if (sel) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await el.screenshot({ path: path.join(out, `${tag}-sel.png`) });
  } else if (flag('--full')) {
    // fullPage capture stretches the viewport (and every svh unit with it), so instead
    // step through the page one viewport at a time and save numbered frames
    const vh = heights[w] ?? 900;
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const from = Number(opt('--from', 0));
    let n = 0;
    for (let y = from; y < h; y += vh) {
      await page.evaluate((y) => {
        const l = window.__lenis;
        if (l) l.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      }, y);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: path.join(out, `${tag}-p${String(n++).padStart(2, '0')}.png`) });
    }
  } else {
    for (const f of at) {
      await page.evaluate((f) => {
        const h = document.documentElement.scrollHeight - innerHeight;
        const y = f > 1 ? f : h * f;
        const l = window.__lenis;
        if (l) l.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      }, f);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(out, `${tag}-${String(f).replace('.', '_')}.png`) });
    }
  }
  if (errors.length) console.log(`[${w}] console errors:\n  ` + errors.join('\n  '));
  await ctx.close();
}
await browser.close();
console.log('done');
