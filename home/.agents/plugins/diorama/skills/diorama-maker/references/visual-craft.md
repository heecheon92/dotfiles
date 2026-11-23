# Visual and motion craft

What makes a stage look rich, and how to build one. The values are a tested starting point;
choose your own colours and artwork. `assets/walkthrough.html` implements the illustrated
diagram stage described in the first half with these values; the trace and 3D sections are
reference values for stages you build yourself. Read this before building or changing a
stage, and when a sheet shows an overlap or a scene that looks lost.

In the engine, the first half is two layers: the isometric stage (`engine/stage-iso.js`,
`.css`: projection, objects, links, dots, camera, tracing) and the page of the `story`
template around it (`engine/template-story.js`, `.css`: step transitions, numbers and text
around the stage). `templates.md` holds the contract between them. The trace and 3D stages
below are not in the engine. Drawing state on the object is a rule for every template.

## What "rich" is made of

Seven things separate these stages from a plain box-and-arrow diagram. Each can be added
independently, and the first three do most of the work.

1. **Objects are illustrations built from layers**, not shapes with a fill.
2. **Things arrive, change and leave with motion that has weight**: they drop, settle, draw, fade.
3. **Something is always gently moving**: a stream of dots, a pulse on the hot node.
4. **State is drawn on the object**: a gauge, a glow, a tag, a cross.
5. **The camera reframes** so the current content always fills the stage.
6. **Every number and label animates when it changes**, so the eye is led to what is new.
7. **The page chrome shares the stage's style**: paper, ink lines, sticker shadows, one typeface.

## Illustrated diagram stage (story walkthroughs)

Plain inline SVG and one `requestAnimationFrame` loop. No drawing library.

### Projection and floor

- Isometric with a 2:1 tile. A grid unit maps to 14 px across and 7 px down:
  `screen = [14·(x + y), 7·(x − y) − z]`, `z` in pixels. Draw order is by `x − y`.
- The floor is a faint diamond grid pattern (one 28×14 diamond, 0.8 px line at 30% opacity)
  under a radial mask that fades it out towards the edges. The mask is re-centred on the
  camera every frame, so the grid looks endless and never shows an edge.
- Layers, back to front: floor marks → links → moving dots → objects → pills and link labels →
  cards in screen pixels. Dots sit under objects so they slip beneath a block at each end.

### A block is eight layers

Flat rectangle versus illustrated block is this stack, bottom to top:

| Layer | What | Reference values |
|---|---|---|
| 1 | contact shadow: the silhouette, shifted down, blurred | warm brown, 26% opacity, blur σ 6.5 |
| 2 | silhouette filled with the side gradient | vertical, slightly darker at the bottom |
| 3 | right-hand face darkened a touch | dark brown at 5% opacity |
| 4 | top face with its own, lighter gradient | diagonal |
| 5 | sheen: the top face shrunk, raised, blurred, white | 22% opacity, blur σ 2.2 |
| 6 | bevel: a light line along the two front top edges, plus a faint dark twin just below | white 75%, 1.6 px |
| 7 | ink outline, round joins | 1.9 px, near-black warm ink |
| 8 | icon centred on the top face; name on the front face | 24 px icon, 1.9 px stroke; 13 px bold text |

- Every corner is rounded by a small quadratic curve (radius 6–12 px). Sharp corners read
  as technical drawing; rounded ones read as a toy.
- Each colour is two gradient pairs (top, side) in one pastel hue. Six or seven named colours
  cover a collection. Ink is one warm near-black used for every outline and all text.
- Default block: 4 grid units wide, 46 px tall.

Other objects follow the same recipe: a cylinder for stored data whose fill level is a
coloured liquid with a meniscus; a small laptop with a miniature browser drawn on its screen;
a platform with a crowd of two-tone pawns that fills from the centre outwards; a row of discs
for a queue; a dashed floor rectangle with its name painted on the floor for a zone; a dashed
wireframe box for something that is gone.

### Pills, tags and cards

