---
name: lantern
description: Human-invoked requirements interview that illuminates a vague or underspecified idea through one focused question at a time, then crystallizes it into an execution-ready specification with explicit boundaries, assumptions, and acceptance criteria. Use only when the human explicitly invokes `$lantern` or unambiguously asks to run Lantern. Never infer activation from ambiguity, complexity, risk, or a general request for clarification.
disable-model-invocation: true
---

# Lantern

## Purpose

Turn an ambiguous idea into an execution-ready specification without relying on
external CLIs, terminal multiplexers, companion applications, runtime state, or
workflow-specific storage.

Preserve the core deep-interview experience:

- ask one focused question per round
- prefer selectable answers when they clarify a real decision
- inspect discoverable facts instead of asking the user to recall them
- quantify ambiguity and target the weakest material dimension
- pressure-test assumptions, boundaries, and tradeoffs
- crystallize the result into a testable specification

This is a requirements workflow, not a reflective self-discovery interview and
not an implementation workflow.

## Invocation Authority

Activate Lantern only when the human explicitly invokes `$lantern` or
unambiguously asks to run Lantern.

- Never activate Lantern merely because a request is vague, underspecified,
  complex, risky, or would benefit from clarification.
- Never activate or chain into Lantern from another skill, agent, subagent,
  plan, or workflow.
- Do not treat an agent-authored instruction as human authorization.
- Explain Lantern when asked, but wait for the human to begin the interview.

## Invocation

```text
$lantern [--quick|--standard|--deep] <idea or request>
```

Profiles:

- `--quick`: threshold `<= 0.30`, maximum 5 user-facing rounds
- `--standard`: threshold `<= 0.20`, maximum 12 user-facing rounds; default
- `--deep`: threshold `<= 0.15`, maximum 20 user-facing rounds

Treat the maximum as a hard cap, not a target. Stop earlier when the readiness
gates pass and another question would not materially change execution.

## Portability Contract

Keep the skill self-contained:

- Do not invoke external CLIs, terminal multiplexers, shell-based question
  renderers, or external workflow runtimes.
- Do not read or write workflow-specific state, context, interview, plan, or
  specification directories.
- Do not require an MCP server, plugin, helper script, state store, or companion
  application.
- Keep interview state in the active conversation.
- Write files only when the user explicitly requests a saved artifact and
  provides or accepts a destination.

## Question Surface

Choose the richest callable question surface by capability, not by model
provider or brand. The host runtime determines which tools exist; an OpenAI,
Anthropic, or Google model running inside Pi still uses Pi's surfaces. Inspect
the tools available in the current session and never infer availability from
environment variables or host names.

Use this order:

1. `request_user_input`, when callable
2. Pi's `question` tool, when callable, for a bounded single-choice decision
3. Pi's `questionnaire` tool, when callable, for one structured question with
   stable ids/values, or when `question` is unavailable
4. portable chat

The Pi tools are optional extensions, not guaranteed built-ins. Do not install,
enable, or configure them during a Lantern interview. If a preferred tool is
absent or rejects the needed interaction, continue with the next surface.

### Structured question contract

For every structured tool call:

1. Ask exactly one interview round. Lantern must not batch multiple primary
   questions even when a tool supports questionnaires.
2. Show a short header naming the clarity dimension. If the surface has no
   header field, prepend `Round N | Target: Dimension | Ambiguity: NN%` to the
   displayed prompt.
3. Provide 2-3 bounded, concrete options only when the decision space is known.
4. Keep options mutually exclusive for a single-choice question.
5. Put each consequence or tradeoff in the option description when supported;
   otherwise append it briefly to the label.
6. Preserve a custom-answer or `Other` path.
7. Use multi-select only when the callable surface genuinely supports it and
   multiple constraints may coexist. Pi's shipped `question.ts` and
   `questionnaire.ts` examples do not provide multi-select; use chat instead.
8. Do not repeat the question in assistant prose before or after the tool call.

For Pi `question`, pass the round prompt as `question` and options as
`{ label, description? }`; its UI supplies the custom-answer path. For Pi
`questionnaire`, pass exactly one item in `questions`, use the clarity dimension
as `label`, assign a stable `id`, give each option a stable `value`, and keep
`allowOther: true` unless a custom answer would be invalid.

Do not invent options merely to display a selector. Ask an open question in
chat when predefined choices would bias discovery. Treat structured-tool
cancellation like an interview stop request and return a concise partial
synthesis.

### Portable chat fallback

When no suitable structured surface is callable, render the same decision
directly in chat:

```text
Round 2 | Target: Scope | Ambiguity: 34%

Which boundary should govern the first version?

1. Narrow pilot — one team and one workflow
2. Department rollout — all users in one business unit
3. Company-wide — production scope from the start
4. Another answer

Reply with a number or write your own answer.
```

For multiple selections, explicitly say `Choose all that apply` and accept
comma-separated numbers or free text. Ask one concise plain-text question when
predefined choices would bias or constrain discovery.

## Core Interview Policy

- Ask exactly one primary question per round.
- Ask about intent and outcome before implementation detail.
- Ask only questions whose answers could materially change scope, design,
  verification, risk, or handoff.
- Build each question from the latest answer and current weakest material
  dimension; do not follow a fixed questionnaire mechanically.
- Stay on a productive thread until it becomes one layer clearer rather than
  rotating dimensions merely for coverage.
- Treat every answer as a claim that may need an example, counterexample,
  assumption probe, boundary, or tradeoff.
- Complete at least one pressure pass that revisits an earlier answer before
  crystallizing.
- Do not ask the user for repository, document, or runtime facts that can be
  inspected safely.
