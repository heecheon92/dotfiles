# diorama-maker

Guides an agent to explain a concept, system, incident or procedure as a **walkthrough**: one
question answered by following one concrete case step by step on a single illustrated scene,
with very few words beside it. It works alone; it needs no other skill, no installs and no
network.

## Use

Name the skill and say what you want. How you name it depends on the tool:

| Tool | Type |
|---|---|
| OMP | `/skill:diorama-maker <your request>` |
| Claude Code | `/diorama-maker <your request>` |
| Codex | `$diorama-maker <your request>` |

```text
/skill:diorama-maker Explain how our login flow works, step by step, so a new developer can follow it.
/diorama-maker Make a page I can share that shows why yesterday's outage happened.
```

You can also ask without the skill name; the agent picks the skill when the request matches.

| Output | When | What you get |
|---|---|---|
| Chat | A question asked in passing | Steps with a small diagram each |
| Single page | Something to keep, share or present | One self-contained HTML file |
| In a collection | The walkthrough belongs to a set | A file in a collection folder |

For a single page the agent copies `assets/walkthrough.html` and replaces the walkthrough
data embedded in it. The page opens in any browser without a server or internet access.
`assets/example-walkthrough.json` is a complete example.

Add `#/<id>/sheet` to the page's address to see every step as a still picture on one page,
with the results of the automatic checks. The agent reviews its work there; you can too.

## The format in seven lines

- Start from one question, with one thing that moves and one number that answers it.
- List the numbers and where each comes from before drawing anything.
- Follow one concrete case and keep one scene, adding one or two objects per step.
- Put a number in a total only after the scene has shown it.
- Each step is a title, two short paragraphs, one callout and a "what changed" list.
- Once the idea works, show too little and too much of one value; let the reader choose it.
- End with the result in numbers, three to five reusable rules and what comes next.

## What a walkthrough is made of

| Part | In the data | What it is |
|---|---|---|
| The objects | `nodes`, `links` | The things on the stage and the connections between them |
| The numbers behind it | `sources` | The ledger: each value and where it comes from |
| The steps | `steps` | The story, one change at a time |
| The running numbers | `metrics` | The counters above the stage, filled in as the stage earns them |
| The practice | `try` | A step where the reader picks a value and gets a verdict |
| What is real | `kind` in `sources`, `note` | Which values are data and which are assumed |

## Contents

| Path | Contents |
|---|---|
| `SKILL.md` | Instructions for the agent |
| `references/structure.md` | Page regions, the four walkthrough families, arcs, collections |
| `references/wording.md` | Word budgets, voice, question, title, callout and verdict patterns |
| `references/techniques.md` | The explaining moves with reasons, and what the format lacks |
| `references/visual-craft.md` | How the stage is drawn and animated; fixing overlaps |
| `references/walkthrough-schema.md` | The data format of one walkthrough, the automatic checks, the sheet |
| `references/collection.md` | The collection folder and its shell |
| `references/checklist.md` | Review list |
| `references/text-mode.md` | The chat rendering |
| `assets/` | The single-page template, an example, and the collection starter |

## Limits

- The template draws step-driven walkthroughs on an isometric stage. A hands-on lab where
  the reader clicks parts of an object, or a 3D scene, needs a custom stage.
- The format is built for first understanding. A try step lets the reader choose among
  preset values and see what happens. It has no free input, no open practice and nothing
  that brings the reader back later; add those separately when retention matters.