- A pill is a rounded rectangle (21 px high) with a thin ink stroke and a **solid ink copy
  offset 2 px below it**. That hard offset shadow, used on every pill, button and card, is the
  "sticker" look that ties stage and page together.
- Tones are background/text pairs: paper, green, amber, red, violet, gray.
- A gauge pill holds an icon, a 28×7 px track and a percentage. The fill is green below 60%,
  amber below 85%, red above.
- Pills stack upward from the object's top corner, 26 px apart.

### State on the object

| State | Drawing |
|---|---|
| busy | gauge pill; on a cylinder, the liquid level |
| in trouble | blurred warm glow behind the object, 30% tint over it, pulsing 0.4 ↔ 1 opacity every 1.3 s |
| failed | grey wash at 62%, red cross, icon hidden |
| not involved | pale wash at 45% |
| value or status | a tone pill with two or three words |

### Links

- Lines run along the floor axes, with elbows where needed and 9 px rounded corners. Each end
  is clipped to the object's outline and stops 3–4 px short.
- Styles: solid; dashed (5/4.5); unused (grey, 4/5); broken (red, 7/6, no arrowheads); heartbeat
  (thin green dots).
- A link label is a small pill. Its position is chosen once per step by trying about nine
  places along the line on either side and scoring each: heavy penalties for covering an
  object, another label or a pill; a small penalty for covering the line itself or for being far
  from the middle. Long labels may wrap to two lines. The search makes collisions rare, not
  impossible: when no free place is left, the page reports it (rule 8) and the fix is in
  the data, below.

### Taste, with numbers

Judge these on the sheet's tiles, which show each step at the framing a reader gets.

- **Room before fit.** Place neighbours 9 grid units apart (7 at the least, never under 6).
  A block is 4 units wide, so 9 leaves about 5 units of floor between two objects, room
  for their tags, pills and link labels. At 7 the objects read as crowded.
- **The reader zooms; do not cram for the first framing.** The camera fits every visible
  object, and the reader can zoom up to 4×, pan and double-click an object to centre it.
  Do not pull objects closer only so that the whole scene's labels stay large at the
  default framing.
- **Labels stay readable when zoomed.** The smallest text on the stage is the 9 px line under
  a node's name; link labels are 9.5 px. When the view pulls so far out that the smallest
  text falls under 8 px on screen, the page raises a note. A note caused by 9-unit spacing
  may stand; say so in the handoff. When the scene is far wider than that, use fewer
  far-flung objects or fold a long row, rather than closing the gaps.
- **No lonely object.** One object alone in a wide empty floor looks lost: start step 1
  with two, 9 grid units apart.
- **One highlight per step.** The spotlight already marks what is new or changed. Add at
  most one `heat` glow, on the node the step is about; leave the rest calm or `dim`.
- **Tags are two or three words.** A longer value belongs in the text.

### Fixing an overlap

A rule 8 warning, or a tile where a label covers an object, another label or the thing it
names, is fixed in the data with a coordinate or a text. Try in this order:

1. Shorten the text: a link label to the two words that matter, a tag to its value, a
   summary-card line to its number.
2. Move a node: change its `x` or `y` by 1–3 units, keeping neighbours about 9 apart (never
   under 6). Moving objects apart usually beats moving them closer. A node
   has one position for the whole walkthrough, so look at every tile again afterwards.
3. Change a link's `route` (`x-first` or `y-first`) so its label has free line to sit on.

Never fix it by deleting the label, tag or card line that carries the information. A link
label may be hidden with `"label": ""` only in a step where it says nothing new, as on an
`off` link.

### Moving dots

- A flow spawns dots at a steady rate and moves each at constant speed along the path
  (155 px/s) using the path's own length function. Slow kinds are a fixed fraction of that.
- Kind is shape and colour: round warm dot for a request, larger square for a heavy one, dark
  square for a write, small ringed dot for a ping. A dot coming back turns green.
- Between two links a dot disappears for 0.16 s, as if inside the node.
- Arrival is marked: a green ring that scales 0.8 → 2 and fades in 0.45 s. A failure is a red
  disc with a white cross that bursts to 2.3× in 0.65 s. A dot held at the far end pulses its
  stroke until released.
