#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

source "$CONFIG_DIR/colors.sh"

focused=${FOCUSED_WORKSPACE:-}
if [ -z "$focused" ]; then
  focused=$(aerospace list-workspaces --focused 2>/dev/null)
fi

workspace_list=$(aerospace list-workspaces --all 2>/dev/null)
[ -n "$workspace_list" ] || exit 0

separator=$(printf '\034')
windows=$(aerospace list-windows --all --format "%{workspace}${separator}%{app-name}" 2>/dev/null)

item_exists() {
  sketchybar --query "$1" >/dev/null 2>&1
}

workspace_is_current() {
  target=$1
  while IFS= read -r candidate; do
    [ "$candidate" = "$target" ] && return 0
  done <<EOF
$workspace_list
EOF
  return 1
}

refresh_workspace_bracket() {
  sketchybar --remove spaces \
             --add bracket spaces '/space\..*/' \
             --set spaces background.color="$BACKGROUND_1" \
                          background.border_color="$BACKGROUND_2" \
                          background.border_width=2 \
                          background.drawing=on
}

add_workspace_item() {
  workspace=$1
  item="space.$workspace"

  space=(
    icon="$workspace"
    icon.padding_left=10
    icon.padding_right=15
    padding_left=2
    padding_right=2
    label.padding_right=20
    icon.highlight_color=$RED
    label.font="sketchybar-app-font:Regular:16.0"
    label.background.height=26
    label.background.drawing=on
    label.background.color=$BACKGROUND_2
    label.background.corner_radius=8
    label.drawing=off
    script="$CONFIG_DIR/plugins/space.sh"
  )

  sketchybar --add item "$item" left \
             --set "$item" "${space[@]}" \
             --subscribe "$item" mouse.clicked \
             --move "$item" before separator
  topology_changed=true
}

topology_changed=false
existing_items=$(sketchybar --query bar 2>/dev/null \
  | jq -r '.items[]? | select(startswith("space."))')
while IFS= read -r item; do
  [ -n "$item" ] || continue
  workspace=${item#space.}
  case "$workspace" in
    [1-9]) continue ;;
  esac
  if ! workspace_is_current "$workspace"; then
    sketchybar --remove "$item"
    topology_changed=true
  fi
done <<EOF
$existing_items
EOF

args=()
while IFS= read -r workspace; do
  [ -n "$workspace" ] || continue

  occupied=false
  icon_strip=" "
  while IFS="$separator" read -r window_workspace app; do
    [ "$window_workspace" = "$workspace" ] || continue
    occupied=true
    [ -n "$app" ] || continue
    app_icon=$("$CONFIG_DIR/plugins/icon_map.sh" "$app")
    icon_strip="$icon_strip $app_icon"
  done <<EOF
$windows
EOF

  case "$workspace" in
    [1-9]) drawing=on ;;
    *)
      if [ "$workspace" = "$focused" ] || [ "$occupied" = true ]; then
        drawing=on
      else
        drawing=off
      fi
      ;;
  esac

  item="space.$workspace"
  if [ "$drawing" = on ] && ! item_exists "$item"; then
    add_workspace_item "$workspace"
  fi

  if item_exists "$item"; then
    if [ "$occupied" = true ]; then
      label_drawing=on
    else
      label_drawing=off
    fi

    if [ "$workspace" = "$focused" ]; then
      selected=true
      label_width=0
    else
      selected=false
      label_width=dynamic
    fi

    args+=(--set "$item"
      drawing="$drawing"
      icon.highlight="$selected"
      label="$icon_strip"
      label.drawing="$label_drawing"
      label.width="$label_width")
  fi
done <<EOF
$workspace_list
EOF

[ "${#args[@]}" -gt 0 ] && sketchybar --animate tanh 20 "${args[@]}"

[ "$topology_changed" = false ] || refresh_workspace_bracket
