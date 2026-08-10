---
name: documentation-lifecycle
description: "Establish, adopt, audit, route, or apply an opinionated project documentation lifecycle with a consistent roadmap, completion archive, source-of-truth map, thin AGENTS.md binding, and task-aware reading protocol."
---

# Purpose

Use this skill when a Human wants a repository to adopt, audit, route, or apply a documentation-maintenance strategy—especially when roadmaps, plans, completion tracking, or agent instructions are growing without bound.

This skill is intentionally opinionated. Unless the Human specifies otherwise or the repository already has a coherent equivalent, apply the default structure, status language, and documentation-routing protocol below. Consistency across projects is a feature.

The skill manages two related concerns:

1. **Lifecycle:** where current, completed, and historical information lives.
2. **Routing:** which documents an agent should read for a specific task.

The goal is not merely to shorten files. The goal is to create a durable information lifecycle:

- **Hot:** concise documents agents must read for current work.
- **Warm:** completed initiative records and occasionally consulted operational detail.
- **Cold:** historical decisions, superseded plans, migrations, and release evidence.

Completed detail leaves the active context surface but is never silently destroyed. Agents load deeper context only when the task requires it.

# Invocation modes

Infer the mode from the Human's request:

- **Setup** (default): inspect the repository and install the opinionated project-local documentation lifecycle and routing policy without creating a new agent-instruction file.
- **Adopt:** run Setup as needed, then create or update a thin project-root `AGENTS.md` binding so future project agents using harnesses that honor `AGENTS.md` automatically receive the documentation authority and reading rules.
- **Audit:** remain read-only and report authority conflicts, duplication, stale status, context cost, routing gaps, and compaction candidates.
- **Compact:** move completed detail into durable records and replace it with concise links.
- **Check:** verify that an existing policy, source-of-truth map, roadmap summary, archives, routing table, `AGENTS.md` binding, and links remain consistent.
- **Route:** given a concrete task, return the minimum required document set, optional conditional references, and documents that should not be preloaded. Route mode is read-only.

If the Human invokes the skill without specifying a mode, use **Setup**. Setup establishes the policy and structure; it does not perform a large historical migration or create a new `AGENTS.md` unless the Human explicitly asks for compaction or Adopt mode. Treat `$documentation-lifecycle adopt` and an explicit request to install the convention into project agent instructions as Adopt mode.

# Opinionated default structure

Use this semantic structure unless the repository already has a clearly equivalent, internally consistent convention:

```text
AGENTS.md                        # thin automatically loaded binding in Adopt mode
ROADMAP.md                       # sole mutable status, priority, and sequence authority
docs/
  README.md                      # documentation map, task router, and minimal reading order
  architecture.md               # current implemented architecture, when applicable
  usage.md                       # current user-facing behavior, when applicable
  operations.md                  # current operational behavior, when applicable
  completed/
    <initiative-slug>.md         # durable completion record
  decisions/
    YYYY-MM-DD-<slug>.md         # accepted and superseded decisions
  ideas/
    <idea-slug>.md               # non-authoritative design exploration
CHANGELOG.md                     # released user-visible changes, only when the project releases them
```

Rules for applying the structure:

- Do not create empty directories or placeholder files.
- Reuse coherent equivalents such as `docs/adr/`, `docs/history/`, or `docs/runbooks/`; record their semantic role instead of renaming for cosmetic uniformity.
- Create `ROADMAP.md` when no canonical roadmap exists and the Human asked for Setup.
- Create or update the project-root `AGENTS.md` only in Adopt mode. Setup may add a concise pointer to an existing authoritative agent-instruction file but does not create one.
- Create `docs/README.md` when documentation has multiple classes or no concise map. For a very small repository, a concise documentation map in the root README is acceptable.
- Create current-behavior documents only when the project actually needs that class. Never generate empty architecture, usage, or operations prose.
- Prefer stable initiative slugs for completion records; record the completion date inside the file rather than renaming the path later.
- Do not create a second plan, tracker, or roadmap.

# Opinionated status vocabulary

Use these exact primary states unless the project has a stronger established contract:

