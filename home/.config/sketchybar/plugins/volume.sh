#!/usr/bin/env bash

if [ "$SENDER" = "volume_change" ] && [ -n "${INFO:-}" ]; then
  volume=$INFO
else
  volume="$(/usr/bin/osascript -e 'output volume of (get volume settings)' 2>/dev/null)"
fi

case "$volume" in
  ''|.*|*.|*.*.*|*[!0-9.]*)
    sketchybar --set "$NAME" icon="VOL?" label="--"
    exit 0
    ;;
esac

whole=${volume%%.*}
if [ "$whole" -eq 0 ]; then
  case "${volume#*.}" in
    *[1-9]*) whole=1 ;;
  esac
fi

if [ "$whole" -eq 0 ]; then
  icon="MUTE"
elif [ "$whole" -lt 35 ]; then
  icon="VOL-"
elif [ "$whole" -lt 70 ]; then
  icon="VOL"
else
  icon="VOL+"
fi

sketchybar --set "$NAME" icon="$icon" label="$whole%"
