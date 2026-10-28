# CLAUDE.md: orhun-site

Personal site of Orhun Habib Erdogan, laid out as a set of engineering drawing sheets. Live: https://orhun-s-site.vercel.app. Repo: `github.com/Orhun23/Orhun-s-site` (branch `main`).

Deeper background (bio, every piece of design feedback, motion patterns with code, technical lessons) is in `docs/skill-backup/personal-website/`, a copy of the user-level skill `~/.claude/skills/personal-website/`.

## Never

- Put a street address, phone number, birthdate, gender or nationality line anywhere: site, repo or CV PDF. Don't name work customers. Don't use WeFabricate/Fyllar images without asking.
- Commit `src/data/gps.json` (ignored; it holds photo coordinates) or media with metadata.
- Commit or push without being asked. A push to `main` deploys to production.

## Stack

Astro 7 + TypeScript, static output. Vanilla CSS with design tokens. Lenis (smooth scroll, mouse/trackpad only). Plain 2D canvas for the line drawings. No animation library, no tracking. Node 22+. Playwright for screenshots, profiling and asset generation.

## Run, build, deploy

```sh
npm install
npx astro dev --background      # http://localhost:4321  (astro dev stop|status|logs)
npm run build                   # → dist/
npx astro preview --port 4322   # serve dist (rebuild first)
npx astro check                 # types
```

Deploy: push to `main`; Vercel builds it (Astro preset, `npm run build`, output `dist`). Open items: set the `SITE_URL=https://orhun-s-site.vercel.app` env var in Vercel and redeploy, and update the sitemap line in `public/robots.txt`. Netlify would work the same way (build `npm run build`, publish `dist`).

Before big changes: commit, push, and tag a checkpoint (`vN-checkpoint`). Tags so far: `v1-checkpoint`…`v4-checkpoint`, `v5`, `v6`, `v7`.

## Where things live

| What | Where |
|---|---|
| Tokens (colour, type scale, space, easing) | `src/styles/tokens.css` |
| Global styles, reveals, buttons, view transitions | `src/styles/global.css` |
| Name, email, links, hero line, sheet list, nav | `src/data/site.ts` |
| Work roles, education, skills, languages | `src/data/work.ts`; role pages content `src/data/roles.ts` |
| Trips (Field log) | `src/data/trips.ts` |
| Builds, one markdown file each | `src/content/builds/*.md` (schema in `src/content.config.ts`) |
| Homepage order | `src/pages/index.astro`: Hero, Status, Builds, FieldLog, WorkTeaser, Contact |
| Layout chrome | `src/layouts/Base.astro`: Header, SheetFrame, TitleBlock, Cursor, core script |
| Hero (contact sheet + kinetic line) | `src/components/Hero.astro` (frames in the `raw` list), `src/scripts/hero/kinetic.ts` |
| Inspection bench (builds) | `Builds.astro`, `Inspector.astro`, `src/scripts/inspect/{bench,engine}.ts`, `models/*.ts` |
| Site-wide behaviour | `src/scripts/core.ts` (reveals, title block, videos, touch focus, clock, copy), `motion.ts` (Lenis, magnetic), `env.ts` (`reducedMotion`, `finePointer`, `swapText`) |
| Photos (optimised, no metadata) | `src/assets/media/{builds,field,trips,work,xray}/` |
| Videos | `public/media/…` (`.mp4`, phone cut `.m.mp4`, some `.webm`) |
| Fonts | `src/assets/fonts/` + `astro.config.mjs` (Fonts API) |
| Pages | `/`, `/work`, `/work/[id]`, `/builds/[id]`, `/cv`, `/404` |
| Scripts | `scripts/shoot.mjs`, `shoot-hero.mjs` (screenshots), `scripts/perf/*` (profile, trace, baseline, compare), `scripts/media/*` (import, phone videos, x-ray, helmet trace), `scripts/make-assets.mjs` (CV PDF, OG, icons) |