```md
- [ ] **Proposed:** intended but not implemented.
- [ ] **Active:** explicitly authorized work or evidence collection is underway.
- [ ] **Deferred:** waiting on a named authority, decision, environment, or dependency.
- [x] **Shipped:** repository-evidenced product behavior.
- [x] **Completed:** repository-evidenced non-product milestone.
- [x] ~~Item~~ — **Canceled:** reason.
- [x] ~~Item~~ — **Superseded:** reason; replaced by link.
```

Successful work is never struck through. A checked parent cannot contain an open required child. Every initiative has exactly one authoritative mutable status marker.

# Opinionated ROADMAP.md shape

Use this order by default:

```md
# <Project> roadmap

<One-paragraph authority and scope statement.>

## Status legend

## Roadmap maintenance policy

## Current honest status

> <Short factual paragraph.>

## Milestone summary

### Active
### Proposed
### Deferred
### Shipped and completed

## Near-term recommended sequence

## Initiative details

<One section per active, proposed, or deferred initiative.>

## Shipped and completed index

<One checked line per compacted initiative, linking to its completion record.>

## Definition of done
```

The milestone summary is link-only navigation grouped by status; it is not a second checklist. Primary status markers live in initiative detail while work is open and in the concise shipped/completed index after compaction.

The current honest status should answer, in one short paragraph:

- what exists now;
- what is actively underway;
- what the highest-priority next work is;
- what is blocked or intentionally deferred; and
- the most important limitation preventing a stronger product-status claim.

# Opinionated docs/README.md shape

When a documentation map is warranted, use this concise structure:

```md
# Documentation map

## Agent reading rule

Read only the task-relevant current sources identified below. Do not preload
archives, completion records, all decisions, or all design ideas.

## Source-of-truth map

| Document or class | Owns | Authority |
| --- | --- | --- |

## Documentation router

| Task type | Always read | Read when relevant | Do not preload |
| --- | --- | --- | --- |

## Lifecycle destinations

| Temperature | Content | Default destination |
| --- | --- | --- |
```

Keep this map short. It routes agents to authoritative documents; it does not summarize every document or duplicate their content.

# Non-negotiable invariants

1. **One mutable status authority.** Roadmap progress, project status, and completion must each have exactly one canonical mutable source. Summaries and dashboards are derived navigation views, not competing checklists.
2. **Preserve before pruning.** Never remove substantive scope, rationale, sequence, dependencies, decisions, acceptance outcomes, limitations, or evidence until its durable destination is verified.
3. **Current truth before history.** Promote shipped behavior into current architecture, usage, operations, configuration, security, or API documentation before archiving the implementation plan.
4. **No false completion.** Plans, patches, worker reports, or passing narrow checks do not prove an initiative shipped. Use repository-grounded behavior and applicable validation.
5. **No archive authority.** Completed records and historical plans explain what happened; they do not regain mutable roadmap authority.
6. **Stable navigation.** Preserve or update inbound links when moving content. Prefer a concise replacement link over a broken historical reference.
7. **No context dumping.** Do not copy the same completed evidence into the roadmap, completion record, changelog, and architecture docs. Put each fact in its proper canonical class and link to it.
8. **No sensitive history.** Never archive credentials, private sessions, raw transcripts, hidden reasoning, mutable runtime state, or sensitive logs.
9. **Semantic consistency over cosmetic churn.** Apply the default structure when no good convention exists; preserve coherent existing equivalents instead of renaming them only to match this skill.
10. **Progressive disclosure.** Read summaries, headings, and relevant ranges first. Follow links or load whole documents only when the task still lacks an authoritative answer.
11. **Thin agent bootstrap.** `AGENTS.md` owns only mandatory agent behavior and exact pointers. Keep lifecycle bindings under roughly 10 lines or 120 words; keep tables, templates, rationale, and history in linked documents.
12. **Deletion remains deliberate.** A large move, document deletion, or ambiguous source-of-truth replacement requires an exact migration map and explicit Human authority when repository instructions require it.

# Workflow

## 1. Read authority first

Use the already-loaded repository and user instructions. Do not search for additional agent instruction files.

