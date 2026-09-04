# Agent skills

Portable, reviewed agent skills maintained in this dotfiles repository. Each
skill is self-contained under `home/.agents/skills/<name>/` and can be installed
without adopting the rest of the dotfiles configuration. Curated upstream
skills retain their source metadata in `home/skills-lock.json`.

## Install with an agent

Ask a skill-aware coding agent to install the selected directory from GitHub.
For example:

```text
Install the `documentation-lifecycle` skill from GitHub repository
`heecheon92/dotfiles`, path
`home/.agents/skills/documentation-lifecycle`.
```

Replace the skill name and path with one of the entries below. The agent should
use its supported skill installer and report the installed destination. Start a
new agent turn or session if the harness discovers skills only at startup.

## Install with the Codex bundled installer

Run one command per skill:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/documentation-lifecycle
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/lantern
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/gpt
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/omp-update
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/create-readme
```

## Available skills

### documentation-lifecycle

Establishes, audits, compacts, or checks an opinionated project documentation
lifecycle. It provides a canonical roadmap structure, durable completion
records, Hot/Warm/Cold document classes, and a task-aware documentation router
so agents load only necessary context.

Invoke explicitly when desired:

```text
$documentation-lifecycle
```

### lantern

Human-invoked, intent-first requirements clarification with one-question-at-a-
time interviewing, ambiguity scoring, assumption pressure, explicit non-goals,
decision boundaries, and testable acceptance criteria. It never starts through
implicit model selection.

```text
$lantern --standard <topic>
```

See the [English](./lantern/README.md) and
[Korean](./lantern/README.ko.md) guides.

### gpt

Explicit-only adversarial review through an authenticated ChatGPT browser
session. The invoking agent sends a focused, sanitized evidence packet and then
verifies material findings against the current repository, diff, commands, and
tests.

```text
$gpt review this implementation before I commit
```

### omp-update

Audits and applies OMP core updates as brownfield migrations. It compares the
release range against active configuration, asks only about material behavior
changes, updates the declarative source of truth, and verifies the resulting
runtime.

```text
$omp-update
```

### create-readme

Creates a concise, well-structured project README after reviewing the complete
workspace. This curated copy comes from GitHub's
[`awesome-copilot`](https://github.com/github/awesome-copilot) repository.

Update the vendored copy and its source lock from the repository root with:

```bash
cd home
npx skills update create-readme --yes
```

## Other agent harnesses

If a harness does not support the Codex installer, copy the selected skill
directory into that harness's documented user or project skill directory. Keep
the complete directory so `SKILL.md`, `agents/`, `references/`, and other skill
resources remain together.

This repository stores only portable, reviewed skill sources. Credentials,
authentication state, sessions, generated caches, and machine-local runtime
state must remain outside the repository.
