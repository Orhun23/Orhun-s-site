# Lessons: what went wrong and how it was fixed

Technical problems from building orhun-site, with the root cause for each, so they don't repeat.

## Contents
1. How to measure
2. Scroll and animation performance
3. Mobile: the "stripped-down" phone version
4. Mobile: the bench lagging differently per phone
5. Layout gotchas
6. Media
7. Fonts
8. Privacy and repo hygiene
9. Deploy (Vercel)
10. Windows / tooling quirks
11. Process lessons

---

## 1. How to measure

- **Profile; don't guess.** `scripts/perf/profile.mjs` scrolls the page and reports frame smoothness (`--mobile` = 390 px, touch, 4x CPU throttle). `scripts/perf/trace.mjs` records a Chrome trace with JS stacks for forced layouts and per-frame averages. A/B every fix against the previous commit.
- **Headless Chrome renders in software by default** and under-reports badly: the hero measured 67% smooth on desktop, but 97–99% on the real GPU. Run with `GPU=1`.
- **CPU throttling models a slow CPU, not a weak GPU or a small memory budget.** Always tell Orhun that emulation isn't a real phone and ask them to try it on their own phones.
- **Count long tasks, not just fps.** The useful numbers for phones were tasks >8 ms per scroll pass (120 Hz budget) and frames that miss their slot at 4x and 6x CPU.
- **Prove locked sections are untouched:** `node scripts/perf/baseline.mjs http://localhost:4322 <dir>` before and after, then `python scripts/perf/compare.py <before> <after>`. 1440 must be pixel-identical. Sub-pixel diffs come from a section above changing height; confirm by checking the markup, element boxes, fonts and colours are identical.

## 2. Scroll and animation performance

