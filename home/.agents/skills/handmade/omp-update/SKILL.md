---
name: omp-update
description: "Use when checking or installing OMP updates to explain new features and changed user workflows alongside a safe migration of effective settings, agents, skills, hooks, and declarative config, asking only for material decisions."
---

# Purpose

Guide an OMP update through two equally important tracks: **feature/workflow briefing** and **safe configuration migration**, not a blind binary replacement. Review the exact release range, teach the user what changed and how to use it even when no local edit is needed, compare it with active configuration, collect material decisions one at a time, apply approved migration to the real source of truth, update OMP, and verify effective behavior. Success requires both a useful briefing and a safe migration.

This skill borrows Lantern's interaction qualities—evidence before questions, one focused decision per round, bounded options with consequences, pressure-testing, and explicit acceptance criteria—but it does not invoke or chain into Lantern. This is an implementation workflow, not a general requirements interview.

# User experience

Optimize for convenience without suppressing decisions that can materially change behavior. The default flow is:

```text
Discover → Release ledger → Feature/workflow briefing + Local-impact triage
         → Ask only material decisions → Plan preview → Apply → Reconcile
         → Features and workflow changes + Impact-sorted configuration outcomes
```

Keep the user-facing status compact:

```text
OMP 18.1.4 → 18.1.5
Needs decision: 1 · Auto-resolved: 2 · Notify only: 14
Highest impact: Removed designer role
```

Do not make the user read the full changelog, approve routine facts, or answer questions that local inspection can resolve. Give concise, actionable feature explanations instead; lack of an enabled setting is not a reason to omit a feature.

Invocation determines execution authority:

- `$omp-update`, `update OMP`, or equivalent explicit update wording authorizes the stable core update plus safe auto-resolved configuration maintenance. Do not ask for a redundant final confirmation.
- `audit`, `check`, or `review the update` is read-only. Report impact without editing or updating.
- If intent is genuinely ambiguous between audit and execution, ask one intent question before mutation.
- Plugin updates, canary switches, destructive removal of user-authored extensions, and unrelated Home Manager activation are not implied by core-update authorization.

Deterministic changes skip interaction but remain visible:

- internal or nonactionable fixes,
- additive optional features the user has not enabled,
- release-documented automatic migrations with unchanged semantics,
- removal of an exact stale config entry that has no active caller or workflow and only one supported outcome,
- mechanical schema normalization with no behavior change.

Show automatic edits under `Handled automatically` and no-edit items under `Notification only`. Notification-only means no approval or configuration edit is required, not that explanation is optional. Explain user-facing changes in the feature briefing and report their migration outcomes separately; only internal/nonactionable fixes may be grouped as counts. Never turn notification into a confirmation question.

There is no unattended destructive mode: material decisions and actions outside the explicit update authority still require the user.

# Safety contract

- Treat `omp update --check` as authoritative for the target offered on the current channel. GitHub `latest` may be ahead of the updater.
- Default to `stable`. Never switch to canary unless explicitly requested.
- Never run `omp update`, `omp update --plugins`, overwrite agent exports, or mutate configuration before an exact plan preview. An explicit core-update invocation supplies execution authority for the stable core update and safe auto-resolved maintenance; material decisions and out-of-scope actions still require explicit choices.
- Keep core and plugin updates separate.
- Never edit `/nix/store`, Home Manager output links, caches, databases, session history, memories, generated files, or package-manager artifacts.
- Resolve and edit the declarative source of truth. A symlink into `/nix/store/...home-manager-files...` is evidence that its source must be found in Home Manager/Nix configuration.
- Never expose credentials or copy auth state into reports.
- Preserve unrelated dirty work. Do not commit, push, or activate unrelated configuration unless requested.
- Remove obsolete configuration cleanly. Never invent a compatibility alias for a removed key, role, agent, or command unless target-version documentation explicitly defines one.

# Phase 1: establish the exact update boundary

Inspect the installed CLI because update syntax and configuration evolve:

```bash
omp --version
omp update --help
omp update --check
omp config get update.channel
omp config path
```

Record:

- current version,
- updater-offered target version,
- active update channel,
- active profile when applicable,
- current working directory,
- presence of project-local `.omp` configuration.

If no update is offered, stop after reporting that fact unless the user explicitly requests a current-version audit.

# Phase 2: build the release ledger

Read every official release in `(current, target]`:

- `https://github.com/can1357/oh-my-pi/releases`
- `https://api.github.com/repos/can1357/oh-my-pi/releases/tags/v<VERSION>`
- each release's `Full Changelog` link and target-version docs/source when behavior, syntax, or migration detail is missing.

Normalize changes into:

