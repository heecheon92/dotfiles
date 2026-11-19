# Structure

How the page, the collection and a single walkthrough are laid out. The layout is the same for every
subject so that the reader learns the interface once and then spends attention on the idea.

## The four regions

```
┌──────────────┬──────────────────────────────────┬───────────────┐
│ collection   │ title · question · summary       │ n / N  chapter│
│ map          ├──────────────────────────────────┤ step title    │
│              │ running numbers                  │ two short     │
│ sections     │                                  │ paragraphs    │
│ walkthroughs │            STAGE                 │ try it        │
│ progress     │   one scene that changes         │ one callout   │
│              │                                  │ what changed  │
│              │                                  │ [Back] [Next:…]│
│              │ legend                           ├───────────────┤
│              ├──────────────────────────────────┤ what you'll   │
│              │ ①──②──③──④──⑤  step strip        │ learn ☑ ☑ ☐   │
│              │                                  │ ▸ sources     │
└──────────────┴──────────────────────────────────┴───────────────┘
```

| Region | Job | Share of width | Rules |
|---|---|---|---|
| Stage | Show the thing | about 60%, the largest | One scene. It changes; it is never replaced by a different picture mid-walkthrough |
| Explanation | Say what the stage is showing now | about 22% | Narrow on purpose, so text cannot grow |
| Sequence | Show where you are and how much is left | a strip | Every step has a 1–2 word name; any step is one click away |
| Collection map | Show the whole subject and progress | about 17%, collapsible | Sections of 2–11 walkthroughs, counts like `1/3` |

On a desktop the page is an app shell that fills the whole window: the stage takes all
spare room and scales its scene up with it, and the explanation scrolls inside its own card
so the page itself never scrolls. On a narrow screen the order is stage, explanation,
sequence, the page scrolls normally, and the collection map collapses.

The stage is never the place for sentences. The explanation panel is never the place for the
picture. If a step needs a third paragraph, it is two steps.

## Four walkthrough families

Pick the family from what is being explained, before writing anything.

| Family | Use when the subject is | The stage shows | Reader's action | Example |
|---|---|---|---|---|
| Story | a system that behaves over time; a design decision; a failure | nodes and messages; the scene grows step by step | Next / Back; choose a value on a try step | how a page load spends its time |
| Object lab | a thing with parts and a few knobs | the object itself, parts labelled, live readings | click a part, pick a value | an LED and a resistor on a breadboard |
| Trace | a real artefact with layers (a packet, a log line, a request, a file) | the artefact travelling, then opened up | play, step, click to drill down | a TLS handshake, message by message |
| Procedure | a physical or manual skill | the workspace filling up as you go | Next; sub-steps tick off | laying and lighting a campfire |

A subject can use two families in sequence (an object lab to meet the parts, then a story
that uses them). Do not mix two families inside one walkthrough.

## Story walkthrough

- The header states the question the walkthrough answers; the recap answers it with a number.
- 8–14 steps (8–15 minutes when the collection is teaching material); about 11 is typical.
- Step 1 is `problem` or `setup`, half and half. The last step is always `recap`.
- In between, problem and solution alternate. Typical arcs:
  - `problem → technique ×4 → solution → technique → problem → problem → recap`
  - `setup → problem → solution → technique → problem → solution → insight → recap`
- After the main idea works, show the contrast: too little and too much of one variable,
  as 1–2 `Case:` steps or as a try step where the reader chooses the value (at most two
  try steps; `techniques.md`, "Letting the reader try").
- Step 1 shows one or two objects. Each later step adds at most one or two more.
- Running numbers above the stage start empty and fill in only when the stage has earned them.
- Every step after the first has a "what changed" list.

Chapter meanings:

| Chapter | The step does this |
|---|---|
| `setup` | Puts the starting situation on the stage, with numbers |
| `problem` | Shows something going wrong, or a need the current picture cannot meet |
| `technique` | Adds one mechanism and shows it working |
| `solution` | Shows the problem from earlier now resolved, with the new number |
| `insight` | Steps back: what the last few steps mean in general |
| `tradeoff` | Shows what the solution costs |
| `recap` | Result in numbers, 3–5 takeaways, pointer to the next walkthrough |

