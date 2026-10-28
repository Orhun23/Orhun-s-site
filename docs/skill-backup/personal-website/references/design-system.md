# Design system and motion patterns

Everything here is live in `C:\dev\orhun-site`. The snippets are trimmed from the real files; open the file named under each one for the full version.

## Contents
1. The concept
2. Tokens: colour, type, space, motion
3. The drawing sheet: grid, frame, title block, sheet heads
4. The dark inspection bench
5. Cursor (desktop) and tap ring (touch)
6. Hero: contact-sheet wall, dim until you go to it
7. Hero text: Wilcock-style kinetic letters
8. Scroll animations: reveals, wipes, self-drawing callouts
9. The bench scroll: assemble, measure, scan
10. Video plates
11. Touch equivalents (the full map)
12. Small physical details
13. Conventions

---

## 1. The concept

**The site is a set of engineering drawing sheets, and the subject of the drawings is Orhun's life.** Every homepage section is a numbered sheet (01 General arrangement, 02 Status, 03 Builds, 04 Field log, 05 Day job, 06 Contact). The engineering layer (mono labels, part codes like `B-01`/`FIG. 03`, dimension lines, callouts, coordinates, a faint grid) collides with the human layer (big Overused Grotesk type, full-bleed photos and clips, dry humour). Schematic callouts point at a snowboard ("Goggles: fogged"); trips are written as spec sheets.

## 2. Tokens

File: `src/styles/tokens.css`. Everything visual hangs off these.

```css
:root {
  color-scheme: light dark;
  /* palette: drawing paper + graphite ink, one accent */
  --paper: #ecebe5;   --paper-2: #e2e1d9;
  --graphite: #121314; --graphite-2: #1b1c1e;
  --orange: #ff4f00;            /* international orange: labels, dimension lines, one hover */
  --orange-ink: #b83500;        /* orange that passes contrast as text on paper */

  --bg: var(--paper); --bg-raised: var(--paper-2);
  --ink: var(--graphite);
  --ink-2: #4a4b4d;             /* ≥ 7:1 on paper */
  --ink-3: #5f6062;             /* ≥ 4.5:1, meta text */
  --line: rgb(18 19 20 / 0.16); --line-strong: rgb(18 19 20 / 0.42);
  --grid: rgb(18 19 20 / 0.045);
  --accent: var(--orange); --accent-text: var(--orange-ink);

  /* fluid type scale */
  --step--2: clamp(0.69rem, 0.67rem + 0.08vw, 0.75rem); /* mono labels */
  --step--1: clamp(0.8rem, 0.77rem + 0.13vw, 0.875rem);
  --step-0:  clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --step-1:  clamp(1.25rem, 1.15rem + 0.45vw, 1.5rem);
  --step-2:  clamp(1.6rem, 1.4rem + 0.9vw, 2.2rem);
  --step-3:  clamp(2.2rem, 1.8rem + 2vw, 3.6rem);
  --step-4:  clamp(3rem, 2.2rem + 4vw, 6.5rem);
  --step-5:  clamp(3.4rem, 2rem + 7.2vw, 10.5rem);

  /* space */
  --gutter: clamp(16px, 3.2vw, 48px);
  --frame: clamp(10px, 1.4vw, 22px);     /* the drawing-border inset */
  --space-xs: .5rem; --space-s: 1rem; --space-m: 1.5rem;
  --space-l: clamp(2.5rem, 2rem + 2vw, 4rem);
  --space-xl: clamp(4rem, 3rem + 5vw, 9rem);
  --max: 1440px;

  /* motion: strong curves, never hand-rolled */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --dur-press: 140ms; --dur-hover: 180ms; --dur-ui: 240ms;
  --radius: 2px;
}
/* dark: graphite paper with paper ink; follows the system, overridable via [data-theme] */
```

**Type.** Overused Grotesk (OFL, RandomMaerks) for display and body: one self-hosted variable woff2, weights 400–900, subset to the characters used (~26 KB), loaded through Astro's Fonts API as `--font-display`. JetBrains Mono as `--font-mono` for every label. Display style: weight 700–800, `letter-spacing: -0.035em` to `-0.045em`, `line-height: 0.92`. Mono labels: uppercase, `letter-spacing: 0.02em`, `--step--2`, meta colour `--ink-3`, accent codes in `--accent-text`. Phone labels never go below 10–11 px. Overused Grotesk has no width axis, so width effects use `scaleX`.

