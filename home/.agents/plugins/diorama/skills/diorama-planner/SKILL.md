---
name: diorama-planner
description: Use when asked to create or continue a set of step-by-step visual walkthroughs on a subject, such as a course, a lecture series, an onboarding guide, a set of incident reviews or an explainer library. Plans the outline with the user, creates the collection folder and runs the write, review, approve queue. For a single explanation use diorama-maker.
---

# Diorama planner

Plan and run a **collection**: several walkthroughs on one subject behind one shell page.
This skill owns the process around the walkthroughs. Writing each walkthrough is the
`diorama-maker` skill's job and reviewing each one is the `diorama-reviewer` skill's.

**Requires `diorama-maker`.** The collection starter, the engine and the formats live
there. If it is not installed, say so and stop; do not improvise a folder.

The collection's **owner** is the person who asked for it unless they name someone else.
The owner approves the outline and every walkthrough. You never approve anything.

## Continuing an existing collection

If the working folder, or a folder the user names, contains `collection.js` and `AGENTS.md`,
it is a collection. Read both, follow that `AGENTS.md`, and go to "Run the queue". Do not
re-plan an outline that is already approved unless the owner asks.

## Starting a new collection

### 1. Intake

Ask only what you cannot find out, in one message, with your best guess offered for each:

- **Subject and purpose.** What should a reader understand or be able to do at the end?
- **Readers.** Who are they and what do they already know?
- **The confusing part.** "Which part of this confuses newcomers most?" That part gets the
  most room in the outline.
- **A list of topics.** "Do you already have a list of the walkthroughs, lessons or topics
  you want, or should I propose one?" Always ask this unless the user already gave a list.
- **Sources.** Code, documents, logs or links the facts and numbers should come from.
- **Where the folder goes.** Propose two or three concrete paths. Never create it inside a
  skill folder or a dotfiles repository.
- **Language** of the walkthroughs, if not obvious.

If the subject is too vague to outline ("explain our platform"), do not guess. Offer three
candidate questions the collection could open with, each with the thing that moves and the
number that answers it, say which one covers the part newcomers find most confusing, and
recommend one.

### 2. Gather the facts

Read the sources before outlining. For a subject you only know from memory, look it up with
whatever research tools are available and keep what you used. A walkthrough can only be as
right as what it was checked against.

Keep a ledger as you read: each value the walkthroughs will show, its unit, where it comes
from, and whether it is data or an assumption. Never invent a number or a source; a value
you cannot trace is an assumption. Each walkthrough later takes its rows from this ledger
as its `sources` field.

### 3. Outline

- **The user gave a list:** use it. Their items and order win. You may suggest splitting an
  item that holds two ideas, merging two that share one, or reordering for dependencies, as
  suggestions the owner can decline. Say plainly when an item does not suit this format
  (a reference table, a list of commands, an opinion piece) and what you would do instead.
- **No list:** propose the outline yourself, following `references/outline.md`.

Either way, propose the **smallest set that serves the purpose**, and list further
candidates separately as "later". Three good walkthroughs beat twelve planned ones.

Present the outline in the conversation as a table (format in `references/outline.md`):
sections, and for each item its title, the one question it answers, the concrete case it
follows, the thing that moves, the number that answers the question, and what it needs the
reader to have seen before.

**Stop here and wait for the owner to approve or edit the outline.** Create no files first.

### 4. Create the folder

After approval:

1. Copy `assets/collection/` from the `diorama-maker` skill to the chosen path.
2. Delete the example files in `walkthroughs/`.
3. Write `collection.js`: the approved sections and items, every item `planned`,
   `options.showDrafts` and `options.showPlanned` both `true` while building. Choose
   `ordered` and `progress` from the kind of collection: both `true` for a course or guide
   read in order, both `false` for a library people dip into. Set `labels` if the default
   teaching wording does not fit.
4. Fill in "About this collection" in the folder's `AGENTS.md`, including the example world.
5. Put the sources you used into `sources/`, or a `sources/README.md` listing where they
   are, and save the ledger from step 2 as `sources/ledger.md`.
6. Open `index.html` and confirm the home view shows the outline with no console errors.

Tell the owner the path and how to open it.

## Run the queue

Work through the items in outline order. For each one:

1. **Write** it with `diorama-maker`, as `walkthroughs/<id>.js`, passing on its question,
   case, moving thing and number from the outline and its rows of the ledger. Review it on
   its sheet (`index.html#/<id>/sheet`) and step through it once, as that skill's workflow
   says. Set its status to `drafted`.
2. **Review** it with `diorama-reviewer`. The reviewer must not be the author: hand it to a
   fresh agent with no memory of the writing if your tool can start one. If it cannot, do a
   separate review pass yourself and record in the review file that it was a self-review.
3. **Resolve** the findings: fix blockers and should-fixes, answer the rest, and write the
   "Resolution" section of `reviews/<id>.md`. Set the status to `reviewed`.
4. **Hand over.** Set `awaiting-approval` and tell the owner: the reading link
   (`index.html#/<id>/1`) with the sheet link (`index.html#/<id>/sheet`) next to it, a
   two-line summary of what the review found and what changed, what was checked on the
   sheet and what was fixed, one hand check of a derived number, which values are
   assumptions, and what the reviewer could not judge. Then wait.
5. **Record the decision.** When the owner answers, write it under "Owner decision" in the
   review file. Approved: the owner, or you on their explicit word, sets `approved`.
   Changes wanted: apply them, set `drafted`, and repeat from step 2 if facts or steps changed.

**Pace.** Stop after the first walkthrough and wait for the owner's decision; it sets the
tone for the rest. After that, you may keep writing while earlier ones wait, but never let
more than two sit unapproved.

**Learn from every decision.** When the owner corrects something that will apply again (a
wording habit, a level of detail, a colour meaning, a preferred kind of case), add one line
to a "House rules" section in the folder's `AGENTS.md` and follow it from then on.

**Engine gaps.** If an item needs something the stage cannot draw, record it under "Engine
gaps" in the folder's `AGENTS.md`, tell the owner, and move on to the next item.

## Finishing

When the owner says the collection is ready to share: set `options.showDrafts` to `false`,
decide `showPlanned` with the owner, open the collection once more from the home view, and
say how to share it (the folder as static files, or a zip; it needs no server).

## Report honestly

At the end of each session say what state each touched item is in, what was verified in a
browser and what was not, and what is waiting on the owner.