## Object lab walkthrough

- The object sits in the centre, drawn as itself, with 3–6 callouts anchored to its parts.
- Right panel has tabs ordered from plain to formal: Overview → Components → Circuit/Diagram → Maths.
  A reader who stops at the first tab still gets the idea.
- Overview is a heading, a two-sentence lede and exactly three bullets: the idea, then two
  things to click.
- Interaction is clicking a highlighted part and choosing from 2–5 preset values. No free input.
  A reset is always visible.
- Every view of the object (3D scene, schematic, formula, chart, reading) is bound to the same
  state and updates together.
- Where the object runs code, show the code, a run button and a log of what the code did in
  plain events (`D13 → HIGH`).

## Trace walkthrough

- Left: the catalogue (protocols, formats) with the phases of the selected one, 4–6 phases.
- Stage: a topology view and a sequence view of the same exchange, switchable.
- Below the stage: the table of messages as they are sent, one row per message.
- Clicking a row opens the artefact: a coloured bar showing its layers by size, then each
  field with value and a one-line note, then the raw bytes with the same colours.
- Depth is five levels (subject → phase → message → field → bytes). Each level is complete;
  nobody is forced to the next one.
- Say what was left out, on the screen ("data ACKs omitted", "example values differ per capture").

## Procedure walkthrough

- 4–8 stages, each with 3–4 imperative sub-steps that tick off.
- The scene accumulates: materials from stage 1 are still lying there in stage 6.
- Tabs: How (the sub-steps), Why (reasons), Tips (mistakes and safety).
- The last stage finishes the job safely, not at the exciting part (put the fire out).

## Collection

- For an ordered collection, aim for 5–9 sections and order walkthroughs so each needs only
  earlier ones. Name sections with one or two words.
- In an ordered collection, each walkthrough's recap points to the next walkthrough by name
  and says what question it answers.
- Walkthroughs refer to each other in passing ("see the Indexes lesson") instead of re-explaining.
- Use the same example world throughout (the same shop, the same laptop and router, the same
  names Alice and Bob) so that later walkthroughs start with a familiar picture.
- Show the step count before the reader starts. When the collection is teaching material,
  also show time and level when they apply and tie "what you'll learn" goals to the steps.
- Progress is stored locally; no account. Every step has its own link.

See [collection.md](collection.md) for the folder layout and shell.

## Navigation and controls

| Control | Behaviour |
|---|---|
| Next button | Labelled with the next step's short name: `Next: Find address` |
| Keys | ← → step, R replay, Space pause. On a try step also `1`–`5` choose an option and `0` resets. Shown as a one-line hint under the buttons |
| Step strip | Click any dot to jump. Try steps are marked |
| Replay / pause / speed | Always on the stage, top right |
| Try it | On a try step: option buttons, Reset and the verdict, after the body |
| Sources | A collapsed list under the goals: where the facts and numbers come from |
| Deep link | `#/<walkthrough-id>/<step>` |
| Sheet | `#/<walkthrough-id>/sheet`: every step and try option as stills, with the automatic checks. For authors and reviewers; not linked from the page (`walkthrough-schema.md`, "The sheet") |
| Search | Across walkthroughs and terms, ⌘K |
| Language, light/dark | In the header |

## Visual language

- One illustration style for everything: objects drawn as themselves in soft colours with a
  dark ink outline and a soft shadow, seen from a fixed three-quarter angle, never photographic.
  `visual-craft.md` describes how that style is built and animated.
- A warm, quiet background. Strong colour only where it carries meaning.
- Colour is a code that stays fixed for the whole collection: one colour per kind of node, one per
  kind of message, green/amber/red for fine/changed/broken.
- Labels sit on the object they name, as pills. Values that changed are tinted.
- One thing is highlighted per step: what changed.
- Motion shows cause: a dot travels from sender to receiver; a counter flashes when its value
  changes. Nothing moves for decoration, and things that did not change do not move.
