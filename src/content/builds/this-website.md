---
title: This website
code: B-05
order: 5
started: 2026-10-26
summary: A set of engineering drawings, except the subject is me. You're on sheet 03.
specs:
  - ['Status', 'Rev 23, in progress']
  - ['Framework', 'Astro + TypeScript']
  - ['Hero', 'Three.js line drawing']
  - ['Motion', 'GSAP, ScrollTrigger, Lenis']
  - ['Type', 'Bricolage Grotesque + JetBrains Mono']
  - ['Accent', 'International orange, rationed']
dimensions: []
callouts: []
gallery: []
---

Most portfolios are a hero, three cards and a skills grid. I wanted mine to look like what I actually do.

So the whole site is a drawing set: sheets, a title block, part numbers, dimension lines. The subject is a person instead of a part. The hero is a wireframe of my tallbike that puts itself together while you scroll, because it was the most ridiculous thing I've built and it seemed like a good first impression.

## Under the hood

Astro for a fast static site, with each build written as a markdown file. Three.js only for the hero, loaded lazily. GSAP + ScrollTrigger for the scroll work, Lenis for smooth scrolling. Everything still works with reduced motion turned on, and it drops to a static drawing if WebGL isn't there.
