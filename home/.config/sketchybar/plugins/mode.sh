#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"
source "$CONFIG_DIR/colors.sh"

# Query current state rather than letting delayed events restore an older mode.
mode=$(aerospace list-modes --current 2>/dev/null) || mode="?"
case "$mode" in
  main)
    sketchybar --set "$NAME" drawing=off
    exit 0
    ;;
  resize) label=RESIZE; color=$YELLOW ;;
  service) label=SERVICE; color=$RED ;;
  *) label=$(printf '%s' "$mode" | tr '[:lower:]' '[:upper:]'); color=$ORANGE ;;
esac

sketchybar --set "$NAME" drawing=on label="$label" background.color="$color"
