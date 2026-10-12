---
name: herdr-update
description: "Use when checking or installing Herdr core and existing managed-plugin updates to explain every feature, command, hotkey, and plugin-skill change alongside an owner-aware migration that protects live panes and processes, asking only material decisions."
---

# Purpose and authority

Treat **feature/workflow briefing** and **safe configuration/plugin migration** as equally important deliverables. Discover exact core and existing-plugin targets, read the complete release/commit ranges, explain changed workflows even when disabled locally, migrate only approved active sources, and distinguish installed files from activation in live clients, servers, and plugin instances. Do not merely replace executables or ask the user to read changelogs.

```text
Discover core + installed plugins → Release/commit ledger → Briefing + Local-impact triage
                                → Material decisions → Exact ordered plan → Apply + Reconcile
                                → Verify → Features + Impact-sorted migration outcomes
```

Invocation sets authority:

- `$herdr-update`, `update Herdr`, or equivalent explicit wording authorizes the stable core update through its actual package owner, normal reviewed updates of **existing installed managed plugins** to their latest appropriate upstream targets, and safe deterministic configuration maintenance. Once material decisions are resolved, show the exact ordered plan and proceed without redundant core/plugin-update approval.
- An explicit `core-only` request excludes plugin mutation; inspect compatibility as needed and report available plugin updates separately. Never expand a narrowed scope.
- `audit`, `check`, or `review the update` is read-only: inspect, brief, and report a plan, but do not edit, install, refresh package catalogs through mutating commands, or reload configuration.
- Creating or editing this skill is **skill authoring**, not authorization to update Herdr or control the live session. Work on the skill sources only.
- Ask one intent question only if execution versus audit is genuinely ambiguous.
- Update authority excludes new/source-list-only plugins, removed-plugin reinstalls, plugin removal/replacement, integrations, new permission grants or credentials, optional-feature activation, remote hosts, channel changes, experimental handoff, stopping/restarting servers, new panes, commits/pushes, and broad system/Home Manager activation. These require explicit scoped authorization. Ordinary audited build/install steps necessary for a planned managed-plugin update are in scope, not optional-feature demonstrations; new hooks, dependencies, data migrations, or materially changed effects require a separate decision.

Default to stable without switching channels. If discovery finds preview, a development checkout, or another non-stable track, preserve it and resolve the update scope as a material decision before mutation. Do not downgrade or change channels automatically.

# Safety contract

- Before runtime inspection/control, load `skill://herdr` and verify `HERDR_ENV=1`. Follow its installed-CLI discovery, explicit-target, and caller-context rules. If the environment gate fails, do not inspect/control the focused session; package/filesystem discovery may continue, with live checks explicitly unavailable. Never run bare `herdr` inside Herdr.
- Use scoped, read-only metadata. No focus changes, pane input, pane/agent text reads, new panes, or optional-feature demonstrations are needed for an update. Do not collect transcripts, command arguments, environment dumps, auth state, or unrelated private workspace details.
- Never stop the pane/server hosting this assistant. Never kill the main Herdr process. A server stop ends its pane processes; a binary/config backup does not preserve them. Session save/restore is not proof that live processes survive.
- Do not use core/plugin installer or channel mutations for discovery. Do not invent `herdr update --check` or `herdr plugin update`; inspect installed help and version-pinned installer source. `herdr channel set …` installs the selected channel, not merely a preference. Never run an install to discover whether it is safe, or treat `--yes` as trust/permission approval.
- `herdr update` is for Herdr's direct installer only. Homebrew, mise, Nix, and other managed installs must use their owner. `--handoff` is experimental, is not implied by an update, and does not apply to package-manager updates.
- Resolve writable ownership. Never patch Nix store/output links, package artifacts, generated plugin blocks, session databases, logs, caches, or local runtime state into the repository. Preserve unrelated dirty work.
- Explain cost, credential, permission, privacy, platform, and dependency consequences using sources. Never grant access, contact remote hosts, install optional dependencies, or send agent/provider requests just to demonstrate a feature. Fetching upstream release/source metadata is discovery, not authorization to execute upstream code.

# 1. Discover the exact boundary

