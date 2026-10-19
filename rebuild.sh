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

# Resolve Nix before sudo resets PATH.
NIX="$(command -v nix)"

ln -sfn "$DIR" "$HOME/.dotfiles"

# Resolve the Git-backed flake as its owner before sudo's root Git checks.
FLAKE_STORE_PATH="$("$NIX" flake metadata --json "$DIR" | /usr/bin/plutil -extract path raw -o - -)"

# Retry only a build, never profile updates or activation.
BUILD_LOG="$(mktemp "${TMPDIR:-/tmp}/dotfiles-rebuild.XXXXXX")"
trap 'rm -f "$BUILD_LOG"' EXIT

build_system() {
  if sudo -H "$NIX" --extra-experimental-features 'nix-command flakes' build --no-link \
    "path:$FLAKE_STORE_PATH#darwinConfigurations.$HOST_LABEL.system" 2>&1 | tee "$BUILD_LOG"; then
    return 0
  else
    BUILD_PIPE_STATUS=("${PIPESTATUS[@]}")
    if [[ "${BUILD_PIPE_STATUS[1]}" -ne 0 ]]; then
      printf 'error: could not capture Nix build output; DNS recovery skipped\n' >&2
    fi
    if [[ "${BUILD_PIPE_STATUS[0]}" -ne 0 ]]; then
      return "${BUILD_PIPE_STATUS[0]}"
    fi
    return "${BUILD_PIPE_STATUS[1]}"
  fi
}

if build_system; then
  :
else
  BUILD_STATUS=$?
  if [[ "${BUILD_PIPE_STATUS[1]}" -ne 0 ]] ||
    ! grep -Eq 'Could not resolve host: cache[.]nixos[.]org([^[:alnum:]_.-]|$)' "$BUILD_LOG"; then
    exit "$BUILD_STATUS"
  fi
  printf 'Retrying the build once after a cache.nixos.org DNS lookup\n' >&2
  if ! dscacheutil -q host -a name cache.nixos.org; then
    exit "$BUILD_STATUS"
  fi
  build_system
fi

rm -f "$BUILD_LOG"
trap - EXIT

exec sudo -H "$DARWIN_REBUILD" switch \
  --flake "path:$FLAKE_STORE_PATH#$HOST_LABEL"
