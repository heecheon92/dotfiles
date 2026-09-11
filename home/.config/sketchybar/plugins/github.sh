#!/bin/bash

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
source "$CONFIG_DIR/environment.sh"

update() {
  source "$CONFIG_DIR/colors.sh"
  source "$CONFIG_DIR/icons.sh"

  if ! command -v gh >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
    sketchybar --set "$NAME" icon="$BELL" label="–" icon.color="$GREY"
    return
  fi

  if ! NOTIFICATIONS=$(gh api notifications 2>/dev/null); then
    sketchybar --set "$NAME" icon="$BELL" label="–" icon.color="$GREY"
    return
  fi

  COUNT=$(printf '%s' "$NOTIFICATIONS" | jq 'length')
  args=()
  if [ "$NOTIFICATIONS" = "[]" ]; then
    args+=(--set "$NAME" icon="$BELL" label=0)
  else
    args+=(--set "$NAME" icon="$BELL_DOT" label="$COUNT")
  fi

  PREV_COUNT=$(sketchybar --query github.bell | jq -r '.label.value')
  args+=(--remove '/github.notification\..*/')
  COUNTER=0
  args+=(--set github.bell icon.color="$BLUE")

  while read -r repo url type title; do
    COUNTER=$((COUNTER + 1))
    IMPORTANT=$(printf '%s' "$title" | grep -Ei '(deprecat|break|broke)')
    COLOR=$BLUE
    PADDING=0
    ICON=$BELL
    URL=https://www.github.com/notifications

    if [ -z "$repo" ] && [ -z "$title" ]; then
      repo=Note
      title="No new notifications"
    fi

    api_url=$(printf '%s' "$url" | sed -e "s/^'//" -e "s/'$//")
    case "$type" in
      "'Issue'") COLOR=$GREEN; ICON=$GIT_ISSUE; URL=$(gh api "$api_url" 2>/dev/null | jq -r '.html_url // "https://www.github.com/notifications"') ;;
      "'Discussion'") COLOR=$WHITE; ICON=$GIT_DISCUSSION ;;
      "'PullRequest'") COLOR=$MAGENTA; ICON=$GIT_PULL_REQUEST; URL=$(gh api "$api_url" 2>/dev/null | jq -r '.html_url // "https://www.github.com/notifications"') ;;
      "'Commit'") COLOR=$WHITE; ICON=$GIT_COMMIT; URL=$(gh api "$api_url" 2>/dev/null | jq -r '.html_url // "https://www.github.com/notifications"') ;;
    esac

    if [ -n "$IMPORTANT" ]; then
      COLOR=$RED
      ICON=􀁞
      args+=(--set github.bell icon.color="$COLOR")
    fi

    clean_title=$(printf '%s' "$title" | sed -e "s/^'//" -e "s/'$//")
    clean_repo=$(printf '%s' "$repo" | sed -e "s/^'//" -e "s/'$//")
    notification=(
      label="$clean_title"
      icon="$ICON $clean_repo:"
      icon.padding_left="$PADDING"
      label.padding_right="$PADDING"
      icon.color="$COLOR"
      position=popup.github.bell
      icon.background.color="$COLOR"
      drawing=on
      click_script="open '$URL'; sketchybar --set github.bell popup.drawing=off"
    )
    args+=(--clone "github.notification.$COUNTER" github.template --set "github.notification.$COUNTER" "${notification[@]}")
  done <<EOF
$(printf '%s' "$NOTIFICATIONS" | jq -r '.[] | [.repository.name, .subject.latest_comment_url, .subject.type, .subject.title] | @sh')
EOF

  sketchybar -m "${args[@]}" >/dev/null
  if { [ "$COUNT" -gt "$PREV_COUNT" ] 2>/dev/null || [ "$SENDER" = forced ]; }; then
    sketchybar --animate tanh 15 --set github.bell label.y_offset=5 label.y_offset=0
  fi
}

popup() { sketchybar --set "$NAME" popup.drawing="$1"; }

case "$SENDER" in
  routine|forced) update ;;
  mouse.entered) popup on ;;
  mouse.exited|mouse.exited.global) popup off ;;
  mouse.clicked) popup toggle ;;
esac
