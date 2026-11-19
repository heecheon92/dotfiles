# diorama-maker

Guides an agent to explain a concept, system, incident or procedure as a **walkthrough**: one
concrete case followed step by step on a single illustrated scene, with very few words
beside it. It works alone; it needs no other skill, no installs and no network.

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

## The format in six lines

- Follow one concrete case from start to finish.
- Keep one scene and add one or two objects per step.
- Put a number in a total only after the scene has shown it.
- Each step is a title, two short paragraphs, one callout and a "what changed" list.
- Once the idea works, break it by changing one value, then show the fix and its cost.
- End with the result in numbers, three to five reusable rules and what comes next.

## Contents

| Path | Contents |
|---|---|
| `SKILL.md` | Instructions for the agent |
| `references/structure.md` | Page regions, the four walkthrough families, arcs, collections |
| `references/wording.md` | Word budgets, voice, title and callout patterns |
| `references/techniques.md` | 48 explaining moves with reasons, and what the format lacks |
| `references/visual-craft.md` | How the stage is drawn and animated |
| `references/walkthrough-schema.md` | The data format of one walkthrough |
| `references/collection.md` | The collection folder and its shell |
| `references/checklist.md` | Review list |
| `references/text-mode.md` | The chat rendering |
| `assets/` | The single-page template, an example, and the collection starter |

## Limits

- The template draws step-driven walkthroughs on an isometric stage. A hands-on lab where
  the reader clicks parts and changes values, or a 3D scene, needs a custom stage.
- The format is built for first understanding. It has no questions that test the reader and
  nothing that brings them back later; add those separately when retention matters.