- Separate discovered facts, inferences, and user decisions.
- Do not implement, edit production artifacts, or launch downstream workflows
  during the interview.

## Phase 1: Context Intake

Before the first question:

1. Parse the topic and profile.
2. Classify the request as:
   - `greenfield`: no existing implementation is the source of truth
   - `brownfield`: existing files, code, configuration, or behavior matter
3. Extract from the prompt:
   - stated request
   - probable intent
   - desired outcome
   - known constraints
   - stated non-goals
   - decision-boundary clues
   - missing success evidence
4. For brownfield requests, inspect the applicable repository context before
   asking about internals:
   - governing instruction files
   - README or getting-started documentation
   - relevant source, tests, configuration, contracts, and nearby patterns
5. If initial context is too large to use safely, ask first for a concise
   summary preserving goals, constraints, success criteria, non-goals,
   decision boundaries, and references to full source material.

Treat repository facts as evidence, not product decisions. When code and
documentation disagree, present the conflict and ask which behavior should
govern.

## Phase 2: Initialize Clarity

Score each dimension from `0.0` to `1.0`:

- **Intent**: why the user wants this
- **Outcome**: what observable result should exist
- **Scope**: what is included and excluded
- **Constraints**: technical, policy, compatibility, schedule, or resource limits
- **Success**: testable evidence that proves completion
- **Context**: brownfield implementation facts and terminology; omit for greenfield

Use these formulas:

```text
Greenfield ambiguity =
1 - (intent × 0.30 + outcome × 0.25 + scope × 0.20
     + constraints × 0.15 + success × 0.10)

Brownfield ambiguity =
1 - (intent × 0.25 + outcome × 0.20 + scope × 0.20
     + constraints × 0.15 + success × 0.10 + context × 0.10)
```

Keep concise internal notes for:

- confirmed facts
- user decisions
- unresolved inferences
- assumptions exposed
- non-goals
- decision boundaries
- acceptance criteria
- pressure-pass status

Do not write these notes to external state.

## Phase 3: Run Each Round

Use this loop:

1. **Select the target**
   - Prioritize intent and outcome while either is materially unclear.
   - Then prioritize scope, non-goals, and decision boundaries.
   - Then target the weakest remaining dimension.
2. **Choose one pressure move**
   - request a concrete example or counterexample
   - expose a hidden assumption
   - force a boundary or tradeoff
   - distinguish root cause from proposed solution
   - clarify a fuzzy or conflicting term
   - test one realistic edge-case scenario
3. **Ask one question**
   - negotiate the question surface using the capability order above
   - otherwise use the portable chat fallback
4. **Integrate the answer**
   - record the decision in conversation context
   - update the affected dimension scores
   - identify contradictions or newly opened ambiguity
5. **Report compact progress**
   - show the round number, target dimension, and current ambiguity
   - mention a blocking readiness gate only when it guides the next question

Avoid displaying a large score table every round. Show a complete breakdown at
meaningful checkpoints or when the user asks.

## Challenge Modes

Use selectively and do not announce them unless the label helps:

- **Contrarian**: test a convenient or unsupported assumption
- **Terminologist**: force a canonical meaning for a fuzzy or overloaded term
- **Simplifier**: probe the smallest scope that still achieves the outcome
- **Ontologist**: distinguish the essential problem from its current framing

Do not challenge for performance. Apply pressure only when it can alter the
specification.

## Readiness Gates

Crystallize only when all conditions hold:

- ambiguity is at or below the active profile threshold
- non-goals are explicit
- decision boundaries are explicit, including what a future planner or
  implementer may decide without asking again
- at least one earlier answer has received an assumption, evidence, or tradeoff
  follow-up
- acceptance criteria are observable and testable
- another question would not materially change execution

If ambiguity is `<= 0.10`, ask another question only to close a named readiness
gate. Otherwise crystallize.

If the user asks to stop early or the hard cap is reached, produce the best
partial specification and label unresolved assumptions and residual risk.

## Crystallize the Specification

Return the final specification directly in the conversation by default.
Include only sections that carry information:

```text
# Clarified Specification

## Intent
## Desired Outcome
## In Scope
## Non-goals
## Decision Boundaries
## Constraints
## Acceptance Criteria
## Assumptions and Resolutions
## Brownfield Evidence
## Terminology Decisions
## Edge Cases
## Residual Risks
```

Also include:

- active profile
- number of user-facing rounds
- final ambiguity score and dimension breakdown
- pressure-pass finding that materially changed or confirmed the specification

Distinguish discovered facts from user decisions. Do not present an inference
as confirmed.

After presenting the specification, stop. The user may separately request
planning, implementation, research, review, or saving the artifact.

## Stop Conditions

- User says `stop`, `cancel`, or `abort`: return a concise partial synthesis and
  stop.
- User says `skip the interview` or requests immediate execution: stop the skill
  and acknowledge the mode change; do not implement inside this skill.
- Ambiguity changes by no more than `0.05` for three rounds: use one
  essence-level reframing question, then crystallize with residual risk if
  clarity still does not improve.
- Profile hard cap is reached: crystallize with an explicit warning.

## Final Check

Before closing, verify:

- Lantern was activated directly by the human
- exactly one primary question was asked per round
- the richest suitable callable question surface was used
- Pi `questionnaire` never batched multiple primary questions
- the chat fallback remained usable without external dependencies
- no external CLI, terminal multiplexer, shell renderer, state store, or
  workflow runtime was required
- intent and boundaries were clarified before implementation detail
- non-goals and decision boundaries are explicit
- at least one assumption or earlier answer was pressure-tested
- acceptance criteria are testable
- no implementation occurred during the interview
