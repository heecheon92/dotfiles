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

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/termaid
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

### termaid

Renders Mermaid source into Unicode diagrams for direct inclusion in an agent's
response, with optional Rich terminal colors. Uses pinned `uvx` execution rather
than a permanent Termaid installation. Requires uv/uvx and a compatible Python
runtime; the first run may download the runtime and packages into uv's cache.

The skill is harness-neutral and available for both model-selected use and
explicit requests such as:

```text
Use the termaid skill to show this request flow.
```

Harnesses with named skill invocation may also support `$termaid`. There is no
OMP-specific API, hook, or tool dependency. The complete directory includes
[runnable examples for all 18 supported diagram types](./termaid/references/examples.md),
plus verified renderer limitations and guidance for visible response delivery.
Home Manager links it into `~/.agents/skills/termaid`; other harnesses can install
the same directory using their own supported skill mechanism.

### mermaid

Chooses an appropriate visual form, authors diagrams, and verifies their rendered output.
Includes all 31 official Mermaid diagram types (catalog checked 2026-10-02), each with an
adaptable example, recommended use, alternative choice, and common semantic/rendering trap.
Use it for browser/GitHub-style Mermaid graphics; `termaid` serves terminal text output.

```text
$mermaid explain this service request with the most appropriate diagram types
```

Named invocation is harness-specific; “Use the mermaid skill” is also suitable.
Read [the selection catalog](./mermaid/references/catalog.md) and
[renderer guidance](./mermaid/references/rendering.md). The included Python helper validates
and optionally renders examples using an existing Mermaid CLI; it does not install tools.

This is an independently authored, harness-neutral skill maintained separately from upstream
`mermaid-diagrams`. Home Manager declares the link at
`~/.agents/skills/mermaid`; apply a normal dotfiles rebuild to activate a new link. An agent can
also read this repository's `home/.agents/skills/mermaid/SKILL.md` directly before activation.
Other harnesses can install/copy the entire directory through their own skill mechanism.

### Jakub Krehel's interface skills

Vendored from [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills) at
[`d574cc8a576dc24256ad38268b8d03d86724a1b3`](https://github.com/jakubkrehel/skills/tree/d574cc8a576dc24256ad38268b8d03d86724a1b3).
The collection includes:

- `better-interface`: combined interface review using the focused `better-*` skills.
- `better-accessibility`: keyboard, focus, semantics, forms, and screen readers.
- `better-colors`: palettes, semantic tokens, color formats, and contrast.
- `better-layout`: grouping, alignment, spacing, and responsive structure.
- `better-typography`: font choices, sizing, wrapping, and OpenType features.
- `better-ui`: surfaces, icons, transitions, and UI polish.
- `better-writing`: interface labels, errors, confirmations, and other product copy.
- `break`: stress-test a component with reachable scenarios on a temporary page.
- `build-design`: implement a Figma design or reference image.
- `explain-interface`: explain how a website or visual effect was built.
- `interface-review`: review interface changes in a branch, PR, or working tree.
- `state-machine`: render component states on a temporary development page.
- `variant`: explore component alternatives with a visual picker.

### Emil Kowalski's design and animation skills

The [public skill page](https://emilkowal.ski/skill) points to a repository now
named [`emilkowalski/skills`](https://github.com/emilkowalski/skills).
This copy is pinned to
[`e8a175de22ae1e49370fc144c1f3bb9aeedf988d`](https://github.com/emilkowalski/skills/tree/e8a175de22ae1e49370fc144c1f3bb9aeedf988d)
and contains all 14 public skills at that revision:

- `emil-design-eng`: design-engineering and animation guidance.
- `animate`: implement web animations with deliberate timing and easing.
- `animate-expo`: React Native and Expo motion, gestures, and haptics.
- `animation-vocabulary`: describe motion precisely when directing an agent.
- `apple-design`: Apple interface and motion principles adapted for the web.
- `ask-sonner`: Sonner toast setup, styling, and troubleshooting.
- `break-ui`: stress-test interfaces with difficult content and data.
- `find-animation-opportunities`: identify useful motion without over-animating.
- `improve-animations`: audit motion and produce prioritized implementation plans.
- `mobile-native`: improve the native feel of mobile web interfaces.
- `pick-ui-library`: choose appropriate UI libraries instead of unnecessary custom implementations.
- `prototype`: compare distinct UI implementations through a visual picker.
- `review-animations`: review existing motion against explicit standards.
- `write-swift`: modern Swift types, concurrency, performance, and testing.

### Activating the upstream collections

Both collections are committed sources, not downloads performed at agent startup.
Home Manager declares individual links from `~/.agents/skills/<name>` to this
checkout. On a configured machine, apply `./rebuild.sh` from the repository root
to create the new links, then restart a skill-aware agent to refresh discovery.
On a new machine, first follow the repository's normal Nix/Home Manager bootstrap;
the skill files themselves require no separate `npx skills add` step.

The standalone installation commands above also accept any of these skill names.
Install related skills together when an upstream skill refers to its siblings;
in particular, `better-interface` delegates to the focused `better-*` skills.
Keep bundled reference files and each skill's MIT `LICENSE` with the skill.
The skill text does not install its suggested UI libraries, browser tools, or
language toolchains; those remain prerequisites of the project being worked on.

Upstream explicit-invocation metadata is preserved. Some skills intentionally
create temporary preview routes, write implementation plans, or suggest project
dependency installation when invoked; importing them does none of those things.
Harnesses differ in how they enforce invocation metadata. In particular,
`animate` suggests calling `pick-ui-library`, but the latter is explicit-only:
do not treat a cross-skill suggestion as permission to bypass that restriction.

### Updating the pinned collections

The initial imports used Skills CLI 1.7.0 from the repository's `home/` directory:

```bash
cd home
npx --yes skills@1.7.0 add \
  https://github.com/jakubkrehel/skills/tree/d574cc8a576dc24256ad38268b8d03d86724a1b3 \
  --skill '*' --agent codex --yes
npx --yes skills@1.7.0 add \
  https://github.com/emilkowalski/skills/tree/e8a175de22ae1e49370fc144c1f3bb9aeedf988d \
  --skill '*' --agent codex --yes
```

For an update, inspect the new upstream revision first, replace the corresponding
SHA in the command, and review both the imported files and generated
`home/skills-lock.json`. Do not hand-edit the lock's hashes. Each entry records
the upstream skill contents; the additional redistribution `LICENSE` is not part
of that upstream hash. The installer may replace entire directories, so restore
the repository-root MIT `LICENSE` from the same upstream revision into **every**
imported skill directory afterward.

Reconcile added or removed skill names with `home.nix` and this catalog; do not
silently remove a skill that still has callers. Update the recorded revisions,
check local resource links, run `npx --yes skills@1.7.0 list --agent codex --json`
from `home/`, and evaluate both Home Manager host configurations before the normal
rebuild. Do not use a global install/update command to replace these managed links.

## Other agent harnesses

If a harness does not support the Codex installer, copy the selected skill
directory into that harness's documented user or project skill directory. Keep
the complete directory so `SKILL.md`, `agents/`, `references/`, and other skill
resources remain together.

This repository stores only portable, reviewed skill sources. Credentials,
authentication state, sessions, generated caches, and machine-local runtime
state must remain outside the repository.
