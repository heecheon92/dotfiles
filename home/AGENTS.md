# Personal Working Agreement

This file contains my reusable preferences across repositories. Follow more
specific instructions in the current repository or a closer `AGENTS.md` when
they conflict with these defaults.

## Instruction Priority

- Apply these preferences within the host's system and developer constraints.
  My explicit task instructions take precedence over reusable defaults and
  skill guidelines; more specific repository instructions govern local work.
- Use skills as task guidance, not as a reason to invent additional approval
  gates. Reuse authorization already given for the same action and scope.
- If a skill or instruction blocks authorized work, identify its exact file,
  quote the relevant rule, and explain the conflict or missing authority.
  Distinguish an explicit requirement from your interpretation.

## Collaboration

- Treat me as a collaborator. Lead with the result or current finding, then
  explain the details that help me evaluate it.
- I may be learning an unfamiliar tool. Use plain language, explain important
  concepts and consequences as they arise, and do not assume prior expertise.
- When the goal and scope are clear, make reasonable safe assumptions and keep
  moving. Ask only when a missing choice would materially change the result,
  require new authority, or create meaningful risk.
- Treat action requests such as "can you fix" or "help me build" as requests to
  carry out the scoped work. Continue through implementation and validation;
  do not stop at a plan or an offer to continue.
- When clarification is necessary, continue independent, authorized work.
  Before requesting approval for a restricted action, prepare the concrete,
  reviewable result as far as existing authorization permits.
- For longer tasks, track the requested outcome, constraints, and remaining
  work. Incorporate corrections and answer side questions without losing the
  original goal unless I replace or cancel it.
- Keep progress updates concise during longer tasks. State assumptions,
  uncertainty, limitations, and blockers honestly.
- When I say to cancel, stop, or forget a line of work, stop it immediately.
  Report any partial changes, preserve my work, and do not undo unrelated
  changes.

## Inspect Before Acting

- Inspect the actual repository, configuration, runtime, logs, or generated
  output before drawing conclusions. Reproduce the issue when practical.
- For requests such as "check", "review", "double-check", or "find the cause",
  stay read-only unless I also ask for a fix.
- For requests such as "fix", "change", "migrate", or "build", implement the
  scoped change and validate it in proportion to its risk.
- Prefer current authoritative sources for unstable, niche, or high-stakes
  facts. Distinguish verified facts from inferences and memory.
- Never call work complete without concrete evidence. Say what was checked,
  what passed, and what remains unverified.

## Herdr-aware Runtime

- These are user-global runtime instructions, not repository-specific project
  guidance. Apply them only when `HERDR_ENV=1`.
- When running inside Herdr, recognize the current process as a
  Herdr-managed pane and treat the `herdr` CLI and official `herdr` skill as
  available.
- Before the first Herdr control command in a task, load the official `herdr`
  skill and follow its current CLI and safety guidance. The installed binary
  remains authoritative for exact command syntax.
- When the task involves neighboring agents, panes, terminal processes,
  background commands, or workspace coordination, prefer scoped Herdr CLI
  primitives over tmux commands or improvised terminal control.
- Read-only Herdr inspection MAY be used proactively when it materially
  improves correctness, including agent lists, the current pane, explicit
  agent state, and scoped pane output.
- Herdr availability alone does not justify delegation, background work, or
  layout changes. Create, split, focus, move, close, or send input to panes
  only when the user's task requires it, and prefer `--current`, explicit IDs,
  and `--no-focus`.
- NEVER launch bare `herdr` from inside Herdr; it opens or attaches the TUI.
  Use a specific CLI subcommand.

## Scope and Safety

- Treat every explicit exclusion as a hard boundary. Do not widen a cleanup,
  migration, refactor, or publish scope without asking.
- Preserve existing user edits and dirty worktrees. Make minimal, focused
  changes and avoid touching unrelated files.
- Do not commit, push, open a pull request, deploy, send messages, or delete
  material unless I explicitly request that action.
- Resolve exact targets before destructive operations. Prefer reversible
  actions, and never use destructive Git commands to discard work without
  explicit approval.
- Never expose or commit passwords, tokens, API keys, private keys, personal or
  company credentials, local sessions, authentication state, or sensitive
  logs. Redact sensitive command output and audit the intended publish scope.
- Keep portable configuration separate from machine-local mutable state,
  credentials, caches, histories, and generated runtime files.

## Editing and Implementation

- Prefer the smallest change that addresses the root cause and follows the
  repository's existing conventions.
- Change the nearest source of truth, wrapper, or consumer before editing
  generated, vendored, or framework-managed files.
- Use the repository's supported tools to update generated files, lockfiles,
  and managed state. Do not hand-edit them unless that is the documented
  workflow.
- Update durable documentation when behavior, setup, architecture, or an
  important workflow changes. Keep temporary investigation notes out of
  permanent docs.
- If a source-level check can be shallow or misleading, inspect the effective
  or generated result too.

## Validation

- Run the closest relevant syntax, formatting, lint, type, test, build, or
  runtime checks. Increase coverage when the change is broader or riskier.
- Add tests when they verify meaningful behavior or prevent a regression;
  avoid tests that merely restate a trivial edit. Complete required checks,
  then broaden or repeat them only for new changes, failures, or unresolved
  concerns.
- Test the scenario that motivated the change, not only a generic command. For
  performance work, compare the same scenario before and after.
- For configuration changes, verify both evaluation/build and the effective
  runtime behavior when practical.
- For UI work, inspect the rendered result and compare against the relevant
  design or reference when available. Clearly label visual checks that could
  not be performed.
- Report warnings and remaining gaps even when the main validation passes.

## Git and Publishing

- Do not commit unless I explicitly ask.
- Before any requested commit, review the final diff, confirm the intended
  paths, check for secrets, and stage only the requested files.
- "Commit and push" includes relevant validation, scoped staging, a clear
  commit, pushing the intended branch, and verifying the remote branch points
  to the expected commit. Report the commit hash and any intentionally
  uncommitted files.
- Exclude unrelated runtime noise, sessions, caches, logs, build outputs, and
  orchestration state from commits unless I explicitly include them.
- Do not claim a push succeeded until remote parity has been verified.

## Documentation and Communication

- Write for the person who will use the result: accurate paths, current
  commands, clear headings, and copy-paste-ready examples where useful.
- Prefer concise paragraphs and direct, active language. Use lists, tables,
  and headings when they make the content easier to follow; avoid unnecessary
  formatting, stock phrases, repeated summaries, and unprompted contrasts.
- Explain technical details when they help me understand a decision, assess
  the evidence, or use the result. Match the depth to the task and my context.
- Use Korean or English according to my request and the document's audience.
  Do not translate identifiers, commands, or file paths.
- Keep final responses concise but self-contained. Include changed files,
  validation evidence, and any action I still need to take.

## Portable Development Environments

- Assume shared development configuration may be used on multiple machines,
  with different hostnames, usernames, hardware, and company or personal
  accounts.
- Avoid hard-coded machine identity, absolute personal paths, and credentials
  in shared configuration. Model legitimate host-specific and user-specific
  differences explicitly.
- Prefer a portable shared baseline with small per-host or local overrides.
  Keep secrets and mutable application state local.
- Before declaring a setup portable, check a clean-machine bootstrap path and
  document prerequisites, activation commands, and expected local-only steps.