- Raise the rate to show more traffic. A queue of discs that grows shows a backlog.

### Step transitions

The scene for the next step is diffed against the current one by object id.

| Phase | What happens | Duration | Easing |
|---|---|---|---|
| exit | removed objects fade and sink | 420 ms | cubic in-out |
| change | persisting objects tween every numeric property (gauge, glow, count, size) | 820 ms | cubic in-out |
| enter | new objects **drop in from 120 px above**, back to front, 130 ms apart; the shadow tightens as they land | 680 ms | cubic out with a back overshoot on the drop |
| links | a new link draws itself from its start once both ends have landed; arrowhead and label appear at the end | 560 ms | cubic in-out |
| settle | flows restart; a one-shot spotlight pulses on the floor under each new or changed object | 1.5 s | ease-out |

- Phases overlap: changes start about halfway through the exits, enters start three-quarters
  through the changes.
- Text on a tag cross-fades in the middle of the change (out by 42%, in from 55%).
- "Replay" jumps to the previous step and animates forward again; on a try step with an
  option chosen it replays the move from the base to that option.
- Choosing an option on a try step runs the same exit, change and enter phases between the
  base and the option. The explanation text does not slide.

### Camera

- The SVG `viewBox` is the camera. It is fitted to the bounds of everything visible with a
  margin, capped at a maximum zoom, and eased to the new framing over 820 ms.
- All framings are planned when the walkthrough loads. If the next step's content still fits the
  current framing with a small margin, the framing is kept. This avoids a wobble on every step.
- A try step has one framing that fits its base and all its options, so choosing never
  moves the camera.
- A summary card is docked in a corner in screen pixels. The planner tries each corner and
  zooms out in small steps until the card covers no object or label.

### The reader's camera and tracing

- The reader's zoom and pan sit on top of the planned framing and never change it: a factor
  from 1× (the planned framing, the furthest out) to 4×, and a pan that keeps the view's
  centre inside the bounds of the step's scene. The summary card and the stage buttons
  stay put in screen pixels; pills and labels are part of the scene and scale with it.
- Wheel, pinch and drag follow the pointer at once: the point under the pointer stays under
  it. The buttons and `+`/`-` zoom by 1.5× around the middle in 220 ms; double-click on an
  object (centre it at 2× or more), double-click on the floor and Fit ease over 360 ms.
  Every eased move is cubic in-out; with reduced motion they all jump.
- A step change eases the reader's view back to the planned framing over the same 820 ms as
  the planned camera move. Replay and a change of layout jump back at once.
- Tracing dims everything outside the traced object, its links and its neighbours (or the
  traced link and its two ends) to 30% opacity in 150 ms, and draws the traced links slightly
  heavier (2.8 px instead of 1.9). Dots and arrival marks take the state of the link they are
  on, so a dot that moves on to an untraced link dims. With reduced motion the change is
  immediate.
- Tracing only sets classes on the outer group of each object, link, label and dot; the
  transitions animate the opacity of inner groups. The two never touch the same property, so a
  trace cannot disturb a transition, and an object that enters later takes the trace's state
  when it is created.

### Numbers and text around the stage

- A metric counts up to its new value over 900 ms, flashes a soft ring and hops 2 px.
- The explanation panel's blocks slide in 36 px from the direction of travel, 30 ms apart,
  360 ms each, while the old content fades out in 150 ms.
- The progress line in the step strip eases to the new position in 0.7 s.
- UI easing is one curve everywhere, `cubic-bezier(.2,.7,.2,1)`, with 150–450 ms durations.
  A second, overshooting curve is reserved for things that pop.

### Dark mode

Dark colours are computed from the light ones: light pastels become deep, less
saturated versions of the same hue; neutrals invert; ink becomes a warm off-white; shadows
become black. Hand-picked illustration colours (skin, a laptop lid) are left alone.

The page opens in the system's theme. The reader can fix it to light or dark with the theme
button, which the shell draws on every page.

## Network trace stage (trace walkthroughs)