Inspect only relevant documentation entry points and references, such as:

- root README files;
- roadmap, plan, backlog, or implementation-tracking documents;
- architecture and current-behavior documentation;
- ADRs or decision records;
- changelog and release-validation records;
- docs index files;
- existing archive, history, completed, or ideas directories.

Inventory links to any document that may move. Do not read every document in full merely to build the inventory; use directory structure, headings, summaries, and targeted references first.

## 2. Build a source-of-truth map

Classify each relevant document internally:

| Class | Owns | Typical temperature |
| --- | --- | --- |
| Agent/repository instructions | Stable execution rules and reading order | Hot, extremely concise |
| Roadmap/backlog | Current priority, status, sequence, blockers, concise outcomes | Hot |
| Documentation map/router | Source ownership and task-to-document selection | Hot, extremely concise |
| Current architecture/usage/API/operations | Behavior that exists now | Hot or warm |
| Completion record | Delivered scope, evidence, limitations, historical implementation detail | Warm |
| ADR/decision log | Accepted or superseded decisions and rationale | Warm or cold |
| Changelog/release record | User-visible release history | Warm or cold |
| Ideas/design exploration | Non-authoritative alternatives and open questions | Cold until activated |
| Superseded plans/migrations | Historical execution detail | Cold |

Identify duplicated mutable status, mixed current/history content, stale links, missing task routes, and documents that every agent loads despite being mostly completed history.

## 3. Resolve structure

Apply the opinionated default when no coherent structure exists. When an existing convention is coherent, map it to the same semantic classes and preserve its paths.

A convention is coherent only when:

- each mutable fact has one authority;
- current behavior is distinguishable from proposals and history;
- completed detail has a durable destination;
- agents have a short documented read order and task router; and
- moving or archiving material does not break navigation.

Mere age or widespread use does not make a duplicated status or read-everything convention coherent.

## 4. Establish the policy

Prefer this policy location order:

1. A concise `Roadmap maintenance policy` section in `ROADMAP.md` for roadmap lifecycle rules.
2. `docs/README.md` for the documentation class map, router, and agent reading order.
3. Existing repository/contribution documentation for broader documentation rules.
4. Only if none fits, `docs/documentation-lifecycle.md`.

The installed policy must state:

- canonical mutable status authority;
- default Hot/Warm/Cold paths;
- status vocabulary;
- completion-compaction procedure;
- maintenance triggers;
- task-to-document routing rules;
- minimal agent reading order;
- preservation and link requirements; and
- definition of done.

## 5. Establish the roadmap

During Setup:

1. Preserve all existing substantive initiative material.
2. Normalize the top of the roadmap to the default shape.
3. Add one honest current-status paragraph.
4. Add a link-only summary grouped by status.
5. Add or reconcile the near-term sequence.
6. Add the definition of done.
7. Leave detailed active/proposed/deferred initiative sections intact unless they duplicate another authoritative source.
8. Identify completed sections eligible for later compaction; do not perform a large migration unless requested.

## 6. Compact completed initiatives

Compaction is mandatory when an initiative transitions to **Shipped**, **Completed**, **Canceled**, or **Superseded**, unless its detail is already concise.

For each initiative:

1. Verify terminal status and applicable evidence.
2. Update canonical current-behavior documentation.
3. Create or update `docs/completed/<initiative-slug>.md`, or the repository's coherent equivalent.
4. Preserve delivered scope, important decisions, acceptance evidence, known limitations, and relevant release or commit references.
5. Replace the large roadmap section with one authoritative checked line in the shipped/completed index and link it to the completion record.
6. Update the current status, milestone summary, and recommended sequence in the same change.
7. Remove obsolete execution instructions only after their destination and inbound links are verified.

Default completion-record shape:

```md
# <Initiative>

- Status: Shipped or Completed
- Completed: YYYY-MM-DD
- Current behavior: <links to canonical docs>
- Roadmap entry: <stable link>

## Delivered scope

## Decisions and boundaries

## Acceptance evidence

## Known limitations and deferred follow-ups

## Historical implementation record
```

Default compact roadmap record:

