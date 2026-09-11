#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

source "$CONFIG_DIR/colors.sh"

if ! command -v brew >/dev/null 2>&1; then
  sketchybar --set "$NAME" drawing=off
  exit 0
fi

COUNT=$(brew outdated 2>/dev/null | wc -l | tr -d ' ')
COLOR=$RED
case "$COUNT" in
  [3-5][0-9]) COLOR=$ORANGE ;;
  [1-2][0-9]) COLOR=$YELLOW ;;
  [1-9]) COLOR=$WHITE ;;
  0) COLOR=$GREEN; COUNT=􀆅 ;;
esac

sketchybar --set "$NAME" drawing=on label="$COUNT" icon.color="$COLOR"
