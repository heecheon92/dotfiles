#!/bin/sh
set -eu

herdr_bin="${HERDR_BIN_PATH:-}"
if [ -z "$herdr_bin" ]; then
  herdr_bin="$(command -v herdr || true)"
fi

jq_bin="$(command -v jq || true)"
if [ -z "$herdr_bin" ] || [ -z "$jq_bin" ]; then
  printf 'The file viewer popup requires herdr and jq on PATH.\n' >&2
  exit 1
fi

plugin_json="$("$herdr_bin" plugin list --plugin herdr-file-viewer --json)"
plugin_root="$(
  printf '%s' "$plugin_json" |
    "$jq_bin" -r \
      '.result.plugins[]? | select(.plugin_id == "herdr-file-viewer") | .plugin_root' |
    head -n 1
)"

viewer="$plugin_root/target/release/herdr-file-viewer"
if [ -z "$plugin_root" ] || [ ! -x "$viewer" ]; then
  printf 'herdr-file-viewer executable not found. Reinstall with:\n' >&2
  printf '  herdr plugin install smarzban/herdr-file-viewer\n' >&2
  exit 1
fi

plugin_config_dir="$("$herdr_bin" plugin config-dir herdr-file-viewer)"
active_cwd="${HERDR_ACTIVE_PANE_CWD:-$PWD}"
active_workspace="${HERDR_ACTIVE_WORKSPACE_ID:-}"

export HERDR_PLUGIN_CONFIG_DIR="$plugin_config_dir"
export HERDR_PLUGIN_CONTEXT_JSON="$(
  "$jq_bin" -cn \
    --arg cwd "$active_cwd" \
    --arg workspace_id "$active_workspace" \
    '{
      focused_pane_cwd: $cwd,
      workspace_id: (if $workspace_id == "" then null else $workspace_id end)
    }'
)"

if [ -d "$active_cwd" ]; then
  cd "$active_cwd"
fi

exec "$viewer"
