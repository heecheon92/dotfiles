# Load NVM only when a Node tool is first used in this shell.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# Persistent terminal processes and nested shells may carry an activated NVM
# directory in PATH without inheriting NVM's shell functions. Reset that stale
# activation so every new shell starts deferred and the first trigger selects
# the configured default version consistently.
if [[ -n ${NVM_BIN:-} ]]; then
  path=(${path:#${NVM_BIN}})
fi
unset NVM_BIN NVM_INC
export PATH

typeset -ga NVM_LAZY_COMMANDS=(nvm node npm npx corepack pnpm pnpx yarn)
typeset -g NVM_LAZY_SCRIPT="${NVM_LAZY_SCRIPT:-}"

_nvm_lazy_find_script() {
  local candidate

  if [[ -n "$NVM_LAZY_SCRIPT" && -r "$NVM_LAZY_SCRIPT" ]]; then
    return 0
  fi

  for candidate in \
    "${HOMEBREW_PREFIX:+$HOMEBREW_PREFIX/opt/nvm/nvm.sh}" \
    /opt/homebrew/opt/nvm/nvm.sh \
    /usr/local/opt/nvm/nvm.sh \
    "$NVM_DIR/nvm.sh"; do
    if [[ -n "$candidate" && -r "$candidate" ]]; then
      NVM_LAZY_SCRIPT="$candidate"
      return 0
    fi
  done

  print -u2 "nvm is not installed on this machine"
  return 127
}

_nvm_lazy_load() {
  _nvm_lazy_find_script || return

  local command completion
  for command in "${NVM_LAZY_COMMANDS[@]}"; do
    unfunction "$command" 2>/dev/null
  done

  source "$NVM_LAZY_SCRIPT" || return

  for completion in \
    "${NVM_LAZY_SCRIPT:h}/etc/bash_completion.d/nvm" \
    "$NVM_DIR/bash_completion"; do
    if [[ -r "$completion" ]]; then
      source "$completion"
      break
    fi
  done
}

for command in "${NVM_LAZY_COMMANDS[@]}"; do
  eval "${command}() { _nvm_lazy_load || return; ${command} \"\$@\"; }"
done
unset command
