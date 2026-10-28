# Orhun's taste: what landed, what didn't, and why

The first section pulls out the principles. Below that is every round of feedback on the site, in order, with Orhun's own words quoted. Last come the Awwwards references with Orhun's notes on each.

## Contents
1. Principles (read this first)
2. Liked and kept
3. Rejected, and why
4. The feedback, round by round
5. Awwwards references

---

## 1. Principles

- **One idea, held with restraint.** "Good taste over more stuff." One focal point, motion that flows instead of firing in bursts. Every round that added more things on screen got rejected.
- **The vibe within 2 seconds.** Real work (footage, builds, trips) on screen from the first second beats decoration or explanation.
- **Behaviour you want to play with.** The hero should be something you play with for a second before scrolling, not something you read. Interactions small, precise and physical (Mike Wilcock's letters, the email-link cursor ring).
- **It has to be Orhun's, not borrowed.** Principles from references, never copies. Machines, maker builds, travel and action sports, in the site's own drawing-sheet language.
- **All of Orhun, together.** Travel, machines and action sports belong in one picture. A hero about only one of them ("just the backfull is not really what i am") misses.
- **Text supports, it doesn't lead the hero.** The rest of the site has plenty of text. The hero line is welcome only when it's part of the composition, never a headline pasted on top or a wall of type.
- **No extra emphasis on single items.** A clip is a clip: same style and behaviour as its siblings, no side text, no readouts, no physics overlays.
- **Same visual language everywhere.** A new part must feel like the same site as the sections already signed off, at their pace.
- **Mobile is the same site.** Not a stripped-down version. Desktop is the reference.
- **Smooth on every device.** Lag counts as a design flaw, and "it depends on the phone" isn't acceptable.
- **Show it, don't describe it.** Orhun judges by feel; clickable prototypes beat paragraphs.

## 2. Liked and kept

| Thing | Why it works for Orhun |
|---|---|
| The whole site as a set of engineering drawing sheets (title block, sheet numbers, part codes, dimension lines, callouts, coordinates) | Ties the engineer and the human layer together; kept through every round |
| International orange `#FF4F00` as the only accent | Orhun was unsure at first ("if you say that it will look really cool then im fine with it"); it held up because it's rationed |
| Overused Grotesk for display, JetBrains Mono for labels | Orhun asked for Overused Grotesk by name |
| The personal part (Status, Field log, trips as spec sheets) and its scroll | "I really enjoyed scrolling through the personal part"; later "basically perfect" |
| The inspection bench for projects: exploded line models that assemble on scroll, part in orange as it's fitted, dimensions draw in, scanner wipes into the real photo, x-ray lens | Gave projects their own character, "like you're inspecting the builds"; locked |
| A self-contained page per work role, only that role's text and photos | Fixed "random pictures from other experiences"; locked |
| The cursor ring on the email link | "I really like that look"; became the one hover look for everything |
| Hero A, "Contact sheet": a tilted wall of all the frames drifting up the paper, dimmed, the frame you go to develops into colour and plays | Picked from the clickable prototypes; instant vibe, all of Orhun at once |
| The line "I make machines do things. Then I go skateboarding." set into the hero composition, reacting like Mike Wilcock's letters | Asked for explicitly in the final round |
| Dim by default, full brightness on interaction | "so the text stands out first and the visuals light up when you interact with them" |
| Blunt, dry copy ("Operator, shown with PPE", "Sheet not found. Probably fell off the tallbike.") | Matches Orhun's own voice |

## 3. Rejected, and why

| What was built or pitched | Verdict | Why |
|---|---|---|
| Hero v1: exploded tallbike wireframe that plots itself and assembles on scroll, then cuts to the Trocadéro rail clip | "doesn't have the wow I'm after" | Nice idea, not a "wait, this is sick" moment; and the rail clip "comes out of nowhere: there's no context for it" |
| Pitch: Cape Verde backflip as a Muybridge-style motion study for the hero | "just the backfull is not really what i am" | Only one side of Orhun; they wanted travel, machines and sports together. (Callouts and physics were liked.) |
| Hero v2: "The machine", a Rube Goldberg chain reaction of all their stuff (slope, skate kicker, helmet servo, tallbike wheel, printer, paper plane over a trip map) with strobe cut-outs. Orhun later called it the knolling pile. | "way too chaotic and doesn't work" | A pile of things moving at once. Afterwards: "I'm no longer after a big wow moment." |
| Ghost-frame / stroboscopic Cape Verde backflip (cut-out frames along the flight path) | "doesn't work. It looks bad." | Replace with the real video |
| Cape Verde clip with a physics readout beside it (airtime, rotation, landing) and "backflip from Cape Verde" text | "No extra emphasis" | Treat it exactly like the skate and snowboard videos |
| Hero v3: calm, type-led hero with a "sheet draws itself" intro, big headline, an orange dimension line as the scroll cue | "still basically a pile of text, and that's the problem" | The hero should be the opposite of the text-heavy rest of the site |
| Hero v4: "Plotted", Orhun drawn as ~110 pen-plotter lines with a cursor lens, click to switch subject | "Only the hero still isn't it" | Rejected without detail; it showed one photo, not the world of work, and wasn't fun to play with |
| Cursor label boxes ("Inspect", "Open", "Play", "Pause") | "Remove the label box" | One look everywhere: the ring |
| Phone version that switched animations off for every touch device, with sizes off | "a big step down … feels like a different site" | Only reduced motion gets the static version |
| Bench animations lagging on phones, differently per phone | "i need this to be clean for every device" | Fixed by root causes (see lessons.md) |

Pitched but never built (for context): One Line (plotter line morphing into skate/tallbike/ridge), The print (photo printed in filament lines, G-code readout), Contour flight (Rinjani topo map in Three.js), Line rider, Knolling loadout (flat-lay of gear with BOM callouts), Departures board (split-flap), Expedition globe, Count-up to coordinates, No-intro type only, Field of marks, Dust portrait, and Hero B "Viewfinder" (one framed reel cutting through nine clips, the losing prototype).

## 4. The feedback, round by round

**Brief.** Awwwards-level, "not a template with my name dropped in". Concept "machines and mountains": an engineering layer (mono annotations, part-number labels, self-drawing dimension lines, coordinates, subtle grid) colliding with a human layer (big expressive type, full-bleed photos, humour). One proper wow moment. Avoid the generic dev portfolio (hero + three cards + skills grid), stock illustrations, emoji, gradients everywhere, "passionate about innovation" copy. A custom cursor only if it adds something. Personal first, portfolio and CV third. Bar: "damn, that's me."

**Pitch answers.** Unsure about the orange but fine if it looks cool. Line becomes "…Then I go skateboarding" ("i skate more then i snowboard lol"). Everything else OK to build.

**Round 1** (after the first build, tag `v1-checkpoint`): "Really solid first version, and I like where it's going. It's not where it needs to be yet though."
- Hero: scrap the exploded tallbike, it lacks the wow. The bar is "wait, this is sick", an Awwwards Site of the Day. Pitch 3–4 concepts first. The Trocadéro clip needs context (move it to the sports part with a lead-in) or goes.
- Typography: Overused Grotesk for display, self-hosted.
- Projects: "I really enjoyed scrolling through the personal part. The projects part felt flatter by comparison." Give it a different character with a lot more motion: scroll-driven exploded views, schematic lines and callouts drawing themselves, parts assembling, cursor-reactive elements. "It should feel like you're inspecting the builds." Use the cleaner photos across the site.
- Work: clicking an experience showed photos from other experiences. Each role needs its own self-contained view. Use the WeFabricate and Fyllar sites for context and UI ideas; ask before using their images.
- Performance: "still feels laggy in places. Profile it properly instead of guessing." 60 fps on desktop and a mid-range phone.
- Process: push + tag first, pitch and wait, build in order, commit per part, screenshot at 1440/768/390 and fix before showing.

**Hero concept pick:** turned down the motion study ("just the backfull is not really what i am"), asked for 5 new concepts that bring travel, machines and action sports together "in a really nicely animation style hero", liking "the callout stuff n the physics". Picked a hybrid of the Contraption and the motion study.

**Round 2** (`v2-checkpoint`): "This round is a big step up."
- Locked: the Work section, the personal projects section and its scroll animations, the experience pages. "These are basically perfect. Don't refactor, restyle or 'improve' them."
- Cape Verde: the ghost-frame effect "doesn't work. It looks bad." Use the real video (muted, autoplay, loop, playsinline, poster, mp4 + webm). A small readout only if it looks clean: "Good taste over more stuff."
- Hero: "way too chaotic and doesn't work. I'm no longer after a big wow moment." Clean, works immediately, makes people want to scroll. Maybe a 1–2 s intro once per session, skippable. Lots of space, strong type, one focal point, a tasteful scroll invitation. "The motion should come from the transition into the site, not from a pile of things moving at once." Match the pace and restraint of the liked sections.
- X-wing and printer: an accuracy pass from Orhun's drawings, only if it makes the animation better.
- Picked "A. Sheet draws itself" and approved a one-line fix to the bench engine.

**Round 3** (`v3-checkpoint`): "Not there yet. The hero is still basically a pile of text."
- Drop the headline. "The rest of the site has plenty of text; the hero should be the opposite." Artistic, visual, behaviour-driven, "something you want to play with for a second before scrolling. Not a wall of type, not a chaotic pile of objects." Actually open Awwwards portfolio sites, pick 3 and say what you take from each. Lead naturally into scrolling.
- Custom cursor with motion trailing after it, like Daniel Ingrassia's. Reacts to links, videos, project cards. GPU-only, no lag. Normal cursor on touch and with reduced motion.
- Cape Verde: remove the text and readouts. "No extra emphasis. Just use the video, styled and behaving exactly like the skate and snowboard videos."
- Picked "Plotted".

**Round 4** (`v4-checkpoint`): "The rest of the site is great. Only the hero still isn't it, plus one cursor fix. Don't touch anything else."
- Research properly: open the sites, scroll, hover. Orhun's five references with notes (section 5). "Don't copy any of them. Work out the principles behind why they land for me (instant vibe, flow, restraint, interaction that feels good), then make something that's mine."
- "Instead of pitching in text: build 2 rough hero prototypes on separate routes (/hero-a, /hero-b), real enough that I can feel how they behave." One line each on the idea and its references.
- The hero must set the vibe within 2 seconds, have no headline text, flow into the first section, and run smoothly on mobile.
- Cursor: remove the label box. "The cursor should behave the same everywhere as it does on hover over the email link at the bottom. I really like that look."

**Round 5:** "Going with hero A. Three finishing touches, then it's done."
1. Bring the line back, "as part of the composition, not as a headline slapped on top."
2. Make it react to the cursor like Mike Wilcock's hero. Smooth, GPU-only. (At this point touch and reduced motion were to get a static version; round 6 overrode that for touch.)
3. "Dim the background and the videos a bit by default, and bring them up to full brightness on hover, so the text stands out first and the visuals light up when you interact with them."
Then promote A to the homepage and delete the prototype routes. Tagged `v5`; Orhun deployed on Vercel.

**Round 6** (after deploying): "the phone version is a big step down from desktop. The sizes are off, and all the animations and interactive parts are gone, so it feels like a different site." The rule: "mobile should be the same site, adapted for touch, not a stripped-down version. Desktop is the reference."
- Motion back on phones; static only for `prefers-reduced-motion`.
- Every hover gets a touch equivalent: hero text reacts to touch and drag and drifts gently when idle; dimmed videos light up on scroll-into-view or tap; no custom cursor on touch "but keep the feel of it, e.g. a subtle response where you touch".
- Fluid type with clamp(), check 360/390/430 and landscape, redesign the hero for a tall screen ("not just shrunk down").
- Smooth on a real phone: GPU-only, lighter videos, lazy-load, pause offscreen, test with 4x CPU throttle. "Don't change the desktop version." Tagged `v6`.

**Round 7:** "the animations on phone on the personal projects are still laggy when you scroll over them and it lags differently for different phones i need this to be clean for every device." Tagged `v7`.

**Wrap-up:** "We're done with the site."

## 5. Awwwards references

Orhun's own picks (round 4), with Orhun's notes:

| Site | Orhun's note | The principle behind it |
|---|---|---|
| Alan Leone | "everything is intertwined and it shows the vibe immediately" | The whole body of work as one connected picture, the vibe in the first second (became the contact-sheet wall) |
| Mike Wilcock | "how the text behaves on hover; the cursor and font are neat" | Letters that swell and push their neighbours near the cursor, then ease back (became the kinetic hero line) |
| Artur Engel | "overkill for me, but worth looking at for individual ideas" | Mine details only (count-to-100 loader, spec labels); don't take the overall density |
| Kyoosang Choi | "everything flows, and you understand his vision right away" | Flow between parts, real footage, an instantly readable vision |
| Studio Mirage | "a clean aesthetic that conveys a message and just works" | One focal shape, restraint, it simply works |

Also asked for by Orhun:
- **Daniel Ingrassia** (cursor): an 8 px dot exactly on the pointer, plus a full-screen canvas comet tail that is longer when you move fast, tapers, and shrinks back into the dot at rest; the dot grows on links. Became the pen cursor with the ink tail (without the label boxes).

Found during research and used:
- **Rubens Cantuni**: the cursor reveals colour (combined with Alan Leone for hero A).
- **Jakub "Urbik" Urbanec** (a lattice of rings that bulges under the cursor) and **Anthracite Studio** (an image built from dots and characters): used for the rejected "Plotted" hero.

Early references from the first pitch (Claude's picks, accepted without comment): Igloo Inc (mono data labels over a scene), Lusion v3 (one surface colour plus one accent, cursor-reactive hero), Bruno Simon (personality over polish), Brandon Yasin (numbered index rhythm, live local time in the nav, which became the Eindhoven clock), Dennis Snellenberg (magnetic buttons, work as rows not cards).
