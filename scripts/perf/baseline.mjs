// Pixel baselines for the sections that must not change.
// node scripts/perf/baseline.mjs <url-base> <outDir>
// Then compare two runs with scripts/perf/compare.py <dirA> <dirB>.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

const shots = [];
for (const [w, h] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    isMobile: w < 500,
    hasTouch: w < 800,
  });
  const page = await ctx.newPage();
  const mask = () => [page.locator('[data-clock]'), page.locator('video')];
  const settle = async () => {
    // finish every reveal transition instantly so timing can't cause diffs
    await page.addStyleTag({ content: '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}' });
    await page.evaluate(() => document.querySelectorAll('[data-reveal],[data-draw]').forEach((e) => e.classList.add('is-in')));
    // lazy images: load and decode all of them so timing can't decide what's in the shot
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) => {
          img.loading = 'eager';
          return img.decode().catch(() => {});
        }),
      ),
    );
    await page.waitForTimeout(400);
  };
  const scrollTo = (y) =>
    page.evaluate((y) => {
      const l = window.__lenis;
      if (l) l.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }, y);

  // homepage: the bench at fixed progress points, and the work teaser
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await settle();
  const insp = await page.evaluate(() =>
    [...document.querySelectorAll('[data-insp]')].map((el) => [el.id, el.getBoundingClientRect().top + scrollY, el.offsetHeight]),
  );
  for (const [id, top, hh] of insp)
    for (const f of [0, 0.35, 0.6, 1]) {
      await scrollTo(top + (hh - h) * f);
      await page.waitForTimeout(600);
      const file = path.join(out, `${w}-home-${id}-${f}.png`);
      await page.screenshot({ path: file, mask: mask() });
      shots.push(file);
    }
  for (const sel of ['.bench__intro', '#work']) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const file = path.join(out, `${w}-home-${sel.replace(/[#.]/g, '')}.png`);
    await el.screenshot({ path: file, mask: mask() });
    shots.push(file);
  }

  // /work and every role page, full length
  const pages = ['/work', '/work/vi-controls', '/work/vi-graduation', '/work/wefabricate', '/work/fyllar', '/work/teampi'];
  for (const u of pages) {
    await page.goto(base + u, { waitUntil: 'networkidle' });
    await settle();
    await page.waitForTimeout(800);
    const file = path.join(out, `${w}-${u.replace(/\//g, '_')}.png`);
    await page.locator('main').screenshot({ path: file, mask: mask() });
    shots.push(file);
  }
  await ctx.close();
}
await browser.close();
console.log(shots.length, 'baseline shots in', out);
