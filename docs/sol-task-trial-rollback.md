# Sol task trial: rollback

Temporary document. From 2026-11-22 the OMP `task` role runs on GPT-6.2 Sol
instead of Opus, as a trial for a few weeks. When the user asks to end the
trial, an agent performs the steps below and then deletes this file.

Before the trial, `modelRoles.task` was `anthropic/claude-opus-5-5:high` and
Opus was not in the `task` fallback chain.

## Rollback steps

Check each file's current content first; apply only the trial lines listed
here and keep any unrelated edits made since. Preserve the comments in
`config.yml` and edit it by hand, not through a serializer.

### 1. `home/.omp/agent/config.yml`

Replace the trial lines with the original ones.

| Trial (remove) | Original (restore) |
|---|---|
| `# Sol implements (trial), Fable plans, and Astra reviews; defaults remain overridable.` | `# Opus implements, Fable plans, and Astra reviews; defaults remain overridable.` |
| The three comment lines above `task` (`# Trial from 2026-11-22 …`, `# Previous value …`, `# To end the trial …`), and `task: openai-codex/gpt-6.2-sol:high` under `modelRoles` | `task: anthropic/claude-opus-5-5:high` |
| `- anthropic/claude-opus-5-5:high` as the first entry of `retry.fallbackChains.task` | No such entry; the chain starts with `- anthropic/claude-fable-5-2:high` |

Leave `fast_task` and its comment alone: it was Sol before the trial.

### 2. `home/.omp/agent/APPEND_SYSTEM.md`

Replace the **Sol (task trial)** and **Opus** bullets with this one bullet:

```markdown
- **Opus:** use the normal `task` route (`@task`, Opus high) for general
  implementation and debugging. Omit `model` unless the assignment has a concrete
  reason to use another model. An explicit selection uses
  `anthropic/claude-opus-5-5:high`.
```

Replace the **Sol elsewhere** bullet with:

```markdown
- **Sol:** retain `openai-codex/gpt-6.2-sol:high` as an explicit alternative for
  a coding assignment or independent second approach when task-specific evidence
  favors it. Do not automatically replace the requested Opus/Fable/Astra defaults.
```

### 3. `docs/agents.md`

Restore these passages (search for `시험` to find the trial wording):

| Trial | Original |
|---|---|
| `위임은 Sol이 구현하고(2026-11-22부터 몇 주간 시험), Fable이 계획하고, Astra가 리뷰하도록 나눕니다.` | `위임은 Opus가 구현하고, Fable이 계획하고, Astra가 리뷰하도록 나눕니다.` |
| The three-line `task` bullet naming `openai-codex/gpt-6.2-sol:high` and the fallback chain | ``- `task`: `@task`, `anthropic/claude-opus-5-5:high`. 일반 구현과 디버깅의`` / `  기본 위임입니다.` |
| `` `@task`(시험 기간에는 Sol `high`) `` (three places: fallback paragraph, selection-policy list, prewalk paragraph) | `` `@task`(Opus `high`) `` and, in the selection-policy list, `` `task`(Opus `high`) `` |
| The `Opus(...)는 코딩 작업이나 독립적인 두 번째` bullet ending `Sol·Fable·Astra 기본값을 자동으로 대체하지 않습니다.` | `` - `fast-task` 이외에서 Sol(`openai-codex/gpt-6.2-sol:high`)은 코딩 작업이나 독립적인 두 번째 `` … ending `Opus·Fable·Astra 기본값을 자동으로 대체하지 않습니다.` |

### 4. Verify

```sh
omp config get modelRoles --json | jq -r '.value.task'
# expect: anthropic/claude-opus-5-5:high
omp config get retry.fallbackChains --json | jq -r '.value.task[0]'
# expect: anthropic/claude-fable-5-2:high
omp config list --json >/dev/null   # expect no warnings
```

Then spawn one `task` agent with no model and confirm it resolves to
`anthropic/claude-opus-5-5:high`. No rebuild is needed; new OMP sessions pick
up the change.

### 5. Clean up

Delete this file, and remove the comment in `config.yml` that points to it if
step 1 left it behind. Do not commit or push unless the user asks.
