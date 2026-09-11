#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

WIDTH=100

detail_on() { sketchybar --animate tanh 30 --set volume slider.width=$WIDTH; }
detail_off() { sketchybar --animate tanh 30 --set volume slider.width=0; }

toggle_detail() {
  INITIAL_WIDTH=$(sketchybar --query volume | jq -r '.slider.width')
  if [ "$INITIAL_WIDTH" = 0 ]; then detail_on; else detail_off; fi
}

toggle_devices() {
  command -v SwitchAudioSource >/dev/null 2>&1 || return 0
  source "$CONFIG_DIR/colors.sh"

  args=(--remove '/volume.device\..*/' --set "$NAME" popup.drawing=toggle)
  COUNTER=0
  CURRENT=$(SwitchAudioSource -t output -c)
  while IFS= read -r device; do
    COLOR=$GREY
    [ "$device" = "$CURRENT" ] && COLOR=$WHITE
    printf -v escaped_device '%q' "$device"
    args+=(--add item "volume.device.$COUNTER" "popup.$NAME"
           --set "volume.device.$COUNTER" label="$device" label.color="$COLOR"
           click_script="SwitchAudioSource -s $escaped_device && sketchybar --set /volume.device\\..*/ label.color=$GREY --set \"\$NAME\" label.color=$WHITE --set \"$NAME\" popup.drawing=off")
    COUNTER=$((COUNTER + 1))
  done <<EOF
$(SwitchAudioSource -a -t output)
EOF

  sketchybar -m "${args[@]}" >/dev/null
}

if [ "${BUTTON:-left}" = right ] || [ "${MODIFIER:-}" = shift ]; then
  toggle_devices
else
  toggle_detail
fi
