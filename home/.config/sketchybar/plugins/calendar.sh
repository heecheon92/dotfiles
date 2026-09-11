#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

sketchybar --set "$NAME" icon="$(date '+%a %d. %b')" label="$(date '+%H:%M')"
