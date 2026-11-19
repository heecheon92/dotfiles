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
| `collection.js` | The outline: sections, order, the status of every item, display switches | Yes. It is the source of truth for what exists and where the work stands |
| `walkthroughs/<id>.js` | One walkthrough each | Yes |
| `reviews/<id>.md` | Review notes and the owner's decision for one walkthrough | Yes |
| `sources/` | Material that facts were checked against | Add to it; do not rewrite sources |
| `index.html`, `engine/` | The shell and the stage engine | No. They are copied from the diorama-maker skill |

## Rules

1. **One walkthrough at a time.** Finish, render and record one before starting the next.
2. **Check facts before writing.** A claim that cannot be traced to `sources/`, to code you
   read or to a document you can name is marked as unverified in the review notes, and is
   labelled on the page if it stays.
3. **Status is honest and lives in `collection.js`:** `planned` → `drafted` → `reviewed` →
   `awaiting-approval` → `approved`. Set `drafted` only after opening the walkthrough in a
   browser and stepping through it. Set `reviewed` only when an independent review is
   recorded in `reviews/<id>.md` and its findings are resolved.
4. **Only the owner approves.** An agent never sets `approved`. If an approved walkthrough's
   facts or steps change, set it back to `drafted` and say so.
5. **Keep the item's title and summary in `collection.js` identical** to the walkthrough's own.
6. **Data files are one call with strict JSON inside:** `Diorama.walkthrough({ ... });`.
   Double quotes, no comments, no trailing commas.
7. **Reuse the example world** above so later walkthroughs start on familiar ground.
8. **If the stage cannot draw what a walkthrough needs,** do not fake it with a misleading
   picture. Note the gap under "Engine gaps" below and choose a different case or ask the owner.

## How to write a walkthrough

The format, the wording budgets and the checklist are in the `diorama-maker` skill
(`references/walkthrough-schema.md`, `wording.md`, `checklist.md`). If that skill is not
installed, read an existing file in `walkthroughs/` as the model and keep to its shape:
one concrete case, one scene that grows by at most two objects per step, two short
paragraphs per step, numbers that add up, a recap with reusable rules.

## Resuming work

1. Read "About this collection" above and `collection.js`.
2. Pick up the first item that is not `approved`, in outline order, unless the owner names one.
3. For `drafted`: it needs an independent review. For `reviewed`: check that the findings in
   `reviews/<id>.md` are resolved, then set `awaiting-approval` and tell the owner.
4. Before finishing a session, make sure `collection.js` reflects reality.

## Engine gaps

<!-- Things a walkthrough needed that the stage could not draw. One line each, newest last. -->

(none yet)
