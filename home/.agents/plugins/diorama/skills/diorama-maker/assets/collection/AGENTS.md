# This folder is a Diorama collection

A set of step-by-step visual walkthroughs behind one shell page. Open `index.html` in a
browser to read it; nothing needs to be installed, built or served.

## About this collection

<!-- Filled in when the folder is created. Keep it current. -->

- **Subject:** (what the collection explains)
- **Readers:** (who it is for and what they already know)
- **Owner:** (the person who approves walkthroughs)
- **Kind:** (course, onboarding guide, incident reviews, explainer library, talk…)
- **Example world:** (the scenario, names and values reused across walkthroughs)

## Where things are

| Path | What | Edit it? |
|---|---|---|
| `collection.js` | The outline: sections, order, the status of every item, display switches | Yes. It is the one record of what exists and where the work stands |
| `walkthroughs/<id>.js` | One walkthrough each | Yes |
| `reviews/<id>.md` | Review notes and the owner's decision for one walkthrough | Yes |
| `sources/` | Material that facts and numbers come from | Add to it; do not rewrite what is there |
| `index.html`, `engine/` | The shell and the stage engine | No. They are copied from the diorama-maker skill |

## Rules

1. **One walkthrough at a time.** Finish, render and record one before starting the next.
2. **Question and numbers first.** Each walkthrough answers one question (its `question`
   field) with one thing that moves and one number. Before writing steps, list every value
   it relies on in its `sources` field: the claim, `data` or `assumption`, and where it
   comes from (a file in `sources/`, code you read, a document you can name). Never invent
   a number or a source; a value you cannot trace is an `assumption` and says so. Every
   number on the page is one of those values or follows from them by simple arithmetic.
3. **Status is honest and lives in `collection.js`:** `planned` → `drafted` → `reviewed` →
   `awaiting-approval` → `approved`. Set `drafted` only after reviewing the walkthrough on
   its sheet (rule 9) and stepping through it once. Set `reviewed` only when an independent
   review is recorded in `reviews/<id>.md` and its findings are resolved.
4. **Only the owner approves.** An agent never sets `approved`. If an approved walkthrough's
   facts or steps change, set it back to `drafted` and say so.
5. **Keep the item's title and summary in `collection.js` identical** to the walkthrough's own.
6. **Data files are one call with strict JSON inside:** `Diorama.walkthrough({ ... });`.
   Double quotes, no comments, no trailing commas.
7. **Reuse the example world** above so later walkthroughs start on familiar ground.
8. **If the stage cannot draw what a walkthrough needs,** do not fake it with a misleading
   picture. Note the gap under "Engine gaps" below and choose a different case or ask the owner.
9. **Review on the sheet after every change.** Open `index.html#/<id>/sheet`: it shows every
   step, and every option of a try step, as a still picture, under a Checks block. Clear
   every warning in Checks and fix or explain every note. On each tile look for objects or
   labels covering each other, a label covering the thing it names, text that is cut off or
   too small to read, and numbers that do not match the picture. Fix an overlap by changing
   a node's `x` or `y` or by shortening a text, never by deleting the label.

## How to write a walkthrough

The format, the wording budgets and the checklist are in the `diorama-maker` skill
(`references/walkthrough-schema.md`, `wording.md`, `checklist.md`). If that skill is not
installed, read an existing file in `walkthroughs/` as the model and keep to its shape:
one question, one concrete case, one scene that grows by at most two objects per step, two
short paragraphs per step, numbers that add up and are listed in `sources`, a recap with
reusable rules.

## Resuming work

1. Read "About this collection" above and `collection.js`.
2. Pick up the first item that is not `approved`, in outline order, unless the owner names one.
3. For `drafted`: it needs an independent review. For `reviewed`: check that the findings in
   `reviews/<id>.md` are resolved, then set `awaiting-approval` and give the owner the
   reading link (`index.html#/<id>/1`) and the sheet link (`index.html#/<id>/sheet`).
4. Before finishing a session, make sure `collection.js` reflects reality.

## Engine gaps

<!-- Things a walkthrough needed that the stage could not draw. One line each, newest last. -->

(none yet)
