# Designing an outline

How to turn a subject into sections and walkthroughs when the user has not given a list,
and how to present any outline for approval.

## What one item is

One walkthrough answers **one question** by following **one concrete case** in which **one
thing moves** and **one number** gives the answer. If you cannot write all four in a line
each, the item is not ready:

| Good item | Question | Case | What moves | The number |
|---|---|---|---|---|
| How a badge tap works | Why does the door sometimes hesitate? | One tap of card 0412 at one door, timed stop by stop | One request from the reader to the server and back | Milliseconds from tap to click |
| Keeping copies in sync | How does a cancelled card reach every door? | One cancellation at 09:00 spreading to three doors | One change copied from door to door | Seconds until the last door knows |

| Not an item | Why | What to do |
|---|---|---|
| "Access control overview" | A topic, not a question | Find the first question a newcomer would ask and start there |
| "How the server decides" | Nothing moves and no number answers it | Follow one request through the decision and time it |
| "All the configuration options" | Reference material | Leave it as a table or a document; link to it |
| "Caching and queues" | Two ideas | Two items |
| "Why our design is better" | An opinion with no mechanism to watch | Pick the failure the design prevents and show that |

## Choosing and ordering

1. **Start from the reader's first real question,** not from definitions. The first
   walkthrough should give the whole picture in miniature, using only everyday words. If
   the owner said which part confuses newcomers most, make sure an early item is about it.
2. **One new idea per item.** Each item may rely on earlier ones and on nothing else.
3. **Order by dependency, then by pull.** Put each item right after the one that raises the
   question it answers. A recap that ends "but what happens when a thousand people arrive at
   once?" is the reason for the next item.
4. **Alternate building and breaking.** After a few items that build a mechanism, include
   one that breaks it. In a larger collection, end with items that put the pieces together
   on a whole case.
5. **Keep one example world.** Choose the scenario, the names and the base numbers once and
   reuse them, so later items open on a familiar picture. Write it down for the folder's
   `AGENTS.md`.
6. **Sections are a handful of related items** with a one- or two-word name. One to nine
   sections, two to eleven items each. A small collection needs no sections at all.
7. **Size it small.** Offer the smallest set that serves the stated purpose and list the
   rest as "later". It is easier to add an item than to finish forty.

## Check each item against the stage

Before proposing an item, picture its scene with the objects the stage can draw: machines
and services, stored data, a device, a person, a crowd, a queue, a zone, links between them,
dots moving along the links, and state on each object (how busy, in trouble, failed, a tag).

- If the idea is something **moving between things, filling up, waiting, failing or being
  copied**, the stage can show it.
- If it needs a **chart, a formula building up, a timeline, a tree, a physical object in 3D
  or bytes inside a packet**, the standard stage cannot. Either choose a case that shows the
  same idea through objects and flows, or mark the item "needs a custom stage" in the
  outline so the owner can decide.

## Kinds of collection

| Kind | Ordered | Progress | Teaching wording (level, minutes, goals) | Typical size |
|---|---|---|---|---|
| Course or lecture series | yes | yes | yes | 6–40 |
| Onboarding guide | yes | yes | goals yes; level and minutes usually no | 4–12 |
| Explainer library | no | no | no | any |
| Incident reviews | by date, or no | no | no; rename headings with `labels` | 1–5 per incident |
| A talk | yes | no | no | 1–3 |

## Presenting the outline

Show it in the conversation, in the reader's language, like this. Do not create files yet.

```markdown
**How Door Access Works** — for new engineers on the access team; no hardware background assumed.
Example world: one office, card 0412, the door "Lab A", round-number timings.

**1. One door**

| # | Walkthrough | Question it answers | Case it follows | What moves | The number | Needs |
|---|---|---|---|---|---|---|
| 1 | How a Badge Tap Works | Why does the door sometimes hesitate? | One tap, timed stop by stop | One request, reader to server and back | ms from tap to click | — |
| 2 | Keeping Copies in Sync | How does a cancelled card reach every door? | One cancellation spreading to three doors | One change copied door to door | s until the last door knows | 1 |

**2. Many doors**

| # | Walkthrough | Question it answers | Case it follows | What moves | The number | Needs |
|---|---|---|---|---|---|---|
| 3 | A Morning Rush | What happens when 200 people arrive at 08:55? | One entrance, a growing queue | People joining and leaving one queue | People waiting at 09:00 | 1 |

**Later, if useful:** visitor badges; fire-alarm release; audit trail.
**Needs a custom stage:** none.

Kind: onboarding guide, read in order, with progress. I would start with walkthrough 1.
```

Then ask one question: approve as is, or what to change.

## When the user supplied the list

Keep their titles unless a title would mislead; keep their order unless a dependency is
broken. For each of their items fill in the question, the case, what moves and the number
yourself and show the same table, so they can see how you read each one. When an item is a
topic and you cannot tell which question they mean, offer three candidate questions for it
and recommend one. Put anything you would add under "Later, if useful" and anything you
doubt under a short "Notes" line. Do not silently drop, merge or rename their items.
