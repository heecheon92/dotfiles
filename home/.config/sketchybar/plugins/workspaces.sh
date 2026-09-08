#!/usr/bin/env bash

focused=${FOCUSED_WORKSPACE:-}
if [ -z "$focused" ]; then
  focused="$(aerospace list-workspaces --focused 2>/dev/null)"
fi

workspace_list="$(aerospace list-workspaces --all 2>/dev/null)"
[ -n "$workspace_list" ] || exit 0

occupied_workspaces="$(aerospace list-windows --all --format '%{workspace}' 2>/dev/null)"
args=()

while IFS= read -r sid; do
  [ -n "$sid" ] || continue

  occupied=off
  while IFS= read -r occupied_sid; do
    if [ "$occupied_sid" = "$sid" ]; then
      occupied=on
      break
    fi
  done <<EOF
$occupied_workspaces
EOF

  case "$sid" in
    [1-9]) drawing=on ;;
    *)
      if [ "$sid" = "$focused" ] || [ "$occupied" = on ]; then
        drawing=on
      else
        drawing=off
      fi
      ;;
  esac

  if [ "$sid" = "$focused" ]; then
    args+=(--set "space.$sid"
      drawing="$drawing"
      label.color=0xff0b1118
      background.drawing=on)
  else
    args+=(--set "space.$sid"
      drawing="$drawing"
      label.color=0xff7d8590
      background.drawing=off)
  fi
done <<EOF
$workspace_list
EOF

[ "${#args[@]}" -gt 0 ] && sketchybar "${args[@]}"