1. removed or renamed settings,
2. removed or renamed model roles and agent types,
3. automatic migrations claimed by OMP,
4. changed defaults and semantics,
5. provider, authentication, model-catalog, and routing changes,
6. task runtime, skills, hooks, extensions, MCP, LSP, browser, and tool changes,
7. session, storage, memory, and database changes,
8. plugin compatibility,
9. internal/nonactionable fixes,
10. introduced, changed, renamed, or removed user-facing commands, hotkeys, keywords, and composer triggers.

Maintain a coverage row for every item in category 10 across `(current, target]`, regardless of enabled configuration, plus every other substantial user-facing feature. Record version/change status, evidence link, user-visible behavior, usage example, prerequisites/restrictions, local impact, decision status, and verification state. No-local-impact does not remove a row from briefing coverage.

Label every material statement as an explicit release/documentation/source fact, local observation, or inference. Verify exact syntax, gestures, defaults, and limitations against docs/source for the offered target version, not an unversioned latest page or older installed runtime. Keep documented behavior distinct from observed local behavior.

For changed or removed workflows, record before/after behavior, what remains supported, and supported user-driven alternatives with their semantic differences. Do not invent removal rationale or equivalent replacements. When a relevant alternative predates the reviewed range, label it `Pre-existing — introduced in <verified version>` or `Pre-existing — introduction unverified`; inspect only enough earlier evidence to explain the alternative, not an exhaustive historical audit.

# Phase 3: inspect active local state

Start with OMP's resolved configuration:

```bash
omp config list --json
omp config get modelRoles --json
omp config get retry.fallbackChains --json
omp config get task.agentModelOverrides --json
```

Missing keys are normal. Re-read relevant `--help` and installed `omp://` documentation rather than assuming old schemas still apply.

Inspect only active customization surfaces:

- global/profile config,
- project `.omp/config.yml` overlays,
- declarative dotfiles, Home Manager, or Nix sources,
- user and project agent definitions,
- managed and user-authored skills,
- hooks and extensions,
- MCP configuration,
- active `AGENTS.md` instructions naming changed runtime concepts,
- active keybindings/keymap and terminal/platform bindings for affected gestures; record the actual local binding, or explicitly state it could not be observed.

Exclude session transcripts, memories, caches, blobs, logs, databases, backups, and archived artifacts. Historical text is not active configuration and must not be deleted as migration cleanup.

To inspect bundled agents, use current CLI help and unpack only into a new temporary directory. Never run `omp agents unpack --force` against an active user or project directory during discovery.

# Phase 4: resolve ownership and precedence

For each detected reference, identify:

- effective resolved value,
- source layer,
- writable source file,
- whether it is generated or declarative,
- precedence relative to other definitions.

Classify ownership:

- OMP-managed runtime setting,
- user-global source,
- named-profile source,
- project-local overlay,
- Home Manager/Nix/dotfiles source,
- generated read-only output,
- inactive historical artifact.

When the effective file is a symlink into `/nix/store`, locate the corresponding declarative source. Do not patch the symlink or store target. If several possible owners exist and repository evidence cannot resolve them, ask one ownership question before planning edits.

# Phase 5: produce the impact summary

Before asking migration questions, present both tracks:

## Feature/workflow briefing

Cover every ledger command, hotkey, keyword, and composer trigger introduced, changed, renamed, or removed in the reviewed range, including optional/disabled features, and explain other substantial user-facing features. For each, give a concise:

- **Version/status + what/why/when:** what it does or changes, its user benefit, and when to use it.
- **Usage:** target-verified syntax or gesture and a concrete example; for a removal, show the old workflow as removed and a supported after-path, or explicitly state no supported alternative was found.
- **Boundaries:** defaults, prerequisites, and supported surfaces (CLI, composer, tool/API, platform); for hotkeys, distinguish the documented default from the actual local keymap.
- **Tradeoffs/evidence:** important cost, permission, context/session, and model-selection differences; source links and observed versus untested status. State unknowns instead of guessing.

For changed/removed workflows, explicitly say what remains supported and whether an alternative requires the user, rather than the assistant/tool, to initiate it. Do not activate features, download dependencies, or issue model requests merely to demonstrate them.

## Local migration impact

Show locally relevant configuration rows separately:

| Release change | Active local reference | Writable source | Severity | Proposed action |
|---|---|---|---|---|

Score two independent axes for every ledger item; local intersection controls migration work, not briefing inclusion.

Impact, sorted high to low:

- `Critical`: security, data loss, credential exposure, or update-blocking incompatibility.
- `High`: removed capability, broken active workflow, invalid active schema, or material behavior change.
- `Medium`: changed default, routing, provider, performance, or UX behavior with bounded consequences.
- `Low`: mechanical cleanup, harmless stale entry, minor fix, or optional feature.
- `Informational`: no active local intersection or verification-only note.

Decision status:

