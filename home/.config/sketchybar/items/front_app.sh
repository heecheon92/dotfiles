#!/bin/bash

FRONT_APP_SCRIPT='if [ "$SENDER" = front_app_switched ]; then app=$INFO; else app=$(aerospace list-windows --focused --format "%{app-name}" 2>/dev/null); fi; sketchybar --set "$NAME" label="$app"'

front_app=(
  script="$FRONT_APP_SCRIPT"
  icon.drawing=off
  padding_left=0
  label.color=$WHITE
  label.font="$FONT:Black:12.0"
  associated_display=active
)

sketchybar --add item front_app left \
           --set front_app "${front_app[@]}" \
           --subscribe front_app front_app_switched