Start with installed syntax, not assumptions:

```sh
command -v herdr
herdr --version
herdr --help
```

Resolve the executable's real path and relevant alternate PATH candidates to detect shadowed installs, wrappers, or mise shims. Record platform/architecture, invoked path, real executable, binary version, installation receipt/source, package owner, package identity/pin, and relevant configuration location. A symlink or directory name alone does not establish ownership.

When the runtime gate permits it, use installed help to confirm read-only status/config/channel commands before calling them. Current documented status inspection includes:

```sh
herdr status server --json
```

Record separately:

- installed binary version and protocol/endpoint generation when obtainable,
- connected live client version, or `Unverified` if not exposed,
- caller's server/session endpoint, server version, protocol/endpoint generation, and reported compatibility,
- effective direct-installer channel or package-owner track/pin, and its evidence,
- exact package/updater-offered target for this platform and architecture, with metadata revision/time and evidence.

Do not equate the CLI executable with the already-running TUI client. Do not treat unequal versions as automatically incompatible, or infer compatibility from equal version numbers alone. Report a discovered client/server mismatch even if no update is offered.

Discover the target from the **actual installation owner**, not GitHub `latest`:

- **Homebrew:** inspect the installed receipt and `brew info --json=v2 herdr` (or the verified actual formula/cask identity). Distinguish installed versions from the offered stable version, revision, bottle/platform availability, and pin state. Record catalog freshness; do not run `brew update` as a read-only audit. Preview the exact owner upgrade command and any unrelated dependencies it would change before execution.
- **mise:** inspect its installed tool/version and configured source/constraint. Use the installed mise help to find read-only resolution of the version offered by that same backend and constraint; do not assume registry Herdr and a GitHub backend are interchangeable. `mise use` is a mutation, not discovery.
- **Nix:** inspect the active profile/flake owner, input/package pin, and lock revision. Resolve the proposed package derivation/version from that owner's authoritative input without updating the lock as discovery. A pinned tag may offer no newer package until an explicitly planned pin change. Do not use a broad `nix flake update` or system activation as a shortcut.
- **Direct installer:** inspect installed update/channel help, installer ownership metadata, and the installed updater's version-pinned source to locate the read-only release/channel metadata and platform asset it actually consumes. Fetch that metadata without executing the updater. Confirm it yields the exact same target selection, not merely a newer GitHub release.
- **Manual/custom owner:** locate its documented package/release selection and writable source. If no authoritative offered target can be established, stop before mutation; do not replace it with a guessed installer.

If core metadata is stale/unavailable or its exact offered target cannot be proved, report the prerequisite needed and stop that track before mutation rather than guessing; independently safe plugin review may continue. Recheck the owner-offered target immediately before installation. If it drifts, stop that operation and review the added release range, impacts, decisions, and plan before installing.

## Inventory existing plugins and resolve exact targets

Use installed plugin help and supported read-only metadata to inventory **all installed plugins, enabled and disabled**. For example, Herdr 0.9.1 exposes `herdr plugin list --json`; verify support on the actual installed CLI before use. Cross-check the registry with its owned checkout/manifest and active config without reading credentials. A source registry is not the installed inventory: never install entries merely listed there, restore a removed plugin, or enable a disabled plugin.

For each stable plugin ID, record:

- Source owner/repository/subdirectory, resolved local path, installation method/owner (managed checkout, package-owned, or linked), and source evidence.
- Ref policy (release/tag, explicit commit/branch pin, or unpinned default branch), installed **actual commit SHA**, manifest/display version separately, and clean/dirty status. A version string alone cannot prove freshness.
- Enabled/disabled state, config/state ownership, plugin-owned skill/link destinations, published minimum Herdr version and actual API/protocol use, runtime/build dependencies, and external binary/runtime versions and owners.
- Latest appropriate upstream target and exact SHA, its release/ref selection evidence, and whether it is eligible, pinned, unsupported, deprecated, or deferred.

