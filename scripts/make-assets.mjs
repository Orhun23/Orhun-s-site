// Generates the static assets that are easier to render than to hand-make:
//   public/og.png                       social card (the homepage hero at 1200×630)
//   public/cv/orhun-habib-erdogan-cv.pdf  (from /cv, printed to A4)
//   public/apple-touch-icon.png, public/favicon.ico (from favicon.svg)
// Run with the dev or preview server up:  node scripts/make-assets.mjs [http://localhost:4321]
import { chromium } from 'playwright';
import fs from 'node:fs';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// OG image: the hero itself, at 1200×630, frames still, chrome hidden
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '.header,.tb,.cur,.cur-trail,.hero__cue,.hero__hint{display:none!important}' });
  // only the frames on screen matter; lazy ones further down never load, so don't wait for them
  await page.evaluate(() =>
    Promise.race([
      Promise.all([...document.querySelectorAll('.hero img')].filter((i) => i.getBoundingClientRect().top < innerHeight).map((i) => ((i.loading = 'eager'), i.decode().catch(() => {})))),
      new Promise((r) => setTimeout(r, 4000)),
    ]),
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'public/og.png' });
  await page.close();
  console.log('public/og.png');
}

// CV PDF
{
  const page = await browser.newPage({ colorScheme: 'light' });
  await page.goto(`${base}/cv`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  fs.mkdirSync('public/cv', { recursive: true });
  await page.pdf({ path: 'public/cv/orhun-habib-erdogan-cv.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.close();
  console.log('public/cv/orhun-habib-erdogan-cv.pdf');
}
await browser.close();

// icons
const svg = fs.readFileSync('public/favicon.svg');
await sharp(svg, { density: 600 }).resize(180, 180).flatten({ background: '#121314' }).png().toFile('public/apple-touch-icon.png');
const png32 = await sharp(svg, { density: 300 }).resize(32, 32).png().toBuffer();
// minimal ICO wrapper around a single 32×32 PNG
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));
console.log('public/apple-touch-icon.png, public/favicon.ico');