## Common edits

- **Copy:** personal facts and the hero line in `src/data/site.ts`; work in `src/data/work.ts`; trips in `src/data/trips.ts`; section text in its component (`Status.astro`, `Contact.astro`, …). Voice: blunt, informal, short sentences, dry humour, no hype words.
- **Add a build:** create `src/content/builds/<id>.md` (copy an existing one; `code` like `B-06`, `order`, dates, `summary`, `specs`, optional `cover`, `dimensions`/`callouts` in % of the photo, `gallery`, `video`). It appears on the homepage and at `/builds/<id>/`. A bench line model is optional: add `models/<id>.ts`, register it in `bench.ts` `models` and the `model` enum in `content.config.ts`.
- **Swap or add photos/videos:** add an entry to `scripts/media/media.json`, then `python scripts/media/import-media.py "<photos folder>" [--only a,b]` (needs pillow, pillow-heif, imageio-ffmpeg in a venv). It rotates, resizes, strips metadata and compresses. For every new mp4 run `scripts/media/make-mobile-videos.py` to make the `.m.mp4` phone cut. Use images through Astro `<Picture>`/`getImage`.
- **Hero frames:** edit the `raw` list at the top of `Hero.astro` (`[path, tag, label, video?]`).
- **CV PDF, OG image, icons:** run the dev server, then `node scripts/make-assets.mjs`. The CV page is built from `work.ts`; keep the PDF free of private details.

## Design system (short)

- **Concept:** every section is a numbered drawing sheet (01 General arrangement … 06 Contact). Fixed frame with zone markers (`SheetFrame`), a title block that tracks the current sheet (`TitleBlock`), a 32 px grid on the paper, mono part codes (`B-01`, `FIG. 03`), orange dimension lines and callouts that draw themselves.
- **Colour:** paper `#ecebe5`, graphite `#121314`, one accent, international orange `#ff4f00` (as text on paper use `--orange-ink` `#b83500`). Dark mode follows the system plus a toggle. The builds bench is always dark (`.on-bench` re-declares tokens; blueprint grid).
- **Type:** Overused Grotesk (display + body, self-hosted variable 400–900, subset) and JetBrains Mono for labels (uppercase, `--step--2`). Fluid `clamp()` scale `--step--2` … `--step-5`. Display weight 700–800, tight tracking (−0.035 to −0.045em), line-height 0.92.
- **Space:** `--frame` (sheet border inset), `--gutter`, `--space-xs…xl`, max width 1440.
- **Motion:** `--ease-out cubic-bezier(.23,1,.32,1)` for UI and entering, `--ease-in-out cubic-bezier(.77,0,.175,1)` for wipes and moves; durations 140/180/240 ms for UI, 700–1100 ms reveals. Transform and opacity only. No GSAP; small rAF loops that stop when idle; CSS animations for constant drift; WAAPI for one-shots; cross-document View Transitions between pages.
- **Cursor** (fine pointer, no reduced motion): an orange dot exactly on the pointer, an ink tail drawn on a canvas (last 110 ms), and over anything clickable the dot opens into a thin ring, the same look everywhere, never a label box. Touch: no cursor, an orange ring blooms where the finger lands.
- **Hero:** a tilted wall of builds/boards/trips frames drifting up (CSS), dimmed graphite at 38% until you go to it; the frame you go to develops into colour and plays its clip (one shared `<video>`). The line "I make machines do things. Then I go skateboarding." sits in the composition; letters stretch, turn to outline and push neighbours near the pointer (Mike Wilcock-style, GPU-only). Scrolling lays the wall flat.

## Locked: do not touch without asking

