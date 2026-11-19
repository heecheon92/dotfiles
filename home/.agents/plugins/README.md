# Agent plugins

Handmade agent plugins maintained in this dotfiles repository. A plugin is a folder in the
[Agent Plugins](https://agent-plugins.org) layout: a `plugin.json` and a `skills/` directory
holding one folder per skill.

```text
home/.agents/plugins/
├── README.md
├── install.sh
└── <plugin>/
    ├── plugin.json
    ├── README.md
    └── skills/
        └── <skill>/SKILL.md
```

## Installation policy

**No plugin here is installed by `./rebuild.sh`.** Home Manager does not read this
directory. A plugin is installed only when you choose to, on the machine where you want it.

This is the plugin counterpart of the skills registry in [`../skills`](../skills/README.md):
that registry has an allowlist of skills linked on every rebuild and a larger set installed
by hand; this one currently has only the by-hand tier.

## Install by hand

```bash
~/.dotfiles/home/.agents/plugins/install.sh --list            # what is here, and what is linked
~/.dotfiles/home/.agents/plugins/install.sh diorama           # link the plugin's skills
~/.dotfiles/home/.agents/plugins/install.sh diorama --remove  # unlink them
```

The script links each of the plugin's skills into `~/.agents/skills/<skill>` and, when
`~/.claude/skills` exists, mirrors the link there. The links point at this repository, so an
edit here takes effect without reinstalling. It never overwrites something that is already
at the destination, and `--remove` deletes only links that point into the plugin.

Restart skill-aware agents afterwards if they discover skills only at startup.

A single skill from a plugin can also be installed alone when the plugin says it works
alone, by linking just that skill folder:

```bash
ln -s ~/.dotfiles/home/.agents/plugins/diorama/skills/diorama-maker ~/.agents/skills/diorama-maker
```

## Install without these dotfiles

Each plugin folder is a complete Agent Plugins package and each skill inside it is
self-contained, so a plugin can be installed alone from this public repository. A plugin's
own README gives the exact commands; see [Diorama's](./diorama/README.md#install) for the
Skills CLI, git-only and ask-your-agent routes.

To publish a plugin to a plugin registry, copy its folder as it is. Tools that install
plugins through a marketplace make their own copy and keep their own install records; that
route needs a marketplace catalog, which this repository does not provide.

## Plugins

| Plugin | What it does | Skills |
|---|---|---|
| [`diorama`](./diorama/README.md) | Explains things as step-by-step walkthroughs on an illustrated, animated stage; plans, writes and reviews collections of them | `diorama-maker`, `diorama-planner`, `diorama-reviewer` |

## Rules for plugins kept here

- Every skill folder is self-contained: it never reads files from a sibling skill or from
  the plugin root, so it still works when linked alone.
- A skill may require another skill of the same plugin to be installed. It says so at the
  top of its `SKILL.md`. Dependencies point one way; a skill described as working alone
  requires nothing.
- A skill may recommend companion skills from outside its plugin. They are always optional:
  the skill names them, says when they help, and works the same without them.
- No network access, package installs or build steps are needed to use a skill. Maintainer
  tooling lives in the plugin's `tools/` folder, outside `skills/`.
