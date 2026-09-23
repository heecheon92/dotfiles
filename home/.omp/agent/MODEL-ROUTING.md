# OMP model roles and agent routing

**Human configuration reference — not agent instructions.**

- Reviewed: **2026-09-23**.
- Latest stable version verified: **OMP 18.2.11**, using both `omp update --check` and the official release tag.
- Scope: built-in roles, bundled agents, model catalogs, delegation, background execution, and configuration precedence.
- Maintenance: refresh this document **only when requested**. Replace outdated descriptions with the newly verified behavior; do not append release history, migration diaries, or old inventories. This is a snapshot of the version above, not a promise about future releases.
- This guide does not change model assignments. The neighboring YAML files remain the configuration sources of truth.

## Contents

- [The short answer](#the-short-answer)
- [The configuration layers](#the-configuration-layers)
- [All built-in model roles](#all-built-in-model-roles)
- [Built-in models versus the live catalog](#built-in-models-versus-the-live-catalog)
- [All bundled agent types](#all-bundled-agent-types)
- [How the main agent normally delegates](#how-the-main-agent-normally-delegates)
- [How a worker gets its model](#how-a-worker-gets-its-model)
- [Thinking, prewalk, and advisors](#thinking-prewalk-and-advisors)
- [Background execution and context](#background-execution-and-context)
- [Practical configuration recipes](#practical-configuration-recipes)
- [Inspection and troubleshooting](#inspection-and-troubleshooting)
- [How to refresh this reference](#how-to-refresh-this-reference)
- [Version-pinned sources](#version-pinned-sources)

## The short answer

The main agent usually chooses an **agent type**, not a separate model role on every spawn.

For example, when it selects `scout`:

1. OMP looks for `task.agentModelOverrides.scout`.
2. Without that override, the bundled scout definition requests `@smol`.
3. `@smol` resolves through `modelRoles.smol` and the applicable resolution rules.
4. OMP starts a child session with the scout's instructions/tools and the resolved model.

The main agent decides **what work to delegate and which kind of worker fits**. Your configuration and the runtime determine **which model that worker actually uses**.

Keep these concepts separate:

- **Model:** a concrete provider/model selector, such as `openai-codex/gpt-6-sol`.
- **Model role:** a reusable routing name, such as `smol`, `task`, or a custom `research` role.
- **Agent type:** a worker definition containing instructions, tools, and default model selection, such as `scout` or `reviewer`.
- **Agent instance:** one actual spawned worker, with its own assignment, model, context, and lifecycle.
- **Thinking level:** reasoning effort, not a model or agent type. A selector can include a suffix such as `:high`.
- **Background job:** how work is scheduled and reported. Background execution does not itself select a cheaper model.

Changing the model assigned to `sonic` does not turn it into a reviewer. Changing `modelRoles.task` does not remap every subagent.

## The configuration layers

In this repository:

- [config.yml](config.yml): shared baseline settings and model-role assignments.
- [config-budget.yml](config-budget.yml): the additional overlay loaded by `ob`.
- [config-experimental.yml](config-experimental.yml): the additional overlay loaded by `oe`.
- [models.yml](models.yml): custom model/provider definitions and catalog overrides; this is different from assigning roles.

Effective settings are merged in this order, with later layers winning:

1. Built-in defaults.
2. Global/profile configuration.
3. Project configuration for the working directory.
4. Explicit `--config` overlays, in the order supplied.
5. In-memory runtime overrides, including supported CLI flags.

Objects merge recursively; arrays replace rather than append. An overlay containing a new `cycleOrder` or fallback array replaces the corresponding lower-layer array. A partial `modelRoles` mapping overrides only the roles it names. An omitted setting can still be inherited from the baseline. [Settings][settings]

`omp`, `ob`, and `oe` are not three independent credential stores: the latter two add configuration overlays to the normal invocation. OMP's separate `--profile` feature provides profile isolation when explicitly used.

**Keep credentials local.** This dotfiles setup already sources `~/.config/zsh/local.zsh` for machine-local environment variables. Do not put API keys into this guide, shared YAML, or Nix expressions. Restart OMP after changing the environment it should inherit.

## All built-in model roles

There are **15** canonical roles: **10 chat roles** and **5 specialized roles**. The canonical role registry and capability predicates are authoritative; a shorter list in another documentation paragraph is not an exhaustive inventory. [Registry][role-ids] · [Capabilities][role-capabilities]

### Chat roles

- **`default` — main assistant.** The normal foreground/default chat selection. A session model override can select something else without remapping all other roles.
- **`smol` — fast helpers.** Lightweight work; also the bundled `scout` and `sonic` model route. Display name: **Fast**. The name does not guarantee low cost if you assign an expensive model.
- **`slow` — stronger analysis.** Thorough reasoning and the bundled reviewer's model route. Display name: **Thinking**. It does not automatically force a particular effort level.
- **`vision` — image understanding.** A chat-model slot intended for vision-capable inference, not image generation. The role filter accepts chat models; verify that the selected model/transport actually accepts images.
- **`plan` — planning.** Planning-oriented selection, displayed as **Architect** and configurable with `--plan`. Read-only restrictions come from plan mode, not from this role name.
- **`commit` — commit-related inference.** Used by the commit workflow for commit messages and related diff/changelog analysis. It is not a bundled agent type.
- **`tiny` — lightweight internal inference.** Small helper workloads, such as title generation. Accepts local `tiny` catalog models or ordinary chat models. Other consumers can reach it indirectly through role fallback rather than selecting it directly.
- **`memory` — memory processing.** Memory extraction/consolidation completions. Accepts local tiny models or ordinary chat models; selecting it does not itself enable every memory feature.
- **`task` — general delegated work.** The model route used by the bundled general-purpose `task` agent. It is not a universal override for all workers.
- **`advisor` — second opinion.** An optional model that reviews a primary session's progress and injects advice. Assigning the role alone does not enable an advisor.

### Specialized roles

- **`image` — image generation.** Accepts image-generation catalog models. `vision` understands images; `image` creates them.
- **`web` — web search and grounded answers.** Accepts search runners or chat models with the supported web-search capability.
- **`speech` — text to speech.** Accepts TTS models.
- **`dictation` — speech to text.** Accepts STT/transcription models.
- **`judge` — structured judgments.** Classification, choices, boolean judgments, and scoring. Accepts native judgment models, tiny models, or chat models.

These roles are capability-filtered. Assigning an ordinary chat model to `speech` does not make it a TTS model. Specialized roles do not use chat thinking suffixes.

### Custom roles

Names such as `spark`, `daybreak-blue`, or `research` can be custom roles. They are **not additional built-in agent types**. Define their selectors in `modelRoles`, then reference them as quoted aliases such as `"@research"` in agent routing.

Adding a custom role does not create a new automatic workload, start an agent, or cause the main agent to use it. A consumer must reference it. `cycleOrder` determines the chat-role cycling sequence; it does not define worker routing.

## Built-in models versus the live catalog

OMP ships a provider/model catalog, role priority patterns, and local-inference model definitions. It does **not** ship all hosted model weights or grant access to every listed provider.

The live registry combines bundled entries with cached/discovered provider models, custom `models.yml` definitions, and extensions. Availability also depends on authentication, provider filters, and runner capabilities. Therefore a static list of every model returned on one machine would be misleading and quickly stale. [Model registry][model-registry]

### Inspect the actual catalog

```sh
omp models                              # available chat models
omp models --kind all                   # all available catalog kinds
omp models --kind all --json --no-extensions
omp models find gpt --kind all --no-extensions
omp tiny-models list                     # local tiny registry; no weight download
```

Catalog listing can fetch metadata on a cache miss; it is not a model-weight download. `--no-extensions` excludes extension discovery, not your ordinary model configuration. Use `--config ~/.omp/agent/config-experimental.yml` with `omp models` when you want that overlay's view.

The catalog recognizes `chat`, `tiny`, `image`, `tts`, `stt`, `search`, `judge`, `embedding`, `rerank`, and `video`. Catalog kinds are not role names: there are no built-in `embedding`, `rerank`, or `video` roles in this version. [Catalog types][catalog-types]

### Shipped local model selectors

The finite local catalog includes these **13 selectors**:

- Tiny/title group: `local/lfm2.5-230m`, `local/lfm2.5-350m`, `local/falcon-h1-90m`.
- Tiny/memory group: `local/qwen3-1.7b`, `local/llama3.2:3b`, `local/gemma-3-1b`, `local/qwen2.5-1.5b`, `local/lfm2-1.2b`.
- TTS: `local/kokoro`.
- STT: `local/parakeet-tdt-0.6b-v3`, `local/whisper-base`, `local/whisper-small`, `local/whisper-large-v3-turbo`.

The two tiny groups describe intended workloads; all eight entries have catalog kind `tiny`. A listed local model is not necessarily downloaded or supported by every backend. In particular, the Qwen3 1.7B ONNX export has a known incompatibility in this version; MLX is the supported path for that entry. [Local models][local-models] · [Tiny registry][tiny-registry]

Use **`omp tiny-models list`**, not bare `omp tiny-models`, for inspection: the bare command defaults to downloading the default title model. Actual local inference can also trigger weight download when a selected local model is first used.

### Built-in priority defaults

The shipped priority file has chains for only seven roles:

- **`smol`:** starts with Gemini 3.8 Flash candidates, followed by Spark, GLM Flash, Flash-Lite, Cerebras, Haiku, Luna, and Mini patterns.
- **`slow`:** starts with GPT-5.6 Sol candidates, followed by Fable, Kimi K3, GLM, Opus, and other GPT candidates.
- **`image`:** starts with GPT Image 1 candidates, then supported Gemini, Grok, and FLUX image candidates.
- **`web`:** starts with `web/parallel` and `web/perplexity`, then grounded-chat and other search-provider candidates.
- **`speech`:** `local/kokoro`, then xAI TTS candidates.
- **`dictation`:** `local/parakeet-tdt-0.6b-v3`.
- **`judge`:** `typesafe/jev-latest`, then `@tiny`, `@smol`, and `@default`.

These summaries are not complete ordered chains. The [version-pinned priority file][priorities] contains every candidate and alias. They are compatibility/selection heuristics, not a recommendation that the first name is currently the newest or best model for your account.

Unset-role behavior is not universally “use default”:

- `smol` and `slow` can inherit a configured `default` before their built-in priority paths.
- `tiny` reuses the effective `smol` path; `memory` reuses `tiny` and then the smol priority path.
- `advisor` prefers a configured `slow`, otherwise the slow priority path; it does not simply inherit the current primary model.
- `default`, `vision`, `plan`, `commit`, and `task` have no dedicated `priority.json` arrays. Their callers can have additional selection rules. For example, commit generation tries its commit role and then other chat selections.

`retry.fallbackChains.<role>: []` suppresses that chain's fallback selectors. It does not necessarily prevent an **unset primary role alias** from using role inheritance, and it is not a universal cost or network-isolation boundary. If routing matters, set a concrete primary and explicit fallbacks, then inspect the actual consumer. [Resolver][resolver]

## All bundled agent types

There are **five** bundled definitions. Local/project/plugin definitions can override them, and `task.agentModelOverrides` can override their model choices. [Bundled registry][bundled-agents] · [Discovery][discovery]

- **`scout`:** read-only exploration, broad searches, and compressed research handoffs. Default model: `@smol`; declared thinking: `medium`.
- **`reviewer`:** read-only code review for actionable, evidence-backed bugs introduced by a change. Default model: `@slow`. Its prompt prohibits editing and builds; it can delegate to a scout.
- **`security-reviewer`:** read-only vulnerability discovery, tracing attacker-controlled inputs to broken controls or dangerous operations. No model is specified in its bundled frontmatter, so normal override/parent fallback rules matter.
- **`task`:** full-capability general-purpose worker for implementation and multi-step assignments. Default model: `@task`; declared thinking: `auto`; can delegate subject to runtime guards.
- **`sonic`:** full-tool worker for strictly mechanical updates or data collection. Default model: `@smol`; declared thinking: `medium`. Its narrow job description is not a distinct model family or a hard guarantee of low reasoning cost.

Read-only agent policies are not a substitute for filesystem/process isolation. General workers can edit files and execute commands; use only trusted agent definitions and assignments.

## How the main agent normally delegates

These are the intended working heuristics for this setup, not a deterministic scheduling algorithm:

1. For a small, well-understood change, the main agent may do it directly.
2. For uncertain code locations or broad investigation, it selects `scout`.
3. For a precisely specified mechanical update, it can select `sonic`.
4. For a substantive implementation or multi-step fix, it selects the general `task` worker.
5. For a review, it selects `reviewer`; for vulnerability investigation, `security-reviewer`.
6. Independent assignments can run together. Dependencies and shared-file edits must be coordinated rather than blindly parallelized.

The ordinary task interface carries shared context and per-worker assignments. It includes an `agent` field but **no public per-item `model` field**. An omitted agent normally means `task`; a restricted parent's spawn policy can choose a different default or reject a requested type. The advertised fields can vary with settings and harness adapters. [Task interface][task-tool]

A good assignment includes the goal, constraints, relevant paths, expected output, and what not to change. Children do not automatically know the whole discussion you had with the main agent. Changing models cannot compensate for an assignment that omits essential context.

## How a worker gets its model

### Normal task and eval-agent selection

For ordinary public task calls, the normal precedence is:

1. `task.agentModelOverrides[agentName]`.
2. The discovered agent definition's ordered `model` selection.
3. The parent's active model, then the configured/default fallback.

Role aliases are expanded while resolving those selections. The runtime also checks availability and policy; extension hooks and retry behavior can affect the eventual model. The live resolved model is the final evidence, not the requested alias alone. [Shared policy][shared-policy]

The public eval **`agent()` and `workpool()` also choose an agent type, not an independent model parameter**. They use the shared routing machinery. An internal adapter can supply a model override, but that internal capability is not a public argument you should assume the main agent can use.

A separate supported exception is a **user-tagged model**: the composer model picker (`^`) can register a session-local name such as `m1`. Dispatching that name uses a model-pinned general-purpose task template, not a specialist such as reviewer. [Discovery][discovery]

### Agent-specific overrides and custom agents

Use an agent override when you want the same behavior/tools with another model. Create a custom agent only when its instructions or allowed capabilities should differ.

Discovery precedence is first-wins by exact name: project `.omp/agents`, user `~/.omp/agent/agents`, enabled extension/plugin definitions, then bundled definitions. A custom file named/declaring `reviewer` can shadow the bundled reviewer; avoid accidental collisions.

An ordered selector list means **choose a usable primary**, not “run both models.” Use a comma-separated string, such as `"@slow, @default"`; do not separate aliases with a bare space. Startup selection alternatives are also different from runtime request-retry chains in `retry.fallbackChains`.

### Primary model versus worker advisor

This is not supported two-part syntax:

```yaml
# Incorrect: this is one selector containing an internal space.
task:
  agentModelOverrides:
    security-reviewer: "@daybreak-blue @advisor"
```

If the intent is one primary model **plus** an advisor, use separate controls:

```yaml
# Requires both referenced roles to be defined/available.
task:
  agentModelOverrides:
    security-reviewer: "@daybreak-blue"
  agentAdvisor:
    security-reviewer: "@advisor"
```

If the intent is instead a primary-model alternative, `"@daybreak-blue, @advisor"` is an ordered selection list. It does **not** enable an advisor. These examples explain the syntax; they do not modify your current configuration.

## Thinking, prewalk, and advisors

### Thinking effort is a separate decision

A role/model selector may request a thinking suffix such as `:high`. Agent definitions also have thinking defaults. In particular, the bundled scout/sonic request `medium`, while task requests `auto`; do not infer the actual worker effort solely from the role name.

With `task.enableEffort: true`, the task tool exposes `effort: lo|med|hi`. That is a per-spawn reasoning hint, not a model selection. It maps onto the chosen model's supported levels and overrides the agent's configured thinking selection, capped by `task.maxEffort` (default `max`). This cap is not a token budget or a total-spend limit. Check the resolved worker effort in the UI when tuning cost. [Task interface][task-tool]

The effective precedence is: per-spawn `effort` → explicit `:level` on the resolved model selector → agent thinking default → resolver-derived level, subject to supported-level clamping. A suffix inside a role assignment counts: `modelRoles.smol: "openai-codex/gpt-6-luna:high"` makes a scout/sonic request high rather than its bundled medium default, unless a per-spawn effort hint overrides it. [Execution][executor]

### Prewalk changes the model during work

Prewalk is a one-time handoff: a worker starts on one selection and can switch at its first edit/write after the planning/todo gate is armed. The default target is `@smol`.

- `task.prewalk` applies the generic task behavior; it is off by default.
- `task.agentPrewalk.<agent>` overrides that agent's frontmatter: `"off"`, `"on"`, or a target selector.
- An unavailable target is skipped. A same-model but lower-effort selection can still be a real handoff.

Do not enable prewalk while diagnosing basic routing unless you also want the model to change mid-task. [Prewalk][prewalk]

### Main advisor and child advisors are separate

`advisor.enabled` or `/advisor on` enables the main session's advisor. A spawned worker does not automatically inherit an active advisor: use `task.agentAdvisor.<agent>` or the agent's `advisor` frontmatter to opt it in.

`task.agentAdvisor.<agent>` accepts `"off"`, `"on"`, or an advisor model/role selector. A worker advisor adds another model reviewing that worker; it does not replace the worker's primary model. A `WATCHDOG.yml` roster can additionally provide explicit advisor models, so changing `modelRoles.advisor` may not override every explicitly configured roster entry. [Advisor][advisor]

Service tier is another independent control: `tier.subagent` and per-agent `task.agentServiceTierOverrides` affect supported provider service tiers, not agent type or reasoning effort.

## Background execution and context

### Ordinary subagents

With async execution enabled, non-blocking workers run in the background and their results are delivered later. Synchronous execution waits for the same kind of child session. No bundled agent declares `blocking: true`.

- A child starts with its assignment, supplied context, applicable workspace instructions/tools, and a settings snapshot. It does **not** inherit the complete parent conversation.
- The parent and child are separate model sessions. Changing the main model does not automatically switch already-running workers.
- New/queued spawns resolve current policy at launch; changing a role or agent override can affect later work. Follow-ups to an existing worker are not the same as a fresh spawn.
- Ordinary finished workers can remain idle, then park and be revived with their context. Messaging an existing worker can avoid repeating setup. Isolated runs are not revivable through the normal worker revival path.
- Isolation/worktrees are a separate choice. Background does not imply filesystem isolation.

In this version, headless child sessions use `tools.approvalMode: yolo` because they have no interactive approval UI. Do not assume a child will ask before every edit or command; constrain its tools, spawn policy, assignment, and isolation appropriately. [Execution][executor]

### Different background mechanisms

- **Task tool / eval `agent()`:** ordinary delegated agent sessions using agent definitions and model routing.
- **Eval `workpool()`:** repeated assignments to a worker pool. The pool resolves its policy when created and normally reuses workers/context. It is not a fresh routing lookup for every item; recreate the pool when changing its routing. `eval.workpool.freshAgents` changes reuse behavior.
- **Eval `completion()`:** stateless, tool-free one-shot inference. Its public model choices are `default`, `smol`, and `slow`; `default` prefers the active session model. It does not create a scout/reviewer/task persona.
- **Eval `judge()` / `judge_batch()`:** typed judgment requests through the `judge` role, not reviewer agents or the advisor subsystem.
- **Background eval cells / supervised shell processes:** execution scheduling for code or programs; no model role is selected merely because a process runs in the background.
- **Agent-swarm:** a separately activated orchestration system with its own profiles and inference settings. Ordinary OMP delegation does not automatically use it, and its workers should not be assumed to obey OMP task-agent overrides.

### Cost and concurrency

`task.maxConcurrency` limits simultaneous workers, not total spend. The built-in default is 32; zero means unlimited. `task.maxRecursionDepth` defaults to 2 and limits nested delegation. These are runtime limits, not targets the main agent should try to fill.

A batch of ten workers is ten contexts, not one discounted call. Large shared context is repeated for each child. Advisors, retries, model fallbacks, and one-shot helper calls add their own inference work. Pool reuse saves repeated setup but accumulates context. Naming a role `smol` is not a cost guarantee.

## Practical configuration recipes

Examples are illustrative, not changes made by this guide. Concrete model names below were available during review; recheck your catalog and credentials before adopting them.

### Separate the main model, cheap workers, and review

```yaml
modelRoles:
  default: openai-codex/gpt-6-sol
  smol: openai-codex/gpt-6-luna
  slow: openai-codex/gpt-6-astra
  task: openai-codex/gpt-6-sol
```

Without agent-specific overrides, this routes scout/sonic through Luna, reviewer through Astra, and the general task worker through Sol. Agent thinking defaults and explicit effort choices remain separate.

### Change only one agent type

```yaml
modelRoles:
  research: openai-codex/gpt-6-sol

task:
  agentModelOverrides:
    scout: "@research"
```

This changes scout's model without changing sonic or all other consumers of `smol`.

### Keep a chosen tiny primary local without a configured online fallback

```yaml
modelRoles:
  tiny: local/lfm2.5-230m
  memory: local/lfm2-1.2b

retry:
  fallbackChains:
    tiny: []
    memory: []
```

This explicitly supplies local primaries and no fallback selectors for those chains. It is not a network sandbox for the whole application: other roles/features have their own consumers and routing.

### What to edit for common goals

- Cheaper scouts and mechanical workers together: `modelRoles.smol`.
- Cheaper general implementation workers only: `modelRoles.task`.
- Different code-review model: `modelRoles.slow`, or only `task.agentModelOverrides.reviewer`.
- A dedicated security-review model: `task.agentModelOverrides.security-reviewer`.
- Different foreground assistant: the active model / `modelRoles.default`; do not expect this to replace explicit worker routes.
- A second opinion on a specific worker: `task.agentAdvisor.<agent>`, not another word in its model selector.
- More predictable routing: explicit primary roles, checked selector availability, and deliberate fallback chains; avoid relying on fuzzy names or accidental parent inheritance.

## Inspection and troubleshooting

### Useful human-facing controls

- **`/model` → Roles:** inspect/assign roles separately from the active foreground model.
- **`/agents`:** inspect discovered agent definitions and their model, prewalk, and advisor settings.
- **Agent Hub:** inspect actual running/idle/parked workers, resolved models, usage, and transcripts. **`Ctrl+S`** is a Meta-free opening shortcut; `Alt+A` is another default. `/hotkeys` shows the effective bindings.
- **`/jobs`:** inspect asynchronous jobs; not every job is a model agent.
- **`/advisor status`:** inspect advisor activity.

Role-picker writes follow `modelRoleStorage`: global/profile by default, or project when configured. In this dotfiles setup, global YAML can resolve to repository-managed files; UI/config commands can therefore create Git changes. Inspection does not require saving a new selection. [Settings][settings] · [Agent Hub][agent-hub]

### Targeted CLI inspection

```sh
omp --version
omp update --check
omp config get modelRoleStorage --json
omp config get modelRoles --json
omp config get task.agentModelOverrides --json
omp config get task.agentAdvisor --json
omp config get task.agentPrewalk --json
omp config get task.enableEffort --json
omp config get task.maxEffort --json
omp config get retry.fallbackChains --json
omp models --kind all --json --no-extensions
```

`omp config get` addresses schema keys: inspect `modelRoles` as a record, not `modelRoles.default` as though every nested record entry were a standalone schema setting. To verify an overlay's model availability, use the supported `omp models --config <file>` surface; to inspect its actual session behavior, launch that overlay and check `/model`, `/agents`, and Agent Hub. Do not assume every CLI subcommand accepts or applies `--config`.

### If a worker uses an unexpected model

1. Confirm which launch you used: `omp`, `ob`, `oe`, or a named profile.
2. Check project settings and later overlays; they can override the global file you edited.
3. Check the exact agent type and whether a custom/plugin definition shadows the bundled one.
4. Check `task.agentModelOverrides` before the agent's default role.
5. Resolve the role to a concrete provider/model and verify availability.
6. Check thinking settings, prewalk, retry fallback, and explicit advisor models separately.
7. Distinguish a new worker from a reused/revived worker or existing pool.
8. Inspect the actual worker in Agent Hub, or ask the main agent to report its resolved model and fallback status.

A model's availability does not guarantee every requested effort, tool mode, or transport feature works. Invalid/unavailable selectors and fallback warnings deserve inspection; they are not proof that the intended role was used.

## How to refresh this reference

On an explicit request to update the document:

1. Check installed version, `omp update --check`, and the official stable release. If they disagree, state the distinction rather than pretending the newer release was locally exercised. Updating this document does not authorize upgrading the binary.
2. Read the selected release's canonical role registry, role capability definitions, priorities, agent definitions, and spawn policy. Pin source links to that version.
3. Check current CLI help. Export bundled agents only into a new temporary directory with `omp agents unpack --dir <temporary-directory> --json`; never overwrite active custom agents for research.
4. Verify model/effort/override syntax, advisor/prewalk behavior, and the public task/eval interfaces. Do not assume a private bridge parameter is publicly available.
5. Check the local model registry and live catalog commands. Do not copy account-specific availability or secrets into the document.
6. Replace the role/agent/model inventory and examples in place. Remove obsolete guidance; do not accumulate a changelog in this file.
7. Update the review date/version, validate links/examples, and remove temporary exports. Keep the user's actual model selections untouched unless changing them was separately requested.

The repository copy is `home/.omp/agent/MODEL-ROUTING.md`. Home Manager exposes it as `~/.omp/agent/MODEL-ROUTING.md` after a rebuild. Subsequent edits to the linked guide do not require rebuilding.

## Version-pinned sources

All implementation links below refer to **v18.2.11**, not a moving main branch.

- [Release][release]
- [Settings and role configuration][settings]
- [Canonical role IDs][role-ids] and [role capabilities][role-capabilities]
- [Role/model resolution][resolver] and [shipped priority candidates][priorities]
- [Bundled agent definitions][bundled-agents] and [agent discovery][discovery]
- [Task tool contract][task-tool], [shared spawn policy][shared-policy], and [child execution][executor]
- [Eval helper contracts][eval] and [Agent Hub][agent-hub]
- [Advisor][advisor] and [prewalk][prewalk]
- [Local models][local-models], [tiny registry][tiny-registry], [model registry][model-registry], and [catalog kinds][catalog-types]

[release]: https://github.com/can1357/oh-my-pi/releases/tag/v18.2.11
[settings]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/settings.md
[role-ids]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/tui/src/overlays/model-browser.ts
[role-capabilities]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/config/model-roles.ts
[resolver]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/config/model-resolver.ts
[priorities]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/priority.json
[bundled-agents]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/task/agents.ts
[discovery]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/task-agent-discovery.md
[task-tool]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/tools/task.md
[shared-policy]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/task/structured-subagent.ts
[executor]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/task/executor.ts
[eval]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/tools/eval.md
[agent-hub]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/agent-hub.md
[advisor]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/advisor-watchdog.md
[prewalk]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/prewalk.md
[local-models]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/docs/local-models.md
[tiny-registry]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/tiny/models.ts
[model-registry]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/coding-agent/src/config/model-registry.ts
[catalog-types]: https://github.com/can1357/oh-my-pi/blob/v18.2.11/packages/catalog/src/types.ts