The same ideas with a different subject: devices on an isometric floor, packets travelling
between them, and a decoder for each packet.

- **Devices are drawn procedurally** from isometric boxes with three gradient faces and a
  single stroke colour (bodies 1.6–2.3 px, details 0.6–1.5 px): a router with an antenna, a
  rack of three slabs with LED strips, a tower with drive bays, a laptop, a cloud made of
  overlapping circles clipped to their union.
- **One engine drives everything.** A lesson is a flat list of events: send a packet, show
  nodes, move the camera, attach a note, rename a node, type a URL, render a page. Play runs
  them with fixed gaps (450 ms, 1100 ms between phases). Step runs exactly one. A single
  pausable, speed-aware clock is used by every animation, so pause and 0.5–2× speed apply to all.
- **One state object feeds every panel.** Each packet is past, current or future. The network
  view, the sequence diagram, the table, the phase list and the info panel all render from it.
- **Packets have presence.** A core dot with a halo, three fading ghost dots trailing behind,
  and a small tag above naming the message. Each node bobs 5 px as a packet passes through. The
  destination gets an expanding ring. The link in use lights up with marching dashes.
- **Each link is two lanes**, one per direction, so a request and its answer never overlap.
- **Nodes drop in** from 46 px above with a back overshoot (650 ms, 200 ms apart), after the
  camera has started moving (1100 ms, cubic in-out).
- **Loss and encryption are shown, not stated.** A lost packet falls off the line and a cross
  appears. An encrypted one carries a padlock.
- **The sequence view maps time to height** (3000 px per second), with minimum spacing between
  events and long gaps collapsed into a wavy break marked "x s later". Arrows draw themselves.
- **The decoder is generated from a builder.** Each field is declared with a name, a value, a
  writer that emits its bytes and a one-line note; the builder records which bytes belong to
  which field. That gives three linked views for free: a bar of layers sized by byte count,
  a field list, and a hex dump coloured by layer. Hovering a field lights its bytes and the
  reverse. Values that vary per capture carry an "e.g." badge.
- **Jumping to a step** snapshots the view, applies all earlier events instantly, then morphs
  from the snapshot, so even a jump is animated.

## 3D object stage (object labs and procedures)

Built with three.js. The hand-drawn look does not come from toon materials. It comes from
ordinary lit materials plus an ink-outline pass, a fixed three-quarter camera and paper
colours.

This section says what to build, not which calls to make. three.js renames and removes APIs
between releases, so check the documentation of the version in the project before writing
code. A stock "outline" effect that highlights a selected object is a different thing from
the ink look described here, which is a custom pass over depth and normals.

**Recommended, not required:** the `threejs-*` skills from
[CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) give an agent the
current three.js API. If they are installed, read the ones that match the part you are
building before writing code; if they are not, carry on with the project's three.js
documentation.

| Part of the 3D stage | Skill |
|---|---|
| Fixed orthographic camera, render loop, render on demand | `threejs-fundamentals`, `threejs-performance` |
| Models from lathes, tubes and extrusions; instanced dashes | `threejs-geometry` |
| Printed labels drawn on a canvas; render targets | `threejs-textures` |
| The ink pass over depth and normals | `threejs-postprocessing`, `threejs-shaders` |
| Key light, sky light, shadow-only floor | `threejs-lighting`, `threejs-materials` |
| Clicking and focusing parts, camera controls | `threejs-interaction` |
| Drop-in and settle motion | `threejs-animation` |

### Camera and controls

- Orthographic camera at a fixed three-quarter angle: 36–45° around, 41–43° up. No
  perspective, so sizes stay comparable and the scene reads as a diagram.
- Pan by drag or WASD, zoom by wheel around the cursor, rotate in 90° snaps (Q/E), a top view
  (T) and a reset (R). Every camera move is eased (cubic in-out, 600–1100 ms).
- Render only when something changed, and pause when the canvas is off-screen.

### The ink look