```md
- [x] **Shipped:** <one-sentence outcome>. [Completion record](<relative-link>).
```

Canceled and superseded work may use `docs/completed/` when it produced durable learning; otherwise preserve the concise struck-through roadmap record and link to the relevant decision.

## 7. Apply maintenance triggers

Run a maintenance pass when any of these occurs:

- an initiative changes terminal status;
- a milestone or release closes;
- completed material exceeds roughly one third of the active roadmap;
- the roadmap exceeds roughly 400 lines and agents must skip history to find current work;
- status is duplicated across documents;
- the documentation router no longer covers a current document class or common task;
- an archive link breaks; or
- a historical document starts being treated as current authority.

The one-third and 400-line values are default review triggers, not deletion quotas. Preserve useful content regardless of size.

## 8. Handle completion rates honestly

Default to status counts or fixed milestone gates:

```text
Shipped: 4
Active: 1
Proposed: 6
Deferred: 2
Blocked: 0
```

Do not add a percentage unless the Human requests one or the project already has a fixed-scope milestone model.

If a percentage is required:

- define and version the denominator;
- calculate only from fixed leaf-level acceptance outcomes;
- show the fraction as well as the percentage;
- specify treatment of deferred, canceled, and newly added scope;
- generate the value when practical instead of editing it manually.

Never present a changing backlog percentage as objective project completion.

## 9. Install the documentation router

Use this default router and adapt paths to the repository:

| Task type | Always read | Read when relevant | Do not preload |
| --- | --- | --- | --- |
| Status or planning | Roadmap current status, summary, sequence, relevant initiative | Linked idea or decision for a disputed boundary | Completion archive, unrelated current docs |
| Implementation | Relevant current architecture/API/module docs | Roadmap initiative for scope; decision records for established boundaries | All ideas, all decisions, completed initiatives |
| Bug fix | Current behavior and affected subsystem docs | Completion record or decision only for regression/history | Entire roadmap history, unrelated archives |
| Architecture change | Current architecture and relevant roadmap initiative | Specific decisions, security, operations, or ideas | All historical plans and completion records |
| Deployment, installer, or release | Operations and release validation | Architecture, security, migration, relevant roadmap initiative | Unrelated ideas and completion records |
| Documentation-only change | Documentation map and target document | Source document whose behavior is being described | Whole codebase documentation set |
| Historical investigation | Relevant completion and decision records | Changelog, migration, or superseded plan | Unrelated current docs |

During Setup, add a short router pointer to an existing authoritative repository-agent instruction document only when appropriate. Setup must not create a new agent-instruction file solely for that pointer. Adopt mode owns explicit project-root `AGENTS.md` creation and reconciliation below.

Keep the full routing table in `docs/README.md`; never duplicate it in agent instructions.

Install this progressive loading protocol:

1. Read already-loaded repository instructions.
2. Read the roadmap current-status summary only when status, scope, priority, or acceptance criteria matter.
3. Classify the task using the router.
4. Read document headings, summaries, or targeted ranges before whole large documents.
5. Follow links only when the current source does not answer the prerequisite question.
6. Load decisions when changing or questioning an established boundary.
7. Load ideas only for future design work.
8. Load completion records and historical plans only for regression, provenance, or historical investigation.
9. Stop once authoritative task prerequisites are satisfied.

## 10. Bind the lifecycle to project AGENTS.md

In **Adopt** mode:

1. Run Setup first when the lifecycle, roadmap authority, documentation router, archive destination, or definition of done is missing or inconsistent.
2. Resolve the project root from the current repository. Target only its root `AGENTS.md` by default. Never modify a user-global instruction file or a nested subtree instruction file unless the Human explicitly selects that scope.
3. Inspect ownership before editing. If the target is a symlink, generated file, vendored file, or externally managed path, update the clear portable source only when current authority permits it; otherwise stop and ask rather than replacing or dereferencing it accidentally.
4. Create the project-root `AGENTS.md` when absent. Explicit Adopt invocation authorizes this one documentation file; no other invocation mode does.
5. Create or reconcile exactly one `## Documentation lifecycle` section. The operation is idempotent: update that section in place, preserve unrelated instructions, and remove obsolete duplicate lifecycle pointers.
6. Keep the section under roughly 10 lines or 120 words. Use the actual canonical paths selected for the project rather than assuming the default filenames.
7. Include only:
   - the sole mutable roadmap/status authority;
   - the documentation router and read-only-what-is-relevant rule;
   - the preserve-before-compaction rule and completion-record destination; and
   - links to the full maintenance policy and definition of done.
