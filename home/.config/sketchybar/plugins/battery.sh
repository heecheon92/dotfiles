#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

source "$CONFIG_DIR/icons.sh"
source "$CONFIG_DIR/colors.sh"

PERCENTAGE=$(pmset -g batt | sed -nE 's/.* ([0-9]+)%.*/\1/p' | sed -n '1p')
CHARGING=$(pmset -g batt | grep 'AC Power')
[ -n "$PERCENTAGE" ] || exit 0

DRAWING=on
COLOR=$WHITE
case "$PERCENTAGE" in
  9[0-9]|100) ICON=$BATTERY_100; DRAWING=off ;;
  [6-8][0-9]) ICON=$BATTERY_75; DRAWING=off ;;
  [3-5][0-9]) ICON=$BATTERY_50 ;;
  [1-2][0-9]) ICON=$BATTERY_25; COLOR=$ORANGE ;;
  *) ICON=$BATTERY_0; COLOR=$RED ;;
esac

if [ -n "$CHARGING" ]; then
  ICON=$BATTERY_CHARGING
  DRAWING=off
fi

sketchybar --set "$NAME" drawing="$DRAWING" icon="$ICON" icon.color="$COLOR"