- Render the scene's normals and depth to a texture, then run a full-screen pass that draws
  a dark line wherever depth jumps (a silhouette) or the normal turns sharply (a crease).
  Line width about 1.3–2.1 screen pixels, scaled a little with zoom. Giving each mesh an id
  and drawing a line where the id changes makes outlines between touching objects reliable.
- Glows, moving dashes, the floor and particles are kept out of the ink pass.
- Materials are plain standard materials in warm colours with moderate roughness, lit by one
  soft sky light and one key light, with a faint studio environment for reflections.
- Shadows: a transparent floor that only receives shadow (warm brown, about 30% opacity,
  heavily blurred), plus a soft dark blob under small props.
- The floor is a shader grid that fades in an ellipse around the camera target, or, for an
  outdoor scene, a drawn paper map with contour lines.

### Models are code

- Every model is built from primitives in code: lathes for bulbs and domes, tubes along
  curves for wires and leads, extruded rounded rectangles for boards, cylinders, boxes and
  capsules. No model files are loaded.
- Printed detail (a battery wrapper reading "3 V", breadboard holes, a switch plate, bark) is
  drawn on a canvas at run time and used as a texture.
- Lesson thumbnails are rendered by the same renderer into an off-screen target.

### Motion

| What | How | Reference values |
|---|---|---|
| a part appears | drops from above while popping to full size with an overshoot | 720 ms; parts 130 ms apart |
| a wire appears | start cap pops, the tube draws along its length, end cap pops | 620 ms for the tube |
| a part leaves | shrinks and sinks | 420 ms |
| a part is moved by a control | slides with a small hop | 800 ms |
| current flows | small bright capsules travel along the wire, faster with more current | fade in 400 ms |
| a lamp lights | emissive brightness plus an additive glow sprite, both tied to the solved current | per frame |
| something fails | a puff of grey smoke sprites rising | about 2 s |
| a prop is set down (procedure) | falls with a bounce; three dust puffs at first contact; its shadow returns on landing | 0.4 s, props 25–100 ms apart |
| the world loads | scenery pops up back to front | 0.38 s each over 0.75 s |

### Callouts that follow the object

- Label cards are HTML laid over the canvas at designed positions. A dashed SVG leader runs
  from the card's edge through a short stub to the part, ending in a small ring. The part's
  position is re-projected to the screen after every render, so the leader follows the
  object as the camera moves.
- When the reader leaves the home view, cards fade out and small pills take their place next
  to each part. Each pill tries six positions and takes one that overlaps nothing.
- The home framing fits the scene while keeping it clear of the cards.

### One state drives every view

An experiment is one object with its parameters, a `solve` function, and functions that
produce the schematic, the maths text and the callouts. A control changes a parameter; the
3D scene, schematic, formula, chart and readout pills are all re-derived from the same solved
values. While powered, `solve` runs every frame to drive the dashes, lamp and meters.

## Rules for motion

- **Motion must mean something.** A dot is a message. A drop is "this is new". A pulse is
  "this is the problem". A flash is "this number changed". Nothing moves for decoration.
- **What did not change does not move.**
- **Entrances have weight; exits are quick.** Enter about 650 ms with overshoot, exit about
  400 ms.
- **Stagger, never simultaneous.** 100–200 ms between objects; links after their endpoints.
- **One clock.** Pause, replay and speed must affect every animation.
- **Ambient motion is slow and small.** Loops of 1.3–1.5 s, opacity or a few pixels.
- **Respect reduced motion.** Switch scenes instantly and show a flow as static arrows. The
  sheet's stills use the same static arrows.

## Build order

When building a new stage, add these in order and stop when it is good enough for the purpose.

1. Projection, floor grid with fade, layer groups.
2. The layered block, the palette and the ink outline.
3. Sticker pills for labels and tags.
4. Links clipped to outlines, with arrowheads and styles.
5. Enter, change and exit transitions with the drop-in.
6. Camera fitted to content and eased.
7. The dot loop with arrival rings.
8. State drawings: gauge, glow, failed, dimmed.
9. Label placement by scored candidates.
10. Counting numbers, chip flash, sliding explanation text.
11. Spotlight on what changed; summary card docking.
12. Dark mode and reduced motion.
