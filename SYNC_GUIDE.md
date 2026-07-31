# Dotfiles Sync Guide

This repository is the source of truth for the macOS development environment
managed by Nix, nix-darwin, and Homebrew.

Git synchronizes the configuration files between Macs. Nix and nix-darwin apply
those files to each Mac:

```text
git pull -> validate -> darwin-rebuild switch
```

## Important current limitation

The repository currently defines only one host:

| Flake profile | Machine | User | Homebrew installation |
| --- | --- | --- | --- |
| `Mac-mini` | Company Mac | `heecheonpark` | Existing installation; nix-homebrew takeover disabled |

Do not run `./rebuild.sh` on the home Mac until `flake.nix` contains a separate
profile matching the home Mac's `LocalHostName`.

Find the required values on a Mac with:

```bash
whoami
scutil --get LocalHostName
uname -m
```

`arm64` uses `aarch64-darwin`. An Intel Mac uses `x86_64-darwin`.

Hostnames do not need to match between machines. The profile names should match
each machine's `LocalHostName` because `rebuild.sh` selects that profile
automatically.

## Repository files

- `flake.nix`: declares dependencies and machine profiles.
- `flake.lock`: pins the exact dependency revisions. Commit this file.
- `configuration.nix`: shared macOS, Nix, and Homebrew configuration.
- `home.nix`: shared Home Manager packages and user configuration.
- `home/`: edit-in-place application configuration linked by Home Manager.
- `rebuild.sh`: selects the current host and applies its configuration.
- `SYNC_GUIDE.md`: this runbook.

## Safety rules

1. Pull before editing and push only after validation.
2. Never commit passwords, API keys, tokens, private SSH keys, certificates, or
   company secrets.
3. Keep `homebrew.onActivation.cleanup = "none"` until every package to preserve
   has intentionally been declared.
4. Keep `manageHomebrewInstallation = false` on the company Mac.
5. Review `git diff` before every commit.
6. Do not apply the company profile to the home Mac or the home profile to the
   company Mac.

## First-time repository publication

This repository currently has no commits or remote. Before using it from another
Mac, create a private remote repository and publish the reviewed files.

From this repository:

```bash
git status --short
git diff --check
nix flake check --no-build
```

Review the complete content for secrets:

```bash
git diff
git diff --cached
```

Then initialize the published history using the actual remote URL:

```bash
git branch -M main
git add flake.nix flake.lock configuration.nix home.nix home/ \
  rebuild.sh SYNC_GUIDE.md
git commit -m "Initialize portable macOS configuration"
git remote add origin <private-repository-url>
git push -u origin main
```

Do not copy the placeholder `<private-repository-url>` literally.

## Adding the home Mac

On the home Mac, clone the repository but do not rebuild yet:

```bash
git clone <private-repository-url> ~/Git/dotfiles
cd ~/Git/dotfiles
```

Inspect the machine:

```bash
whoami
scutil --get LocalHostName
uname -m
command -v brew || true
```

Ask Codex to add a separate host profile. A useful prompt is:

> Inspect this Mac and the dotfiles repository. Add a home-machine
> `darwinConfiguration` matching this Mac's LocalHostName without changing the
> company profile. Keep shared configuration reusable, enable nix-homebrew only
> if appropriate for this Mac, preserve existing Homebrew packages, run
> read-only validation, and show me the changes before activation.

After installing Nix as described below, confirm the new profile exists:

```bash
nix --extra-experimental-features 'nix-command flakes' flake show
```

The output under `darwinConfigurations` must include the exact value returned by:

```bash
scutil --get LocalHostName
```

## Installing standard Nix on a new Mac

This repository currently expects standard upstream Nix and allows nix-darwin
to manage it.

Use the official macOS installer:

```bash
curl -L https://nixos.org/nix/install | sh
```

The standard installer performs a multi-user installation on macOS. Follow its
prompts, then open a new terminal.

Verify:

```bash
nix --version
```

