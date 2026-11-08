# Tern update skill

Review Stencil Tern's release changes and local settings before updating, without treating a shared review as proof that this machine's app or running daemon has been updated. The [workflow](./SKILL.md) is for skill-aware agents; this guide explains how to use it.

## Use

```text
$tern-update
```

An explicit update request authorizes a safe stable core update through the verified installation owner and deterministic settings maintenance after an exact plan. It does **not** authorize interrupting running Tern sessions, panes, agents, or the daemon. The agent must ask at the point of risk before a restart or other disruptive action. If it cannot establish a safe owner action, it defers installation rather than using an unrelated download or interrupting the current assistant.

For a read-only assessment, ask:

```text
Audit Tern updates and local settings; do not make changes.
```

An audit writes no checkpoint. Installing this skill does not perform a review or update. OMP and Herdr updates, plugins, a different release channel, unrelated Home Manager activation, and Git publication are separate decisions.

## What to expect

The primary output is a feature briefing, even when your settings need no changes. It leads with **Worth your attention**: a few changes selected for evidenced workflows, with what each does, why it may matter, when to use it, and a version-verified example or shortcut. The agent distinguishes what is available in the installed or running app from what needs enabling, an update, or a restart, and says when that is unknown. It covers the remaining user-facing changes too, including optional ones; highlighting a feature does not enable it.

The agent compares the shared last-reviewed release with the latest official release and assesses local settings separately. It distinguishes documented behavior from local observation and untested features, asks material questions one at a time, shows before/after workflows and an exact plan, and reports deferred or unverified work honestly.

The first run has no review checkpoint. Choose either a known previously reviewed version or an explicitly scoped current-version audit; the installed version alone is not evidence of prior review. An execution-mode review can record the agreed completed boundary; a read-only audit cannot. The checkpoint is `review-state.json` in the resolved skill source directory and is shared through the dotfiles checkout. Sharing it between machines requires an explicitly authorized Git commit and synchronization. It records release review only—not installation, the live version, or runtime compatibility.

On macOS the included Python helper reads app-bundle metadata without launching Tern:

```sh
python3 /path/to/tern-update/scripts/review_state.py status
```

Use `--app /path/to/Tern.app` before `status` to inspect a specific bundle. An absent app is supported; discovery on other operating systems is not established by this helper. App metadata alone does not identify the installation owner, offered update, running version or channel. The agent must independently establish those facts, and must not invent Tern CLI update commands.

## Settings and ownership

In this dotfiles configuration, Home Manager links the shared `home/.config/tern/settings.json` preferences file, not the Tern app or its daemon, account and agent state. If the live preferences file has replaced its link, compare it with the repository source first and preserve the latest portable preferences. Machine-specific paths, dimensions and secrets are not blindly copied. Preserve existing backups, including collisions under unique timestamped names, and do not force a link or run an unrelated rebuild.

See [Tern settings](../../../../../docs/terminals-herdr.md#tern-설정) for the local Home Manager arrangement. The product's official pages are [Stencil Tern](https://stencil.so/tern), its [documentation](https://docs.stencil.so/tern), and its [build page](https://build.stencil.so/tern). Same-name products are not interchangeable sources.

## Install outside dotfiles

A skill-aware agent can install the leaf directory `home/.agents/skills/handmade/tern-update` from `heecheon92/dotfiles`. Alternatively, with the Codex bundled installer:

```sh
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/tern-update
```

The repository's Home Manager selection links the skill; it does not install Tern. Refresh skill discovery in the agent if required. A standalone copy has its own checkpoint unless deliberately shared; it is not automatically synchronized with the dotfiles copy.
