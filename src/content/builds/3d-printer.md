---
title: Own 3D printer
code: B-04
order: 4
started: 2024-02-02
finished: 2024-06-17
summary: Designed, built and programmed a CoreXY printer from zero, with a team of four.
cover: ../../assets/media/builds/printer/finished.jpg
model: printer
xray: ../../assets/media/xray/3d-printer.webp
coverAlt: The finished CoreXY 3D printer, a black aluminium-extrusion cube with blue printed brackets, on a lab table
specs:
  - ['Build time', '~4.5 months']
  - ['Team', '4 people, Fontys']
  - ['Kinematics', 'CoreXY']
  - ['Board', 'BTT Manta E3EZ']
  - ['Firmware', 'Klipper']
  - ['Frame', 'Aluminium extrusion, printed brackets']
dimensions:
  - { from: [13, 32], to: [87, 32], label: '390', side: top }
  - { from: [10, 40], to: [10, 87], label: '400', side: left }
callouts:
  - { at: [52, 46], label: 'Toolhead, own design', dir: right }
  - { at: [24, 36], label: 'CoreXY belts', dir: left }
  - { at: [62, 66], label: 'Bed + Z axis', dir: right }
gallery:
  - { src: ../../assets/media/builds/printer/frame-cad.jpg, alt: 'CAD render of the printer frame with every extrusion labelled and dimensioned in marker', caption: 'Fig. 2 — Frame, every extrusion named', wide: true }
  - { src: ../../assets/media/builds/printer/parts.jpg, alt: 'All printer parts laid out on a table: extrusions, rods, motors, brackets and a display', caption: 'Fig. 3 — Everything, before it was a printer' }
  - { src: ../../assets/media/builds/printer/toolhead-cad.jpg, alt: 'Transparent CAD render of the toolhead with fan, hotend and extruder', caption: 'Fig. 4 — Toolhead in CAD' }
  - { src: ../../assets/media/builds/printer/toolhead.jpg, alt: 'Close-up of the real toolhead with a blue printed shroud above the build plate', caption: 'Fig. 5 — Toolhead, real' }
video:
  src: /media/builds/printer/printing.mp4
  poster: ../../assets/media/builds/printer/printing.jpg
  alt: The finished printer's toolhead moving across the bed during a print
  caption: Fig. 6 — It prints.
---

Fontys asked us to come up with a project we actually wanted to build. We picked the thing we use every day: a 3D printer. Not a kit. Our own design.

Four of us designed, built and programmed it from scratch. CoreXY kinematics, so both motors stay on the frame and the toolhead stays light and fast. Aluminium extrusion for the frame, with printed brackets, and a toolhead we designed ourselves.

## Electronics + firmware

A BigTreeTech Manta E3EZ running Klipper. Klipper does the heavy maths on a separate computer and leaves the board to drive the motors, so tuning becomes editing a config file instead of reflashing firmware every time.

## The good part

The moment a printer you designed prints a part for itself. That's the whole point.