- `Needs decision`: multiple supported outcomes have meaningful tradeoffs or authority is missing.
- `Auto-resolved`: one safe supported action exists inside the authorized update scope.
- `Notify only`: no approval or local change is needed; user-facing explanation is still required.
- `Verify after update`: target-runtime evidence is required.

A high-impact fact does not automatically require a question when it has no local intersection. A low-impact edit must not be hidden merely because it was automatic. Only internal/nonactionable fixes may be summarized by count, never user-facing features, commands, hotkeys, keywords, or composer triggers. Show all automatic local edits in the plan and lead the decision queue with the highest-impact unresolved decision.

# Phase 6: run the interactive decision queue

First apply this decision gate. Ask only when at least one condition holds:

- two or more supported outcomes have meaningfully different behavior,
- security, privacy, credentials, cost, destructive scope, or workflow ownership changes,
- a removed capability has active callers and removal versus replacement is a real choice,
- preserving an old default versus adopting the new default changes observable behavior,
- the writable source of truth or configuration precedence is ambiguous,
- the action is outside explicit core-update authority, including plugins or canary,
- the user must choose to defer an update with known risk.

Skip interaction for deterministic items classified as `Auto-resolved` or `Notify only`, including optional features needing no local edit. Notification and feature explanation are mandatory; consent theater is not. A feature's availability or hypothetical cost alone does not require a question unless choosing or enabling it is a material decision within the requested scope.

For actual decisions, use OMP's `ask` tool when callable. Otherwise use a plain-chat fallback. Ask exactly one primary decision per round even though `ask` accepts multiple questions.

Each round must:

- use a stable question id,
- use a short header such as `Decision 1 · Required`,
- state the release fact and detected local impact,
- offer 2–3 concrete, mutually exclusive options,
- put consequences in option descriptions,
- mark a recommendation only when a genuine conservative default exists,
- preserve OMP's automatic custom-answer path,
- include an exact or representative config diff in `preview` when useful,
- never repeat the question in prose before or after the tool call.

Do not use a fixed questionnaire. Always ask about the highest-severity unresolved item. Continue on the same issue until its replacement, boundary, and verification are clear.

Recommended option pattern for a removed capability:

1. `Remove stale entries` — delete references with no supported runtime meaning.
2. `Map the workflow` — rewrite active instructions to a currently supported agent whose semantics fit; never create an alias implicitly.
3. `Defer the update` — keep the current version while the user investigates alternatives.

Pressure-test at least one consequential decision. Example: if the user maps a removed read-write design agent to a read-only reviewer, point out that implementation work would no longer be possible and ask whether that is intended.

If a tool result indicates timeout auto-selection, do not treat it as an explicit decision. Retry through chat or leave it unresolved. Cancellation stops the migration and yields a partial report without mutation.

# Phase 7: crystallize the migration plan

After the decision queue is empty, show:

```text
Migration plan
├─ Pre-update edits
├─ OMP update
├─ Post-update reconciliation
├─ Verification
└─ Rollback
```

List exact files, keys, commands, and expected effective values. Separate:

- edits compatible with both versions,
- changes requiring the target schema,
- migrations OMP claims to perform automatically,
- plugin work requiring separate approval.

Define observable acceptance criteria and show all automatic local edits under `Handled automatically`.

Execution behavior:

- If the user explicitly invoked a core update and every material decision is resolved, proceed after the plan preview without a redundant final approval.
- If the session was invoked as audit/check/plan-only, stop after the plan.
- If execution intent is ambiguous, ask one final intent question with `Apply stable core update`, `Keep plan only`, and `Revise decisions`.
- Never infer authorization for plugins, canary, destructive user-authored artifact removal, commits, pushes, or unrelated configuration activation.

# Phase 8: apply in two stages

## Pre-update

- Edit only the writable source of truth.
- Keep unrelated settings and user changes intact.
- Validate syntax/evaluation using the configuration repository's documented workflow.
- Capture a sanitized effective-state snapshot for comparison.
- If practical, keep one previous-binary backup; do not claim OMP supports rollback unless verified.

## Update and reconcile

When stable core update execution is authorized and all material decisions are resolved:

```bash
omp update
omp --version
```

Then re-read the new CLI help, config schema, installed docs, supported model roles, task-tool agent list, and model catalog. Apply only approved post-update changes. If Home Manager/Nix owns the config, activate through its documented source workflow rather than editing generated links.

Run `omp update --plugins` only after a separate user choice.

# Phase 9: verify behavior

At minimum:

```bash
omp --version
omp config list --json
omp update --check
```

Verify every affected surface:

