---
title: This website
code: B-05
order: 5
started: 2026-10-26
summary: A set of engineering drawings, except the subject is me. You're on sheet 03.
specs:
  - ['Status', 'Rev 23, in progress']
  - ['Framework', 'Astro + TypeScript']
  - ['Builds', 'Exploded line drawings on a 2D canvas']
  - ['Motion', 'CSS + a few small rAF loops, Lenis']
  - ['Type', 'Overused Grotesk + JetBrains Mono']
  - ['Accent', 'International orange, rationed']
dimensions: []
callouts: []
gallery: []
---

Most portfolios are a hero, three cards and a skills grid. I wanted mine to look like what I actually do.

So the whole site is a drawing set: sheets, a title block, part numbers, dimension lines. The subject is a person instead of a part. On your first visit the sheet draws itself in; after that it stays out of the way.

## Under the hood

Astro for a fast static site, with each build written as a markdown file. The builds on sheet 03 are exploded line drawings rendered on a plain 2D canvas, which put themselves together while you scroll. No animation library; Lenis for smooth scrolling. Everything still works with reduced motion turned on, and without JavaScript.