```css
.mono { font-family: var(--font-mono); font-size: var(--step--2); font-weight: 450;
        letter-spacing: .02em; text-transform: uppercase; line-height: 1.4; }
.mono-meta { color: var(--ink-3); }
.accent { color: var(--accent-text); }
.display { font-family: var(--font-display); font-weight: 700; letter-spacing: -.035em; line-height: .92; }
```

## 3. The drawing sheet

**Grid** under everything (`global.css`):
```css
body::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-image: linear-gradient(var(--grid) 1px, transparent 1px),
                    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 32px 32px; background-position: -1px -1px; }
```

**Frame** (`SheetFrame.astro`): a fixed 1 px `--line-strong` border at `inset: var(--frame)` around the viewport, with zone markers 1–8 along the top and bottom and A–F along the sides in 9 px mono, like the edge of an A-size sheet. Decorative, `pointer-events: none`, `z-index: 40`.

**Title block** (`TitleBlock.astro`): a one-row strip on the bottom frame line. Cells: Title, Sheet, Drawn (O.H. Erdogan), Rev (23 = age), Location (coords + live Eindhoven clock). An IntersectionObserver with `rootMargin: '-50% 0px -50% 0px'` (a thin band across the middle) decides the current sheet, and `swapText` cross-fades the number and title. A fast jump delivers several sheets in one batch; only the last one counts.

```ts
const hit = entries.filter((e) => e.isIntersecting).at(-1);
swapText(tbNo, el.dataset.sheet); swapText(tbTitle, el.dataset.sheetTitle);
```

**Sheet heads**: every section opens with a ruled mono row: `Sheet 03 · Builds · <meta>` (`.sheet-head`: flex, baseline, `border-top: 1px solid var(--line-strong)`, last item pushed right; wraps on phones).

**Footer** title block in Contact: Drawn / Checked "—" / Approved "Pending" / Location / Rev / Cookies "None. Not even tracking."

## 4. The dark inspection bench

The Builds section is always dark whatever the theme, so it reads as a different room. It re-declares the tokens, which re-skins everything inside, canvas included:
```css
.on-bench { --bg: #0d0e10; --bg-raised: #17181b; --ink: #e9e8e2; --ink-2: #b6b5af; --ink-3: #8c8b86;
  --line: rgb(233 232 226 / .13); --line-strong: rgb(233 232 226 / .36); --accent-text: var(--orange);
  background-color: var(--bg); color: var(--ink);
  /* blueprint grid: 96 px major + 16 px minor */ }
```
The fixed header and title block take the bench colours while it's under them: two IOs set `data-bench-top` / `data-bench-bottom` on `<html>` with rootMargins `0px 0px -94% 0px` and `-94% 0px 0px 0px`.

## 5. Cursor and tap ring

File: `src/components/Cursor.astro`. After Daniel Ingrassia's comet cursor, made into a pen.

- **Dot**: 8 px orange, positioned with `translate3d` straight from `pointermove` (no easing, so no lag).
- **Ink tail**: a fixed full-screen canvas that draws the path of the last 110 ms (using coalesced events), tapered and fading towards the tail end. It redraws only while there's a tail, and clears only the box it drew last frame.
- **Hover**: one look for everything clickable. The dot shrinks and a thin orange ring opens (`scale(.15)→.6`). No labels, ever. The press state tightens the ring.
- **Only** with `(hover: hover) and (pointer: fine)` and no reduced motion (the `has-cursor` class on `<html>` hides the system cursor). Touch keeps the system behaviour plus the tap ring.

```ts
const CLICKABLE = 'a, button, [role="tab"], summary, label, [data-plate], [data-insp-view]';
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  const evs = e.getCoalescedEvents?.() ?? [];
  for (const c of evs.length > 1 ? evs : [e]) pts.push({ x: c.clientX, y: c.clientY, t: now });
  pts.push({ x, y, t: now });           // pin the newest point to the dot
  kick();                                // rAF draw loop, stops when the tail is gone
}, { passive: true });

// draw(): drop points older than TRAIL, then per segment
ctx.globalAlpha = 0.15 + 0.75 * k;       // k = 0 at the tail end, 1 at the dot
ctx.lineWidth   = 0.6 + 4.2 * k;
addEventListener('pointerover', (e) => {
  el.dataset.state = (e.target as Element).closest(CLICKABLE) ? 'link' : '';
});
```
```css
.cur__ring { width: 56px; height: 56px; margin: -28px 0 0 -28px; border: 1px solid var(--orange);
  border-radius: 50%; transform: scale(.15); opacity: 0;
  transition: transform 260ms var(--ease-out), opacity 180ms ease; }
.cur[data-state='link'] .cur__ring { transform: scale(.6); opacity: 1; }
.cur[data-state='link'] .cur__dot  { transform: scale(.5); }
```

