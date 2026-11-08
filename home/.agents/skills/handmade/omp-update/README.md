# OMP update review

An installable agent skill with a shared release-review checkpoint. Tern (or another
verified installation owner) handles the binary; the skill explains releases,
reviews configuration impact, and records the last fully reviewed release boundary.
The shared review is independent of which version each machine has installed.

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

Invoke `$omp-update` in an agent that supports skills. Compare four facts:

1. The version installed on this machine.
2. The shared last-reviewed release.
3. The latest official stable release, which is the **review** endpoint.
4. The verified installation owner's offered target, if available.

Review releases after the shared boundary through the latest official stable
release, even when this machine is behind or its owner offers no update. GitHub
releases identify what to review, not what to install; only the verified owner
provides an install target. Do not rebrief already reviewed releases. Each update
run still checks this machine's active configuration and runtime compatibility
afresh, including its profile and project overlays. A shared review is not proof
that a release is installed or compatible on any machine.

For a read-only status check:

```sh
python3 "$HOME/.agents/skills/omp-update/scripts/review_state.py" status
```

The default checkpoint is `review-state.json` in the resolved skill package
directory, so the linked skill uses the file in this dotfiles checkout.
`status` creates no directories or state. It reports `uninitialized`, `catch-up`,
`current`, `installed-behind`, or `local-channel-mismatch`, along with the
revision token and installed and reviewed observations. An older installed
version than the shared boundary is normal. `runtimeCompatibility` is
`not-attested`: check compatibility locally instead of inferring it from the
checkpoint. The helper does not discover the latest official release or the
owner's install target.

A missing checkpoint is **not** silently initialized to the installed version.
The skill asks you to confirm a previously reviewed version, or explicitly choose
a current-version audit without claiming that earlier releases were reviewed.
The former local state at `${XDG_STATE_HOME:-$HOME/.local/state}/omp-update/`,
including profile checkpoints, is unused and is not silently imported or removed.

Profiles remain runtime observations, not separate review scopes. `--state-dir`
provides explicit isolation for tests or a separately approved channel; pass it
consistently to every command, not as an implicit machine/profile checkpoint.

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

# After the release briefing and shared configuration decisions/migrations:
python3 "$HELPER" complete --version 18.12.2 --channel stable \
  --expected-revision REVISION_FROM_STATUS --confirm-reviewed
```

For an explicitly chosen first-use current-version audit, `complete` accepts
`--expected-revision missing` after the agreed audit is complete. `baseline`
cannot reset an existing checkpoint and is not bounded by the installed version.
Audit/check/plan-only skill invocations never write either kind of checkpoint.

Completion attests the release briefing and that shared configuration decisions
and migrations have been addressed. Unresolved release-review or shared-config
decisions and required shared migrations block advancement. A machine-specific
installation, runtime migration, or verification may be explicitly deferred and
reported separately; the checkpoint is not an installation or compatibility
attestation. Optional features deliberately left disabled do not block it.

The helper enforces the stored review channel and a monotonic shared version,
rejects stale revisions, uses a process lock, and atomically replaces the JSON
file. It preserves malformed or symlinked state instead of repairing it by
guessing. Keep the original revision token: fetching a new one to bypass a
concurrent-change error is unsafe. `--confirm-reviewed` is a caller attestation;
software cannot prove that the review was complete.

Schema 2 stores only the schema version and `lastReviewed` version, channel, and
completion time: no profile, host, installation details, credentials, configuration
contents, or conversation transcripts. The lock and token protect writers in one
checkout, not concurrent clones. Git propagates the file only after an explicit
user-requested commit and push; the skill never does either automatically. Before
using another checkout, synchronize as authorized and reconcile divergent records
against evidence of completed reviews and addressed shared decisions. Retain the
highest fully reviewed boundary, not merely the highest version number.

## Limits

- This is an on-demand review workflow, not an automatic update notification service.
- It cannot prevent Tern from installing a release before you review it.
- It does not replace Tern's binary, remove ownership markers, modify PATH, or
  update a shadowed standalone OMP installation.
- It does not infer provider availability from a catalog or perform paid inference.
- A local channel mismatch is reported separately; a shared review cannot switch
  channels or move backward. Older installations are not review regressions.
- Checkpoint files are shared attestations, not tamper-proof audit records or
  evidence of installation and runtime compatibility.

## Verify the package

```sh
python3 -B -m unittest discover \
  -s home/.agents/skills/handmade/omp-update/tests -v
```

The suite uses isolated fake executables and temporary directories to exercise
review-state and installer behavior. No real checkpoint, OMP installation,
account, or model is modified by the tests.
