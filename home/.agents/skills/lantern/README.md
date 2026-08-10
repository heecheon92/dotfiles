# Lantern

[English](README.md) | [한국어](README.ko.md)

Before your coding agent plans or builds something, make sure it understands
what you actually want.

`lantern` is a human-invoked, portable requirements-interview skill. Light it
explicitly when you want to clarify a broad idea or underspecified change. It
asks one focused question at a time and finishes with an execution-ready
specification. It never starts automatically merely because a request is
ambiguous, complex, or risky.

It uses each harness's own structured-question interface when one is available -
Codex `request_user_input`, Claude Code `AskUserQuestion`, OMP `ask`, or Pi
`question` and `questionnaire` - and falls back to numbered chat options
everywhere else.

## Try it

```text
$lantern I want to replace our internal approval process. Interview me before proposing a solution.
```

On Claude Code, invoke it as a slash command instead:

```text
/lantern I want to replace our internal approval process. Interview me before proposing a solution.
```

The default `--standard` profile provides a thorough requirements interview
without continuing after the specification is ready.

For a shorter or more rigorous session:

```text
$lantern --quick Help me define the smallest useful version of this feature.
```

```text
$lantern --deep Do not assume anything about this migration. Clarify the intent, boundaries, risks, and acceptance criteria first.
```

## What it does

The skill:

- asks exactly one primary question per round
- uses selectable choices when the answer space is genuinely known
- falls back to numbered choices or free text when structured input is
  unavailable
- inspects discoverable repository or document facts instead of asking you to
  recall them
- tracks intent, outcome, scope, constraints, success criteria, and existing
  context
- exposes assumptions, tradeoffs, non-goals, and decision boundaries
- revisits at least one earlier answer to pressure-test it
- stops with a testable specification rather than implementing immediately

## What the conversation feels like

Each round shows its current target and estimated ambiguity:

```text
Round 2 | Target: Scope | Ambiguity: 34%

Which boundary should govern the first version?

1. Narrow pilot — one team and one workflow
2. Department rollout — all users in one business unit
3. Company-wide — production scope from the start
4. Another answer

Reply with a number or write your own answer.
```

When the current agent is Codex and `request_user_input` is available, Lantern
uses its native structured-question interface for bounded choices. In Default
mode, availability may depend on the `default_mode_request_user_input` feature.
Otherwise, the numbered format keeps the interview usable in an ordinary
conversation without changing the user's Codex configuration.

On Claude Code, Lantern uses `AskUserQuestion` for the same bounded choices. The
round marker stays in the question text because that tool's header field is
capped at 12 characters, and the custom-answer path comes from Claude Code's own
`Other` row rather than an option Lantern adds. The tool needs an interactive
session, so a `--print` run or the `dontAsk` permission mode falls back to the
numbered format.

The next question is based on your latest answer. The skill does not mechanically
walk through a fixed questionnaire.

## Profiles

```text
$lantern [--quick|--standard|--deep] <idea or request>
```

| Profile | Best for | Ambiguity target | Maximum rounds |
| --- | --- | ---: | ---: |
| `--quick` | A fast pre-planning clarification pass | 30% | 5 |
| `--standard` | A complete requirements interview | 20% | 12 |
| `--deep` | High-risk or highly ambiguous work | 15% | 20 |

The maximum is a safety cap, not a target. The interview stops earlier when its
readiness checks pass and another question would not materially change
execution.

## Good use cases

### A vague feature request

```text
$lantern Add team sharing to this application, but interview me before deciding what sharing means.
```

### A risky migration

```text
$lantern --deep We need to move authentication providers without disrupting existing customers.
```

### A new internal process

```text
$lantern Help me define a support-escalation workflow, including what should stay out of scope.
```

### A proposal or presentation

```text
$lantern Review this proposal and clarify what decision I need from the audience before recommending revisions.
```

## Final specification

When the interview is ready to close, it returns a specification containing the
relevant parts of:

- intent and desired outcome
- in-scope behavior and non-goals
- decision boundaries
- constraints
- testable acceptance criteria
- resolved assumptions
- existing-system evidence and terminology decisions
- edge cases and residual risks
- final ambiguity score

The skill does not automatically implement the result. Planning,
implementation, review, or saving the specification can be requested
separately.

## Install

### Codex

Use the skill installer included with Codex:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/skills/lantern
```

The skill will be available from your next Codex turn:

```text
$lantern --standard <topic>
```

### Claude Code

Copy the skill directory into your personal skills directory:

```bash
git clone --depth 1 https://github.com/heecheon92/dotfiles.git /tmp/dotfiles
mkdir -p ~/.claude/skills
cp -R /tmp/dotfiles/home/.agents/skills/lantern ~/.claude/skills/lantern
```

Use `.claude/skills/` inside a repository instead if you want the skill scoped
to one project. The skill is available from your next turn:

```text
/lantern --standard <topic>
```

The bundled `disable-model-invocation: true` frontmatter is what keeps Claude
from starting Lantern on its own, so leave it in place.

## Notes

The interview keeps its working state in the current conversation. It does not
require a separate service, terminal UI, state store, helper script, or
companion application.

Only the human may start Lantern. Another skill, agent, subagent, plan, or
workflow must not invoke or chain into it.

The quality of selectable controls depends on the harness surface being used.
When native controls are unavailable, the skill provides the same decisions as
numbered chat options with a custom-answer path.
