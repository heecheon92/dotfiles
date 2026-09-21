#!/bin/bash

keyboard=(
  script="\"$PLUGIN_DIR/keyboard.sh\" \"$HELPER_BIN\""
  icon.drawing=off
  label="?"
  label.width=24
  label.align=center
  label.font="$FONT:Black:11.0"
  label.color=$BLACK
  padding_left=3
  padding_right=3
  background.drawing=on
  background.color=$BLUE
  background.height=20
  background.corner_radius=5
)

sketchybar --add event keyboard_input_changed com.apple.Carbon.TISNotifySelectedKeyboardInputSourceChanged \
           --add item keyboard right \
           --set keyboard "${keyboard[@]}" \
           --subscribe keyboard keyboard_input_changed system_woke