**Tap ring (touch)**: "keep the feel of it": a 44 px orange ring blooms and fades where the finger lands. A pool of three reused spans, WAAPI on transform and opacity only, off with reduced motion.
```ts
addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  const r = pool[n++ % pool.length];
  r.getAnimations().forEach((a) => a.cancel());
  const at = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  r.animate([{ transform: `${at} scale(0.35)`, opacity: 0.9 }, { transform: `${at} scale(1)`, opacity: 0 }],
            { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
}, { passive: true });
```

## 6. Hero: the contact sheet

File: `src/components/Hero.astro`. 24 frames (builds, boards, trips; edit the `raw` list at the top) in 6 columns, each column drifting up at its own speed on a pure CSS animation, the whole wall tilted in 3D. The line sits on the paper in front; a paper veil rises from the bottom behind the line, so the wall seems to drift out of the sheet.

```css
.hero__stage { position: sticky; top: 0; height: 100svh; overflow: hidden; perspective: 1400px; }
.wall { position: absolute; inset: -30% -8%; display: grid; grid-template-columns: repeat(6, 1fr);
        transform: rotateX(26deg) rotateZ(-6deg); transform-origin: 50% 40%; will-change: transform; }
.wall__track { animation: drift var(--d) linear infinite; animation-delay: calc(var(--d) * var(--o)); }
@keyframes drift { to { transform: translateY(-50%); } }   /* each column's list is repeated 4x */
.hero.is-off .wall__track { animation-play-state: paused; }
.hero.is-off .hero__stage { visibility: hidden; }            /* far off screen: costs nothing */
```

**Dim until you go to it.** At rest the frames are graphite at 38% so the line reads first. Moving onto the wall lifts it to 60%; the frame under the cursor develops into full colour, gets an orange outline and plays its clip. Over the line the wall stays dim.
```css
.tile img { filter: grayscale(1) contrast(1.05); opacity: .38; transition: filter 450ms ease, opacity 450ms ease; }
.hero__stage.is-looking .tile img { opacity: .6; }
.tile.is-on img { filter: none; opacity: 1; }
.tile.is-on { outline: 1px solid var(--accent); outline-offset: 3px; }
```
**One shared `<video>`** is moved into whichever clip tile is lit, so never more than one video decodes (phones get the `.m.mp4` cut):
```ts
const activate = (tile) => {
  if (tile === active) return;
  active?.classList.remove('is-on'); active = tile;
  stage.classList.toggle('is-looking', !!tile);
  if (!tile) { player.pause(); player.remove(); return; }
  tile.classList.add('is-on');
  const v = tile.dataset.video;
  if (v && !reduced) { const file = phone ? v.replace(/\.mp4$/, '.m.mp4') : v;
    if (!player.src.endsWith(file)) player.src = file; tile.appendChild(player); player.play().catch(() => {}); }
};
```
**Scroll lays it flat** (145svh section, sticky stage): progress `p` maps to a transform written straight onto the wall, never through an inherited custom property:
```ts
wall.style.transform = `rotateX(${tiltX*(1-p)}deg) rotateZ(${tiltZ*(1-p)}deg) translateY(${-12*p}%) scale(${1-p*.08})`;
wall.style.opacity = String(1 - p * .75);
copy.style.transform = `translate3d(0, ${-p * 80}px, 0)`; copy.style.opacity = String(Math.max(0, 1 - p * 1.8));
```
**Tall screens are recomposed, not shrunk** (≤760 px): 3 columns that run off the edges (`inset: -14% -34%`), gentler tilt 18°/−4°, a higher veil, title `clamp(2.5rem, 11.6vw, 4.6rem)` with the lines allowed to wrap, hero 130svh. **Landscape phones** (`max-height: 520px` and landscape) use the desktop composition sized off the height.

## 7. Hero text: kinetic letters (after Mike Wilcock)

