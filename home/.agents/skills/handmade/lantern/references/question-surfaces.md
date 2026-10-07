# Lantern Question Surface Adapters

This reference contains the volatile, harness-specific part of Lantern's user
input strategy. `SKILL.md` owns the stable interview policy and invariants.

Read only the adapter matching a callable first-class surface. Tool availability
and the callable schema are authoritative; model provider names, environment
variables, and host names are not.

## First-class adapter index

| Harness | Surface | Use when |
| --- | --- | --- |
| Claude Code | `AskUserQuestion` | The tool is callable in the current interactive session |
| Codex | `request_user_input` | The tool is callable in the current interactive or planning context |
| OMP | `ask` | The built-in tool is callable in an interactive OMP session |
| Pi | `question` | A bounded single-choice question fits the callable extension |
| Pi | `questionnaire` | Stable ids/values, tabs, or schema-supported multi-select are needed |

Anything else is unvalidated. Follow `SKILL.md`'s unknown-harness negotiation
instead of silently treating a similar schema as compatible.

## Shared adapter contract

Every adapter must preserve these rules:

1. Submit exactly one Lantern interview round per invocation.
2. Use a stable question id when the schema supports one.
3. Show the clarity dimension and progress in a header or prompt prefix.
4. Offer 2-3 concrete options only when they do not bias discovery.
5. Preserve a custom-answer path.
6. Use multi-select only when the callable schema and UI genuinely support it.
7. Never repeat the same question in surrounding assistant prose.
8. Treat cancellation as an interview stop.
9. Treat timeout-generated answers as unresolved rather than explicit user
   decisions.
10. Fall back to portable chat when the surface is missing, incompatible, or
    fails.

## Capability matrix

| Capability | Claude Code `AskUserQuestion` | Codex `request_user_input` | OMP `ask` | Pi `question` | Pi `questionnaire` |
| --- | --- | --- | --- | --- | --- |
| Stable id | No | Yes | Yes | Schema-dependent | Yes |
| Short header | `header`, 12-character cap; prefix prompt | Yes | Yes | No; prefix prompt | `label` |
| Option description | Yes | Yes | Yes | When exposed | Schema-dependent |
| Rich preview | Yes, single-select only | No | Yes | No | No |
| Multi-select | Yes, `multiSelect: true` | Treat as unsupported unless exposed | Yes, `multi: true` | Treat as unsupported | When exposed as `multiSelect` |
| Custom answer | Automatic `Other` row and notes field | Host UI path | Automatic | Extension UI path | `allowOther: true` |
| Multiple questions | Up to 4; Lantern sends one | Host may support; Lantern sends one | Supported; Lantern sends one | No | Supported; Lantern sends one |
| Headless availability | Denied under `dontAsk`; rely on callability | Only when callable | Not registered without UI | Extension-dependent | Extension-dependent |
| Option count | 2-4 required | 2-3 preferred | 2-3 preferred | 2-3 preferred | 2-3 preferred |

## Claude Code adapter: `AskUserQuestion`

### Availability

Use this adapter only when `AskUserQuestion` is callable. It requires an
interactive session, and the `dontAsk` permission mode denies it even when an
allow rule would otherwise match it. A skill or subagent can also remove it
through `disallowed-tools` or a restricted tool list. Do not infer availability
from the model name, a `CLAUDE_*` environment variable, or the presence of a
`.claude` directory.

### Mapping

Pass exactly one item in `questions`:

- `question`: the round's primary question, prefixed with
  `Round N | Target: Dimension | Ambiguity: NN%` and a blank line
- `header`: the bare clarity dimension, at most 12 characters, such as `Scope`
- `options`: 2-4 `{ label, description }` choices, the label 1-5 words and the
  consequence or tradeoff in `description`
- `multiSelect`: `false` for a single decision, `true` only when several
  constraints may genuinely coexist
- `preview`: optional, single-select only, for a round where the human must
  compare concrete artifacts such as layout sketches, snippets, or configuration
  examples

