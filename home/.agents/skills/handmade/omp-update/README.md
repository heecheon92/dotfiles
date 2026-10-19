# OMP update review

An installable agent skill with a small, local JSON checkpoint. Tern (or another
verified installation owner) handles the binary; the skill explains releases,
reviews configuration impact, and records the last successfully reviewed version.
An automatic binary update no longer means its changes have already been reviewed.

## Install without Nix

Requires macOS or Linux, Python 3.9+, Git to clone, and OMP on PATH when reviewing.
No Python packages, database server, daemon, or model requests are needed by the helper.

```sh
git clone https://github.com/heecheon92/dotfiles.git
python3 dotfiles/home/.agents/skills/handmade/omp-update/install.py
```

This links the entire package into `~/.agents/skills/omp-update`. Keep the clone
in place; pulling it updates the linked skill and helper together. The directory
is self-contained and may also be copied elsewhere before running its installer.
Restart/reload your agent to discover the skill. The installer does not update
OMP, initialize review state, or overwrite an existing skill. A link already
pointing to this package is accepted without changing it, including a Home Manager link.

For a different skill discovery directory:

```sh
python3 dotfiles/home/.agents/skills/handmade/omp-update/install.py \
  --skills-dir "$HOME/.omp/agent/skills"
```

Use one discovery location rather than registering duplicate copies. If there is
an existing conflicting skill, inspect its ownership and migrate it explicitly;
there is intentionally no force-overwrite option.

## Home Manager

This repository already selects `handmade/omp-update` in `home.nix`. That selection
links the same complete directory into `~/.agents/skills/omp-update`; `home.packages`
provides Python 3. The standalone installer is not run during activation.
Use the repository's normal Home Manager/rebuild procedure when first installing
its links or Python. Changes to the linked skill itself require no rebuild.
There is no second helper copy or separate global command to keep synchronized.

## Use

Invoke `$omp-update` in an agent that supports skills. The skill distinguishes
**installed**, **last reviewed**, and **offered** versions. It reviews all releases
since the checkpoint, even when Tern already installed them. A supported owner
update can still be reviewed before installation; unavailable Tern update controls
do not prevent catch-up review of a known installed version.

For a read-only status check:

```sh
python3 "$HOME/.agents/skills/omp-update/scripts/review_state.py" status
```

The default checkpoint is:

```text
${XDG_STATE_HOME:-$HOME/.local/state}/omp-update/review-state.json
```

`status` creates no directories or state. It reports `uninitialized`, `catch-up`,
`current`, `version-regression`, or `channel-mismatch`, plus a revision token.
A missing checkpoint is **not** silently initialized to the installed version.
The skill asks you to confirm a previously reviewed version, or explicitly choose
a current-version audit without claiming that earlier releases were reviewed.

`OMP_PROFILE` (or `PI_PROFILE`) selects a separate profile checkpoint under
`omp-update/profiles/`. Use the same environment as your OMP session. For a CLI
`--profile`, set `OMP_PROFILE` for the helper too. `--state-dir` provides an explicit
alternative scope; pass it consistently to every command. Checkpoints track
release/configuration review for this machine/profile, not every project in the
world and not later manual edits to configuration.

## Recording a review

The agent should perform these operations only after the corresponding explicit
baseline choice or completed review. Examples use illustrative versions; do not
copy them as claims about your review history.

```sh
HELPER="$HOME/.agents/skills/omp-update/scripts/review_state.py"

# First use only: record a historical baseline you explicitly confirm.
python3 "$HELPER" baseline --version 18.11.1 --channel stable \
  --expected-revision missing --confirm-reviewed

# Save this status result's revision token before reviewing the release range.
python3 "$HELPER" status

# After briefing, required migrations, and verification are complete:
python3 "$HELPER" complete --version 18.12.2 --channel stable \
  --expected-revision REVISION_FROM_STATUS --confirm-reviewed
```

For an explicitly chosen first-use current-version audit, `complete` accepts
`--expected-revision missing` after verification. `baseline` cannot reset an
existing checkpoint or select a version newer than the installed binary.
Audit/check/plan-only skill invocations never write either kind of checkpoint.

The helper rechecks the installed version/channel, rejects stale revisions and
backward movement, uses a process lock, and atomically replaces a mode-0600 JSON
file. Malformed state is preserved, not repaired by guessing. Keep the original
revision token: fetching a new one to bypass a concurrent-change error is unsafe.
`--confirm-reviewed` is a caller attestation; software cannot prove an agent
actually performed a complete review. If required work is deferred, leave the
checkpoint unchanged. Optional features deliberately left disabled do not block it.

Only the schema version, profile, reviewed version/channel, and completion time
are stored. Credentials, configuration contents, and conversation transcripts are
not stored. State belongs outside Git and is not managed by Home Manager.

## Limits

- This is an on-demand review workflow, not an automatic update notification service.
- It cannot prevent Tern from installing a release before you review it.
- It does not replace Tern's binary, remove ownership markers, modify PATH, or
  update a shadowed standalone OMP installation.
- It does not infer provider availability from a catalog or perform paid inference.
- Channel changes and downgrades are surfaced rather than silently accepted.
- Checkpoint files are local attestations, not tamper-proof audit records.

## Verify the package

```sh
python3 -B -m unittest discover \
  -s home/.agents/skills/handmade/omp-update/tests -v
```

The suite uses isolated fake executables and temporary directories to exercise
catch-up, version/channel drift, stale writers, lock contention, malformed files,
profile separation, and installer conflict preservation. No real checkpoint,
OMP installation, account, or model is modified by the tests.