File: `src/scripts/hero/kinetic.ts`. Wilcock animates variable-font width/weight axes, which costs layout and paint every frame, and Overused Grotesk has no width axis. This version is GPU-only: each letter is two stacked layers, the solid glyph over the same glyph as a 1 px outline. Near the pointer a letter stretches (`scaleX`), its solid layer fades so it turns into a drawing of itself, and its neighbours slide aside (`translateX`). Positions are measured once (and on resize/fonts ready), so a frame never reads layout.

Markup (Astro):
```astro
<h1 class="hero__title display" data-kinetic>
  <span class="visually-hidden">{line1} {line2}</span>
  {[line1, line2].map((line) => (
    <span class="hero__line" data-k-line aria-hidden="true">
      {words(line).map((w) => (<span class="hero__word">
        {[...w].map((ch) => <span class="k" data-k><span class="k__b">{ch}</span><span class="k__a">{ch}</span></span>)}
      </span>))}
    </span>))}
</h1>
```
```css
.k { position: relative; display: inline-block; transform-origin: 50% 60%; }
.k__b { position: absolute; left: 0; top: 0; color: transparent; -webkit-text-stroke: 1px var(--ink); }
.hero__word:not(:last-child) { margin-right: .24em; }   /* gap trails the word: wrapped lines start flush */
```
The frame loop (influence is a 2D Gaussian around the pointer; it swells fast and settles slower, like Wilcock's ~0.7 s return; the line keeps its left edge, so the extra width pushes right):
```ts
const up = 1 - Math.exp(-dt * 14), down = 1 - Math.exp(-dt * 6);   // frame-rate independent
const sx = avgW * 1.7, sy = lineH * 0.75;                            // SPREAD in letter widths
for (const row of rows) {
  for (const l of row) {
    const dx = l.cx - px, dy = l.cy - py;
    let target = inside ? Math.exp(-(dx*dx)/(2*sx*sx) - (dy*dy)/(2*sy*sy)) : 0;
    if (target < 0.01) target = 0;
    l.f += (target - l.f) * (target > l.f ? up : down);
  }
  let acc = 0;
  row.forEach((l) => { const extra = l.w * stretch * l.f; write(l, acc + extra / 2); acc += extra; });
}
// write(): translate3d(shift,0,0) scaleX(1 + stretch*f) on the letter, opacity 1-f on the solid layer;
// skip the write when the string didn't change. rAF runs only while something is still moving.
```
`stretch` is 0.55 on desktop and 0.38 on ≤760 px. API: `move(clientX, clientY)`, `moveRel(u, v)` (fractions of the box, no layout read), `leave()`, `setActive(on)`, `measure()`.

**Touch:** a finger dragging across the words drives `move()` (passive touchstart/touchmove on the stage, only inside the copy's box). When nobody has touched it for 2.5 s, a "ghost finger" drifts a lazy figure-eight through the line via `moveRel`, only while the hero rests at the top (`scrollY <= 4`) and is on screen:
```ts
kinetic.moveRel(0.5 + 0.45 * Math.sin(t * 0.55), 0.5 + 0.38 * Math.sin(t * 1.1 + 1.3));
```
A tap on a frame develops it; when idle, a frame in the upper half lights up every 2.2 s.

## 8. Scroll animations

**Reveals** (`global.css` + `core.ts`): `[data-reveal]` fades up 24 px with a 60 ms stagger via `--i`; `.is-in` is added once by an IO. Without JS everything is visible (the rules are scoped to `.js`).
```css
.js [data-reveal] { opacity: 0; transform: translateY(24px);
  transition: opacity 700ms var(--ease-out), transform 900ms var(--ease-out);
  transition-delay: calc(var(--i, 0) * 60ms); }
.js [data-reveal].is-in { opacity: 1; transform: none; }
/* image plates wipe up like a print coming out of the plotter */
.js [data-reveal='wipe'] { clip-path: inset(100% -40% -25% -40%); transition: clip-path 1100ms var(--ease-in-out); }
.js [data-reveal='wipe'].is-in { clip-path: inset(-25% -40% -25% -40%); }  /* negative insets: callouts can hang outside */
```
Two observers keep it cheap. A wipe target is fully clipped, and Chrome's IO honours the target's own clip-path, so watch its parent. Reveals are only handed to the reveal observer when their sheet comes within half a screen:
```ts
const revealIO = new IntersectionObserver(/* add .is-in, unobserve */, { rootMargin: '0px 0px -12% 0px' });
const nearIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  bySheet.get(e.target)?.forEach((w) => revealIO.observe(w)); nearIO.unobserve(e.target);
}), { rootMargin: '50% 0px' });
```

**Self-drawing callouts and dimension lines** (`Annotated.astro`): coordinates are % of the photo. Once the figure is `.is-in`, each callout plays in sequence: the dot pops (`scale .6→1`, 400 ms, delay `500ms + i*140ms`), the leader line scales out from its origin (500 ms), then the label fades in. Dimension lines draw the same way. On phones (≤560 px) labels would run off the screen, so they switch to the drawing convention: numbered balloons on the photo and a parts list underneath.

**Text swaps** cross-fade, opacity only, 180 ms; instant with reduced motion (`swapText` in `src/scripts/env.ts`).

**Page transitions**: cross-document View Transitions in CSS, no JS: old page fades and lifts 12 px (220 ms), new page rises 18 px (420 ms), fade-only for reduced motion.

## 9. The bench scroll

Files: `Inspector.astro`, `src/scripts/inspect/bench.ts`, `engine.ts`, `models/*.ts`.

Each build pins while you scroll through a tall track. Progress `p` (0..1) drives:
1. 0–0.7: an exploded 3D line model (orthographic, plain 2D canvas) assembles part by part. The part being fitted is drawn in orange, a slow turntable turns it, and dimension lines draw in at the end. Part labels `P-01 …` with leader lines.
2. 0.74–0.92: a scanner line wipes the drawing into the real photo.
3. A HUD reads like a log: "Fitting P-08 · Cockpit", a % counter, a progress bar, and spec rows ticking on.
4. Done: "As built". Desktop: the cursor tilts the model on a spring, and over the photo it becomes an x-ray lens (an edge scan of the photo). Touch: drag sideways to turn, press and hold the photo (260 ms) for the lens, steered by the finger.

Models are lists of 3D segments per part with an `explode` offset and a `start` time; the helmet is traced from the clean photo (`scripts/media/trace-helmet.py`); the X-wing and printer use proportions from Orhun's own drawings (460 × 385 mm; 390 × 400 frame). Models load only near the viewport; finished or offscreen drawings stop drawing.

On touch the drawing **glides** towards the scroll position at the same pace on every refresh rate, from cached geometry, so uneven scroll delivery never shows:
```ts
function glide(now: number) {
  glideRaf = 0;
  const dt = glideLast ? Math.min(0.1, (now - glideLast) / 1000) : 1 / 60;
  glideLast = now;
  const k = 1 - Math.exp(-dt / 0.085);         // ~85 ms time constant at any Hz
  let moving = false;
  for (const it of items) {
    if (!it.near || !it.engine || it.mode !== 'scroll') continue;
    const t = clamp01((scrollY - it.top) / (it.h - clientH));   // it.top/h cached by measure()
    let c = it.sp < 0 ? t : it.sp + (t - it.sp) * k;
    if (Math.abs(t - c) < 0.0006) c = t; else moving = true;
    it.sp = c; apply(it, c, it.vw);
  }
  if (moving) glideRaf = requestAnimationFrame(glide); else glideLast = 0;
}
```
On touch the engine runs in **"lean" mode**: labels, leaders and dimension tags are painted into the canvas (style read once from the hidden DOM labels) instead of moving DOM nodes, and the photo wipe is two counter-moving transforms (window `translate3d(x%)`, inner `translate3d(-x%)`) instead of a clip-path. Desktop keeps DOM labels, SVG leaders and the clip-path.

## 10. Video plates

File: `Plate.astro` + `core.ts`. Every looping clip is a "plate": muted, `playsinline`, `loop`, `preload="none"`, with a FIG caption, a pause button (WCAG 2.2.2) and a click-to-toggle on the video itself. It plays only while ≥25% visible and never with reduced motion. The poster is set only when the plate comes within 800 px. Phones get a lighter cut through a media-gated source:
```astro
<video muted playsinline loop preload="none" data-poster={p.src} data-autoplay aria-label={alt}>
  <source src={src.replace(/\.mp4$/, '.m.mp4')} type="video/mp4" media="(max-width: 760px)" />
  {webm && <source src={webm} type="video/webm" />}
  <source src={src} type="video/mp4" />
</video>
```
All board clips (skate, snow, the Cape Verde backfull) share the same Plate, caption style and behaviour. No single clip gets extra emphasis.

## 11. Touch equivalents (the full map)

| Desktop (hover / cursor) | Touch |
|---|---|
| Pen cursor with ink tail, ring on clickables | No cursor; an orange tap ring blooms where the finger lands |
| Hero letters react to the cursor | Finger drag across the words; an idle ghost finger when untouched |
| Hero frame under the cursor develops and plays | Tap a frame; idle auto-develop every 2.2 s |
| Bench: cursor tilts the model | Drag sideways to turn |
| Bench: x-ray lens on photo hover | Press and hold the photo (260 ms), the finger steers the lens |
| Rows, build links, trip photos, next-drawing link, email underline on hover | `.is-focus` as they cross the middle of the screen |
| Buttons invert on hover | Buttons invert while pressed (`:active`) |
| Magnetic buttons | Off (no hover to pull towards) |
| Lenis smooth scroll | Native scrolling; CSS `scroll-behavior: smooth` + `scroll-padding-top: 64px` for anchors |
| Hint "Move over the frames…" / "Move the cursor…" | Hint "Tap a frame · drag across the words" / "Drag the drawing… press and hold the photo" (`.hint-fine` / `.hint-touch` spans swapped by `(hover: none)`) |

The scroll-centre focus pattern (`core.ts`):
```ts
if (matchMedia('(hover: none)').matches && !reducedMotion()) {
  const focusIO = new IntersectionObserver(
    (es) => es.forEach((e) => e.target.classList.toggle('is-focus', e.isIntersecting)),
    { rootMargin: '-44% 0px -44% 0px' });   // a band across the middle of the screen
  document.querySelectorAll('.build-mini, .wt__row, .row, .role__pg, .bd__next, .trip__shot, .contact__mail')
    .forEach((el) => focusIO.observe(el));
}
```
```css
@media (hover: hover) and (pointer: fine) { .contact__mail:hover .contact__addr { background-size: 100% 2px; } }
@media (hover: none) { .contact__mail:global(.is-focus) .contact__addr { background-size: 100% 2px; } }
```
Gate every hover style with `@media (hover: hover) and (pointer: fine)` and pair it with a `(hover: none)` version. Gate JS with `finePointer()` / `reducedMotion()` from `src/scripts/env.ts`; motion itself is gated only on `reducedMotion()`.

## 12. Small physical details

- **Press**: `.press:active { transform: scale(.97) }`, 140 ms ease-out.
- **Buttons**: mono, uppercase, pill, 1 px `--line-strong`; hover (fine pointer) inverts to ink on paper.
- **Link draw**: an underline that draws in from the left, `background-size 0 → 100% 1px`, 240 ms.
- **Magnetic buttons** (`motion.ts`, fine pointer only): a tiny spring writing `transform` on the button only while it moves. Stiff while following (k 260, c 26), softer and slightly bouncy on release (k 170, c 11), `[data-magnetic="0.12–0.25"]` for strength.
- **Copy email** button swaps its label to "Copied" via `swapText` and back after 1.8 s.
- **Live clock**: Eindhoven time via `Intl.DateTimeFormat`, every 15 s.

## 13. Conventions

- Animate `transform` and `opacity` only (clip-path for wipes on desktop). Write transforms straight onto the element, never through an inherited CSS custom property.
- Curves come from the tokens: `--ease-out` for entering and UI, `--ease-in-out` for wipes and on-screen moves, linear for constant drift. UI transitions stay ≤ 300 ms; reveals can be 700–1100 ms.
- rAF loops run only while something is moving, and stop when idle or off screen. Skip DOM writes when the value didn't change.
- No layout reads inside a frame: measure on load/resize/fonts-ready and cache.
- One scroll listener per system, passive, batched to rAF.
- IntersectionObserver for visibility; pause CSS animations, videos and loops off screen.
- No animation library (GSAP was removed). Lenis on fine pointers only.
- Reduced motion: fewer and gentler, not broken. Keep fades, drop movement, no autoplay, the hero static, the bench shows the finished state, and the site works without JS.
- Accessibility: visible focus (2 px orange outline), pause buttons on every looping video, decorative layers `aria-hidden`, real text kept in a visually hidden span behind split letters.
