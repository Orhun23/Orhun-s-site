# orhun-site

Personal site of Orhun Habib Erdogan. The whole thing is laid out as a set of engineering drawing sheets: a title block in the corner, part numbers, dimension lines. The hero is a line drawing of the tallbike that assembles itself as you scroll.

Astro + TypeScript, vanilla CSS with design tokens, GSAP + ScrollTrigger, Lenis. No framework runtime, no tracking.

## Run it

Needs Node 22+.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in ./dist
npm run preview    # serve ./dist locally
npx astro check    # type check
```

## Where things live

| What | Where |
| --- | --- |
| Colours, type scale, spacing, easing | `src/styles/tokens.css` |
| Global styles, reveals, page transitions | `src/styles/global.css` |
| Name, email, links, hero line, nav | `src/data/site.ts` |
| Work history, skills, education, languages | `src/data/work.ts` |
| Trips (Field log) | `src/data/trips.ts` |
| Builds (one markdown file each) | `src/content/builds/*.md` |
| Homepage sections | `src/components/*.astro` |
| Hero drawing (the tallbike) | `src/scripts/hero/tallbike.ts` |
| Photos (optimised, metadata stripped) | `src/assets/media/` |
| Videos | `public/media/` |

## Add a build

Create `src/content/builds/my-thing.md`. It shows up on the homepage and gets its own page at `/builds/my-thing/`.

```md
---
title: My thing
code: B-06              # part-number label
order: 6                # position in the list
started: 2026-11-01
finished: 2026-12-15    # leave out if it's still going
summary: One blunt line about it.
cover: ../../assets/media/builds/my-thing/cover.jpg   # optional
coverAlt: What the photo shows
specs:
  - ['Build time', '~6 weeks']
  - ['Material', 'Aluminium']
dimensions:             # orange dimension lines drawn on the cover, in % of the photo
  - { from: [90, 10], to: [90, 80], label: 'H ≈ 600 mm', side: right }
callouts:               # leader labels on the cover, in % of the photo
  - { at: [40, 35], label: 'The clever bit', dir: right }
gallery:
  - { src: ../../assets/media/builds/my-thing/detail.jpg, alt: '…', caption: 'Fig. 2 — Detail', wide: false }
video:                  # optional
  src: /media/builds/my-thing/clip.mp4
  poster: ../../assets/media/builds/my-thing/clip.jpg
  alt: What happens in the clip
---

Write-up in normal markdown. `##` for subheadings.
```

Tip for callout coordinates: open the photo in any editor that shows the cursor position and divide by the image size. Or guess, run `npm run dev` and nudge.

## Swap or add photos and videos

The import script turns raw phone photos (HEIC/JPG/PNG/Canon CR3) and videos into web-ready files. It rotates them correctly, resizes them, strips all metadata (including GPS) and compresses the videos.

1. Add an entry to `scripts/media/media.json`: `src` is the path inside your photos folder, `out` is where it lands. Optional: `crop` `[left, top, right, bottom]` as fractions, and for videos `start`/`dur` in seconds and `width` (long edge).
2. One-time setup (Python 3.10+):
   ```sh
   python -m venv .venv
   .venv\Scripts\pip install pillow pillow-heif imageio-ffmpeg
   ```
3. Run it, pointing at your photos folder:
   ```sh
   .venv\Scripts\python scripts/media/import-media.py "C:\path\to\photos"
   # or just a few:  ... --only field/surf,trips/fogo
   ```
4. Use the image in a component or markdown file. Astro generates the AVIF/WebP sizes at build time.

GPS is read *before* stripping, rounded to about 1 km, and written to `src/data/gps.json` (git-ignored, it stays on your machine). Copy coordinates from there if you want them on the site.

## Regenerate the CV PDF, OG image and icons

The CV is a normal page (`/cv`, built from `src/data/work.ts`). The PDF, the social share image and the favicons are generated from the running site:

```sh
npm run dev                      # in one terminal
node scripts/make-assets.mjs     # in another → public/cv/…pdf, public/og.png, icons
```

Do this after changing work history or the hero line. One-time setup: `npx playwright install chromium`.

## Review screenshots

```sh
node scripts/shoot.mjs http://localhost:4321/ shots --w 1440,768,390 --at 0,0.5,1
node scripts/shoot.mjs http://localhost:4321/ shots --w 390 --full          # step through the page
node scripts/shoot.mjs http://localhost:4321/ shots --w 390 --reduced --dark
```

## Fonts

Self-hosted, both OFL. They're subset to the characters the site uses and split for speed:

- `BricolageDisplay.woff2`: Bricolage Grotesque at optical size 96, weights 400–800, width 90–100. Headings only, preloaded.
- `BricolageText.woff2`: the same font at optical size 14, for body text.
- `JetBrainsMono.woff2`: labels and annotations.

If you add text with unusual characters (Polish, Greek, emoji) they'll fall back to Arial. Re-subset from `@fontsource-variable/bricolage-grotesque` with `pyftsubset` if that ever matters.

## Deploy (Vercel, free)

1. Push this repo to GitHub (`orhun23/orhun-site`).
2. On vercel.com: **Add New → Project → Import** the repo. The Astro preset is detected automatically. Build command `npm run build`, output `dist`. Deploy.
3. Every push to `main` redeploys. Pull requests get preview URLs.

### Connect a domain later

1. Vercel → Project → **Settings → Domains → Add** `yourdomain.com` (and `www.yourdomain.com`).
2. At your registrar, set the DNS records Vercel shows you: usually an `A` record to `76.76.21.21` for the bare domain and a `CNAME` for `www` to `cname.vercel-dns.com`. HTTPS is automatic.
3. Vercel → **Settings → Environment Variables**: add `SITE_URL` = `https://yourdomain.com`, then redeploy. Canonical URLs, the sitemap and OG tags use it.
4. Update the `Sitemap:` line in `public/robots.txt`.

## Accessibility and motion

- Everything works with `prefers-reduced-motion`: no smooth scroll, no scroll story, no autoplaying video. The hero shows the assembled drawing straight away.
- Without JavaScript the page still reads top to bottom: no tall scroll track, videos show a still frame, every figure is drawn.
- Every looping video has a pause button and only plays while on screen.
