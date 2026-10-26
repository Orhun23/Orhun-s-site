---
title: Iron Man helmet
code: B-02
order: 2
started: 2022-12-15
finished: 2023-02-14
summary: Fully 3D printed, with a faceplate that lifts itself. About 50 hours of printing.
cover: ../../assets/media/builds/helmet/finished.jpg
coverAlt: A finished red and gold Iron Man helmet on a white shelf
specs:
  - ['Build time', '~2 months']
  - ['Manufacturing', '100% 3D printed']
  - ['Print time', '~50 h']
  - ['Actuation', '360° servo, 2 arms']
  - ['Control code', 'One while loop']
  - ['Finish', 'Primer, gold, red, patience']
dimensions: []
callouts:
  - { at: [58, 37], label: 'Faceplate — lifts up and over', dir: right }
  - { at: [36, 50], label: 'Servo arms, inside each side', dir: left }
  - { at: [52, 60], label: 'Hand-sanded, a lot', dir: right }
gallery:
  - { src: ../../assets/media/builds/helmet/raw-parts.jpg, alt: 'Raw white 3D printed faceplate and cheek parts held in a hand', caption: 'Fig. 2 — Straight off the printer' }
  - { src: ../../assets/media/builds/helmet/electronics.jpg, alt: 'Servo, battery and breadboard wiring for the faceplate mechanism on a desk', caption: 'Fig. 3 — The brains, on a breadboard' }
  - { src: ../../assets/media/builds/helmet/primer.jpg, alt: 'The helmet in grey primer next to a pair of spoons for scale', caption: 'Fig. 4 — Primer. Spoons for scale.' }
  - { src: ../../assets/media/builds/helmet/white-assembled.jpg, alt: 'Assembled white helmet with a green LED glowing behind it', caption: 'Fig. 5 — First full assembly' }
video:
  src: /media/builds/helmet/faceplate.mp4
  poster: ../../assets/media/builds/helmet/faceplate.jpg
  alt: The primed helmet's faceplate swinging open on its servo arms
  caption: Fig. 6 — Faceplate test, pre-paint
---

Every engineer has an Iron Man phase. Mine came with a print queue.

The whole helmet is 3D printed: shell, cheeks, faceplate and the mechanism parts. Around 50 hours of printing in total, plus more sanding than I'd like to admit.

## The mechanism

A 360° servo drives two arms that lift the faceplate up and over the top of the helmet. The code is honest about how simple it is: one while loop that keeps the servo moving until the faceplate hits fully open or fully closed. It doesn't need to be clever. It needs to stop in the right place.

## Finishing

Sand, prime, sand again, gold, mask, red, then sand off whatever went wrong. The gap between "3D print" and "looks like a prop" is mostly patience.
