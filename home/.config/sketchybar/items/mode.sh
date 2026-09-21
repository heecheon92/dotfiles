#!/bin/bash

mode=(
  drawing=off
  updates=on
  icon.drawing=off
  label.font="$FONT:Bold:12.0"
  label.color=$BLACK
  label.padding_left=8
  label.padding_right=8
  background.drawing=on
  background.height=24
  background.corner_radius=6
  padding_left=4
  padding_right=6
  script="$PLUGIN_DIR/mode.sh"
)

sketchybar --add event aerospace_mode_change \
           --add item aerospace.mode right \
           --set aerospace.mode "${mode[@]}" \
           --subscribe aerospace.mode aerospace_mode_change system_woke
