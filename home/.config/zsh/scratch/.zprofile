# Lightweight login environment for Herdr's scratch terminal.
# Keep this independent from ~/.zprofile and ~/.zshrc.

if [[ -r "/etc/profiles/per-user/$USER/etc/profile.d/hm-session-vars.sh" ]]; then
  source "/etc/profiles/per-user/$USER/etc/profile.d/hm-session-vars.sh"
fi

typeset -U path
path=(
  "$HOME/.local/bin"
  "$HOME/.cargo/bin"
  "$HOME/Library/pnpm"
  /opt/homebrew/bin
  /opt/homebrew/sbin
  $path
)

# Herdr's persistent process may have inherited an activated runtime. Start the
# scratch shell light and let its nvm/conda wrappers initialize on demand.
if [[ -n ${NVM_BIN:-} ]]; then
  path=(${path:#${NVM_BIN}})
fi
if [[ -n ${CONDA_PREFIX:-} ]]; then
  path=(${path:#${CONDA_PREFIX}/bin})
  path=(${path:#${CONDA_PREFIX}/condabin})
fi
path=(${path:#/opt/anaconda3/bin})
path=(${path:#/opt/anaconda3/condabin})

unset NVM_BIN NVM_INC
unset CONDA_DEFAULT_ENV CONDA_PREFIX CONDA_PROMPT_MODIFIER CONDA_SHLVL
unset _CE_CONDA _CE_M
export PATH