The header cap is the reason the round marker goes in the prompt rather than the
header. The schema exposes no stable question id, so carry the dimension in
`header` and keep the decision's identity in conversation context.

Claude Code supplies the custom-answer path itself through the `Other` row and
the notes field. Never add an `Other`, `None of these`, or `Let me explain`
option. When a genuine safe default exists, put it first and append
`(Recommended)` to its label.

The schema accepts up to four questions per call. Lantern still submits one.
Options must be mutually exclusive unless `multiSelect` is `true`. Do not attach
a `preview` to a simple preference question that labels and descriptions already
settle.

### Example

```json
{
  "questions": [
    {
      "question": "Round 2 | Target: Scope | Ambiguity: 34%\n\nWhich boundary should govern the first version?",
      "header": "Scope",
      "multiSelect": false,
      "options": [
        {
          "label": "Narrow pilot",
          "description": "One team and one workflow."
        },
        {
          "label": "Department rollout",
          "description": "All users in one business unit."
        }
      ]
    }
  ]
}
```

### Result handling

- Record a selected option, `Other` text, or notes-field text as the round
  decision. Claude Code relays free text with neutral wording, so an answer that
  asks Lantern to wait or explain first is an instruction to follow, not a
  choice to score.
- Treat a dismissed or rejected question as an interview stop and return a
  concise partial synthesis.
- Questions stay open indefinitely unless the human configured
  `askUserQuestionTimeout`. When that timeout expires, the dialog submits
  whatever was already selected and reports that the human may be away. Never
  record that as an explicit decision: preserve the point as unresolved and
  re-ask through chat.
- If the tool is unavailable, denied, or rejects the call, use portable chat.

### Frontmatter

Claude Code loads this skill from `SKILL.md` frontmatter. Keep
`disable-model-invocation: true` set so the harness enforces Lantern's
human-only invocation rule directly, rather than relying on the model to honor
it. That field also stops the skill from being preloaded into subagents and from
running when a scheduled task fires with the skill as its prompt.

## Codex adapter: `request_user_input`

### Availability

Use this adapter only when `request_user_input` is callable. Some Codex hosts or
modes expose it only for planning or specification work. Do not infer
availability merely because the model is an OpenAI model or the process is
named Codex.

### Mapping

Pass exactly one item in `questions`:

- `id`: stable dimension-oriented identifier such as `scope_boundary`
- `header`: short clarity dimension label
- `question`: the current round's primary question
- `options`: 2-3 `{ label, description }` choices

Use the callable schema as the final authority. Treat multi-select as unsupported
unless that schema explicitly exposes it. Rely on the host-provided custom input
path rather than adding an `Other` option yourself.

### Example

```json
{
  "questions": [
    {
      "id": "scope_boundary",
      "header": "Round 2 · Scope · Ambiguity 34%",
      "question": "Which boundary should govern the first version?",
      "options": [
        {
          "label": "Narrow pilot",
          "description": "One team and one workflow."
        },
        {
          "label": "Department rollout",
          "description": "All users in one business unit."
        }
      ]
    }
  ]
}
```

### Result handling

- Record an explicit selected option or custom response as the round decision.
- If the host reports cancellation, return a concise partial synthesis.
- If the host ever reports a default or timeout-generated answer, preserve the
  point as unresolved and retry through chat.
- If the tool is unavailable or rejects the call, use portable chat.

## OMP adapter: `ask`

### Availability

OMP registers `ask` only when the session has interactive UI. Headless sessions
do not expose it. Tool callability is authoritative.

### Mapping

Pass exactly one item in `questions`:

- `id`: stable identifier
- `header`: `Round N · Dimension · Ambiguity NN%`
- `question`: the current round's primary question
- `options`: `{ label, description?, preview? }[]`
- `multi`: `true` only when multiple constraints may coexist
- `recommended`: only when a genuine safe default exists

OMP automatically supplies the custom-answer path. Never provide its reserved
labels:

