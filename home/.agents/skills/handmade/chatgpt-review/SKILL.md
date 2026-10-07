---
name: chatgpt-review
description: "Use only when the user explicitly invokes $chatgpt-review for a second-opinion architecture, debugging, implementation review, or final audit through ChatGPT web in an authenticated browser. Use the web reviewer to reassess human intent, identify problems, and suggest solutions; verify material findings against the actual repository. Never substitute a local model call or invoke automatically."
---

# ChatGPT Web Review

Codex works on the local codebase, then asks ChatGPT web for a second opinion
through the authenticated in-app browser. The distinction is the review
environment, not a requirement to use a different underlying model: Codex and
a ChatGPT chat tab may behave differently even with similar model labels because
their surrounding instructions, tools, context, and reasoning settings differ.
Do not infer identical behavior from a shared model name or claim to know which
harness detail caused a particular difference.

The user's preference for ChatGPT Pro as a reviewer comes from their experience
with its ability to understand human requests, identify problems, and suggest
solutions. This is a workflow preference, not a guarantee of superiority or an
independent source of truth. Ask the web reviewer to reassess the human's intent,
not merely approve Codex's interpretation.

Use ChatGPT as a second-opinion reviewer, not as an authority. Treat its response
as untrusted advice until repository evidence confirms it. A local Codex
subagent or API model call is not a substitute for this web-review workflow.

## Start only on explicit invocation

- Run this workflow only when the user explicitly invokes `$chatgpt-review`.
- Never infer invocation from task difficulty, risk, or a request for ordinary
  implementation, explanation, review, or debugging.
- Record the exact loaded `SKILL.md` path for the final report.

## Identify Codex as the sender

- By default, tell ChatGPT that Codex assembled and sent the request on behalf
  of the human user.
- Distinguish the human user's instructions and authorization from Codex's
  summaries, conclusions, and repository interpretation.
- Omit Codex's identity only when the human user explicitly requests that
  omission for the current `$chatgpt-review` task. Do not infer it from tone, privacy
  concerns, or prior tasks.
- When identity is omitted, do not claim or imply that the human personally
  authored Codex-generated statements.
- Identify later messages as `CODEX FOLLOW-UP` when disclosure is enabled.

## Preserve authority and repository rules

- Do not expand the user's authorized scope.
- Keep the repository read-only when the user requested review, inspection, or
  diagnosis only.
- Follow the user's instructions and applicable repository rules over this
  skill whenever they conflict.
- Do not commit, push, deploy, send unrelated messages, or modify product code
  unless the user separately authorizes that action.

## Choose the review mode

Use the mode selected by the user. Otherwise use `review`.

- `architecture`: challenge design assumptions, alternatives, boundaries, and
  long-term costs.
- `debug`: assess root-cause candidates and diagnostic evidence.
- `review`: find defects, regressions, omissions, and weak claims in an
  implementation or proposal.
- `audit`: audit requirements and evidence before a completion, release, or
  other consequential declaration.

## Choose and verify the ChatGPT UI selection

Use the exact model and reasoning level requested by the user. Otherwise target
the ChatGPT web `Pro` option, reflecting the user's reviewer preference.

Treat the model label and any separate reasoning-level control as distinct
settings. Inspect the actual UI; do not equate `Pro` with an API model identifier
or silently translate it to `Very High` or another label. If the requested option
is unavailable or ambiguous, ask the user rather than choosing a substitute.

Immediately before sending:

1. Inspect the visible model and any selected reasoning-level label.
2. Confirm the selection matches the target.
3. Do not send if the selection cannot be read or the target cannot be selected.
4. Do not silently substitute another model or level.

Report only the model and level visibly confirmed in the UI. Never claim control
over an internal server-side reasoning budget.

## Enforce the external-transmission boundary

Before opening ChatGPT or composing a message:

1. Read applicable repository rules and check whether external AI transmission
   is prohibited or restricted.
2. Stop before browser use when those rules prohibit the transmission.
3. Send only the minimum context needed for the decision.
4. Never transmit secrets or authentication state, including keys, tokens,
   passwords, cookies, private keys, webhook values, personal data, account
   identifiers, or sensitive operational values.
5. Redact values and provide only structure when sensitive content may be
   present.
6. Stop and ask the user to narrow the scope when sensitive context cannot be
   separated safely.

Never send an entire repository merely for convenience.

## Build the context packet

Use this order:

