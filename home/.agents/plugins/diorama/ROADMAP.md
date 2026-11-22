# Diorama roadmap

This file is the one place that records what is planned, in progress and done for the
Diorama plugin. Other documents describe how Diorama behaves now; none of them tracks status.

## Status legend

```md
- [ ] **Proposed:** intended but not implemented.
- [ ] **Active:** explicitly authorized work is underway.
- [ ] **Deferred:** waiting on a named decision, environment or dependency.
- [x] **Shipped:** behaviour that exists in this repository and was verified.
- [x] ~~Item~~ — **Canceled:** reason.
- [x] ~~Item~~ — **Superseded:** reason; replaced by link.
```

Each initiative has exactly one status marker, on its heading line under "Initiative
details" while it is open and in the "Shipped index" once it is done. The acceptance boxes
inside an initiative track its parts; they are not separate statuses.

## Roadmap maintenance policy

- Change an initiative's status here in the same change that changes the behaviour.
- An initiative is **Shipped** only when every acceptance box is ticked, the reference
  documents and READMEs describe the new behaviour, `python3 tools/build-single.py --check`
  passes, and the result was opened in a browser.
- When an initiative ships, move its detail to `docs/completed/<initiative-slug>.md`
  (delivered scope, decisions, how it was verified, known limits) and leave one checked line
  in the "Shipped index" that links to it. Do not delete detail before that record exists.
- Current behaviour belongs in `skills/diorama-maker/references/` and the READMEs, not here.
- Ideas nobody has agreed to build are not initiatives. They go under "Collected for later".
- Versions: a **minor** version for a change to the engine or a contract (the shell, the
  data format, the contracts in `references/templates.md`, existing behaviour); a **patch**
  version for an added template, component or colour scheme, and for fixes. Decided by the
  owner on 2026-11-20.

## Current honest status

> Diorama 0.4.0 draws walkthrough step stories on an illustrated isometric stage, with a
> question, a sources list, try steps, a review sheet and automatic checks. The step story is
> the only template; the engine is now split into a shell, a stage and a template so that
> others can be added, and that split is verified to leave every page of the shipped
> examples unchanged. The reader can zoom and pan the stage and trace connections by
> pointing at an object or a link; both were built and verified by an agent in Chromium on
> a locked screen at about 30 frames a second, and wait for the owner's check at full frame
> rate before they count as shipped. None of 0.3.0 or 0.4.0 is committed yet. Engine 0.5.0
> adds a theme button (light, dark, system) to every page; an agent built and checked it in
> Chromium, and it waits for the owner's check of the animation. The trace
> template is next. The planner and reviewer skills have still not been run end to end by
> an agent on a real collection.

## Milestone summary

### Active