- `Other (type your own)`
- `Chat about this`
- `Next →`

### Example

```json
{
  "questions": [
    {
      "id": "scope_boundary",
      "header": "Round 2 · Scope · Ambiguity 34%",
      "question": "Which boundary should govern the first version?",
      "options": [
        {
          "label": "Narrow pilot",
          "description": "One team and one workflow."
        },
        {
          "label": "Department rollout",
          "description": "All users in one business unit."
        }
      ],
      "multi": false
    }
  ]
}
```

### Result handling

- OMP may support several questions, but Lantern always sends one.
- `ask.timeout` defaults to disabled; plan mode disables it regardless of the
  configured value.
- Outside plan mode, a configured timeout may auto-select `recommended` or the
  first option. Do not treat a result marked auto-selected after timeout as an
  explicit decision.
- Cancellation aborts the tool call and counts as an interview stop.
- Rich dialogs may support option previews; selector/editor fallback remains a
  valid native OMP experience.

## Pi adapter: `question`

### Availability

`question` is an optional Pi extension rather than a guaranteed built-in. Use
it only when callable and when its exposed schema matches this adapter.

### Mapping

Use it for one bounded single-choice decision:

- pass the round prompt through `question`
- pass choices through `{ label, description? }[]` when descriptions are
  supported
- prepend `Round N | Target: Dimension | Ambiguity: NN%` when no header field
  exists
- use the extension's custom-answer path

Treat multi-select as unsupported unless the callable schema explicitly exposes
it. Use portable chat when the decision requires several simultaneous choices.

### Result handling

- Record explicit selection or custom input as the round decision.
- Treat UI cancellation as an interview stop.
- Fall back to chat if the extension is absent or its schema differs materially.

## Pi adapter: `questionnaire`

### Availability

`questionnaire` is also an optional Pi extension. Implementations can differ,
so inspect the callable schema before use. The commonly used contract exposes
`questions`, stable ids and values, `label`, `prompt`, `allowOther`, and optional
`multiSelect`.

### Mapping

Pass exactly one item in `questions`:

- `id`: stable identifier
- `label`: clarity dimension
- `prompt`: current round's primary question
- `options`: `{ value, label }[]` with stable values
- `allowOther`: `true` unless custom input would be invalid
- `multiSelect`: `true` only when exposed and multiple constraints may coexist

### Example

```json
{
  "questions": [
    {
      "id": "scope_boundary",
      "label": "Scope",
      "prompt": "Which boundary should govern the first version?",
      "options": [
        { "value": "pilot", "label": "Narrow pilot" },
        { "value": "department", "label": "Department rollout" }
      ],
      "allowOther": true
    }
  ]
}
```

### Result handling

- Even when tabs or multi-question navigation exist, Lantern sends one question.
- Preserve returned stable values and custom-answer markers when summarizing the
  decision.
- Treat a cancelled result as an interview stop.
- Fall back to `question` for a simple compatible single choice, otherwise use
  portable chat when the richer schema is unavailable.

## Adding another first-class harness

Supporting a new harness must not rewrite Lantern's core interview policy.
Update only:

1. the compact first-class index in `SKILL.md`
2. the adapter index and capability matrix in this reference
3. a new adapter section with availability, mapping, example, result handling,
   and fallback behavior
4. validation that exactly one Lantern round is submitted

Split this reference into one file per harness only when independent evolution,
review ownership, or shared-file churn makes the single matrix materially harder
to maintain. Preserve the same adapter contract and links if that split occurs.

## Revalidation checklist

When a harness or extension changes:

- inspect the current callable schema or authoritative source
- verify the tool is registered only in the documented modes
- verify custom-answer behavior
- verify single-select and multi-select behavior
- verify timeout/default semantics
- verify cancellation semantics
- verify headless behavior
- execute one representative Lantern round
- confirm portable chat still works when the tool is absent
- update this reference without changing core interview policy unless a shared
  invariant itself changed
