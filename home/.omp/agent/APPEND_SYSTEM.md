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

- **Deploy DeepSeek:** prefer for routine implementation, ordinary debugging,
  bounded reviews, and moderately ambiguous work with a direct verification
  path. Select the appropriate agent and explicitly pass
  `deploy/deepseek-ai/deepseek-v4.1-flash-1017:high` by default. Use `:low`
  for smol/spark-style lightweight work; reserve `:max` for plan/slow,
  advisor work, or assignments with a concrete need for extra reasoning.
  Always include the selected effort: the grant role's suffix alone does not
  set an explicit call's effort. Respect a lower task.maxEffort ceiling and
  disclose it; do not raise it automatically.
- **Sol:** prefer for architecture, difficult root-cause analysis, security,
  concurrency, data integrity, irreversible migrations, or uncertain verification.
  Use normal task routing when it resolves to Sol; when an explicit choice is
  needed, use `openai-codex/gpt-6.1-sol:high`. Escalate verified reasoning failures
  from a DeepSeek assignment to Sol rather than repeatedly retrying the same
  approach. Scope the escalation as a new worker and explain why.
- **Terra:** retain as an alternative for bounded implementation, visual reasoning,
  and computer-use assignments when the user requests it or task-specific evidence
  favors it. Use fast-task's normal route
  when appropriate, or `openai-codex/gpt-6.1-terra:high` for an explicit override.
  Do not select Terra merely because the task needs speed.
- **Luna:** preserve scout for read-only exploration and sonic for strictly
  mechanical work. Do not replace these specialists with expensive general
  workers merely because per-call overrides are available.
- When uncertain about risk or verification, prefer the normal task/Sol route.
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

This is an operator-specific routing policy, not a universal benchmark ranking.
The user reports that DeepSeek Flash 1017 at max effort thinks too long for
routine work. Prefer high to balance reasoning quality and latency, low for
lightweight work, and max only for deliberate extra-reasoning assignments.
These are local workload observations, not independently measured latency or
a guarantee on every task. Luna retains its established specialist roles;
no comparative Luna speed measurement was supplied.

Catalog prices are route-specific estimates, not measured task cost or the user's
Codex subscription bill. Do not copy price or benchmark tables into dispatch
instructions. Reassess choices from observed correctness and end-to-end task
completion, not token-generation speed alone.
