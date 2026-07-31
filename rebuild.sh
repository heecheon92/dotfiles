#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
HOST_LABEL="${1:-$(scutil --get LocalHostName)}"

if DARWIN_REBUILD="$(command -v darwin-rebuild)"; then
  :
elif [[ -x /run/current-system/sw/bin/darwin-rebuild ]]; then
  DARWIN_REBUILD="/run/current-system/sw/bin/darwin-rebuild"
else
  printf 'error: darwin-rebuild is not installed; finish the first nix-darwin switch first\n' >&2
  exit 1
fi

ln -sfn "$DIR" "$HOME/.dotfiles"

exec sudo -H "$DARWIN_REBUILD" switch \
  --flake "$DIR#$HOST_LABEL"
