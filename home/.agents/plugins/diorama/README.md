# Diorama

[English](README.md) | [한국어](README.ko.md)

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

## How to use it

Name the skill at the start of your message, then say what you want in plain words. The way
to name a skill depends on the tool:

| Tool | Type |
|---|---|
| OMP | `/skill:diorama-maker <your request>` |
| Claude Code | `/diorama-maker <your request>` |
| Codex | `$diorama-maker <your request>` |

The same pattern works for `diorama-planner` and `diorama-reviewer`. You can also leave the
skill name out and just ask; the agent picks the skill when your request matches it. Naming
it makes sure the right one is used.

### The usual flow

For a set of walkthroughs you only talk to the planner. It calls the other two for you:

```text
diorama-planner   asks what you want, proposes the outline, waits for your approval
   └─ for each walkthrough, in order:
        diorama-maker     writes it and renders it
        diorama-reviewer  reviews it; the findings are fixed
        you               read it and approve, or ask for changes
```

For a single explanation, `diorama-maker` is enough. Add `diorama-reviewer` afterwards if you
want it checked before you share it.

### Explain one thing: `diorama-maker`

```text
/skill:diorama-maker Explain how our login flow works, step by step, as a page I can share with a new teammate.
```

```text
/diorama-maker Walk me through why yesterday's deploy failed. Keep it in the chat.
```

```text
$diorama-maker Make a page that shows how a request travels from the browser to our database.
```

Say "page" when you want a file to keep or share. Without it you get the steps in the
conversation.

### Build a set: `diorama-planner`

```text
/skill:diorama-planner I want an onboarding guide to our door-access system for new engineers. I have no lesson list yet.
```

```text
/diorama-planner Create a course from these topics: 1) how a badge tap works 2) keeping doors in sync 3) the morning rush.
```

The planner asks whether you have a list of topics. If you do, it uses yours; if not, it
proposes an outline. Nothing is written until you approve the outline, and you approve each
walkthrough after a model review.

To pick up an existing collection later, open its folder and ask:

```text
$diorama-planner Continue this collection.
```

### Check one before you read it: `diorama-reviewer`

```text
/skill:diorama-reviewer Review walkthroughs/badge-tap.js before I read it.
```

The planner runs this step for you inside a collection. Use it directly for a single page,
or when you want a second opinion from a different model.

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

You do not need the rest of this dotfiles repository. Pick one route.

### Paste this to your agent

The quickest route. Copy the whole block and paste it into your coding agent:

```text
Install the Diorama agent plugin for me.

Source: https://github.com/heecheon92/dotfiles (public), folder home/.agents/plugins/diorama.
Its skills/ folder holds three skills: diorama-maker, diorama-planner, diorama-reviewer.

1. Fetch only that folder into a temporary directory:
   git clone --depth 1 --filter=blob:none --sparse https://github.com/heecheon92/dotfiles.git <tmp>/diorama-src
   cd <tmp>/diorama-src && git sparse-checkout set home/.agents/plugins/diorama
2. Copy the three skill folders, unchanged, from home/.agents/plugins/diorama/skills/ into the
   user-level skills folder that you load skills from. If you are not sure which folder that
   is, use ~/.agents/skills and tell me.
3. If a folder with the same name is already there, stop and ask me before replacing it.
4. Check that each installed folder contains SKILL.md and that
   diorama-maker/assets/walkthrough.html exists.
5. Delete the temporary directory.
6. Tell me where the skills were installed, which commit they came from, and whether I need
   to start a new session before they load.

Do not install anything else, do not change any other files, and do not run the skills yet.
```

To install only the part that works alone, change the request to "Install only diorama-maker".

### With the Skills CLI

Needs Node.js. Installs all three skills for your user account and asks which agents to
install them for:

```bash
npx skills add https://github.com/heecheon92/dotfiles/tree/main/home/.agents/plugins/diorama --global --skill '*'
```

Only the maker, which works alone:

```bash
npx skills add https://github.com/heecheon92/dotfiles/tree/main/home/.agents/plugins/diorama --global --skill diorama-maker
```

Use the full URL with the path, as above. `npx skills add heecheon92/dotfiles` looks at the
repository's top-level skills and does not find the plugin.

To remove them later: `npx skills remove --global diorama-maker diorama-planner diorama-reviewer`.

### With Codex's bundled installer

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/plugins/diorama/skills/diorama-maker \
         home/.agents/plugins/diorama/skills/diorama-planner \
         home/.agents/plugins/diorama/skills/diorama-reviewer
```

### If you use these dotfiles

`./rebuild.sh` does not install the plugin. Link it when you want it:

```bash
~/.dotfiles/home/.agents/plugins/install.sh diorama
```

The links point at the repository, so edits take effect without reinstalling. See the
[plugins README](../README.md) for removal and for linking `diorama-maker` alone.

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
