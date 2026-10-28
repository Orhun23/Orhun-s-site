---
name: personal-website
description: >-
  Orhun Habib Erdogan's personal website and portfolio. Covers who Orhun is, their taste (what they liked and rejected, and why), the site's visual language and motion patterns, and the workflow they expect. Use this whenever Orhun asks for anything on a personal website, portfolio, homepage, CV page or landing page about themselves, or on the existing site at C:\dev\orhun-site (orhun-s-site.vercel.app): new sections, a redesign, a hero, animations, mobile fixes, copy, photos or deploys. Use it even when they only say "my site" or "the website", and even for a fresh site built from scratch.
---

# Orhun's personal website

Orhun is a mechatronics engineer from Eindhoven who skates, snowboards, surfs, travels and builds things nobody asked for. The site already exists: `C:\dev\orhun-site` (Astro + TypeScript, vanilla CSS tokens), repo `github.com/Orhun23/Orhun-s-site`, live at https://orhun-s-site.vercel.app. The repo's `CLAUDE.md` is the practical manual for that codebase.

Read the reference that fits the task before you design or write anything:

| File | Read it when |
|---|---|
| `references/about-me.md` | writing copy, captions or the CV; anything factual about Orhun |
| `references/taste.md` | proposing any design, hero, motion or layout (it holds every piece of feedback Orhun gave, and their Awwwards references) |
| `references/design-system.md` | building UI: tokens, type, the drawing-sheet frame, cursor, hero text, scroll and touch patterns, with code |
| `references/lessons.md` | anything touching performance, mobile, video, canvas or deploys |

## Hard rules

- **Privacy.** Never put Orhun's street address, phone number, birthdate, gender or nationality line on the site, in the repo or in a CV PDF. Don't name work customers (say "XXL loop sorter, UK"). Strip all photo/video metadata (GPS especially). Never use WeFabricate or Fyllar images without asking.
- **Locked sections.** In the existing site, Work (homepage teaser, `/work`, the experience pages, RoleDiagram), the personal projects inspection bench and its scroll, and the contact-sheet hero are signed off. Don't refactor, restyle or "improve" them. If a change elsewhere would affect them, ask first.
- **Mobile is the same site, adapted for touch.** Every hover gets a touch equivalent. Only `prefers-reduced-motion` gets the static version, never "touch device" or "small screen".
- **Outward actions need a yes.** Commit and push only when asked. Deploys happen by pushing to `main` (Vercel).

## Workflow

1. **Checkpoint before anything big.** Commit, push and tag the current state (`vN-checkpoint`) and confirm it before touching code. Check `.gitignore` and that nothing private is staged first.
2. **Ask everything at once.** If you need facts, photos or decisions, put them in one batch, not a drip of questions.
3. **Prototype, don't pitch.** For anything visual with real design risk (a hero, a new section's character), build 2 rough versions on their own routes (`/hero-a`, `/hero-b`) that Orhun can click through, with one line each on the idea and which references it draws from. Orhun picks one or asks for a mix; only then polish it into the real page and delete the prototype routes. Text pitches for the hero missed four rounds in a row; the first clickable prototypes landed.
4. **One change per commit**, with a clear message, so any single change can be rolled back.
5. **Look at your own work.** Screenshot every change at 1440, 768 and 390 with Playwright (plus 360/430 and landscape for mobile work, and the touch interactions with touch emulation on). Look at the shots critically and fix what's off before showing them. For mobile changes, show 390 next to the 1440 shot.
6. **Prove locked sections didn't move.** Take baseline screenshots before, compare after (`scripts/perf/baseline.mjs` + `compare.py` in the repo); desktop at 1440 must be pixel-identical.
7. **Measure performance, don't guess.** Profile scrolling on desktop and on a 4x CPU-throttled phone emulation with touch, on the real GPU. Find the cause before changing code. Say clearly that emulation isn't a real phone.
8. **Hand over plainly**: what changed, what's still a placeholder, and what you weren't sure about (including copy you inferred).

## How Orhun gives feedback

Orhun reacts to what they can see and feel, not to descriptions. Short verdicts ("doesn't have the wow", "too chaotic", "a pile of text") mean "start over in that direction", not "tweak it". Something they call perfect is locked. They like restraint, flow and one strong idea over many effects; read `references/taste.md` before proposing anything.