For a verified release-tracking policy, select the latest appropriate stable release and resolve its tag to a commit. For a tracked branch, resolve its current HEAD without switching branches; otherwise use upstream default-branch HEAD resolved to an exact SHA. Absence of tags or an unchanged manifest version does **not** mean no update. Record latest available separately from the currently allowed target. Preserve deliberate fixed tag/commit pins; ask before advancing them or changing a tracked branch/release policy. Advancing a commit within an established tracking policy is a normal update, not a pin change. Report linked or locally dirty user code without overwriting it; a custom migration requires explicit authority.

Distinguish an intentional user pin from the exact SHA used to make an update reproducible. An installer's recorded `--ref <SHA>` alone does not establish a permanent user pin. Preserve the original tracking policy in its existing supported owner/metadata when possible; never silently convert tracking into permanent pinning or erase an intentional pin. If provenance cannot resolve that distinction, ask once rather than guessing.

Check target manifest existence and upstream deprecation/removal notices before planning installation. A deleted manifest or deprecated project stops automatic update for that plugin; do not auto-uninstall, reinstall, or choose a replacement. Ask about any active removed workflow. A separate browser skill such as `terminal-browser` is not implicitly a replacement plugin or permission to restore `official.browser`.

Core and plugin discovery are independent tracks. A current core does not stop plugin review/update. Report no updates only when neither in-scope track has an available update; candidates withheld by pins, incompatibility, or missing evidence are **deferred/blocked**, not current. Report latest available, pins/blockers, and existing client/server mismatch. Do not force a reinstall, channel switch, plugin enablement, or server restart to manufacture an update. If core is blocked, still assess plugins that can safely update against the **live** version; do not blindly abort all plugins or update them all.

# 2. Read every release and pin behavioral evidence

Official starting points:

