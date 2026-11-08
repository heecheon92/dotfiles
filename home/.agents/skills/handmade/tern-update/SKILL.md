---
name: tern-update
description: "Use when checking or updating Stencil Tern to review releases and workflows, assess local settings, and use the verified installation owner without disrupting running sessions."
---

# Purpose and authority

Review Stencil Tern releases and local compatibility independently of installing an update. Brief the user on all meaningful changes, including optional features, then plan safe, authorized migrations. This is not an OMP, Herdr, or plugin update. The product is [Stencil Tern](https://stencil.so/tern), with [product documentation](https://docs.stencil.so/tern) and a [build page](https://build.stencil.so/tern); similarly named products are not evidence for it. The build page may not expose release metadata to a text reader. Do not infer a release feed, updater, channel policy, or CLI from another product or from the bundle name.

- `$tern-update` or an explicit request to update Tern authorizes release review, a stable core update through the verified owner, and safe, deterministic settings maintenance, **only when the existing runtime is unaffected**. Preview an exact plan before changes. This does not authorize a restart, quitting or killing the app, daemon, panes, agents, or the assistant's own host. If an owner action may interrupt them, stop and obtain explicit point-of-risk authority identifying what will be affected; otherwise defer it. Never assume a background install is harmless.
- `audit`, `check`, or `review` is read-only: no installation, settings changes, baseline, or checkpoint writes. Ambiguous execution intent requires one question. Authoring or installing this skill never constitutes a release review, update, or checkpoint initialization.
- Canary changes, OMP binary updates, Herdr or other plugin updates, unrelated rebuilds, destructive cleanup, Git commit and push require separate explicit authorization. The official build page identifies stable and canary channels; do not infer the installed app's channel or an owner offer from that fact. If a safe stable target or owner action is not established, defer installation rather than substitute a website's latest build.

# Discover independently

Resolve `SKILL_DIR` to this skill's installed directory. The standard-library helper requires Python 3.9+ and POSIX facilities; it is not Windows-portable. It inspects a macOS app bundle's plist without launching Tern; it does not discover an owner, running version, channel, update offer, or runtime compatibility. On other operating systems it does not establish installation discovery; use verified platform-specific evidence or report it unavailable. No app is a valid `no-install` observation, not a reason to invent one.

```sh
python3 "$SKILL_DIR/scripts/review_state.py" status
# When the intended app is not in the default locations:
python3 "$SKILL_DIR/scripts/review_state.py" --app /path/to/Tern.app status
```

Record the returned state path and revision token, bundle version and separate build number, app path and bundle identity, discovery status, and `runtimeCompatibility: not-attested`. The default locations are `~/Applications/Tern.app` and `/Applications/Tern.app`; ambiguous distinct bundles or invalid identity require resolution, not a guess. `--state-dir DIR` before `status` selects a separately approved checkpoint; use it consistently. Failure or malformed state means stop and preserve it.

The official [build page](https://build.stencil.so/tern) uses the same-origin
`/api/products/tern/builds` inventory and identifies stable and canary builds.
The inventory returned HTTP 401 without authentication when investigated; this
does not establish what an authenticated user can access. At execution time,
use a legitimate existing authenticated UI or browser session for read-only
metadata when available. Never extract cookies or tokens to bypass access.
Seek release notes in the authenticated app/build view or official
version-specific announcements; the inventory alone is not a changelog.

Distinguish four facts: shared last-reviewed release; latest **official** release for the agreed review channel; locally installed app; and the actual owner's offered target/action. Also determine the running app and daemon independently where read-only evidence permits. A plist is not proof of the live version. An older local app than the shared boundary is normal; neither that boundary nor a successful review attests local compatibility. Inspect local compatibility afresh on each run even when no shared release is outstanding.

Find the owner from actual package receipts, app provenance and/or its supported updater UI, not an assumed website. Establish the offered version, channel, action and impact without triggering installation; respect host UI confirmation rules. A local install or its update UI may be unavailable. If official release endpoint, version-specific notes, owner, offer, safe action, running state, or support policy cannot be verified, state the missing evidence and defer the affected work. Do not invent `tern --version`, `--check`, or updater commands. A published release is the review endpoint, not automatically the install target.

# Shared review boundary

The default `review-state.json` lives in the resolved skill source directory, shared through the dotfiles checkout. It is initially absent. Schema 2 contains only `schemaVersion` and `lastReviewed` (`version`, `channel`, `completedAt`): no host, app, profile, or runtime attestation. `status` is read-only. Review progress is shared only after explicit Git synchronization; never commit or push without authorization. Concurrent Git checkouts require their own coordination: the helper's revision guard protects this checkout, not cross-machine Git races.

When the checkpoint is missing, ask one focused question: confirm a previously reviewed version, or explicitly choose a current-version audit as the baseline. Check the revision and `lastReviewed` fields even when the status is `no-install`, which takes precedence over `uninitialized`. Never infer prior review from the installed version, another machine, or this skill's creation. A current-version audit does not claim older releases were reviewed. In audit/check mode record the chosen scope only in the report, never in the checkpoint. In execution mode, record an explicitly confirmed historical baseline only after its review claim is confirmed, or a current-version baseline only after completing that agreed audit; then inspect status again and retain its new revision before reviewing further releases.

For an established boundary, review every official release in `(last reviewed, latest official release]`; do not repeat a covered briefing just because a machine is behind. Recheck the official endpoint before completion and include newly outstanding releases. Preserve the existing channel; canary requires a separately approved `--state-dir` distinct from the default and verified channel evidence. Do not silently switch channels. An unknown or incompatible channel, malformed checkpoint, unsupported version, missing release evidence, or concurrent change blocks advancement. Re-read and reconcile instead of overwriting.

After the entire agreed review and shared settings decisions/migrations are complete, and only in authorized execution mode, preview and run:

```sh
python3 "$SKILL_DIR/scripts/review_state.py" complete \
  --version REVIEWED_VERSION --channel stable \
  --expected-revision REVISION_FROM_STATUS --confirm-reviewed
```

For a first confirmed baseline, the expected revision is `missing`; use the confirmed channel, subject to the separate canary state rule. The helper enforces revision, monotonic version and channel guards. It may record a reviewed release beyond the local install; it does not attest local installation. Local installation or runtime work can be deferred explicitly, but unresolved release review or required shared migration cannot be labeled complete.

# Review and local impact

Build a release ledger from official, version-specific release notes and pinned documentation/source for every release in scope. Download and retain version-specific notes when appropriate; do not use moving latest documentation as proof of past syntax or defaults. If an official source is incomplete or inaccessible, say exactly which coverage cannot be established and do not claim a complete review. The public SDK issue tracker alone is not an exhaustive app changelog.

## Feature and workflow briefing

Make the briefing a primary output, even when no configuration changes are needed. Lead with **Worth your attention**: a small selection of changes relevant to evidenced usage, such as OMP in Tern, Git and external editor workflows with nvim, log or terminal navigation, tabs and panes, keyboard use, or readability. Use actual local evidence rather than assuming all of these are active interests, and do not assume interest means permission to enable or change anything. For each selected feature explain what it does, why it may matter, when to use it, and an exact version-verified menu, shortcut, or example. Distinguish availability in the installed and currently running versions from a feature needing enablement, update, or restart; say when those facts are unknown.

Then cover the remaining user-facing changes concisely. Personalization determines emphasis, not whether optional or disabled features are included.

For every introduced, changed, renamed, or removed user-facing feature, command, hotkey, menu, setting and default, including optional or disabled features, explain version, what it does, when and how to use it, prerequisites/platform, documented default versus observed local setting, and source. For changed or removed workflows show the old and new behavior, what remains supported, and any verified alternative; mark old alternatives as pre-existing and state if their introduction is unknown. Identify user-visible tradeoffs and distinguish documentation, local observation, inference, and untested features. Do not activate features, download dependencies, or disrupt sessions simply to demonstrate them.

## Local configuration impact

Inspect the active local preferences and their actual ownership before proposing edits. In this dotfiles setup Home Manager links only `~/Library/Application Support/Tern/settings.json` to `home/.config/tern/settings.json`; it does not own the app, daemon state, accounts, locks or agent runtime. The active file may have replaced the symlink. Compare the actual local file with the tracked source before migration; preserve the user's latest portable preferences rather than blindly copying local paths, window sizes, secrets, account or runtime state. Never publish secrets. Preserve unrelated edits and avoid touching generated stores, caches or session data. If local/source precedence or a material preference cannot be determined, ask.

For each relevant change, show the observed local value, writable source, impact, and proposed action. Separate `Needs decision`, `Handled automatically`, `Notification only`, and `Verify after update`. Optional features still receive a briefing even if no local edit is needed. Ask only material questions, one primary question per round: explain evidence and consequences, offer concrete alternatives, and recommend only when justified. Do not treat a timeout or cancellation as approval.

# Plan, apply, report

Before any mutation, present the precise target and owner action, shared range and revision, current installed and running evidence, intended file/key changes, before/after workflows, required permissions, impact on sessions, verification and rollback limitations. Recheck the owner offer before installation; if it changed, reassess and cover any newly relevant releases. Stop for a decision whenever behavior, privacy, data, destructive scope or ownership is material. A core-update request does not waive point-of-risk authorization for disruption.

Edit only authorized writable sources. If a Home Manager link needs migration, compare and preserve the active file first. Preserve any colliding `settings.json.before-home-manager` backup under a unique timestamped name; never overwrite or force it. Do not run a broad rebuild merely to install or review this skill, or assume activation succeeded. If a necessary activation is outside the user's authorized scope, propose it and defer. Do not restart the app or daemon to validate without explicit authority, especially when it hosts this assistant.

## Verify

After an installation and after checkpoint completion, rerun the helper's `status` with the same app and state scope. Confirm the expected shared version and new revision; compare the owner-installed bundle separately from the still-running app and daemon, whose versions may differ or remain unknown. Check that intended effective preferences agree with their writable source, and use supported read-only UI or command inspection for affected workflows where available. Report what was actually observed and what remains unverified. Do not restart or run optional feature demonstrations for verification.

## Report

Report the feature briefing and local impact separately, with impact outcomes ordered high to low: handled, deferred and unresolved decisions; official review boundary and checkpoint outcome; installed version, running version and owner-offered target each with evidence or unknown; settings and backup actions; tests actually exercised versus read-only metadata and features not exercised. Do not claim a runtime update, compatibility, restart, migration, or rollback succeeded without evidence. Never equate shared review completion with runtime verification.
