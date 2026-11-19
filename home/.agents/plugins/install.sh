#!/bin/sh
# Manually install or remove one plugin from this registry by linking its skills.
# Nothing here runs during ./rebuild.sh; a plugin is installed only when you run this.
#
#   ./install.sh <plugin>            link the plugin's skills
#   ./install.sh <plugin> --remove   remove the links this script made
#   ./install.sh --list              show plugins and whether each is linked
set -eu

here=$(cd "$(dirname "$0")" && pwd -P)
skills_root="${AGENT_SKILLS_DIR:-$HOME/.agents/skills}"
# The Claude Code mirror link is relative to the default skills folder, so skip it when that folder is overridden.
if [ -n "${AGENT_SKILLS_DIR:-}" ]; then claude_root=""; else claude_root="$HOME/.claude/skills"; fi

usage() { sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; }

linked_to() { [ -L "$1" ] && [ "$(cd "$1" 2>/dev/null && pwd -P)" = "$2" ]; }

list() {
  for dir in "$here"/*/; do
    [ -f "$dir/plugin.json" ] || continue
    name=$(basename "$dir")
    state="not installed"
    for skill in "$dir"skills/*/; do
      [ -f "$skill/SKILL.md" ] || continue
      if linked_to "$skills_root/$(basename "$skill")" "$(cd "$skill" && pwd -P)"; then state="installed"; fi
    done
    printf '%s\t%s\n' "$name" "$state"
  done
}

[ $# -ge 1 ] || { usage; exit 2; }
case "$1" in
  --list) list; exit 0 ;;
  -h|--help) usage; exit 0 ;;
esac

plugin=$1
action=${2:-install}
src="$here/$plugin"
[ -f "$src/plugin.json" ] || { echo "No plugin named '$plugin' in $here" >&2; exit 1; }

mkdir -p "$skills_root"
for skill in "$src"/skills/*/; do
  [ -f "$skill/SKILL.md" ] || continue
  name=$(basename "$skill")
  target=$(cd "$skill" && pwd -P)
  dest="$skills_root/$name"
  mirror="$claude_root/$name"

  if [ "$action" = "--remove" ]; then
    if linked_to "$dest" "$target"; then rm "$dest"; echo "removed  $dest"; else echo "skipped  $dest (not a link to this plugin)"; fi
    if [ -L "$mirror" ] && [ ! -e "$mirror" ]; then rm "$mirror"; echo "removed  $mirror"; fi
    continue
  fi

  if linked_to "$dest" "$target"; then
    echo "ok       $dest"
  elif [ -e "$dest" ] || [ -L "$dest" ]; then
    echo "skipped  $dest (something else is already there; remove it first)" >&2
    continue
  else
    ln -s "$target" "$dest"; echo "linked   $dest"
  fi
  # Claude Code reads its own skills folder; mirror the link there when that folder exists.
  if [ -d "$claude_root" ] && [ ! -e "$mirror" ] && [ ! -L "$mirror" ]; then
    ln -s "../../.agents/skills/$name" "$mirror"; echo "linked   $mirror"
  fi
done
