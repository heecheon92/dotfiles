---
name: diorama-maker
description: Use when asked to explain, teach or walk through a concept, system, incident, design or procedure so a newcomer can follow it step by step, as a chat explanation, one self-contained interactive HTML page, or one walkthrough inside a collection. Not for quick factual answers or reference docs.
---

# Diorama maker

Explain one thing by following one concrete case on a single illustrated scene that grows
step by step, with very few words beside it. One such explanation is a **walkthrough**. The
format is distilled from Dilum Sanjaya's interactive learning sites. Reuse the format; do not
copy those sites' text, artwork or code.

This skill works alone. It needs no other skill, no installs and no network.

## Core rules

1. Follow **one concrete case** with real-looking values. State the general rule only in the recap.
2. Keep **one scene**. It grows by at most two objects per step and nothing moves unless it changed.
3. **Earn every number** on the stage before it appears in a total.
4. Each step is a title, **two short paragraphs**, at most one callout and a "what changed" list.
5. After the idea works, **break it** by changing one variable, then show the fix and its cost.
6. End with the result in numbers, 3–5 reusable rules and a pointer to what comes next.
7. **Say what is simplified or invented.** Never state an unverified technical claim as fact.
8. Write in the reader's language. Keep identifiers, commands and units untranslated.

## Workflow

1. **Pin down the request.** Who is the reader, what do they already know, and what should
   they be able to say or do afterwards? Infer from context; ask only if the answer changes
   the walkthrough.
2. **Get the facts first.** Read the code, logs, docs or source that the explanation
   describes. Do not design a walkthrough around a mechanism that has not been checked.
3. **Choose the family** (`references/structure.md`): story, object lab, trace or procedure.
4. **Choose the case and the numbers.** One scenario, named actors, values that add up.
   Decide the 0–5 running numbers and the one or two things that will be broken later.
5. **Write the walkthrough as data** following `references/walkthrough-schema.md`. Fill the
   step list with chapters and titles first, read the titles in order as a story, then write
   the bodies.
6. **Write the words** within the budgets in `references/wording.md`.
7. **Check** against `references/checklist.md`. Fix or report every miss.
8. **Render** in the mode the user asked for (below).
9. **Verify the rendering** by opening it: step through every step, watch each transition,
   look for overlapping labels, check the numbers on screen against the data, and read the
   browser console for `[diorama]` warnings.

`references/techniques.md` lists the explaining moves with reasons; read it when a
walkthrough feels flat or when deciding what to cut. `references/visual-craft.md` explains
how the stage is drawn and animated; read it before building or changing any stage, and when
a result looks plain.

## Output modes

| Mode | Use when | How |
|---|---|---|
| Chat | A quick explanation inside a conversation | `references/text-mode.md`. Same steps, a small diagram per step |
| Single page | Something to keep, share or present | Copy `assets/walkthrough.html`, replace the embedded walkthrough JSON, verify in a browser |
| In a collection | The walkthrough belongs to a set (a course, a guide, a library) | `references/collection.md`. Add `walkthroughs/<id>.js` and its entry in `collection.js` |
| Custom stage | An object lab, a 3D scene or a packet-level trace | Build in the user's stack following `references/structure.md` and `references/visual-craft.md` |

Default to chat mode for a question asked in passing and to a single page when the user
says "make", "build", "page", "share" or names an audience. The template draws an
illustrated isometric stage for story walkthroughs, and for traces or procedures told as
steps. A custom stage is a project of its own; say so before starting.

On the stage, show state instead of describing it: a gauge for how busy, a glow for the
node in trouble, a cut link for a broken path, more dots for more traffic, a tag for a value.

Not everything explained is a lesson. For an incident review, a design briefing or a talk,
leave out `minutes`, `level` and `goals`, and rename the page's headings with `labels`.

## Collections

To start a set of walkthroughs, copy `assets/collection/` to the place the user chose, then
edit `collection.js` and replace the example walkthroughs. `references/collection.md` gives
the folder layout, the outline format, the status of each item and what the shell does.
Never edit `index.html` or `engine/` inside a collection.

In a collection, write one walkthrough at a time and set its status honestly: `drafted`
after you have rendered it once, never `approved`. Only the collection's owner approves.

## Files

- `references/structure.md` — page regions, walkthrough families, arcs, collection shape, visual language.
- `references/visual-craft.md` — how the illustrated and 3D stages are drawn and animated, with reference values.
- `references/wording.md` — word budgets, voice, title and callout patterns, with examples.
- `references/techniques.md` — the explaining moves and why they work; known gaps of the format.
- `references/walkthrough-schema.md` — the data format of one walkthrough and its consistency rules.
- `references/collection.md` — the collection folder, `collection.js`, statuses, the shell.
- `references/checklist.md` — review list for the data and the rendered result.
- `references/text-mode.md` — the chat rendering.
- `assets/walkthrough.html` — one self-contained page that renders a walkthrough from embedded JSON.
- `assets/example-walkthrough.json` — a complete walkthrough in the format.
- `assets/collection/` — starter folder for a collection: shell, engine, example outline and walkthroughs.

## Optional companion skills

Nothing here is required. When building a custom 3D stage, the `threejs-*` skills
([CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills)) are recommended
for the current three.js API; `references/visual-craft.md` lists which one helps with which
part. Use them if they are installed and continue without them if they are not. Do not
install anything on the user's behalf unless asked.