| Symptom | Root cause | Fix |
|---|---|---|
| Hero wireframe needed Three.js (534 KB) | Line-only drawing doesn't need a 3D engine | A custom orthographic 2D-canvas projector (~8 KB), sharper lines |
| GSAP + ScrollTrigger in the bundle | Nothing actually needed ScrollTrigger | Removed both. Lenis runs its own rAF (`autoRaf`); magnetic buttons use a 20-line spring |
| Bench engine janky on phones | Allocated arrays every frame (GC), wrote label DOM every frame | Flat `Float32Array`s, one affine per part, progress quantised, DOM writes only on change |
| Too many compositor layers | `will-change` on ~40 label elements | Removed. Use `will-change` only on the element that animates, only while it's near (`.is-near`) |
| Canvas too expensive | Full device pixel ratio | Cap DPR at 1.5 (2 only where canvas text must stay sharp) |
| Hero drag spun half as fast on 120 Hz | Velocity was frame-rate corrected twice (pointer deltas already shrink at higher rates) | Time-based velocity (dx/dt); smoothing as `1 - exp(-dt/τ)` everywhere |
| Title block flashed intermediate titles on fast jumps | The IO delivers several sheets in one batch | Take only the last intersecting entry |
| Text swap cost paint while scrolling | Animated `filter: blur()` on text | Opacity-only cross-fade; instant with reduced motion |
| Hero scroll restyled everything inside the wall | Scroll progress written to an inherited CSS custom property | Write `transform`/`opacity` directly on the wall and the copy |
| Kinetic text would cost layout every frame | Wilcock's effect animates variable-font axes (and Overused Grotesk has no width axis) | `scaleX` + `translateX` on letters, an opacity crossfade to an outline layer, positions measured once |
| Phone hero scroll at 72% smooth | The idle "ghost finger" read the line's layout every frame | `moveRel(u, v)` in the line's own cached coordinates, no layout read → 97% |
| Hero kept costing after scrolling past | Wall layers and handlers stayed live | IO with `rootMargin: '25% 0px'` sets `.is-off`: drift paused, stage `visibility: hidden`, scroll handler returns early |
| Hero stayed faded after a jump back to top | The scroll handler skipped while off, so it never caught up | Call `refresh()` when the hero re-enters |
| Every unrevealed element checked each scroll frame | All reveals observed from page load | Hand a sheet's reveals to the observer only when the sheet is within 50% of a screen |
| `#contact` anchor landed in the wrong place | `content-visibility: auto` mis-estimates unrendered section heights | Removed it; correct navigation matters more than a few Lighthouse points |
| Header blur expensive on phones | `backdrop-filter` on a fixed header | Removed |
| Bench ground and dimension lines drifted off-centre | A perf refactor composed absolute-coordinate geometry without subtracting the model centre | One-line engine fix (with Orhun's OK, since the bench is locked). Visually diff after every perf refactor |

## 3. Mobile: the "stripped-down" phone version

**What happened:** after deploying, Orhun found the phone version "a big step down … all the animations and interactive parts are gone, so it feels like a different site."

**Root cause:** motion was gated on `finePointer()` (mouse/trackpad) instead of only on `reducedMotion()`. The kinetic text, the bench tilt and lens, magnetic buttons and every CSS hover state were effectively desktop-only, and nothing replaced them on touch. The hero was shrunk for tall screens, not recomposed.

**Fix (the rule since then):**
- `reducedMotion()` gates motion. `finePointer()` only chooses the input method (cursor vs finger), and every desktop hover gets a touch equivalent (see design-system.md §11).
- Recompose for tall screens (hero: 3 bigger columns running off the edges, gentler tilt, bigger type, 130svh). Check 360, 390, 430 and landscape.
- Lighter video cuts for phones, lazy posters, everything paused off screen.

**Also tell Orhun:** an iPhone with **Reduce Motion** on (Settings → Accessibility → Motion) gets the static site by design, and **Low Power Mode** blocks video autoplay. Either one makes a phone look like the stripped version.

## 4. Mobile: the bench lagging differently per phone

**What happened:** "the animations on phone on the personal projects are still laggy when you scroll over them and it lags differently for different phones."

| Cause | Why it varied per phone | Fix |
|---|---|---|
| The stage column was `1fr`; a long status line ("Fitting P-08 · Cockpit") widened it past the screen mid-scroll, so the canvas was resized, refit and its labels re-measured about 19 times per pass | Whether the text overflowed depended on screen width | `grid-template-columns: minmax(0, 1fr)` |
| Part labels were moving DOM elements; Chrome re-checked layer overlap and repainted page-wide every frame. Tried pixel transforms on their own layers, then `left/top` in a contained overlay; both still cost frames | Slower CPUs crossed the budget | Draw labels, leaders and dimension tags into the canvas itself ("lean" mode, touch only), styled from the hidden DOM labels; refit when fonts load |
| The drawing followed the raw scroll position, which phones deliver in uneven steps | 60/90/120 Hz screens, iOS momentum | Glide towards the target with an 85 ms time constant, from cached geometry, scroll position read in the scroll event |
| A non-passive `touchmove` (for the x-ray lens) covered the whole drawing, so every scroll starting on the bench waited for the main thread | Worse on slow CPUs | Attach the blocking listener only while the lens is up |
| Lenis was running on touch, adding a rAF loop and class flips on `<html>` (full restyles) to every scroll while not smoothing anything | — | Lenis only on fine pointers; CSS smooth anchors + `scroll-padding-top` on touch |
| The photo wipe used `clip-path`, repainting the photo every frame | — | Touch: two counter-moving transforms (window and contents) |

Result in emulation (390 px, touch fling, real GPU): at 4x CPU, tasks >8 ms dropped from ~40 to 4–7 per pass with no frame over 16 ms; at 6x CPU, missed frames per model went from 4–28 to 2. Desktop stayed pixel-identical because every change sat behind a touch check.

## 5. Layout gotchas

- **Grid `1fr` is `minmax(auto, 1fr)`:** long unbreakable content widens the column past the screen. Use `minmax(0, 1fr)` on phone grids (the bench stage, and a 13 px sideways overflow on build pages at 360).
- **IntersectionObserver honours the target's own clip-path.** An element that starts fully clipped (a wipe reveal) never intersects. Observe its parent.
- **Callout labels run off phone screens:** switch to numbered balloons + a legend under the image (≤560 px).
- **`viewport-fit=cover`** was dropped: without safe-area padding, iOS's default letterboxing is the safe choice.
- **Fixed chrome over a dark section:** flip its tokens with IO-driven attributes on `<html>`, not scroll math.
- **Tap targets:** nav links 44 px tall on touch; phone labels at least 10–11 px.

## 6. Media

- **Import pipeline** (`scripts/media/import-media.py` + `media.json`): rotates, resizes, strips all metadata, compresses video. GPS is read before stripping, rounded to ~1 km, and written to `src/data/gps.json`, which is git-ignored.
- **iPhone HDR (HLG) clips look washed out** in browsers: tone-map to SDR when converting.
- **Formats:** VP9 webm (2-pass) first, H.264 mp4 fallback. `scripts/media/make-mobile-videos.py` writes a 640 px CRF 30 `.m.mp4` next to every mp4 (about a quarter of the bytes); Plate picks it with `<source media="(max-width: 760px)">`.
- **One shared `<video>`** moved between hero tiles keeps it to one decoder at a time.
- **Hero tiles:** `getImage` 300 × 375 webp q62, 2 eager + `fetchpriority=high` per column; Lighthouse mobile 96–97, LCP 2.6 s, ~256 KB first load.
- **Background-removal cut-outs from handheld clips are unreliable** (heads and statues cut wrong; only 4 skate frames were usable). Test a few frames before building a concept on them.
- **Faithful isn't always better:** the X-wing's true 83 mm height collapsed the wings onto the engines in the 3/4 view, and the drawing's 26 parts were too busy. Kept the foils open and 6 part groups, and said why.

## 7. Fonts

- Overused Grotesk replaced Bricolage Grotesque in round 1. One variable woff2 (400–900), subset to the characters used (~26 KB). Characters outside the subset (Polish, Greek, emoji) fall back to Arial; re-subset if that matters.
- Fonts go through Astro's Fonts API (`astro.config.mjs`) with metric-matched fallbacks, so there's no layout shift.
- Anything that measures text (kinetic letters, canvas labels) must re-measure on `document.fonts.ready`.
- The README's "Fonts" section still describes the old Bricolage files and is out of date; trust `astro.config.mjs`.

## 8. Privacy and repo hygiene

- `src/data/gps.json` held photo coordinates including both work sites. It was purged from the whole git history before the first push and is ignored now.
- Before any push: check `.gitignore` (node_modules, dist, .env, .astro), check that no image or video carries metadata, and confirm the CV PDF holds only email + LinkedIn.
- The repo carries a GPL-3.0 LICENSE (created on GitHub). It also covers the photos by default; an "all rights reserved" note for media was offered and never answered.
- Never publish screenshots showing hostnames, IPs or usernames (one terminal shot was dropped for this).

## 9. Deploy (Vercel)

- Orhun imported the GitHub repo in the Vercel dashboard (the CLI login needs a browser). Astro is auto-detected: build `npm run build`, output `dist`, no env vars needed to build. Every push to `main` deploys.
- The project URL came from the repo name: **https://orhun-s-site.vercel.app**. `orhun-site.vercel.app` is not the site.
- Still open: set `SITE_URL=https://orhun-s-site.vercel.app` in Vercel and redeploy (canonical URLs, sitemap and OG links use it), and fix the hard-coded sitemap line in `public/robots.txt`.
- The OG image is a 1200 × 630 capture of the homepage hero (`scripts/make-assets.mjs`, which needs a running server); regenerate it after hero changes.

## 10. Windows / tooling quirks

- Keep the project out of OneDrive (`C:\dev\orhun-site`): OneDrive handles `node_modules` badly.
- Git Bash rewrites arguments that start with `/` into Windows paths.
- Writing to `nul` in Git Bash creates a real file named `nul` (a 5 MB trace once landed in the repo); use `/dev/null`.
- Python `open(..., 'w')` on Windows writes CRLF; preserve the file's newline style with `newline=''` when editing.
- `rm` with a variable path needs a `"${VAR:?}"` guard.
- Dev server: `npx astro dev --background` (:4321). Preview: `npx astro build && npx astro preview --port 4322`.

## 11. Process lessons

- **Text pitches for a visual hero failed four times.** Clickable prototypes on separate routes landed on the first try.
- **Bigger "wow" made it worse.** The hero went from exploded bike → chain reaction → calm type → plotter lines → contact sheet. What worked was the calmest idea that still showed all of Orhun at once and was fun to touch.
- **Commit each change separately** so a single rejected idea (the strobe frames, the Cape Verde readout) can be reverted cleanly.
- **Locked means locked.** Even a one-line bug fix in a locked section was asked about first.
- **Report what you inferred.** Copy guesses (trip details, "available for freelance") were listed for Orhun to confirm.