- obsolete keys and role names are absent from effective active config,
- model selectors resolve in the refreshed catalog,
- referenced agent types actually exist,
- automatic migrations produced documented new keys,
- affected hooks, extensions, MCP servers, or tools load,
- a short non-destructive smoke path exercises changed behavior where authorized and practical,
- declarative source and effective runtime agree,
- every required user-facing ledger item has its briefing, verified target-version syntax/example, and prerequisites/restrictions covered,
- affected gestures are reconciled with the actual local keymap, distinguishing documented defaults from locally observed bindings.

Do not search historical sessions or memories to prove a migration. Verify active sources and resolved output only. For feature explanations, use target-version docs/source even when runtime exercise is unnecessary or unavailable; label those cases `Documented, not exercised` and unresolved details `Unverified`. Do not enable optional features, download dependencies, grant permissions, or make model requests solely to complete a demonstration. Read-only audits do not mutate or claim post-update runtime verification.

If post-update verification fails, stop additional changes, preserve evidence, and offer the documented rollback or source revert. Never improvise destructive recovery.

# Removed role and agent checklist

When a release removes `<name>`, check active references in:

- `modelRoles.<name>`,
- `retry.fallbackChains.<name>`,
- `task.agentModelOverrides.<name>`,
- custom agent definitions and model selectors,
- active `@<name>` instructions and dispatches,
- skills, hooks, and extensions,
- declarative profile/budget overlays.

For OMP v18.1.5's removal of bundled `designer` and the `designer` model role, the audit must detect and offer removal or intentional workflow migration for:

- `modelRoles.designer`,
- `retry.fallbackChains.designer`,
- `task.agentModelOverrides.designer` when present,
- active `@designer` instructions or dispatches,
- a user-authored custom `designer` definition only after determining whether the target runtime still supports it as a deliberate custom agent.

Do not automatically replace `designer` with `task` or `reviewer`:

- `task` is a general read-write implementation agent.
- `reviewer` is a read-only code review specialist.

Explain the semantic difference and let the user decide how active UI work should be expressed. Do not delete memories or session transcripts that merely mention `designer`.

# Workflow coverage example

Use this bounded checklist when the reviewed range removes a per-call model override and mentions a user-facing command such as `/tan`:

- **Removed per-call argument:** explain the old tool-call surface versus the target schema, which model-selection mechanisms remain supported, and who can select them. Verify before/after facts; do not infer why the argument was removed.
- **Related `^` composer model tag:** verify the user-driven picker/tagging gesture and give a concrete prompt/delegation example; distinguish user-tagged model selection from assistant-selected tool arguments and explain scope/model resolution. Label its original introduction version only when verified, otherwise `Pre-existing — introduction unverified`. It is not new merely because it is discussed in this update.
- **`/tan`:** independently verify version/status and the actual workflow; test the explanation against a concrete example such as `/tan inspect the latest diff for regressions`, not by running it. Check defaults/prerequisites/surface, parent-model inheritance versus explicit selection, copied transcript versus assignment-only context, background completion, and cost/permissions against target evidence. Do not assume it replaces per-call overrides or `^` because all mention models.
- Include all reviewed command/gesture changes even with no config intersection; mark documentation-only examples as unexercised. This is a coverage method, not a fixed catalog of current commands or an instruction to expand the historical range.

# Final report

Include two distinct sections; a successful no-edit update or read-only audit still needs the feature section:

## Features and workflow changes

Give the concise Phase 5 briefing for every required ledger feature/workflow item, with version/status, what/why/when, verified syntax/gesture and example, boundaries/tradeoffs, and evidence/verification state. Clearly label related pre-existing alternatives rather than counting them as additions in the reviewed range. If already fully briefed in this conversation, use a compact recap with exact references instead of repeating the full content; do not collapse user-facing items into counts.

## Configuration and migration outcomes

Sort local configuration changes and outcomes from highest to lowest impact, regardless of discovery or execution order:

1. `Critical`
2. `High`
3. `Medium`
4. `Low`
5. `Informational`

Within each impact level, label each item as `User-decided`, `Auto-resolved`, `Deferred`, `Notification only`, or `No action`. Omit empty impact sections. Minor automatic edits must be reported, not buried. Cross-reference feature entries for workflow details instead of duplicating their full explanations.

Then report concisely:

- version before and after,
- release range reviewed,
- high-to-low configuration impact and outcomes,
- decisions made and why interaction was required,
- automatic changes performed without interaction,
- exact source-of-truth files changed,
- effective-state and smoke verification, separating observed results from documented but unexercised features and unverified details,
- plugin status,
- rollback artifact if created,
- remaining warnings.

# Stop conditions

Stop before mutation when:

- the updater target cannot be determined,
- migration-critical official notes are unavailable,
- writable ownership cannot be resolved,
- a proposed replacement is unsupported by the target,
- unrelated dirty changes make safe declarative edits ambiguous,
- validation needs unauthorized credentials or destructive actions,
- the user cancels, defers, or chooses plan-only mode.