8. Do not copy routing tables, completion templates, lifecycle rationale, initiative status, historical evidence, or archive contents into `AGENTS.md`.
9. State in the final report that already-running agents may require a new session or context reload before the new project instruction is active.

Default binding when the project uses the opinionated paths:

```md
## Documentation lifecycle

- `ROADMAP.md` is the sole mutable authority for project status, priority,
  sequence, and completion tracking.
- Use `docs/README.md` as the documentation router. Read only the current,
  task-relevant sources it identifies; do not preload all decisions, ideas,
  completion records, or historical plans.
- Before compacting completed work, update current behavior documentation and
  preserve substantive implementation detail under `docs/completed/`.
- Follow the full maintenance and definition-of-done policies in `ROADMAP.md`;
  keep this section concise rather than duplicating them here.
```

Adapt the wording and links when the project preserves coherent equivalent paths.

## 11. Route a concrete task

In **Route** mode:

1. Parse the task into status/planning, implementation, bug fix, architecture, deployment/release, documentation, historical investigation, or a repository-specific class.
2. Read the documentation map/router and only enough repository structure to resolve paths.
3. Return three ordered groups:
   - **Must read:** minimum authoritative documents or sections required before acting.
   - **Read if triggered:** documents needed only for named conditions.
   - **Do not preload:** likely but unnecessary context for this task.
4. Name relevant sections or line ranges when a whole document is unnecessary.
5. Explain each selection in one short phrase.
6. Do not edit files, expand scope, or read the routed documents in full unless the Human also asked to perform the task.

Default Route output:

```md
## Must read

1. `path` — reason; relevant section.

## Read if triggered

- Condition → `path` — reason.

## Do not preload

- `path or class` — why it is unnecessary now.
```

## 12. Verify

For Setup, verify:

- every summary item resolves to one authoritative roadmap record;
- every status agrees with the current honest status;
- no substantive content was discarded;
- archive and documentation-class paths are documented;
- the router covers common repository task classes without routing everything to everything;
- agent instructions contain at most a concise router pointer, not a duplicated policy;
- the minimal read order is clear;
- links and anchors remain valid; and
- applicable documentation formatting, link, generated-doc, and repository checks pass.

For Adopt, additionally verify that the project-root binding is the only lifecycle section, stays within the thin-section limit, names the actual canonical paths, preserves unrelated agent instructions, and points to complete durable policy. Confirm whether a new agent session is required to observe it.

For Compact, additionally verify every move, inbound link, current-behavior destination, and completion record before removing original detail.

For Route, verify that every Must-read item owns a prerequisite fact for the concrete task and remove any item justified only as generally useful background.

# Decision points

Ask the Human only when repository evidence cannot resolve a materially different choice, such as:

- two documents both claim canonical status authority and neither is clearly newer;
- externally published links make a move or deletion risky;
- the project must choose between release-based and initiative-based archives;
- a completion percentage requires a product decision about its denominator;
- substantive content has no safe durable destination;
- common task classes require materially different routing strategies;
- the project-root `AGENTS.md` is generated, symlinked, externally managed, or conflicts with a higher-authority instruction source; or
- the Human explicitly rejects one of the opinionated defaults.

Otherwise apply the default structure and proceed.

# Final report

Report:

- the canonical mutable status source;
- the Hot/Warm/Cold document classes and paths;
- which opinionated defaults were applied and which existing equivalents were preserved;
- the completion-compaction rule and triggers;
- the documentation router and minimal agent read order;
- whether Adopt created or updated the project-root `AGENTS.md`, the exact section installed, and whether new agent sessions must reload it;
- documents changed or created;
- content moved, preserved, or intentionally left for later compaction;
- validation performed and remaining gaps.
