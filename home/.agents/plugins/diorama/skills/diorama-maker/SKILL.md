---
name: diorama-maker
description: Use when asked to explain, teach or walk through a concept, system, incident, design or procedure so a newcomer can follow it step by step, as a chat explanation, one self-contained interactive HTML page, or one walkthrough inside a collection. Not for quick factual answers or reference docs.
---

# Diorama maker

Answer one question by following one concrete case on a single illustrated scene that grows
step by step, with very few words beside it. One such explanation is a **walkthrough**.

This skill works alone. It needs no other skill, no installs and no network.

## Core rules

1. Start from **one question** with one thing that moves and one number that answers it.
2. **Numbers before the stage.** List every value with where it comes from. Never invent a
   number or a source; what has no source is an assumption and is labelled as one.
3. Follow **one concrete case** with real-looking values. State the general rule only in the recap.
4. Keep **one scene**. It grows by at most two objects per step and nothing moves unless it changed.
5. **Earn every number** on the stage before it appears in a total. Every number shown derives
   from the list in rule 2 by arithmetic the reader could redo.
6. Each step is a title, **two short paragraphs**, at most one callout and a "what changed" list.
7. After the idea works, **break it** by changing one variable: too little, then too much.
   Show the fix and its cost. At most two steps hand that choice to the reader.
8. End with the result in numbers, 3–5 reusable rules and a pointer to what comes next.
9. **Say what is simplified, invented or sped up.** Never state an unverified claim as fact.
10. Write in the reader's language. Keep identifiers, commands and units untranslated.

## Workflow

1. **Pin down the request.** Who is the reader, what do they already know, and what should
   they be able to say or do afterwards? Infer from context; ask only if the answer changes
   the walkthrough.
2. **State the question,** the one thing that moves and the one number that answers it
   (`references/techniques.md`, "The question"). If the request is vague, offer three
   candidate questions, say which part confuses newcomers most, and recommend one.
3. **Build the numbers ledger.** Read the code, logs, docs or material that the explanation
   describes. Write down each value with its unit, where it comes from, and whether it is
   `data` or an `assumption`. Do not design a walkthrough around a mechanism that has not
   been checked.
4. **Choose the family** (`references/structure.md`): story, object lab, trace or procedure.
5. **Choose the case.** One scenario, named actors, values from the ledger that add up.
   Decide the 0–5 running numbers and the one variable that will be set too low and too high.
   Work out one derived value by hand and keep the working.
6. **Write the walkthrough as data** following `references/walkthrough-schema.md`: `question`,
   `sources` (the ledger), then the step list with chapters and titles. Read the titles in
   order as a story, then write the bodies. Where the reader should choose the value
   themselves, make that step a `try` step.
7. **Write the words** within the budgets in `references/wording.md`.
8. **Check** against `references/checklist.md`. Fix or report every miss.
9. **Render** in the mode the user asked for (below).
10. **Review on the sheet.** Open `#/<id>/sheet`. Read the Checks block and clear every
    warning. Look at every tile: overlaps, a lonely or shrunken scene, numbers that differ
    from the data. Then step through the walkthrough once for the transitions and choose
    every option of every try step. Do this again after every change.
11. **Hand off.** Say what you checked on the sheet and what you fixed, write out the hand
    check from step 5, list the entries that are assumptions and anything on the checklist
    that still stands, and give the sheet link next to the reading link.

`references/techniques.md` lists the explaining moves with reasons; read it when a
walkthrough feels flat or when deciding what to cut. `references/visual-craft.md` explains
how the stage is drawn and animated, and how to fix an overlap or a scene that looks lost;
read it before building or changing any stage, and when a result looks plain.

## Output modes

| Mode | Use when | How |
|---|---|---|
| Chat | A quick explanation inside a conversation | `references/text-mode.md`. Same steps, a small diagram per step |
| Single page | Something to keep, share or present | Copy `assets/walkthrough.html`, replace the embedded walkthrough JSON, review it on its sheet |
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
after its sheet shows no warnings and you have stepped through it once, never `approved`.
Only the collection's owner approves.

## Files

- `references/structure.md` — page regions, walkthrough families, arcs, collection shape, navigation, visual language.
- `references/visual-craft.md` — how the illustrated and 3D stages are drawn and animated, with reference values; fixing overlaps.
- `references/wording.md` — word budgets, voice, question, title, callout and verdict patterns, with examples.
- `references/techniques.md` — the explaining moves and why they work; what the format does not do.
- `references/walkthrough-schema.md` — the data format of one walkthrough, its consistency rules, the automatic checks and the sheet.
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

## Credits

The walkthrough format follows Dilum Sanjaya's interactive learning sites
([x.com/DilumSanjaya](https://x.com/DilumSanjaya)). The method around it builds on
[SIMULAB](https://github.com/ecapri-dev/simulab-skill) by @0xKapri (MIT licence). Diorama
is a separate implementation: reuse the format and the method, and copy none of their text,
artwork, code or fonts.
