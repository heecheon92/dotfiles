#!/bin/bash

add_workspace_item() {
  sid=$1
  case "$sid" in
    [1-9]) initial_drawing=on ;;
    *) initial_drawing=off ;;
  esac

  space=(
    drawing=$initial_drawing
    icon="$sid"
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
    script="$PLUGIN_DIR/space.sh"
  )

  sketchybar --add item "space.$sid" left \
             --set "space.$sid" "${space[@]}" \
             --subscribe "space.$sid" mouse.clicked
}

# Numeric workspaces remain visible. Configured non-numeric workspaces are
# registered inside the bracket but stay undrawn until focused or occupied.
for sid in 1 2 3 4 5 6 7 8 9; do
  add_workspace_item "$sid"
done

while IFS= read -r sid; do
  [ -n "$sid" ] || continue
  case "$sid" in
    [1-9]) continue ;;
  esac
  add_workspace_item "$sid"
done <<EOF
$(aerospace list-workspaces --all 2>/dev/null)
EOF

spaces=(
  background.color=$BACKGROUND_1
  background.border_color=$BACKGROUND_2
  background.border_width=2
  background.drawing=on
)

separator=(
  icon=􀆊
  icon.font="$FONT:Heavy:16.0"
  padding_left=15
  padding_right=15
  label.drawing=off
  associated_display=active
  icon.color=$WHITE
)

workspace_controller=(
  drawing=off
  update_freq=2
  updates=on
  script="$PLUGIN_DIR/workspaces.sh"
)

sketchybar --add bracket spaces '/space\..*/' \
           --set spaces "${spaces[@]}" \
           --add item separator left \
           --set separator "${separator[@]}" \
           --add item workspace.controller left \
           --set workspace.controller "${workspace_controller[@]}" \
           --subscribe workspace.controller aerospace_workspace_change \
                                            front_app_switched \
                                            space_windows_change \
                                            display_change \
                                            system_woke
