#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

language=$("$1" --input-source 2>/dev/null) || language="?"

case "$language" in
  ko|ko-*) label="한" ;;
  en|en-*) label="EN" ;;
  ""|\?) label="?" ;;
  *)
    primary_language=${language%%-*}
    label=$(printf '%s' "$primary_language" | /usr/bin/tr '[:lower:]' '[:upper:]')
    ;;
esac

sketchybar --set "$NAME" label="$label"
