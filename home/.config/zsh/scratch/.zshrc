# Fast interactive profile for Herdr's disposable scratch terminal.

[[ -o interactive ]] || return

bindkey -e

# Reuse the full profile's completion dump. Fall back to one full discovery on
# a newly bootstrapped machine where that dump does not exist yet.
typeset -U fpath
for profile in ${(z)NIX_PROFILES}; do
  fpath+=(
    "$profile/share/zsh/site-functions"
    "$profile/share/zsh/$ZSH_VERSION/functions"
    "$profile/share/zsh/vendor-completions"
  )
done

autoload -U compinit
if [[ -s "$HOME/.zcompdump" ]]; then
  compinit -C -d "$HOME/.zcompdump"
else
  compinit -d "$HOME/.zcompdump"
fi

HISTFILE="$HOME/.zsh_history"
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_FCNTL_LOCK HIST_IGNORE_DUPS HIST_IGNORE_SPACE SHARE_HISTORY
setopt NO_BEEP

alias -- ..='cd ..'
alias -- ls='eza'
alias -- la='eza --long --all --group'
alias -- ll='eza --long --all --group --git --header'

# Reuse the managed Starship theme for directory and Git context. Keep a
# built-in fallback for machines where Starship is not installed.
if (( $+commands[starship] )); then
  eval "$(starship init zsh)"
else
  PROMPT='%F{cyan}%1~%f %# '
fi

export NVM_DIR="$HOME/.nvm"
typeset -g SCRATCH_NVM_SCRIPT="/opt/homebrew/opt/nvm/nvm.sh"
typeset -g SCRATCH_NVM_COMPLETION="/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

nvm() {
  if [[ ! -r "$SCRATCH_NVM_SCRIPT" ]]; then
    print -u2 "nvm is not installed on this machine"
    return 127
  fi

  unfunction nvm
  source "$SCRATCH_NVM_SCRIPT"
  [[ -r "$SCRATCH_NVM_COMPLETION" ]] && source "$SCRATCH_NVM_COMPLETION"
  nvm "$@"
}

typeset -g SCRATCH_CONDA_EXE=""
for candidate in \
  /opt/anaconda3/bin/conda \
  "$HOME/miniconda3/bin/conda" \
  "$HOME/anaconda3/bin/conda"; do
  if [[ -x "$candidate" ]]; then
    SCRATCH_CONDA_EXE="$candidate"
    break
  fi
done
unset candidate

conda() {
  if [[ -z "$SCRATCH_CONDA_EXE" ]]; then
    print -u2 "conda is not installed on this machine"
    return 127
  fi

  local hook
  if ! hook="$("$SCRATCH_CONDA_EXE" shell.zsh hook 2>/dev/null)"; then
    print -u2 "failed to initialize conda"
    return 1
  fi

  unfunction conda
  eval "$hook"
  unset hook
  conda "$@"
}
