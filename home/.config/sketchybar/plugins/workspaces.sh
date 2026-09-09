#!/usr/bin/env bash

focused=${FOCUSED_WORKSPACE:-}
if [ -z "$focused" ]; then
  focused="$(aerospace list-workspaces --focused 2>/dev/null)"
fi

workspace_list="$(aerospace list-workspaces --all 2>/dev/null)"
[ -n "$workspace_list" ] || exit 0

separator="$(printf '\034')"
windows="$(aerospace list-windows --all --format "%{workspace}${separator}%{app-name}" 2>/dev/null)"
args=()

truncate_app() {
  app_name=$1
  if [ "${#app_name}" -gt 14 ]; then
    printf '%s…' "${app_name:0:13}"
  else
    printf '%s' "$app_name"
  fi
}

while IFS= read -r sid; do
  [ -n "$sid" ] || continue

  occupied=off
  apps=
  while IFS="$separator" read -r window_sid app_name; do
    [ "$window_sid" = "$sid" ] || continue
    occupied=on
    [ -n "$app_name" ] || continue

    duplicate=off
    while IFS= read -r known_app; do
      if [ "$known_app" = "$app_name" ]; then
        duplicate=on
        break
      fi
    done <<EOF
$apps
EOF
    [ "$duplicate" = off ] || continue

    if [ -n "$apps" ]; then
      apps="$apps
$app_name"
    else
      apps=$app_name
    fi
  done <<EOF
$windows
EOF

  label=$sid
  if [ -n "$apps" ]; then
    sorted_apps="$(printf '%s\n' "$apps" | LC_ALL=C sort)"
    app_count=0
    first_app=
    second_app=
    while IFS= read -r app_name; do
      [ -n "$app_name" ] || continue
      app_count=$((app_count + 1))
      case "$app_count" in
        1) first_app="$(truncate_app "$app_name")" ;;
        2) second_app="$(truncate_app "$app_name")" ;;
      esac
    done <<EOF
$sorted_apps
EOF

    [ -n "$first_app" ] && label="$label $first_app"
    [ -n "$second_app" ] && label="$label · $second_app"
    if [ "$app_count" -gt 2 ]; then
      label="$label +$((app_count - 2))"
    fi
  fi

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
      label="$label"
      label.color=0xff0b1118
      background.drawing=on)
  else
    args+=(--set "space.$sid"
      drawing="$drawing"
      label="$label"
      label.color=0xff7d8590
      background.drawing=off)
  fi
done <<EOF
$workspace_list
EOF

[ "${#args[@]}" -gt 0 ] && sketchybar "${args[@]}"