- [Installation/update lifecycle](https://herdr.dev/docs/install/)
- [Herdr releases](https://github.com/herdrdev/herdr/releases)
- Release tag API: `https://api.github.com/repos/herdrdev/herdr/releases/tags/v<VERSION>` (verify the actual tag spelling).
- [Herdr source](https://github.com/herdrdev/herdr): resolve the target release tag to a commit, then use commit-pinned source links and that version's documentation.

Read **every release in `(installed binary, offered target]`**, not just the target notes. Follow comparison links and version-pinned docs/source wherever notes lack exact behavior, syntax, defaults, or migration details. If a live server/client lags the installed binary, also review the relevant intervening releases for activation and compatibility; label that supplementary range separately. Unversioned current docs are a navigation aid, not evidence for an older target.

For **each plugin**, read every relevant release and the full installed-SHA-to-target-SHA diff, including same-version commit changes. Follow commit-pinned docs, manifests, installer/build scripts, command/key registrations, and bundled skills. Add every introduced/changed/removed plugin command, flag, hotkey, workflow, substantial feature, and skill-provided capability to the same ledger; disabled plugins still receive coverage. If the installed SHA cannot be established, report that evidence gap rather than claiming the diff is complete.

Audit the planned installer/build path and dependencies for scripts/hooks, permissions, network destinations/downloads, credential access, config/state migrations, and runtime effects before executing anything. Trace the **installed Herdr version's** installer implementation, not only newest docs: does reinstall replace/reparent the existing checkout, retain config/identity/enablement/pins, run builds, or change skill links? Establish idempotency and rollback behavior from source/docs; never test destructive reinstall as discovery. Do not clone over an existing checkout or hand-edit arbitrary runtime/package artifacts to emulate an updater.

Herdr 0.9.1 help exposes `herdr plugin install <owner>/<repo>[/subdir] --ref <ref>` (and `--yes`), `herdr plugin uninstall <ID>`, `herdr plugin link <path>`, and `herdr plugin list --json`, but no plugin-update command. These are historical syntax evidence, not permission to run them on another version. If no supported update command exists, use reinstall only after the actual installed help and version-pinned installer source prove the exact-SHA `--ref` path safely updates that existing identity and preserves state. If exact pinning or those guarantees are unavailable, defer and state the prerequisite; do not invent flags, uninstall first, or use a moving branch ref.

External runtime installers are part of the review, not an automatic fallback. Resolve their exact version/artifact/digest and owner, including a script that internally selects `latest`. Use a supported exact pin or ask a material decision about a concretely reviewed target; never execute an unreviewed moving target. New dependencies/effects require the decision above even when a plugin's source SHA is pinned.

Build a ledger covering:

1. Every introduced, changed, renamed, or removed user-facing command, command group/subcommand, flag with workflow impact, hotkey, prefix binding, or gesture.
2. Every substantial feature, including optional/disabled features and client-only versus server-dependent capability.
3. Config schema, defaults, semantics, reload behavior, automatic migrations, storage/session changes, platform support, protocol/endpoint gates, package/update behavior, plugins, and integrations.
4. Internal/nonactionable fixes (these alone may be grouped by count).

Each required workflow/feature row records version/status, source, what/why/when, target-verified syntax or gesture with a concrete example, prerequisites/defaults/limits, client/server/platform surface, local intersection, impact, decision status, and verification state. No-local-impact never removes an item from briefing coverage.

For changed/removed workflows, show before/after behavior, what remains supported, and supported alternatives with semantic differences; explicitly say when none is verified. Do not invent aliases, equivalence, or removal rationale. Label related older alternatives `Pre-existing — introduced in <verified version>` or `Pre-existing — introduction unverified` rather than calling them new.

Separate **user TUI/keymap capabilities** from **agent CLI/API capabilities**. A key gesture or interactive picker is not automatically an agent command. Explain who can initiate each path and whether it changes focus, sends input, costs money, grants permissions, or affects processes. Examples are explanatory, not authorization to execute them.

For every changed hotkey/prefix binding, distinguish the target documented default from the actual local mode/keymap. Trace prefix sequences and conflicts across Herdr, terminal emulator, OS/window manager, and nested tmux/screen or another multiplexer when present. Explain precedence/passthrough and a verified alternative or unresolved conflict; do not invent a universal keyboard shortcut.

# 3. Inspect active ownership and protect live topology

Inspect only affected active sources: resolved Herdr config, keymaps, shell/launcher wrappers, package declarations, active instructions/scripts naming changed commands, installed plugin checkouts/manifests/config and owned skills, integration ownership, terminal/OS mappings, and nested-multiplexer bindings. Do not search historical sessions, memories, backups, or pane text as migration evidence. Inspection does not authorize executing a plugin, enabling it, or demonstrating a workflow.

For each affected value record effective value, source layer/precedence, writable owner, generated status, and proposed action. Distinguish runtime-local files from portable baselines and package-managed outputs. Derive paths from the current environment/repository; never hardcode a personal checkout, host label, or home directory.

Track plugin-provided skills by proven owner, installed/target paths, and symlink targets; distinguish them from user-authored skills and independently installed skills. Plan reconciliation only for that plugin's owned links after its supported update, preserving user files and unrelated skill destinations. Skill deletion or workflow replacement requires an explicit material choice; do not overwrite user-authored skills or replace the official runtime-control skill.

In this dotfiles repository, read the **current** `home.nix`, `docs/terminals-herdr.md`, `home/bin/sync-herdr-config.py`, and relevant `SYNC_GUIDE.md` before choosing an application path:

- `home/.config/herdr/config.toml` is the portable shared key/mode baseline, not a full copy of active config.
- Active `$HOME/.config/herdr/config.toml` is a writable local regular file. The existing helper three-way-merges shared keys using mode/key identity and a local previous-managed baseline; local edits/deletions take precedence. Use that established merge, not manual whole-file copying or a second merge convention.
- `home/.config/herdr/sidebar-overrides.toml` is the existing narrow authored style policy; the helper applies only its designated token properties to existing Radar blocks. This exception does not authorize manually migrating or regenerating plugin-owned blocks; use a reviewed supported plugin installer/migration for those blocks.
- Generated Radar blocks, plugin checkout/configuration, credentials, sessions, logs, backups, and merge-tracking state remain local. Never copy them into the portable baseline or source registry. Normal managed-plugin updates may change local owned artifacts only through the reviewed supported path.
- The plugin-source list records sources, not installation authority. Existing Home Manager integration management and server reload are separate side effects of rebuild; broad `./rebuild.sh` is not implied by core/plugin-update scope. Select a documented narrow merge/application path with exact side effects, or defer application and request the additional authority needed.

Before any authorized update or runtime reload, capture a sanitized **scoped metadata baseline** using supported read-only CLI operations: caller pane/server identity, affected workspaces/tabs/pane count and IDs, available shell/foreground PID and process identity metadata, and focus identity only if exposed without changing focus. Do not include process arguments or output. If metadata is unavailable, mark that acceptance check unverified; never scrape pane text to compensate. Preserve this baseline for comparison, not as a session-restore promise.

# 4. Triage and ask only material decisions

Present both the concise feature briefing and local-impact summary before questions. Classify two independent axes for every ledger item:

| Impact (sort high to low) | Meaning |
| --- | --- |
| Critical | Security/data loss, credential exposure, or update-blocking protocol/package incompatibility |
| High | Removed active capability, broken workflow/schema, or material process/session behavior change |
| Medium | Changed default, performance, UX, or bounded behavior change |
| Low | Mechanical migration, minor fix, or optional addition |
| Informational | No active local intersection or verification-only note |

Decision status: `Needs decision`, `Auto-resolved`, `Notify only`, or `Verify after update`. Impact alone does not force a question. Deterministic supported changes with unchanged semantics inside core/existing-managed-plugin scope may be auto-resolved; optional features needing no edit are notify-only but still receive a briefing. Never collapse user-facing commands/hotkeys/features/skills into counts.

Ask only when supported alternatives have material tradeoffs; active removed workflows or skill deletion/replacement need a real choice; pins must advance; defaults change behavior; ownership is unresolved; new hooks/dependencies, data migrations, credentials/privacy/cost/permission/destructive scope changes; activation would terminate processes; or required action lies outside authority. Reviewed routine builds needed for the normal update do not require redundant activation/demo approval. A hypothetical optional feature cost does not need consent unless enabling it is in scope.

Use a callable structured ask tool, otherwise plain chat. Ask **one primary material decision per round**, highest impact first, with a stable question ID, evidence/local impact, 2–3 mutually exclusive concrete choices and consequences, a conservative recommendation when justified, and a focused diff when useful. Pressure-test a consequential choice if semantics could be misunderstood. Never treat timeout selection as explicit consent. Cancellation/defer/plan-only stops mutation with an honest report.

# 5. Gate compatibility and show the exact plan

Before mutation, establish that the offered binary can safely coexist/reconnect with the live server and relevant clients, or that an explicitly authorized compatible transition exists. Check version/protocol/endpoint-generation requirements and affected plugin/config gates against pinned target evidence. A server requiring mandatory termination, an unsupported protocol transition, or unavailable migration-critical evidence can **block installation before it starts**. Do not install first and discover the only path kills this assistant's host server.

Endpoint-generation-1 server preservation and older-server mandatory-stop behavior must be verified for the actual versions/owner. Do not apply direct-updater guarantees to Homebrew/mise/Nix. If installation may safely leave a compatible old server, plan that split outcome explicitly; server-side feature activation can remain deferred.

Gate **each plugin independently** against the installed binary, actual live server/client, and proposed core target. A published minimum Herdr version is necessary evidence but not sufficient: inspect removed/renamed APIs, protocol/endpoint requirements, runtime dependencies, and the actual pinned plugin code. Do not assume a target-compatible plugin works on an intentionally retained older server.

Replacing a plugin checkout or external runtime can break already-running plugin instances even without a server restart. Establish supported live-instance quiescence/reload behavior and whether code/assets are loaded lazily. If an affected instance cannot safely quiesce without closing user panes or stopping the host server, defer that plugin and explain why. A disabled plugin stays disabled; lack of activation is not proof that a shared runtime/installer has no live effects.

Choose an ordered core/plugin transition whose every intermediate state is compatible, including a core install that deliberately leaves the old live server/client running. Separate independently safe plugins from target-only or blocked ones. If no safe order exists, defer the affected operations before mutation; never rely on a later restart to repair an unsafe intermediate state.

Show an exact plan before any mutation:

- Before/target core versions, owner/package/track, protocol compatibility evidence, and scoped live baseline.
- A per-plugin table: stable ID, enabled state, install owner/method, installed manifest version + SHA, latest available version + SHA, selected exact ref/SHA, pin policy, runtime dependency/artifact targets, compatibility with live and target versions, action/defer reason, and order.
- Exact writable files/keys and diffs, separating dual-version-safe edits, target-only edits, documented automatic migrations, plugin-owned skill-link changes, and notification-only items.
- Exact core install command and package/dependency scope; exact supported plugin update/reinstall and reviewed build commands; exact narrow config merge/validation/reload commands and side effects. Use verified syntax and exact SHAs/artifacts, not an invented updater. Reload only when compatible, necessary, and within approved maintenance; never substitute restart.
- Observable acceptance criteria, bounded supported read-only load checks, and excluded/unverified surfaces.
- A scoped binary/config backup or verified package rollback path when feasible, plus **per-plugin previous source ref/SHA and necessary config/state/skill-link/runtime backup or supported restoration path**. Keep private backups restrictive and out of version control. A CLI's own backup may cover only its binary/config, not plugin data or external runtimes; prove coverage and migration reversibility. Do not claim backup/session restore preserves live processes.
- Ordered installation versus plugin-instance activation versus client reconnect versus server activation, including deferrals and separately authorized actions.

Proceed after this preview for an explicit update with resolved material decisions, including eligible plugin-only work when core is current or blocked. Audits stop at the plan; core-only requests exclude plugin mutation. No redundant final core/plugin approval; no implied new plugin, removal/replacement, integration update, permission grant, channel switch, handoff, remote action, server stop, or broad activation.

# 6. Apply and reconcile

Back up only necessary approved source/config/binary artifacts, protecting private local config with restrictive permissions and keeping it out of version control. Edit writable owners, preserve unrelated settings and generated blocks, and use the repository's documented syntax/merge workflow. Install through the confirmed owner, then resolve the executable path/version again to detect stale PATH/shims or an unexpected target. On target drift, stop further changes and review the actual range before reconciliation.

Apply eligible plugins through their confirmed supported owner/update path in the planned order, with the reviewed ordinary build steps required to make the update usable. Immediately before each operation, recheck the selected upstream SHA/artifact, ownership, pin, dirty status, and live compatibility/quiescence gate. Stop that plugin's mutation on drift and review the newly added diff/effects; do not substitute latest branch HEAD. Preserve stable ID, config/state, explicit pins, and enabled/disabled state; never force-overwrite linked or dirty user code or silently enable a plugin.

Reconcile only proven plugin-owned skill links after a successful supported update and within the planned decisions. Preserve user-authored skills, unrelated links, and generated blocks outside the installer's ownership. Execute no demonstrations, discovery installs, arbitrary artifact patches, or unplanned external-runtime installers.

Re-read new help/schema and apply only planned target-version changes. Do not rewrite sources to suit an old live server without documenting precedence/compatibility. Do not restart a server or use handoff automatically to make a version check look successful.

A compatible mixed-version result is legitimate but must read **`Installation complete; server activation deferred`**, not full activation success or a false installation failure. Explain which client-only capabilities are available to a newly connected client and which server-side features remain unavailable. The already-running client may itself require reconnect; do not claim it updated just because the executable did. Report plugin source installation and live-instance activation separately; a deferred incompatible plugin must remain at its previous safe source/state, not be replaced in anticipation of activation.

If verification fails, stop additional mutation, preserve evidence, and report the supported recovery/rollback choice. Never improvise destructive server recovery.

# 7. Verify without disrupting work

Recheck and report separately:

- Installed executable real path/version and owner-offered target.
- Live client, server, protocol/endpoint generation, and compatibility, with unavailable facts marked unverified.
- Effective affected config and source agreement; automatic migration results; obsolete active references; affected command/subcommand help and documented target syntax.
- For every installed plugin: stable ID, actual checkout SHA versus desired/latest SHA, manifest/version metadata, pin policy, config/state preservation, enabled/disabled state, external runtime target, owned skill-link agreement, and live/target compatibility. Verify loading only through supported read-only metadata/load checks; do not invoke a plugin, create a pane, enable it, or request permission solely to verify it. Report installed-but-not-live activation honestly.
- Actual affected keymaps/prefix conflicts across the relevant layers, separating documentation from observed local mappings.
- The same scoped workspace/tab/pane count and IDs, available process/PID identity, and focus metadata from the baseline. No new panes or input, and no focus changes; unavailable preservation evidence stays unverified.
- Every required ledger row has an explanation, concrete target-verified example, boundaries, evidence, and verification state.

Use only bounded read-only smoke/load checks allowed by installed help and current compatibility. Do not enable disabled features/plugins, create disposable panes, start agents, send prompts, open remote connections, install dependencies, or grant permissions for a demo. Reviewed builds required for the planned update belong to Apply, not this verification phase. Mark features `Documented, not exercised` when only pinned docs/source support them, and unresolved details `Unverified`. Audit mode cannot claim post-update runtime verification.

# Final report: two distinct sections

## Features and workflow changes

Cover every core and plugin ledger workflow/feature/skill with version or commit/status, what/why/when, exact syntax/gesture and example, defaults/prerequisites, user versus agent surface, client/server/platform restrictions, keymap conflicts, tradeoffs, source links, and observed/documented/unverified status. Disabled features/plugins still count. If already briefed, use a compact exact-reference recap, not a feature count.

## Configuration and migration outcomes

Sort outcomes `Critical → High → Medium → Low → Informational`, omitting empty levels. Label items `User-decided`, `Auto-resolved`, `Deferred`, `Notification only`, or `No action`; cross-reference briefing rows rather than duplicating them. Include:

- Before/after installed binary **and** live client/server/protocol state, owner/offered target/channel, primary and supplementary release ranges reviewed, per-plugin release/commit ranges, and authoritative sources.
- Per-plugin stable ID, enabled state, installed version/SHA before and after, **actual latest available** version/SHA, selected/preserved pin, source/runtime owner, and outcome: updated, current, pinned, linked/dirty, deprecated/removed-manifest, or deferred with exact incompatibility/evidence/authority reason. Separate installed sources from live activation; do not call a deferred older commit latest.
- Decisions/consequences, automatic edits, exact source files changed, effective merge/application state, owned skill-link reconciliation, config/state preservation, and integration status (unchanged, inspected, incompatible, or separately authorized).
- Checks actually exercised and results, documented-but-unexercised features, unverified evidence, scoped pane/process/workspace/focus preservation, backup/rollback artifact and its limits.
- Pending activation instructions: name the exact affected server/session and target-version command from installed help, prerequisite that the user first finish/save and intentionally end its live work, and how to reconnect outside this assistant's host pane. Give concrete commands only when identifiers/syntax are verified; do not run them. Explicitly state that stop/restart terminates pane processes and restoration does not preserve them. Do not tell the user to run bare `herdr` inside the active managed pane.
- Any blocked update, deferred server-side capability, existing mismatch on a no-update result, and the precise prerequisite/authority needed. Do not report all components activated when only installation finished.

# Compact scenario checklist

Before completing an execution or audit, check the applicable cases against the rules above:

- **Core current, plugin new:** continue plugin discovery/review and apply eligible updates in execution mode; a no-core-update result is not a global stop.
- **Same manifest version, new commit / no tags:** compare actual SHAs and full diff; resolve the appropriate exact target instead of declaring current.
- **Explicit pin:** show latest available separately; preserve it until the user chooses to advance.
- **Deprecated project / removed manifest:** defer automatic update, never auto-remove/reinstall; ask about active workflow replacement.
- **Disabled plugin:** inventory/review/update only if otherwise safe, retaining disabled state and config.
- **Older live server/client:** assess actual APIs and intermediate states; defer target-only code or unsafe live-instance replacement without closing panes.
- **Linked or dirty checkout:** report available changes and ownership; do not overwrite user code.
- **External runtime installer:** require reviewed exact version/artifact pin or a material decision about a concrete target; no unreviewed `latest`.
- **Plugin-owned skills:** reconcile only proven owned links through the supported update; protect user-authored skills and ask before deletion/workflow replacement.
