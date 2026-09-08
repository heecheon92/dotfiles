#!/usr/bin/env bash

if [ "$SENDER" = "front_app_switched" ] && [ -n "${INFO:-}" ]; then
  app=$INFO
else
  app="$(aerospace list-windows --focused --format '%{app-name}' 2>/dev/null)"
  if [ -z "$app" ]; then
    app="$(/usr/bin/osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null)"
  fi
fi

[ -n "$app" ] || app="Desktop"
sketchybar --set "$NAME" label="$app"
