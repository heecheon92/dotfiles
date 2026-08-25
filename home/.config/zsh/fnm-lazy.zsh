# Initialize FNM only when a Node-related command is first used.
typeset -ga FNM_LAZY_COMMANDS=(
  fnm node npm npx corepack pnpm pnpx yarn yarnpkg
  pi repo-codex-mcp
)
typeset -g FNM_LAZY_BINARY="${FNM_LAZY_BINARY:-}"
typeset -gi FNM_LAZY_LOADED=0

# Persistent terminals and nested shells may inherit another shell's FNM or NVM
# activation. Remove runtime PATH entries while retaining FNM configuration such
# as FNM_DIR and mirrors for the new shell's on-demand initialization.
if [[ -n ${FNM_MULTISHELL_PATH:-} ]]; then
  path=(${path:#${FNM_MULTISHELL_PATH}/bin})
fi
if [[ -n ${NVM_BIN:-} ]]; then
  path=(${path:#${NVM_BIN}})
fi
unset FNM_MULTISHELL_PATH NVM_BIN NVM_INC
export PATH

_fnm_lazy_find_binary() {
  local candidate

  if [[ -n "$FNM_LAZY_BINARY" && -x "$FNM_LAZY_BINARY" ]]; then
    return 0
  fi

  for candidate in \
    "${commands[fnm]:-}" \
    "${HOMEBREW_PREFIX:+$HOMEBREW_PREFIX/bin/fnm}" \
    /opt/homebrew/bin/fnm \
    /usr/local/bin/fnm; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      FNM_LAZY_BINARY="$candidate"
      return 0
    fi
  done

  print -u2 "fnm is not installed on this machine"
  return 127
}

_fnm_lazy_load() {
  (( FNM_LAZY_LOADED )) && return 0
  _fnm_lazy_find_binary || return

  local environment
  if ! environment="$("$FNM_LAZY_BINARY" env \
    --use-on-cd \
    --shell zsh \
    --version-file-strategy recursive)"; then
    print -u2 "failed to initialize fnm"
    return 1
  fi

  eval "$environment" || return
  FNM_LAZY_LOADED=1
  unset environment
}

_fnm_lazy_dispatch() {
  local command_name="$1"
  shift

  _fnm_lazy_load || return

  if [[ "$command_name" != fnm \
    && ( -z ${FNM_MULTISHELL_PATH:-} \
      || ! -x "$FNM_MULTISHELL_PATH/bin/node" ) ]]; then
    print -u2 "no fnm-managed Node version is active"
    print -u2 "run: fnm install <version> && fnm default <version> && fnm use <version>"
    return 127
  fi

  command "$command_name" "$@"
}

for command_name in "${FNM_LAZY_COMMANDS[@]}"; do
  eval "${command_name}() { _fnm_lazy_dispatch ${command_name} \"\$@\"; }"
done
unset command_name
