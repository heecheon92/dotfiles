#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: omp_parallel_bench.sh <repo-directory> [-o output_filename_prefix] [session-name]

Examples:
  omp_parallel_bench.sh "/path/to/repo"
  omp_parallel_bench.sh "/path/to/repo" -o bench
  omp_parallel_bench.sh "/path/to/repo" -o ./logs/omp-bench
  omp_parallel_bench.sh "/path/to/repo" -o bench my-session

Logs are written only when -o/--output is provided. Each log filename receives
_<YYYYMMDD-HHMMSS>_<model-label>.log before its extension.
USAGE
}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

shell_quote() {
  printf '%q' "$1"
}

TARGET_DIR="${1:-}"
if [[ -z "$TARGET_DIR" ]]; then
  usage >&2
  exit 2
fi

# Fail before parsing options or touching the target when required commands are
# unavailable. Home Manager supplies tmux; OMP remains an external prerequisite.
command -v tmux >/dev/null 2>&1 || die "tmux is not installed or not in PATH"
command -v omp >/dev/null 2>&1 || die "omp is not installed or not in PATH"
shift

OUTPUT_PREFIX=""
SESSION_NAME="omp-bench-$(date +%H%M%S)"
SESSION_NAME_SET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)
      [[ $# -ge 2 ]] || die "$1 requires a filename prefix"
      [[ -n "$2" ]] || die "$1 requires a non-empty filename prefix"
      OUTPUT_PREFIX="$2"
      shift 2
      ;;
    --)
      shift
      [[ $# -le 1 ]] || die "only one session name may be provided"
      if [[ $# -eq 1 ]]; then
        [[ "$SESSION_NAME_SET" == false ]] || die "only one session name may be provided"
        SESSION_NAME="$1"
        SESSION_NAME_SET=true
        shift
      fi
      ;;
    -*)
      die "unknown option: $1"
      ;;
    *)
      [[ "$SESSION_NAME_SET" == false ]] || die "only one session name may be provided"
      SESSION_NAME="$1"
      SESSION_NAME_SET=true
      shift
      ;;
  esac
done

[[ -d "$TARGET_DIR" ]] || die "directory not found: $TARGET_DIR"
TARGET_DIR="$(cd -- "$TARGET_DIR" && pwd -P)"


tmux has-session -t "$SESSION_NAME" 2>/dev/null && \
  die "tmux session already exists: $SESSION_NAME"

PROMPT="이 저장소의 프로젝트의 대해서 요약해줘"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# Update these selectors when the installed OMP model catalog changes.
MODELS=(
  "5.3 spark high|openai/gpt-5.3-codex-spark:high"
  "5.6 sol minimal|openai/gpt-5.6-sol:minimal"
  "5.6 sol low|openai/gpt-5.6-sol:low"
  "5.6 luna minimal|openai/gpt-5.6-luna:minimal"
  "5.6 luna low|openai/gpt-5.6-luna:low"
  "5.6 luna max|openai/gpt-5.6-luna:max"
)

LOG_ENABLED=false
if [[ -n "$OUTPUT_PREFIX" ]]; then
  LOG_ENABLED=true

  # Resolve relative prefixes from the caller's directory, not each tmux pane's
  # repository directory. This makes -o ./logs/omp-bench predictable.
  if [[ "$OUTPUT_PREFIX" != /* ]]; then
    OUTPUT_PREFIX="$PWD/$OUTPUT_PREFIX"
  fi

  OUTPUT_DIR="$(dirname "$OUTPUT_PREFIX")"
  mkdir -p "$OUTPUT_DIR"
  OUTPUT_PREFIX="$OUTPUT_DIR/$(basename "$OUTPUT_PREFIX")"
fi

echo "Target dir : $TARGET_DIR"
echo "Session    : $SESSION_NAME"

if [[ "$LOG_ENABLED" == true ]]; then
  echo "Logs       : ${OUTPUT_PREFIX}_${TIMESTAMP}_<model>.log"
else
  echo "Logs       : disabled"
fi

tmux new-session -d -s "$SESSION_NAME" -c "$TARGET_DIR" -n "omp-bench"

TARGET_Q="$(shell_quote "$TARGET_DIR")"
PROMPT_Q="$(shell_quote "$PROMPT")"

for i in "${!MODELS[@]}"; do
  item="${MODELS[$i]}"
  label="${item%%|*}"
  model="${item#*|}"
  safe_label="$(printf '%s' "$label" | tr ' /' '__' | tr -cd '[:alnum:]_.-')"

  if [[ "$LOG_ENABLED" == true ]]; then
    log_file="${OUTPUT_PREFIX}_${TIMESTAMP}_${safe_label}.log"
  else
    log_file=""
  fi

  if [[ "$i" -eq 0 ]]; then
    pane_id="$(tmux display-message -p -t "$SESSION_NAME:0.0" '#{pane_id}')"
  else
    pane_id="$(tmux split-window -P -F '#{pane_id}' -t "$SESSION_NAME:0" -c "$TARGET_DIR")"
  fi

  tmux select-pane -t "$pane_id" -T "$label"

  LABEL_Q="$(shell_quote "$label")"
  MODEL_Q="$(shell_quote "$model")"

  if [[ "$LOG_ENABLED" == true ]]; then
    LOG_Q="$(shell_quote "$log_file")"
    pane_script=$(cat <<EOF
set -euo pipefail
cd -- $TARGET_Q
printf '%s\\n' '============================================================'
printf 'MODEL    : %s\\n' $LABEL_Q
printf 'SELECTOR : %s\\n' $MODEL_Q
printf 'START    : %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')"
printf 'LOG      : %s\\n' $LOG_Q
printf '%s\\n' '============================================================'
{ time omp --model $MODEL_Q -p $PROMPT_Q; } 2>&1 | tee $LOG_Q
status=\${PIPESTATUS[0]}
if [[ "\$status" -ne 0 ]]; then
  printf 'FAILED   : %s (exit %s)\\n' $LABEL_Q "\$status" >&2
  exit "\$status"
fi
printf '\\nEND      : %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')"
printf 'DONE     : %s\\n' $LABEL_Q
EOF
)
  else
    pane_script=$(cat <<EOF
set -euo pipefail
cd -- $TARGET_Q
printf '%s\\n' '============================================================'
printf 'MODEL    : %s\\n' $LABEL_Q
printf 'SELECTOR : %s\\n' $MODEL_Q
printf 'START    : %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')"
printf 'LOG      : %s\\n' 'disabled'
printf '%s\\n' '============================================================'
time omp --model $MODEL_Q -p $PROMPT_Q
printf '\\nEND      : %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')"
printf 'DONE     : %s\\n' $LABEL_Q
EOF
)
  fi

  tmux send-keys -t "$pane_id" "bash -lc $(shell_quote "$pane_script")" C-m
done

tmux select-layout -t "$SESSION_NAME:0" tiled
tmux set-option -t "$SESSION_NAME" pane-border-status top
tmux set-option -t "$SESSION_NAME" pane-border-format '#{pane_title}'

printf '\nAttached to tmux session: %s\n' "$SESSION_NAME"
printf 'Detach  : Ctrl-b then d\n'
printf 'Reattach: tmux attach -t %s\n\n' "$SESSION_NAME"

tmux attach-session -t "$SESSION_NAME"