- [Move the camera](#1-move-the-camera)
- [Hover to trace](#2-hover-to-trace)
- [Separate the shell from the template](#5-separate-the-shell-from-the-template)

### Proposed

- [Click an object to inspect it](#3-click-an-object-to-inspect-it)
- [Click the object to try a value](#4-click-the-object-to-try-a-value)
- [Component registry and catalog page](#6-component-registry-and-catalog-page)
- [Colour schemes](#7-colour-schemes)
- [A 3D scene stage](#8-a-3d-scene-stage)
- [Choosing a template: named, suggested or decided](#9-choosing-a-template-named-suggested-or-decided)
- [The trace template](#10-the-trace-template)

### Deferred

None.

### Shipped

See the [Shipped index](#shipped-index).

## Near-term recommended sequence

1. Move the camera and hover to trace, together, as engine 0.3.0. Neither changes the data
   format, so every existing walkthrough gains them.
2. Click an object to inspect it. It reuses the pointer handling and the object highlight
   from step 1 and adds one optional field per node.
3. Click the object to try a value. It builds on the inspect interaction and on try steps.
4. Separate the shell from the template. Built as engine 0.4.0; everything in the
   collection plan below depends on it.
5. The trace template, the second format. The owner chose it on 2026-11-20. It does not
   need the two click interactions above, so it can go ahead of them if that is preferred.
6. Choosing a template, in the skills, once the trace template exists.
7. Component registry and catalog page, then colour schemes. Neither needs a dependency.
8. A 3D scene stage, for the templates that need one.

## Initiative details

Theme for initiatives 1–4: **make the stage itself respond**, so a reader can explore the
picture and not only step through it. Rules that hold for each of them:

- Every pointer action has a keyboard equivalent and works by touch.
- The author's framing is the default; whatever the reader changes is temporary.
- Nothing here adds a dependency, a network request or a build step.
- The review sheet stays a page of stills and gains no interaction.
- Rotation is out of scope: the stage is a drawn 2D picture.

### 1. Move the camera

- [ ] **Active:** the reader can zoom and pan the stage and return to the author's framing.

Why: on a busy scene, or on a small window, labels are small and the reader cannot get
closer. The reference sites all let the reader zoom and pan.

Scope:

- Zoom toward the pointer with the wheel or a pinch; zoom with on-stage buttons and keys.
- Pan by dragging, and by two-finger drag on touch.
- Double-click an object to zoom to it; double-click empty floor to fit the scene again.
- A fit control that returns to the author's framing.
- The reader's view resets when the step changes.

Data format: no change.

Acceptance:

- [x] Wheel and pinch zoom toward the pointer, within fixed limits, in the single page and in a collection.
- [x] Dragging pans, clamped so the scene cannot be lost off-stage.
- [x] Double-click on an object zooms to it; double-click on empty floor fits.
- [x] On-stage zoom in, zoom out and fit controls, each with a key.
- [x] Changing step, replaying, and choosing a try option behave as before; the view returns to the author's framing on a step change.
- [x] On a page that scrolls (narrow layout), the wheel still scrolls the page unless the reader asks to zoom.
- [x] Reduced motion: the view changes without easing.
- [x] No leaked listeners or animation loops after switching walkthroughs ten times.
- [x] `structure.md`, `collection.md` and both READMEs describe the controls.

Built in engine 0.3.0. Remaining before this is marked shipped:

- The owner's check at full frame rate, including whether a plain wheel should zoom in the
  full-window layout.
- Not tested: Safari and Firefox, real multi-touch hardware (pinch and double-tap were
  exercised with synthetic events).

Out of scope: rotation; remembering a zoom level across steps; a minimap.

### 2. Hover to trace

- [ ] **Active:** pointing at an object or a link shows what it is connected to.

Why: a reader's first question about a picture is "what talks to what?". Tracing by eye
across a busy scene is slow; the stage can answer it directly.

Scope:

- Pointing at an object keeps it, its links and its neighbours at full strength and dims
  the rest of the scene.
- Pointing at a link keeps the link, its label, its two ends and the dots on it at full
  strength and dims the rest.
- The same by keyboard focus, and by a tap on touch screens.

Data format: no change.

Acceptance:

- [x] Hovering an object highlights it with its links and neighbours and dims everything else, in the current step's scene only.
- [x] Hovering a link highlights the link, its label, its ends and its dots.
- [x] Objects can be reached with the keyboard and show the same trace when focused; Escape clears it.
- [x] A tap traces on touch screens and a tap elsewhere clears it, without breaking double-tap zoom.
- [x] The trace clears on a step change and never disturbs a running transition.
- [x] Works together with camera zoom and pan.
- [x] Reduced motion: no fade.
- [x] `structure.md`, `visual-craft.md` and both READMEs describe it.

Built in engine 0.3.0. Remaining before this is marked shipped:

- The owner's check at full frame rate.
- Not tested: a real screen reader on the focusable objects, and real touch hardware.

Out of scope: showing text about the object (initiative 3); tracing from a metric counter.

### 3. Click an object to inspect it

- [ ] **Proposed:** clicking an object opens a small card saying what it is and its state in this step.

Why: the reference sites attach a short explanation to each part. Today a reader can only
learn about an object from the step text.

Scope:

- A card anchored to the clicked object: its name, an optional one- or two-line description,
  and its state in the current step (how busy, tags, failed or not, what it connects to).
- One card at a time; Escape or a click elsewhere closes it; it closes on a step change.
- Keyboard: Enter on a focused object opens the card.

Data format: one optional field per node for the description. The state part is automatic.

Acceptance:

- [ ] Click and Enter open the card; Escape, a click elsewhere and a step change close it.
- [ ] The card shows name, description when given, and the step's state for that object.
- [ ] The card never covers the object it describes and stays inside the stage.
- [ ] The automatic checks note a description over its word budget.
- [ ] `walkthrough-schema.md`, `wording.md`, `checklist.md` and the reviewer's rubric cover the new field.
- [ ] The sheet shows which objects have a description.

Open questions: whether the card may also carry a link to another walkthrough in the collection.

### 4. Click the object to try a value

- [ ] **Proposed:** on a try step, the reader changes the value by clicking the object it belongs to.

Why: a try step is buttons beside the stage. The reference sites let the reader click the
highlighted part itself, which ties the choice to the thing being changed.

Scope:

- A try step may name the object its variable belongs to. The stage marks that object as
  the one to click.
- Clicking it steps through the options; the buttons beside the stage stay and stay in sync.
- The verdict is shown beside the stage as now.

Data format: one optional field on a try step naming the object.

Acceptance:

- [ ] The named object is visibly marked as clickable on a try step, and only then.
- [ ] Clicking it cycles the options in order and Reset returns to the base.
- [ ] Buttons, number keys and the object stay in sync.
- [ ] It does not conflict with inspect (initiative 3) or with double-click zoom (initiative 1).
- [ ] The automatic checks warn when the named object is not shown in that step.
- [ ] `walkthrough-schema.md`, `techniques.md`, `checklist.md` and the reviewer's rubric cover it.

Depends on: initiatives 1 and 3.

### The collection plan (initiatives 5–10)

Direction set by the owner on 2026-11-20: Diorama grows by **collecting** four kinds of
thing an agent can choose from: templates, components, interactivities and colour schemes.
It must not stay a fixed ten-step explainer: the way something is presented varies with the
subject, and a template is chosen for each piece of work.

Words used below:

- **Format:** how an explanation is presented and moved through. A step story is one
  format. Others have no steps at all: a thing the reader operates, a recorded exchange
  played back, a place where many things work at once.
- **Stage:** how the picture is drawn. The isometric diagram is one stage; a 3D scene is another.
- **Template:** a format on a stage, with its components and its interactions. Today there
  is one: the step story on the isometric stage.

Rules that hold for each of these initiatives:

- **A template is chosen in one of three ways.** The user names it; or the agent suggests
  two or three with a reason each and a recommendation; or the agent decides and says which
  it chose and why.
- **Diorama itself requires nothing.** The core maker, the isometric stage, every
  interactivity and every colour scheme keep working with no dependency, no network and no
  build step.
- **Some templates may require three.js.** A template that needs it says so, ships the
  library with itself so its pages still open offline, and is optional: a piece that does
  not use that template never loads it.
- **One spine for every template.** Whatever the format, a piece answers one question,
  follows one concrete case, lists where its numbers come from, shows state on the picture,
  says what is simplified, opens offline, works by keyboard, has a link to each of its
  states, and can be reviewed on a sheet with automatic checks. Steps, step counts and word
  budgets per step belong to the step story, not to Diorama.
- **A collection has a default template** and colour scheme, so the reader learns the page
  once. One of its pieces may use another template when its subject needs it, and says so.
- Things collected but not yet agreed are not initiatives. They are listed under
  [Collected for later](#collected-for-later) with where they came from.

### 5. Separate the shell from the template

- [ ] **Active:** the page shell talks to a template through a small fixed contract, so another format or another stage can be plugged in.

Built as engine 0.4.0 on 2026-11-20 and in the working tree, not yet committed. It counts
as shipped once the owner has seen it and it is committed. The contracts are written in
`skills/diorama-maker/references/templates.md`.

Why: the step story and the isometric stage are woven into one engine. Until they are
separate, nothing else can share the question, the sources, the sheet and the checks.

Scope:

- A format contract: which states a piece has, how the reader moves between them (steps,
  free exploration, a timeline), which of them the sheet shows, and what each one links to.
- A stage contract: draw a state, give a still for the sheet, describe the scene in text,
  report layout problems, and tear down.
- The step story on the isometric stage becomes the first template behind those contracts,
  with no change in behaviour.
- A piece names its template; with none named it is a step story on the isometric stage.
- The maker's rules are split into those every template keeps (the spine above) and those
  that belong to the step story.

Data format: one optional field naming the template. Existing walkthroughs are unchanged.

Acceptance:

- [x] Both shipped examples render identically before and after, in the single page, the collection and the sheet. Checked on all 34 pages: identical markup at desktop width in light mode and at phone width in dark mode, and identical screenshots on seven pages.
- [x] A second, trivial template used only for testing, with no steps, plugs in without changing the shell. It is `tools/test-template/` (`plain`), checked as a single page and inside a copy of the collection.
- [x] The single-page file still contains only what its piece's template needs. A page built for the test template holds no stage code.
- [x] `SKILL.md`, `walkthrough-schema.md`, `structure.md`, `checklist.md` and `visual-craft.md` separate the spine from the step story and describe the contracts.

Known after-effects, none in the step story itself: on a collection's home page the
Continue link for a walkthrough not yet opened under 0.4.0 has no step number; an address
with an unrecognised last part opens where the reader left off instead of the home page;
the single page grew from 268 KB to 296 KB.

Left for the trace template to settle: the "trace" family described in `structure.md`,
`walkthrough-schema.md` and `visual-craft.md` shares its name with the planned template.
Not checked: other browsers, touch gestures, switching reduced motion while a page is open.

### 6. Component registry and catalog page

- [ ] **Proposed:** every component is registered in one place and shown on one catalog page.

Why: components are hard-coded today. Collecting them needs one way to add a component and
one place where a person or an agent can see what exists.

Scope:

- A registry per template: a component is a drawing function, a one-line description, the
  state it understands and its layout rules.
- **Named connection points.** A component may declare the points where something attaches
  to it, each with the direction a link leaves in, so a link is drawn to a named point and
  finds its own route instead of being placed by hand.
- **Real sizes.** Where a subject has real dimensions, components are drawn to them in one
  unit per template, so objects made at different times fit together.
- **Make it once, add it.** When a piece of work needs a component the registry lacks, the
  agent makes it as a registered component, not as a one-off drawing inside that piece, so
  the collection of components grows with use.
- A catalog page that shows every template, component, interactivity and colour scheme
  live, and an index of the same content that an agent can read to choose. Both are
  generated from the registrations.

Data format: no change; the node types and icons that exist become registered components.

Acceptance:

- [ ] Adding a component touches one registration and nothing else in the engine.
- [ ] A link drawn between two named connection points routes itself and still passes the overlap checks.
- [ ] The maker skill says when to add a component and how, and a component added that way appears in the catalog without a manual edit.
- [ ] The catalog page lists everything registered, opens from disk, and shows each item in light and dark.
- [ ] The maker skill tells the agent to choose components from the index, and the automatic checks warn on an unknown component.
- [ ] The catalog is regenerated or checked by the maintainer tool, so it cannot go stale.

Depends on: initiative 5.

### 7. Colour schemes

- [ ] **Proposed:** a walkthrough or a collection can choose a named colour scheme.

Why: there is one scheme, in light and dark. Since 0.5.0 the reader can switch between light
and dark, but not between schemes. Different subjects and audiences suit
different looks, and a collection may need to match a brand.

Scope:

- Named schemes as sets of the colour variables the engine already uses, each with its
  light and dark values.
- A field to choose one; the current look stays the default.
- A contrast check so a scheme cannot make labels unreadable.

Data format: one optional field in a walkthrough and in `collection.js`.

Acceptance:

- [ ] At least two schemes besides the default, each shown on the catalog page in light and dark.
- [ ] Node colours and tag tones keep their meanings in every scheme.
- [ ] The automatic checks warn on an unknown scheme and on text below the contrast limit.
- [ ] The sheet renders in the chosen scheme.

Open question: whether a collection may also set a single accent colour of its own.

### 8. A 3D scene stage

- [ ] **Proposed:** a second template that draws the scene in 3D, for subjects where objects and their movement in space carry the explanation.

Why: some subjects are places and machines, not boxes and messages. The reference sites
and the simulator work the owner collected both use toy-scale 3D scenes for these.

Scope:

- A stage behind the contract from initiative 5, built on three.js: one fixed camera angle
  that pans and zooms, models written as code, selection shown on the object.
- three.js ships with the template. Nothing is fetched from the network.
- The same steps, try steps, sources, sheet and checks as the isometric template.

Data format: the template's own scene description, inside the same walkthrough file shape.

Acceptance:

- [ ] A walkthrough using this template opens from disk with no network request.
- [ ] A walkthrough using the isometric template loads no three.js code.
- [ ] The sheet shows a still per step, and the automatic checks report at least overlapping labels.
- [ ] The licence of the bundled library is included with the template.
- [ ] The maker skill says when to choose this template and what it costs in file size.

Open questions: whether the library is one shared file per collection or inlined into each
single page; which kinds of model the first version includes.

Constraint to weigh in the first question: a page over about 1 MB reportedly gets no link
preview on X or Slack (reported in the SIMULAB article; not tested here). The step story's
single page is well under that; three.js inlined would add roughly 700 KB on its own. So
an inlined 3D page will probably lose its preview, and a shared library file keeps pages
small but means a 3D piece cannot be sent as one file.

Depends on: initiative 5.

### 9. Choosing a template: named, suggested or decided

- [ ] **Proposed:** the skills choose a template for each piece in one of three ways, and say which.

Why: with more than one template, the choice shapes everything after it. The owner wants
all three ways to work: naming one, being offered a choice, or leaving it to the agent.

Scope:

- The user names a template: the agent uses it, and says so plainly if the subject fits it badly.
- The request leaves it open and more than one fits: the agent offers two or three, each
  with one line on what the reader would get, and recommends one.
- Otherwise the agent decides, and the handoff says which template it chose and why.
- A selection guide in the maker: which kind of subject suits which format.
- The planner does the same for a collection's default and for any piece that departs from it.

Data format: none beyond the template field from initiative 5.

Acceptance:

- [ ] The maker's workflow has a "choose the template" step covering the three ways.
- [ ] The selection guide lists every template in the catalog, and the maintainer check fails if one is missing.
- [ ] The planner's outline shows the template of each piece, and the reviewer's rubric asks whether the template fits the subject.
- [ ] Tried with an agent on three requests: one naming a template, one open, one where only one fits.

Depends on: initiative 5, and on a second template existing (initiative 10).

### 10. The trace template

- [ ] **Proposed:** a second format, in which the reader plays back a recorded exchange and opens each message.

Why: this is what keeps Diorama from being a fixed ten-step explainer. Chosen by the owner
on 2026-11-20 from the candidates below, as the second format after the step story.

What a trace is: the answer to "what was actually said, in what order, and what was inside
it?" A login, a payment, an API call across services, a door controller talking to its
server, a network handshake. The step story explains why something happens; the trace
shows the exchange itself.

Scope of the first version:

- **The exchange as data:** the objects that take part, and an ordered list of messages.
  Each message has a sender, a receiver, the path it takes, a kind, a short label, a time
  and a size, and a list of fields: name, value, and one line saying what the field is for.
- **Phases:** the messages grouped into four to six named phases, each with a few words of
  caption, two or three sentences of detail and three facts.
- **Three linked views of one position in the exchange:** the stage, where the current
  message travels between objects; the message list, which fills in as the exchange plays;
  and the detail of the opened message, field by field.
- **Moving through it without steps:** play and pause, one message forward or back, speed,
  jump to a phase, click a row to open that message. Every message has its own link.
- **Playback holds long enough to read.** At normal speed each message stays for 1 s for a
  short label, plus 0.25 s for each word beyond three, counting the label and the caption
  shown with it. Speed settings scale that; nothing is ever shorter than the travel itself.
- **Shown, not stated:** a lost message stops and is marked; a protected one carries a lock;
  a slow one is visibly slow against the others.
- **The spine:** the question, the sources list with data and assumption, a note of what
  was left out of the exchange, the sheet (one still per message, with its fields) and
  automatic checks.
- It draws on the isometric stage and uses its components, the camera and hover tracing.
  It needs no dependency.

Data format: a new shape for this template, in the same kind of file as a walkthrough.

Version: a patch version if the contracts in `templates.md` hold as they are; a minor
version if building it shows a contract has to change.

Automatic checks, at least: every sender, receiver and path exists; times never go
backwards; every message has a label; a field note over its word budget; a phase with no
messages; a number in a field that is not in the sources list.

Out of scope for the first version: a byte-level view with a hex dump; a separate sequence
diagram view; editing or recording a trace in the page; importing a capture file.

Acceptance:

- [x] The chosen format is named here and its scope written before work starts.
- [ ] An example trace ships with the maker and plays through from disk, in the single page and in a collection.
- [ ] Play, pause, step forward and back, speed, jump to a phase and open a message all work by pointer and by keyboard.
- [ ] The stage, the message list and the detail always show the same position, including after a link straight to a message.
- [ ] Lost, protected and slow messages are each visibly different on the stage and in the list.
- [ ] The sheet shows every message with its fields, and the automatic checks above report planted defects.
- [ ] Its data format, word budgets, checklist and review rules are written the way the step story's are.
- [ ] The step story is unchanged.
- [ ] The owner has read a trace made for a real subject.

Open questions: whether a field may be marked as an example value that differs per run;
whether a collection can mix traces and step stories in one outline from its first version.

Candidates not chosen now are listed under [Collected for later](#collected-for-later).

Depends on: initiative 5.

## Collected for later

Found while collecting, not agreed, not scheduled. An item moves up into an initiative when
the owner decides to build it.

### Templates

- **Lab.** One input on a control drives a small model, and every part, reading and verdict
  is computed from that model, so nothing on screen can disagree. The reader sets any
  value, not one of a few presets. Open design point: Diorama's data is plain values, and a
  model needs formulas, so this template must say how a model is written and checked by
  hand. This is the "explorable" candidate with a concrete design. Source: SIMULAB.
- **Three chapters by contrast.** The wrong way, the right way, too much; one idea each
  with a two-line card, ending on one sentence. A short format for one cause and its limit.
  Source: SIMULAB.
- **Self-assembly.** The scene builds itself piece by piece, each piece shown with the line
  or the reason that placed it. For "how is this put together". Source: SIMULAB.
- **Live system.** Many things working at once on one clock; the reader selects what to
  follow, and the selected thing gets an outline, a ground glow and its route drawn ahead.
  Needs the 3D stage. Source: the Nyxera simulator article.
- **Comparison.** Two designs side by side on the same case.
- **Leads, known by title only:** a system run like a strategy game; something spreading
  over a grid (a wildfire); a machine opened up to show its inside; a thing built up layer
  by layer; a book of pages. Source: examples listed in the SIMULAB article.

### Interactivities

- **Hold to act.** The reader holds a key or a button to do something for as long as it is
  held (heat, feed, pull), and the outcome depends on how long. Belongs with the Lab
  template. Source: SIMULAB.
- **Selection in the scene.** Outline, ground glow and the route drawn ahead for the chosen
  object; a stronger signal than dimming alone. Consider for initiatives 2 and 3. Source:
  the Nyxera simulator article.

### Sharing and look

- **A cover image** at 1200×630 made from a chosen state, for link previews.
- **A size limit for a shared page**, about 1 MB, checked by the maintainer tool.
- **Interface text in the reader's language**, from a small dictionary; today it is fixed
  in English.
- **Open fonts shipped with the engine**, with their licences, so the look does not vary by
  machine. Costs file size against the limit above.
- **Measuring a reference look** (sampled colours, panel sizes) as the procedure for making
  a new colour scheme. Source: the Nyxera simulator article. Belongs with initiative 7.

### Engine

- **A contract number.** The shell states which contract it implements and each template
  file states which it needs, so a newer template copied into a collection with an older
  engine says so plainly. The version rule does not cover that case.

### For the 3D stage

- **A shared size contract** in the brief when more than one agent builds models, so their
  parts fit together.
- **Tone mapping that keeps pale colours**, checked by sampling a rendered frame against the
  scheme's values.
- **Position as a function of time**, so any moment can be drawn on its own and the sheet's
  stills are exact.
- **A sweep for objects passing through each other** along their paths, as an automatic check.

Source for all four: the Nyxera simulator article.

## Shipped index

- [x] **Shipped:** 0.2.1, sixteen engine fixes from the 0.2.0 review, no data format change (commit `b059fcc`).
- [x] **Shipped:** 0.2.0, the question, the sources list, try steps, the review sheet and the automatic checks (commit `485e487`).
- [x] **Shipped:** 0.1.0, the three skills, the isometric stage, the single page and the collection shell (commit `0efe450`).

These three shipped before this roadmap existed, so they have no completion record.

## Definition of done

An initiative is done when:

1. Every acceptance box under it is ticked, each checked in a browser or by a stated test.
2. Both shipped examples still open, step through and show no warnings on their sheets.
3. The engine version is raised, `walkthrough.html` is regenerated and
   `python3 tools/build-single.py --check` passes.
4. The reference documents and both READMEs describe the behaviour as it now is.
5. Its detail is moved to `docs/completed/` and its line is in the Shipped index.
6. Anything not verified is written down in the completion record, not left unsaid.
