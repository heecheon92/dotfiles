# Agent skills

Portable, reviewed agent skills maintained in this dotfiles repository. Sources
are grouped by ownership and upstream collection; each leaf skill directory is
self-contained and can be installed without the rest of the dotfiles configuration.
Curated upstream skills retain their source metadata in `home/skills-lock.json`.

```text
home/.agents/skills/
├── README.md
├── handmade/
│   ├── <skill>/
│   └── nextjs-react/
│       ├── frontend-patterns/
│       └── react-ui-ux/
└── external/
    ├── jakubkrehel/<skill>/
    ├── emilkowalski/<skill>/
    └── github-awesome-copilot/create-readme/
```

Home Manager links only selected leaf skills to the unchanged flat destination
`~/.agents/skills/<skill>`. Do not link the category directories into that runtime
root: OMP's normal discovery expects immediate skill children, not this nested
source layout. Moving a selected source directory requires updating its path in
`home.nix` and rebuilding to retarget the managed link; until then, the old link
can be broken. Do not add aliases at the old repository paths to hide a pending
activation.

## Default installation policy

Dotfiles is the source registry; the `selectedAgentSkills` map in
[`home.nix`](../../../home.nix) is the explicit default installation allowlist.
Each entry maps a flat runtime skill name to its relative grouped source path.
The seven defaults are:

- `chatgpt-review` → `handmade/chatgpt-review`
- `lantern` → `handmade/lantern`
- `documentation-lifecycle` → `handmade/documentation-lifecycle`
- `omp-update` → `handmade/omp-update`
- `mermaid` → `handmade/mermaid`
- `termaid` → `handmade/termaid`
- `create-readme` → `external/github-awesome-copilot/create-readme`

The remaining 29 skills stay available in this registry for deliberate standalone
or project installation, but are not globally linked by Home Manager. Adding a
source to the registry does not install it automatically, even after a rebuild.
To change the default set, add or remove entries in `selectedAgentSkills`, then
run the normal `./rebuild.sh` from the repository root and restart skill-aware
agents if needed to refresh discovery.

Deselection removes only the previously Home Manager-managed runtime link on
activation; it does not delete the source directory from dotfiles. Machine-local,
project-local, and plugin-provided skills are outside this allowlist and remain
unaffected.

## Skill ownership and sources

This is the human-maintained source registry for the skills checked into this
repository, not an inventory of every skill installed on a machine. The lists
below cover all 36 registered skills: 8 handmade and 28 externally imported.

### Handmade skills

These skills are authored and maintained here. Edit their checked-in directories;
do not replace them through a marketplace update. References to external tools
or documentation inside a handmade skill are not its installation source.

- [`chatgpt-review`](./handmade/chatgpt-review/SKILL.md)
- [`lantern`](./handmade/lantern/SKILL.md)
- [`mermaid`](./handmade/mermaid/SKILL.md)
- [`omp-update`](./handmade/omp-update/SKILL.md)
- [`termaid`](./handmade/termaid/SKILL.md)
- [`documentation-lifecycle`](./handmade/documentation-lifecycle/SKILL.md)
- [`frontend-patterns`](./handmade/nextjs-react/frontend-patterns/SKILL.md)
- [`react-ui-ux`](./handmade/nextjs-react/react-ui-ux/SKILL.md)

The `handmade/nextjs-react/` pair contains personal, opinionated patterns developed
across projects. Dotfiles owns these copies; they are not marketplace imports and
are intentionally excluded from `home/skills-lock.json`. Maintain them here and
adopt changes into individual projects deliberately.

### Externally imported skills

