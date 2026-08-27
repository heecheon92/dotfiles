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

# Preserve scratch startup by loading only FZF's history widget on the first
# Ctrl-R. The official widget replaces this temporary binding after loading.
if (( $+commands[fzf] )); then
  _scratch_fzf_history_lazy() {
    local fzf_binary="${commands[fzf]:A}"
    local FZF_CTRL_T_COMMAND="" FZF_ALT_C_COMMAND=""
    source "${fzf_binary:h:h}/share/fzf/key-bindings.zsh"
    zle -D _scratch_fzf_history_lazy
    unfunction _scratch_fzf_history_lazy
    zle fzf-history-widget
  }
  zle -N _scratch_fzf_history_lazy
  bindkey '^R' _scratch_fzf_history_lazy
fi

alias -- ..='cd ..'
alias -- ls='eza'
alias -- la='eza --long --all --group'
alias -- ll='eza --long --all --group --git --header'

# Home Manager initializes zoxide in the full shell; mirror it here without
# making scratch startup depend on the command being installed yet.
if (( $+commands[zoxide] )); then
  eval "$(zoxide init zsh)"
fi

# Reuse the managed Starship theme for directory and Git context. Keep a
# built-in fallback for machines where Starship is not installed.
if (( $+commands[starship] )); then
  eval "$(starship init zsh)"
else
  PROMPT='%F{cyan}%1~%f %# '
fi

if [[ -r "$HOME/.config/zsh/nvm-lazy.zsh" ]]; then
  source "$HOME/.config/zsh/nvm-lazy.zsh"
fi

if [[ -r "$HOME/.config/zsh/conda-lazy.zsh" ]]; then
  source "$HOME/.config/zsh/conda-lazy.zsh"
fi
