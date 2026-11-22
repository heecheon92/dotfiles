# Browser preference

When a task needs an interactive web browser, prefer `ego-browser` over other
browser tools. Read `skill://ego-browser` before the first browser action.
This applies whether you do the work yourself or delegate it to a subagent.
For static pages, use `read` or `web_search`; no browser is needed.

# Autonomous subagent model selection

These instructions govern the main OMP agent's delegation choices, not the model
for its own conversation. Keep the shared AGENTS.md harness-neutral.

## Authority and boundaries

- Choose autonomously within the effective per-call model grants and allowlist;
  an explicit user choice takes precedence. Project restrictions still apply.
- Select the agent for its instructions, tools, and read/write scope first. A
  model override does not turn a read-only agent into an implementation worker.
- Respect task.agentModelOverrides; never pass an explicit model for an agent
  with such an override. Keep scout and sonic on their configured Luna routes.
- If an overlay, project, or runtime policy excludes a preferred model or turns
  per-call selection off, use normal configured routing and disclose the limit.
  Never edit settings to expand permission as part of an assignment.

## Selection policy

- **Documentation:** use docs-writer for substantial documentation writing or
  revision, including decision handoffs and audience-focused explanations.
  Dispatch by agent name without a per-call model override so its `@docs` role
  remains authoritative. This specialist route takes precedence over the general
  model preferences below. For mixed code/documentation work, give the writer
  verified implementation facts and scope; do not ask it to invent product
  decisions or implement code. Explicit user model choices still take precedence.

- **Sol (task trial):** use the normal `task` route (`@task`, GPT-6.2 Sol high)
  for general implementation and debugging. The user is trialling Sol as the main
  task implementer; Opus is its first fallback. Omit `model` unless the assignment
  has a concrete reason to use another model.
- **Opus:** retain `anthropic/claude-opus-5-5:high` as an explicit per-call
  alternative for a coding assignment or independent second approach when
  task-specific evidence favors it. Do not automatically replace the Sol default.
- **Fable:** use `@plan` (Fable high) for planning. The `plan` role is not a
  bundled agent named `planner`; for a planning assignment delegated to `task`,
  explicitly select `anthropic/claude-fable-5-2:high`.
- **Bounded implementation:** dispatch `fast-task` without a model override by default.
  Its `@fast_task` primary is GPT-6.2 Sol with high reasoning effort because
  the user's Codex account offers Ultrafast for it. Do not replace this primary
  as part of a routine model upgrade. Before proposing a change, verify the
  replacement's account-specific tier support and check the model-service-tier hook.
- **Astra:** use the normal `reviewer` route (`@slow`, Astra xhigh) for code
  review. Omit `model` for that default; an explicit selection uses
  `openai-codex/gpt-6.2-astra:xhigh`. The reviewer's read-only scope still applies.
- **Sol elsewhere:** an explicit Sol selection uses `openai-codex/gpt-6.2-sol:high`.
  Do not automatically replace the Fable/Astra defaults with it.
- **Deploy DeepSeek:** retain for explicit user requests, concrete task-specific
  reasons, and lower-priority automatic fallbacks, not as the default implementation
  or review route. Use `deploy/deepseek-ai/deepseek-v4.1-flash-1017:high` unless the
  assignment justifies another supported effort.
- **Terra:** retain for visual reasoning and computer-use assignments when the
  user requests it or task-specific evidence favors it. An explicit override uses
  `openai-codex/gpt-6.1-terra:high`; do not select it merely to promise speed.
- **Daybreak:** `openai-codex/gpt-6-sol:max` (the `daybreak` role) is the Codex
  model with the `daybreak_blue` cyber access program. No agent definition is
  wired to it; select it per call when a security assignment needs that
  access, such as vulnerability research, exploit or malware analysis, binary
  reverse engineering, or security testing the standard models decline, or
  when the user asks for it. Do not use it for ordinary coding, review, or
  planning, and do not move it to a newer GPT version without confirming that
  model offers `daybreak_blue`. `security-reviewer` is pinned to the ordered
  list `@mythos, @daybreak, @advisor` and takes no per-call model: dispatch
  it by name, or use `task` or another unpinned agent for a per-call
  choice. OpenAI may use Daybreak session content to improve its models.
- **Mythos:** `anthropic/claude-mythos-5-2:high` (the `mythos` role) is the
  Anthropic model with loosened restrictions for security work, available
  through the user's approved access. Like Daybreak, no agent definition is
  wired to it; select it per call for the same kind of security assignment,
  or when the user asks for it, and not for ordinary coding, review, or
  planning. When either would fit, prefer Mythos over Daybreak; use Daybreak
  when the user asks for it or Mythos is unavailable or declines, and name the
  substitution. Use the exact `-5-2` id: the plain
  `claude-mythos-5` id is not served.
- **Luna:** preserve scout for read-only exploration and sonic for strictly
  mechanical work. Do not replace these specialists with expensive general
  workers merely because per-call overrides are available.
- When uncertain, use the selected agent's configured default rather than
  overriding its model. Always include an effort suffix in an explicit selection;
  respect and disclose a lower `task.maxEffort` ceiling instead of raising it.
  File count and diff size alone do not measure reasoning difficulty.

## Explain and verify

Before substantial delegation, state one short model/agent choice and the
assignment-specific reason. Do not ask for permission on every dispatch or
present internal reasoning traces. Worker claims require appropriate verification
regardless of model; speed and low cost never justify skipping checks.

Explicit per-call selection pins the main worker model: normal cross-model
fallback and prewalk do not apply. If a pinned worker is unavailable, report the
failure. A new attempt on another approved model may be selected under this
policy, but name the substitution; never present it as the originally requested
model. If the user required a specific model, ask before substituting it.

## Evidence basis

These defaults express the user's preferred division of work, not a universal
benchmark ranking or a measured latency guarantee. Vendor capability claims
and catalog metadata do not prove which model performs best on this repository.
Luna retains its established specialist roles. Reassess alternatives from actual
task outcomes rather than changing the default on speculative performance claims.

Catalog prices are route-specific estimates, not measured task cost or the user's
Codex subscription bill. Do not copy price or benchmark tables into dispatch
instructions. Reassess choices from observed correctness and end-to-end task
completion, not token-generation speed alone.