| Skills | Upstream source | Import record | Update procedure |
| --- | --- | --- | --- |
| [Jakub Krehel's 13 skills](#jakub-krehels-interface-skills) | [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills), `skills/<name>/` | Commit-pinned entries in `home/skills-lock.json` | [Stage the collection](#jakub-krehel), then [review and apply](#review-and-apply-the-staged-import) |
| [Emil Kowalski's 14 skills](#emil-kowalskis-design-and-animation-skills) | [`emilkowalski/skills`](https://github.com/emilkowalski/skills), `skills/<name>/`; linked from [the author's skill page](https://emilkowal.ski/skill) | Commit-pinned entries in `home/skills-lock.json` | [Stage the collection](#emil-kowalski), then [review and apply](#review-and-apply-the-staged-import) |
| [`create-readme`](#create-readme) | [`github/awesome-copilot`](https://github.com/github/awesome-copilot) | Source, path, and content hash in `home/skills-lock.json`; no commit recorded | [Update this skill only](#create-readme) |

The collection sections enumerate their individual skills and imported commits.
[`home/skills-lock.json`](../../skills-lock.json) is installer-managed provenance
for external imports, not a list of handmade skills. Preserve the recorded
repository, skill path, revision when present, and content hash; let the supported
installer update it rather than editing generated hashes by hand.

### Update rules

- Read the upstream changes and installation guidance before updating. A pinned
  revision is the installed baseline, not a command to track the latest version.
- Import only the intended external skill or collection into a temporary staging
  directory, then replace its reviewed source directories as described below.
  Skills CLI installs flat paths and cannot maintain this grouped layout directly.
  Do not run it in `home/` or against live Home Manager links.
- Keep upstream skill files, companion resources, and invocation metadata
  together. Preserve redistribution licenses as described below. If a local
  adaptation becomes necessary, document it here before a later update replaces it.
- When adding or removing a registered skill, reconcile this registry, the
  detailed catalog, and generated lockfile where applicable. Change
  `selectedAgentSkills` in `home.nix` only when deliberately changing the default
  installation set or a selected source path. Inspect the diff and verify
  discovery when activating changed links.

## Install with an agent

Ask a skill-aware coding agent to install the selected directory from GitHub.
For example:

```text
Install the `documentation-lifecycle` skill from GitHub repository
`heecheon92/dotfiles`, path
`home/.agents/skills/handmade/documentation-lifecycle`.
```

Use the full grouped source path for the selected skill. The agent should
use its supported skill installer and report the installed destination. Start a
new agent turn or session if the harness discovers skills only at startup.

## Install with the Codex bundled installer

Run one command per skill:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/documentation-lifecycle
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/lantern
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/chatgpt-review
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/omp-update
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/external/github-awesome-copilot/create-readme
```

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/handmade/termaid
```

## Available skills

### Personal Next.js and React patterns

- **`frontend-patterns`** provides conditional implementation patterns for locale
  routing, authentication, forms, queries, mutations, dates, and uploads. It adapts
  to the target project's contracts rather than importing product requirements.
- **`react-ui-ux`** defines responsive initial paint, stable async boundaries,
  skeletons, overlays, server-state freshness, draft protection, and accessibility.

Neither skill is in the default installation allowlist. Install both leaf
directories from `handmade/nextjs-react/` deliberately when using them together.
Their installed names remain `frontend-patterns` and `react-ui-ux`;
`nextjs-react` is an organizational directory, not another skill.

```text
Use frontend-patterns and react-ui-ux to implement this Next.js settings screen
using the project's existing API, authorization, localization, and design rules.
```

Read the [frontend-patterns guide](./handmade/nextjs-react/frontend-patterns/README.md)
and [react-ui-ux guide](./handmade/nextjs-react/react-ui-ux/README.md) for scope and
examples. These skills do not require other marketplace skills to be installed.

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

See the [English](./handmade/lantern/README.md) and
[Korean](./handmade/lantern/README.ko.md) guides.

### chatgpt-review

Explicit-only second-opinion review through an authenticated ChatGPT web session,
using the Codex in-app browser when available. Codex's coding environment and a
ChatGPT chat tab are distinct review contexts even when model labels match;
a local subagent or API model call is not a substitute.

The workflow defaults to the web `Pro` option, reflecting the user's experience
with its ability to interpret human intent, identify problems, and suggest
solutions—not a guarantee that its conclusions are correct. The invoking agent
sends a focused, sanitized evidence packet and verifies material findings against
the current repository, diff, commands, and tests. Invocation remains explicit;
installing or testing discovery never sends a review request.

```text
$chatgpt-review review this implementation before I commit
```

### omp-update

Audits and applies OMP core updates through equally important feature/workflow
briefing and safe brownfield migration. It explains every command, hotkey, keyword,
and composer-trigger change in the reviewed range plus other substantial features,
even without enabled config, using verified usage examples and clear limitations.
It separately compares active configuration, asks only material decisions, updates
the declarative source of truth, and verifies runtime within the authorized scope;
notification-only means no approval or edit, not an omitted explanation.

```text
$omp-update
```

### create-readme

Creates a concise, well-structured project README after reviewing the complete
workspace. This curated copy comes from GitHub's
[`awesome-copilot`](https://github.com/github/awesome-copilot) repository.

Its local source directory is `external/github-awesome-copilot/create-readme/`.
Use the [staged import workflow](#updating-external-skills) below with only
`--skill create-readme`; do not run an in-place marketplace update.

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
[runnable examples for all 18 supported diagram types](./handmade/termaid/references/examples.md),
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
Read [the selection catalog](./handmade/mermaid/references/catalog.md) and
[renderer guidance](./handmade/mermaid/references/rendering.md). The included Python helper validates
and optionally renders examples using an existing Mermaid CLI; it does not install tools.

This is an independently authored, harness-neutral skill maintained separately from upstream
`mermaid-diagrams`. Home Manager declares the link at
`~/.agents/skills/mermaid`; apply a normal dotfiles rebuild to activate a new link. An agent can
also read `home/.agents/skills/handmade/mermaid/SKILL.md` directly before activation.
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

Both collections are committed registry sources, not downloads performed at agent
startup, and neither collection is globally linked by default. To select skills
for Home Manager installation, add their names and grouped source paths to
`selectedAgentSkills` in `home.nix`, then apply `./rebuild.sh` from the repository
root and restart a skill-aware agent to refresh discovery. A rebuild alone does
not install unselected collection skills.
On a new machine, first follow the repository's normal Nix/Home Manager bootstrap;
selected skill files require no separate `npx skills add` step.

Use `external/jakubkrehel/<name>` or `external/emilkowalski/<name>` in the
standalone installer's source path; the installed skill name remains unchanged.
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

### Updating external skills

Skills CLI 1.7.0 writes to `<cwd>/.agents/skills/<name>` and keeps one
`skills-lock.json` at `<cwd>`. Its lock's `skillPath` is an **upstream** path, not
the local grouped destination. Keep the existing full lock and use staging so
an import cannot flatten this checkout or overwrite handmade skills.

From the repository root, prepare a fresh staging directory:

```bash
repo="$PWD"
stage="$(mktemp -d)"
cp "$repo/home/skills-lock.json" "$stage/skills-lock.json"
```

Run **one** of these imports in that same shell. For an update, replace a pinned
SHA with the reviewed upstream commit; the commands shown for Jakub and Emil
reimport the currently recorded revisions, not the latest versions.

#### Jakub Krehel

```bash
(cd "$stage" && npx --yes skills@1.7.0 add \
  https://github.com/jakubkrehel/skills/tree/d574cc8a576dc24256ad38268b8d03d86724a1b3 \
  --skill '*' --agent codex --yes)
```

Destination: `home/.agents/skills/external/jakubkrehel/<name>/`.

#### Emil Kowalski

```bash
(cd "$stage" && npx --yes skills@1.7.0 add \
  https://github.com/emilkowalski/skills/tree/e8a175de22ae1e49370fc144c1f3bb9aeedf988d \
  --skill '*' --agent codex --yes)
```

Destination: `home/.agents/skills/external/emilkowalski/<name>/`.

#### GitHub awesome-copilot

```bash
(cd "$stage" && npx --yes skills@1.7.0 add \
  https://github.com/github/awesome-copilot \
  --skill create-readme --agent codex --yes)
```

Destination: `home/.agents/skills/external/github-awesome-copilot/create-readme/`.
This command follows the upstream default branch. Use a reviewed `/tree/<commit>`
source URL instead when a pinned revision is desired.

#### Review and apply the staged import

1. Inspect `$stage/.agents/skills/` and the generated `$stage/skills-lock.json`.
   Confirm only the intended source's entries changed and unrelated lock entries
   remain intact. Do not merge generated lock fragments or hand-edit their hashes.
2. For Jakub and Emil, restore the repository-root MIT `LICENSE` from the selected
   upstream revision into **every** staged skill directory. These redistribution
   copies are additional to the upstream skill contents covered by the lock hash.
3. Replace only the reviewed skill directories in the appropriate destination
   above with their staged counterparts. Replace whole skill directories rather
   than merging files, so obsolete companion resources do not survive. Never copy
   the staging `.agents/skills` root wholesale into the repository or the live home.
4. Copy the complete generated `$stage/skills-lock.json` back to
   `home/skills-lock.json`. An upstream skill disappearing does not authorize
   automatic removal: resolve its callers and remove its lock entry through the
   installer's supported removal command in staging before copying the lock back.
5. Reconcile added or removed skills with this registry and the collection lists
   and revisions above. Review `selectedAgentSkills` in `home.nix` separately:
   update it only for an intentional default-set change or a selected source-path
   change, not automatically for new registry entries. Review the diff and local
   resource links.
   Verify the staged flat inventory with:

   ```bash
   (cd "$stage" && npx --yes skills@1.7.0 list --agent codex --json)
   ```

6. Evaluate both Home Manager host configurations. Rebuild when selected link
   targets or allowlist membership change, then restart skill-aware agents.
   Finally remove the disposable staging directory. Do not run blanket/global
   skill updates.

The staging inventory describes the selected import, not all grouped repository
sources or the global installation set. This registry covers the sources;
`selectedAgentSkills` in `home.nix` defines the Home Manager-managed skill links.

## Other agent harnesses

If a harness does not support the Codex installer, copy the selected skill
directory into that harness's documented user or project skill directory. Keep
the complete directory so `SKILL.md`, `agents/`, `references/`, and other skill
resources remain together.

This repository stores only portable, reviewed skill sources. Credentials,
authentication state, sessions, generated caches, and machine-local runtime
state must remain outside the repository.