Official reference:
[Installing a Nix binary distribution](https://nix.dev/manual/nix/stable/installation/installing-binary.html)

Do not install Determinate Nix without first adjusting the host profile.
Determinate Nix manages its own daemon and normally requires
`nix.enable = false`, while the current standard-Nix profile uses
`nix.enable = true`.

## First nix-darwin activation

Create the stable repository link:

```bash
ln -sfn "$(pwd -P)" "$HOME/.dotfiles"
```

Bootstrap `darwin-rebuild` with the current machine's host label:

```bash
HOST_LABEL="$(scutil --get LocalHostName)"

sudo -H /nix/var/nix/profiles/default/bin/nix \
  --extra-experimental-features 'nix-command flakes' \
  run github:nix-darwin/nix-darwin/nix-darwin-26.05#darwin-rebuild -- \
  switch --flake "$HOME/.dotfiles#$HOST_LABEL"
```

The explicit experimental-feature flags are needed only during bootstrap.
After the first successful switch, this configuration enables `nix-command` and
`flakes`.

Official reference:
[nix-darwin getting started](https://github.com/nix-darwin/nix-darwin#flakes)

### `/etc/bashrc` or `/etc/zshrc` conflict

The standard Nix installer modifies these shell files and creates backups named
`*.backup-before-nix`. nix-darwin may refuse to overwrite the modified files.

First compare them:

```bash
diff -u /etc/bashrc.backup-before-nix /etc/bashrc || true
diff -u /etc/zshrc.backup-before-nix /etc/zshrc || true
```

Only when the difference is the standard Nix initialization block and there is
no company-specific content, preserve the current files:

```bash
sudo mv /etc/bashrc /etc/bashrc.before-nix-darwin
sudo mv /etc/zshrc /etc/zshrc.before-nix-darwin
```

Then retry the bootstrap command. Do not rename unfamiliar company-managed
content without reviewing it.

## Normal synchronization workflow

Before editing on either Mac:

```bash
cd ~/.dotfiles
git status --short
git pull --ff-only
```

If `git pull --ff-only` refuses because of local changes, do not force it.
Review, commit, or intentionally stash those changes first.

After pulling or editing, validate without activating:

```bash
nix flake check --no-build

HOST_LABEL="$(scutil --get LocalHostName)"
nix build ".#darwinConfigurations.${HOST_LABEL}.system" --dry-run
```

Apply the configuration:

```bash
./rebuild.sh
```

After successful validation and activation:

```bash
git diff --check
git status --short
git add <files-reviewed-for-this-change>
git commit -m "Describe the configuration change"
git push
```

Prefer explicit file names instead of `git add .` so unrelated or sensitive
files are not accidentally published.

On the other Mac:

```bash
cd ~/.dotfiles
git pull --ff-only
nix flake check --no-build
./rebuild.sh
```

## Updating pinned dependencies

Normal rebuilds use the versions already pinned in `flake.lock`. Do not delete
the lock file to update packages.

To intentionally update all flake inputs:

```bash
nix flake update
nix flake check --no-build

HOST_LABEL="$(scutil --get LocalHostName)"
nix build ".#darwinConfigurations.${HOST_LABEL}.system" --dry-run
./rebuild.sh
```

Review and commit the resulting `flake.lock` change only after the rebuild
succeeds.

## Homebrew policy

`nix-homebrew` and nix-darwin's Homebrew module have different jobs:

- `nix-homebrew` installs and pins Homebrew itself.
- `homebrew.*` declares formulae and casks installed through Homebrew.

Company Mac policy:

```nix
manageHomebrewInstallation = false;
homebrew.onActivation.cleanup = "none";
```

This keeps the existing Homebrew installation and packages intact while
allowing declared packages to be added.

A fresh personal Mac may use:

```nix
manageHomebrewInstallation = true;
```

If the home Mac already has Homebrew, inspect it before deciding whether to use
`nix-homebrew.autoMigrate`.

Never change cleanup to `"uninstall"` or `"zap"` until all packages that should
remain installed are listed. `"zap"` can remove unlisted applications and their
associated files.

Reference:
[nix-homebrew](https://github.com/zhaofengli/nix-homebrew)

## Rollback

List system generations:

```bash
sudo -H /run/current-system/sw/bin/darwin-rebuild --list-generations
```

Roll back to the previous system generation:

```bash
sudo -H /run/current-system/sw/bin/darwin-rebuild --rollback
```

After rollback, fix or revert the repository configuration before rebuilding
again. A system rollback does not modify the Git working tree.

## Troubleshooting

### `darwin-rebuild` is not found

Open a new terminal after the first successful activation. `rebuild.sh` also
falls back to:

```text
/run/current-system/sw/bin/darwin-rebuild
```

### Host profile is missing

An error mentioning a missing `darwinConfigurations.<name>` means the Mac's
`LocalHostName` has no matching flake profile.

Check:

```bash
scutil --get LocalHostName
nix flake show
```

Add the missing host profile; do not rename both Macs to the same hostname.

### A new imported file is not found

Git-backed flakes ignore untracked files. If `flake.nix` imports a new `.nix`
file, stage that file before building:

```bash
git add path/to/new-file.nix
```

Staging makes it visible to the flake; it does not publish it.

### `warning: Git tree ... is dirty`

This is informational. It means tracked files differ from the last commit.
Review the changes and commit them after validation.

### A macOS preference did not change

First confirm that a new generation was activated:

```bash
ls -lt /nix/var/nix/profiles/system*
readlink /run/current-system
```

Then inspect the live preference. For example:

```bash
defaults read com.apple.dock autohide
```

For Boolean preferences, `0` is false and `1` is true. nix-darwin restarts
affected applications such as Dock during activation, but logging out and back
in may be required for some macOS settings.

## Recommended future repository structure

As the configuration grows, separate shared and machine-specific concerns:

```text
.
├── flake.nix
├── flake.lock
├── hosts/
│   ├── company-mac.nix
│   └── home-mac.nix
├── modules/
│   ├── common.nix
│   ├── homebrew.nix
│   └── macos-defaults.nix
├── home.nix
├── rebuild.sh
└── SYNC_GUIDE.md
```

Keep common development tools in shared modules. Keep hostname, username,
architecture, company-only software, home-only software, and Homebrew ownership
in host-specific modules.
