# About Orhun (as used on the site)

Source of truth in the repo: `src/data/site.ts`, `src/data/work.ts`, `src/data/trips.ts`, `src/content/builds/*.md`. Checked against the CV and LinkedIn by Orhun.

**Never publish:** street address, phone number, birthdate, gender, nationality line. Customer names for work sites stay out too.

## Basics

- **Name:** Orhun Habib Erdogan (short: Orhun, initials O.H.E.)
- **Age:** 23 (shown on the site as "Rev 23" in the title block)
- **Role:** Mechatronics engineer
- **Base:** Eindhoven, NL · 51.44°N 5.47°E · Europe/Amsterdam
- **Languages:** Dutch (native), Turkish (native), English (professional), German (limited). Site copy: "Dutch and Turkish, both native, which mostly means I can complain in two languages."
- **Public contact:** orhun2303@gmail.com · LinkedIn https://www.linkedin.com/in/orhunhabiberdogan · GitHub https://github.com/orhun23
- **Hero line (Orhun's own):** "I make machines do things. Then I go skateboarding." Orhun changed "snowboarding" to "skateboarding": "i skate more then i snowboard".

## Short bio

Mechatronics engineer who's happiest where software meets real machines ("where the code stops being code and something actually moves"). Between things on purpose: the job at Vanderlande ended in September 2026 and Orhun is taking time to work out what's next instead of jumping straight into another job. Wants to work independently, on their own terms, on interesting machine problems (open to freelance). Looking at a master's in robotics + entrepreneurship for 2027.

Outside work: skateboards most days, snowboards when there's snow, surfs when there's a wave ("falling off all three, regularly"). Freedom, travel and action sports are a big part of who Orhun is. Maker at heart: takes electronics apart, mods consoles and handhelds, 3D prints, builds things nobody asked for.

## What the site is for

Mostly personal. When someone Googles Orhun or gets the link, they should get who Orhun is: an engineer who builds real machines, a tinkerer, someone who'd rather be on a mountain or a wave than in a meeting. The professional layer (work, skills, CV, "open to projects") is there but quiet: something you find, not the headline. No "Hire me!" banners, skill bars or buzzwords. Personal first, portfolio and CV third. Bar: "damn, that's me."

## Voice

Blunt, informal, direct, dry humour. Short sentences. No hype words ("passionate about innovation" is banned). English. Examples from the site:
- "I wanted to see the world from about two metres up, and a ladder seemed boring."
- "Every engineer has an Iron Man phase. Mine came with a print queue."
- "Got an interesting machine problem? Tell me about it."
- 404: "Sheet not found. Probably fell off the tallbike."
- Status readout: "Between things, on purpose" · "checked: nobody"
- Contact: "Response time: faster than a PLC handover" · Cookies: "None. Not even tracking."

## Work history

LinkedIn still says Vanderlande is "Present". It isn't; use these dates.

| Role | Where | When | What Orhun did |
|---|---|---|---|
| International Controls Project Engineer | Vanderlande, Veghel (on site in UK + India) | Sep 2025 – Sep 2026 | Commissioned loop-sorter control systems on customer sites in the UK and India, teams of 2–4. PLCs over Profinet + FSC safety, Vanderlande's Debian-based flow controller. Bring-up, verification against spec, on-site fault finding through to customer handover. Highlight: XXL loop sorter, UK, 800+ destinations, six months on site (Jan–Jun 2026). Don't name the customer. |
| Graduation Intern Mechatronics | Vanderlande, Veghel | Feb – Sep 2025 | Feasibility study: replacing the traditional PLC control architecture with a new Siemens platform that unifies control types, compared with vendor-independent options. What moving control from OT hardware to IT infrastructure (Docker containers) does to deterministic behaviour. Built the evaluation platform themselves in IEC 61131-3 ST and ran the validation test plan. |
| Mechatronics Intern | WeFabricate, Best | Feb – Jul 2024 | Rewrote the Bin-Handler (AGV-fed bin registration station) control software in C++, re-architected for scalability. ROS2 for modular comms, C++ behaviour tree with custom Groot nodes. Gazebo digital twin from a URDF covering its full range of motion. |
| Mechatronic Engineer (part-time) | Fyllar, Best | May 2023 – Jul 2024 | Low-level C++ driver library for the MCF8329A three-phase BLDC FOC gate driver over I²C, written from the register map. Shipped in Fyllar's dispensing machine. Also a C# proof of concept for automated unit testing. |
| Software Engineer | Robotics Team Pi, Eindhoven | Jul 2022 – Aug 2023 | One of two software engineers. Designed the full software architecture for the PHINIX robot (3rd place, regional competition), incl. sensor comms. Object detection in Python + OpenCV with a depth camera. |

One-line teasers used on the homepage: "Commissioned loop-sorter control systems on customer sites abroad." · "Could a new Siemens platform replace the classic PLC architecture? Tested it." · "Rewrote an AGV-fed bin station's control software in C++, plus a digital twin." · "Wrote a BLDC gate-driver library from the register map. It shipped." · "One of two software engineers on a competition robot. Took 3rd."

**Education:** BSc Mechatronics Engineering, Fontys University of Applied Sciences, 2021–2025. Specialisation Project Management & Automation. Final grade 8/10 (for the degree).

**Skills:** C++, ROS2, Python, C#, Linux, Git, PLC programming, TIA Portal, IEC 61131-3 ST, Profinet, Gazebo, Matlab, SolidWorks, Fusion 360, 3D printing.

**Certificates:** SolidWorks CSWA (2021), VCA-VOL (on-site safety).

## Builds (maker projects, these matter more than the CV)

| Code | Build | Dates | Facts |
|---|---|---|---|
| B-01 | **Tallbike** | 12 Aug – 14 Sep 2022 | Two donor frames welded one on top of the other in the university metal workshop. ~5 weeks. It rides properly. Reddit post: 7.6k upvotes. Hard parts: geometry, steering through two frames, getting on ("lean against a lamp post and commit"). |
| B-02 | **Iron Man helmet** | 15 Dec 2022 – 14 Feb 2023 | Designed and fully 3D printed, ~50 h of printing. A 360° servo drives two arms that lift the faceplate up and over the helmet; the code is one while loop that runs until fully open/closed. Sanded, primed, gold, red. |
| B-03 | **X-wing** | 15 May – 19 Sep 2023 | Designed in SolidWorks + Blender, printed, painted and weathered by hand. No lights or motors. ~40 cm wingspan, ~50 cm long (Orhun's "Overall measures" drawing: 460 mm long, 385 mm span). Has an exploded-view drawing with every part numbered. |
| B-04 | **Own 3D printer** | 2 Feb – 17 Jun 2024 | Fontys project, team of 4: designed, built and programmed from scratch. CoreXY, aluminium extrusion frame ~390 × 400 with printed brackets, own toolhead, BTT Manta E3EZ board, Klipper firmware. |
| B-05 | **This website** | Oct 2026 – | A set of engineering drawings where the subject is a person. Astro, 2D canvas line drawings, Overused Grotesk + JetBrains Mono, "international orange, rationed". |

## Out there (sports + travel)

- **Skate:** most days. Clips: rail at the Trocadéro (Paris, Eiffel Tower behind), indoor park, the Taghazout bowl in Morocco (that's Orhun in the bowl).
- **Snow:** Alps. Snowboard jump clip (4K, loops), snow-spray close-up (the best single photo of Orhun, used as the portrait).
- **Surf:** Lombok, Indonesia (that's Orhun in the surf shot). No surf clip yet.
- **Backfull into a pool**, Cape Verde (short clip): just one of the board videos, no extra emphasis.

Trips (Field log, written as spec sheets with coordinates and one blunt line):
- **Rinjani, Lombok, Indonesia** (Aug 2025, 8.41°S 116.46°E): 3726 m, "~2 h sleep, in a tent, on a slope", swam with a whale shark.
- **Fuji, Osaka & around, Japan** (Jul–Aug 2024): slept on Fuji, shadow shot at 04:59, Osaka neon at night.
- **Sahara, Todra, Taghazout, Morocco** (May 2026): desert, gorge, then a concrete bowl "full of kids who skate better than me". Camel (reluctant).
- **Santiago & Fogo, Cape Verde** (Sep 2026): first trip after the job ended. Scooter, active volcano (2829 m), black sand.
- **Agra & Jaipur, India** (Dec 2025): went for work (commissioning a sorter), used every weekend.
- **Istanbul, Türkiye** (Jul 2025): "the other half of home".

## Media notes

- Raw photos and videos live in `C:\Users\orhun\OneDrive\Bureaublad\orhun's website\photos\` (subfolders for personal projects, travel, work, action pics + vids, additional pictures).
- Still missing: a proper non-selfie photo of Orhun, a surf clip.
- Left out on purpose: the photo with kids in India, friends' faces in big images, Instagram screenshots with text, a terminal screenshot showing hostnames/IPs, generic tourist shots (Eiffel Tower, Louvre).
