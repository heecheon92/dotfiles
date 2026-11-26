# Diorama

[English](README.md) | [한국어](README.ko.md)

Diorama is a plugin for coding agents: three skills that have an agent explain a concept, a
system, an incident or a procedure as a picture that moves step by step, and the HTML page
that draws it.

The walkthrough format follows Dilum Sanjaya's interactive learning sites
([x.com/DilumSanjaya](https://x.com/DilumSanjaya)). The method around it (a question with
one moving part and one number, sourced numbers, try-it steps, review on a sheet) builds on
[SIMULAB](https://github.com/ecapri-dev/simulab-skill) by @0xKapri (MIT licence). Diorama
is a separate implementation and contains none of their text, artwork, code or fonts.

See [Template references](TEMPLATE-REFERENCES.md) for live examples, images and notes on what to study in each.

## Skills

| Skill | Use it to | Needs |
|---|---|---|
| `diorama-maker` | Make one walkthrough: in chat, as one self-contained HTML page, or inside a collection | Nothing. Works alone |
| `diorama-planner` | Plan a collection with you, create its folder and run the write → review → approve queue | `diorama-maker` |
| `diorama-reviewer` | Review a walkthrough before you read it: as a newcomer, then against the format, the numbers and the sources | `diorama-maker` |

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

## Ideas

A request works best as a question with one thing that moves and one number that answers
it. These fit the standard stage; you can ask in the words of the first column and the
agent will propose the rest.

| You ask about | The question | What moves | The number |
|---|---|---|---|
| How our login works | Why does the first login of the day take longer? | One login request passing from the browser to the API to the session store | Milliseconds at each stop, added up |
| Why the job queue backs up | Why do jobs pile up at 9 am? | Jobs entering a queue faster than the workers take them out | Jobs waiting after ten minutes |
| When the log disk fills | How long until the log disk is full? | Log writes filling a store | Days until it is full |
| Where a support ticket waits | Why does a ticket take four days to close? | One ticket handed from team to team | Hours spent waiting at each team |
| What the cache buys us | Why is the second page load faster than the first? | A request that stops at the cache instead of the database | Milliseconds saved per load |
| What happens in an outage | What happens to orders when the payment service is down? | Orders reaching a broken link, then waiting in a queue | Orders delayed and orders lost |
| Why we rate-limit | How many requests can one client send before it is refused? | Requests passing or bouncing at a gate | Requests allowed per minute |
| Your job | [The process you find hardest to explain] | [The thing that moves] | [The number that matters] |

## What you get

- **A single page:** one HTML file. Open it in any browser; it needs no server and no
  internet. Arrow keys step, `R` replays, Space pauses, and every step has its own link.
- **For the reader, on every page:**
  - the question the walkthrough answers, right under the title;
  - the explanation right beside the picture, in a pane inside the stage, and where a step
    has one, a short note on the stage next to the object the step is about;
  - try-it steps, where you pick a value (click, or press `1`–`5`) and the page shows what
    happens and why; `0` resets;
  - a "Where this comes from" list that says which facts and numbers have a source and
    which are assumptions;
  - a stage you can move closer to: zoom with the wheel (Ctrl/⌘ + wheel where the page
    scrolls), a pinch, the on-stage buttons or `+`/`-`, drag to look around, double-click an
    object to zoom to it, and press `F` or double-click the floor to see the whole scene
    again (each new step starts from the author's framing);
  - tracing: point at an object, focus it with Tab or tap it, and it stays bright with its
    links and the objects they lead to while the rest of the scene dims; point at a link to
    see its two ends;
  - a theme button: light, dark, or follow the system. It is in the top right corner of a
    single page, and in the map and the top bar of a collection. The choice is kept in the
    reader's browser.
- **For the author and the reviewer:** a sheet at `#/<walkthrough-id>/sheet` that shows
  every step and every try-it option as a still picture on one page, and automatic checks
  listed at its top: broken references, totals that do not add up, labels that overlap,
  text over its word budget. You can open the sheet yourself; the agent gives you the link.
- **A collection:** a folder you can zip or host as static files.

  ```text
  my-collection/
  ├── index.html         open this
  ├── collection.js      the outline and the status of each walkthrough
  ├── walkthroughs/      one file each
  ├── reviews/           review notes and your decisions
  ├── sources/           where the facts and numbers come from
  ├── engine/            the page shell, the stage and the step story; shared by all walkthroughs
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

## What to expect

**Yes:** a first walkthrough that really explains something, with numbers you can defend,
as one file to share.

**No:** it is rarely right at the first request. Expect to ask for corrections, one at a
time. And it is an illustrated isometric diagram, not photoreal 3D you can spin.

If you remember three things:

1. Ask a question with one moving part and one number, never a topic.
2. Have the numbers gathered, with their sources, before anything is drawn.
3. Every number on the page comes from the same small set of values.

## Limits

- The stage draws machines, stored data, devices, people, crowds, queues and zones, with
  links and moving dots between them. It does not draw charts, timelines, formulas or 3D
  objects. A walkthrough that needs those needs a custom stage; `diorama-maker` describes
  how such stages are built but does not provide one.
- Try-it steps offer preset values only. There is no free input, no open exercise and
  nothing that brings a reader back to the idea later.
- The automatic checks catch mechanical problems: broken references, wrong totals,
  overlapping labels, over-long text. A model review adds a check of facts and numbers
  against their sources. Neither replaces your reading: whether a walkthrough clicks for a
  newcomer is yours to judge.
- Reading progress in a collection is kept in the reader's browser only.
- There is one way to present a walkthrough today: the step story on the isometric stage.
  Since engine 0.4.0 the engine can hold more such templates, and more are planned, but
  none exists yet.

## Maintaining

The engine has one source, `skills/diorama-maker/assets/collection/engine/` (version
0.6.0), in three layers. The shell (`diorama.js`, `diorama.css`) is the page around a
walkthrough: the collection, search, progress and links. The stage (`stage-iso.*`) draws
the isometric picture. The template (`template-story.*`) is the step story, the only
template today. `skills/diorama-maker/references/templates.md` describes the contracts
between the layers and how to add a template or a stage.

The single page `skills/diorama-maker/assets/walkthrough.html` contains a copy of all three
layers. After changing the engine, regenerate and check that copy:

```bash
python3 tools/build-single.py          # rewrite walkthrough.html from the engine
python3 tools/build-single.py --check  # fail if anything is out of date
```

`--template <name>`, `--template-dir <folder>` and `--out <path>` build a single page for
another template, from another folder, into another file. `tools/test-template/` holds
`plain`, a template with no steps and no stage that exists only to test that the layers
are separate; `templates.md` shows how to run it.

`tools/` is for maintainers and is not part of any skill.