Orhun signed these off as done. Don't refactor, restyle or "improve" them; if a change elsewhere would affect them, ask first.
- **Work:** homepage `WorkTeaser`, `/work`, the experience pages `/work/[id]`, `RoleDiagram`.
- **Personal projects scroll:** the inspection bench (`Builds`, `Inspector`, `bench.ts`, `engine.ts`, models) and its scroll animation.
- **The final hero:** the contact-sheet wall + kinetic line in `Hero.astro` / `kinetic.ts`.
- (The personal sections, Status and Field log, were also called "basically perfect".)

To prove they didn't change: `node scripts/perf/baseline.mjs http://localhost:4322 <dir>` before and after, then `python scripts/perf/compare.py <before> <after>`. 1440 must be pixel-identical.

## Mobile rules

- **Same site, adapted for touch, not a stripped-down version. Desktop is the reference.**
- Only `prefers-reduced-motion` gets the static version. Never gate motion on touch or screen size: `reducedMotion()` gates motion; `finePointer()` only picks cursor vs finger input.
- Every hover has a touch equivalent: hero letters follow a finger drag (plus an idle ghost finger); tap a hero frame (plus idle auto-develop); bench drag to turn, press and hold the photo for x-ray; rows, links and photos get `.is-focus` as they cross the middle of the screen (`core.ts` focusIO); buttons invert on `:active`. Hint text swaps via `.hint-fine` / `.hint-touch`.
- Gate hover CSS with `@media (hover: hover) and (pointer: fine)` and add a `(hover: none)` version.
- Recompose for tall screens, don't shrink. Check 360, 390, 430 and landscape. Labels ≥ 10–11 px, taps ≥ 44 px.
- Desktop must stay pixel-identical when changing mobile; keep touch changes behind touch checks.

## Performance rules and gotchas

- Measure first: `node scripts/perf/profile.mjs` (`--mobile` = 390, touch, 4x CPU; `GPU=1` or the numbers are software-rendered and wrong) and `scripts/perf/trace.mjs`. Emulation isn't a real phone; say so.
- Animate `transform`/`opacity` only. Write transforms on the element itself, never via an inherited custom property. No layout reads inside a frame: measure on load, resize and `document.fonts.ready`, and cache. Skip unchanged DOM writes.
- rAF loops stop when idle; everything off screen pauses (IO). The hero sets `.is-off` (stage hidden) a quarter screen out and calls `refresh()` when it comes back.
- Phone grids: `minmax(0, 1fr)`, not `1fr` (long text widened the bench mid-scroll and made it lag differently per phone).
- Bench on touch runs the engine's "lean" mode: labels painted into the canvas, the drawing glides to the scroll position (85 ms time constant), transform-based photo wipe. Desktop keeps DOM labels and a clip-path wipe.
- Lenis only on fine pointers. Non-passive touch listeners only while they're needed (the x-ray lens).
- `will-change` only on what animates, only while it's near. Canvas DPR ≤ 1.5 (2 for lean labels).
- Don't use `content-visibility: auto` (it broke anchor jumps). Wipe reveals: observe the parent (IO honours the target's own clip-path).
- Videos: muted, playsinline, loop, `preload="none"`, play only while visible, pause button, phone `.m.mp4` cut, webm first where available. Tone-map iPhone HDR clips.
- Users with iOS Reduce Motion get the static site by design; Low Power Mode blocks autoplay.
- Windows: Git Bash rewrites `/args`; writing to `nul` creates a file; keep the project out of OneDrive.
- `README.md` still describes the old Bricolage fonts; `astro.config.mjs` is the truth.

## Workflow Orhun expects

Checkpoint (commit + push + tag) before big changes. Ask all questions in one batch. For visual ideas, build rough clickable prototypes on separate routes instead of pitching in text, then wait for a pick. One commit per change with a clear message, ending with the co-author line. Screenshot every change at 1440 / 768 / 390 (`scripts/shoot.mjs`, `scripts/shoot-hero.mjs`, touch emulation for phones) and fix what's off before showing. Finish with: what changed, what's still a placeholder, what you weren't sure about.
