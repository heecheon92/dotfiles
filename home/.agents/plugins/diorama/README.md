# Diorama

Explain something the way a good diagram on a whiteboard does, except it moves: one concrete
case, one illustrated scene that grows a step at a time, a couple of sentences beside it.

A **walkthrough** is one such explanation. A **collection** is a set of them behind one page:
a course, an onboarding guide, a set of incident reviews, an explainer library.

The format is distilled from Dilum Sanjaya's interactive learning sites
([x.com/DilumSanjaya](https://x.com/DilumSanjaya)). Diorama reuses the format; it contains
none of those sites' text, artwork or code.

## Skills

| Skill | Use it to | Needs |
|---|---|---|
| `diorama-maker` | Make one walkthrough: in chat, as one self-contained HTML page, or inside a collection | Nothing. Works alone |
| `diorama-planner` | Plan a collection with you, create its folder and run the write → review → approve queue | `diorama-maker` |
| `diorama-reviewer` | Review a walkthrough before you read it: as a newcomer, then against the format and the sources | `diorama-maker` |

## Try it

One explanation:

```text
Explain how our login flow works, step by step, as a page I can share with a new teammate.
```

A set:

```text
I want an onboarding guide to our door-access system for new engineers. I have no lesson list yet.
```

The planner asks whether you have a list of topics. If you do, it uses yours; if not, it
proposes an outline. Nothing is written until you approve the outline, and you approve each
walkthrough after a model review.

## What you get

- **A single page:** one HTML file. Open it in any browser; it needs no server and no
  internet. Arrow keys step, `R` replays, Space pauses, and every step has its own link.
- **A collection:** a folder you can zip or host as static files.

  ```text
  my-collection/
  ├── index.html         open this
  ├── collection.js      the outline and the status of each walkthrough
  ├── walkthroughs/      one file each
  ├── reviews/           review notes and your decisions
  ├── sources/           what the facts were checked against
  ├── engine/            the stage; shared by all walkthroughs
  └── AGENTS.md          rules and state for any agent that opens the folder
  ```

Each walkthrough in a collection moves through `planned` → `drafted` → `reviewed` →
`awaiting-approval` → `approved`. Only you set the last one.

## Install

Not installed by `./rebuild.sh`. Link it when you want it:

```bash
~/.dotfiles/home/.agents/plugins/install.sh diorama
```

See the [plugins README](../README.md) for removal, for installing `diorama-maker` alone and
for using the plugin on a machine without these dotfiles.

## Optional companions

Diorama needs nothing else. One set of skills is recommended alongside it:

| Skills | When they help | Install |
|---|---|---|
| [`threejs-*`](https://github.com/CloudAI-X/threejs-skills) (13 skills, MIT) | Building a custom 3D stage, such as a hands-on lab with parts the reader can click | `npx skills add cloudai-x/threejs-skills`, or from this repository's skills registry under `external/cloudai-x/` |

`diorama-maker` points to them where they apply and works the same without them.

## Limits

- The stage draws machines, stored data, devices, people, crowds, queues and zones, with
  links and moving dots between them. It does not draw charts, timelines, formulas or 3D
  objects. A walkthrough that needs those needs a custom stage; `diorama-maker` describes
  how such stages are built but does not provide one.
- A model review catches mechanical problems and checks facts against sources. It does not
  replace your reading: whether a walkthrough clicks for a newcomer is yours to judge.
- Reading progress in a collection is kept in the reader's browser only.

## Maintaining

The stage engine has one source: `skills/diorama-maker/assets/collection/engine/`. The
single-page template `skills/diorama-maker/assets/walkthrough.html` contains a copy of it.
After changing the engine, regenerate and check that copy:

```bash
python3 tools/build-single.py          # rewrite walkthrough.html from the engine
python3 tools/build-single.py --check  # fail if anything is out of date
```

`tools/` is for maintainers and is not part of any skill.
