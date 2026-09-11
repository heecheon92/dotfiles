#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

if [ "$SENDER" = "mouse.clicked" ] && [ "${BUTTON:-left}" != "right" ]; then
  workspace=${NAME#space.}
  aerospace workspace "$workspace" >/dev/null 2>&1
fi