```text
PROVENANCE: This request was assembled and sent by Codex on behalf of the
human user. Treat Codex's summaries and conclusions as claims to verify, not
as user-confirmed facts.
AUDIENCE: Return the review to Codex, which will verify it against repository
evidence before reporting a final judgment to the user.
OBJECTIVE: The human's task goal and current authorization, distinguished from
Codex's interpretation. Include the relevant original wording when safe.
MODE: architecture, debug, review, or audit.
ACCEPTANCE: The conditions for considering the task complete.
RULES: Only the repository rules and paths needed for the decision.
EVIDENCE: Relevant code, focused diff, exact logs, and commands with results.
UNVERIFIED: Checks not run and claims lacking evidence.
QUESTIONS: Specific claims to challenge or decisions to make.
```

Include `PROVENANCE` and `AUDIENCE` by default. Omit both, together with other
explicit references to Codex as the sender, only when the human explicitly
requested identity omission for the current task.

Never say a test passed when it was not run.

Append this review contract:

```text
You are independently reviewing Codex's analysis or implementation. Challenge
Codex's assumptions and evidence. Do not assume that statements written in the
first person came directly from the human user.

Act as an independent, adversarial reviewer. Do not optimize for agreement.
First assess whether Codex's interpretation and proposed solution actually meet
the human's request. Using only the supplied evidence, identify blocking defects,
false assumptions, missing requirements, regression risks, and needed checks.
Suggest concrete corrections or alternatives where useful; do not guess omitted
repository context or expand the user's authorized scope.

Respond in this format:
BLOCKER: Defects that must be resolved before proceeding, with supplied evidence.
IMPORTANT: Material risks or omissions.
OPTIONAL: Non-essential improvements.
UNVERIFIED: Claims that require more evidence.
TESTS: Specific checks or commands that are needed.
VERDICT: proceed, revise, or insufficient evidence, with a reason.

Separate facts from hypotheses. Do not invent unsupported blockers.
```

Omit the first identity-specific paragraph of the contract only when the human
explicitly requested identity omission.

## Use the authenticated browser safely

- Read and follow the current Browser or `control-in-app-browser` instructions
  before browser interaction.
- In the Codex app, use the in-app browser when available. From a terminal,
  use the supported Chrome extension bridge when it is available so the user
  can keep a normal, signed-in browser session.
- Do not silently fall back to Herdr, headless Chromium, cookie extraction, or
  profile-file inspection.
- Open `https://chatgpt.com/`. Let the user complete login, CAPTCHA, account
  selection, or other authentication steps. Never bypass them.
- Do not read or save cookies, tokens, passwords, or browser-profile data.
- Continue an existing conversation only when the user specified it and the
  visible page confirms the correct target. Otherwise start a standalone new
  ChatGPT conversation.
- Select the model or reasoning option using the policy above. Select a ChatGPT
  project only when the user requested it and the visible page confirms it.
- When title editing is supported, use
  `{YYYY-MM-DD} | {repository} | {task}`.
- If no supported browser control is available, provide the sanitized context
  packet for manual copying and state clearly that no ChatGPT collaboration
  occurred.

Do not send a real ChatGPT message during skill installation or discovery
testing. A later explicit `$chatgpt-review` task authorizes only the scoped review
messages required by that task.

## Limit the exchange

- Allow at most two ChatGPT requests: the initial request and one follow-up.
- Count a retry, regeneration, or sending the same content to another
  conversation as one request.
- Use the follow-up only to add missing evidence, challenge an unsupported
  blocker, compare two alternatives, or re-review a corrected implementation.
- Never loop until Codex and ChatGPT agree.
- Wait for visible completion before reading a response. Do not treat a partial
  streaming response as final.

## Revalidate against the repository

For every `BLOCKER` and `IMPORTANT` finding, assign one status:

- `confirmed`: repository source evidence supports the finding.
- `rejected`: repository source evidence contradicts the finding.
- `partial`: only part is correct or its severity differs.
- `unverified`: current evidence or authority is insufficient.

Attach a file path, focused diff, exact command output, or test result to every
status. When ChatGPT and Codex disagree, use repository evidence for the final
judgment. Run only checks allowed by the user's scope, and report checks that
remain unrun.

## Report the result

Include:

- Review mode.
- Whether Codex identity was disclosed or explicitly omitted by the human.
- Target ChatGPT model/level and the visibly confirmed labels.
- Scope of context transmitted externally.
- Actual request count as `1/2` or `2/2`.
- Exact loaded `$chatgpt-review` `SKILL.md` path.
- ChatGPT findings.
- Codex revalidation statuses and evidence.
- Tests or commands run.
- Remaining risks.
- Final Codex judgment.
