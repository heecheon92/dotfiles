# Load Conda's shell integration only when `conda` is first used.
typeset -g CONDA_LAZY_EXE="${CONDA_LAZY_EXE:-${CONDA_EXE:-}}"

# Persistent terminal processes and nested shells may inherit an activated
# environment. Remove its PATH entries and shell state so the new shell stays
# deferred until the first explicit `conda` command.
if [[ -n ${CONDA_PREFIX:-} ]]; then
  path=(${path:#${CONDA_PREFIX}/bin})
  path=(${path:#${CONDA_PREFIX}/condabin})
fi
path=(${path:#/opt/anaconda3/bin})
path=(${path:#/opt/anaconda3/condabin})
unset CONDA_DEFAULT_ENV CONDA_PREFIX CONDA_PROMPT_MODIFIER CONDA_SHLVL
unset _CE_CONDA _CE_M CONDA_EXE CONDA_PYTHON_EXE
export PATH

_conda_lazy_find_exe() {
  local candidate

  if [[ -n "$CONDA_LAZY_EXE" && -x "$CONDA_LAZY_EXE" ]]; then
    return 0
  fi

  for candidate in \
    /opt/anaconda3/bin/conda \
    /usr/local/anaconda3/bin/conda \
    "$HOME/miniconda3/bin/conda" \
    "$HOME/anaconda3/bin/conda" \
    "$HOME/miniforge3/bin/conda" \
    "$HOME/mambaforge/bin/conda"; do
    if [[ -x "$candidate" ]]; then
      CONDA_LAZY_EXE="$candidate"
      return 0
    fi
  done

  print -u2 "conda is not installed on this machine"
  return 127
}

conda() {
  _conda_lazy_find_exe || return

  local hook
  if ! hook="$("$CONDA_LAZY_EXE" shell.zsh hook 2>/dev/null)"; then
    print -u2 "failed to initialize conda"
    return 1
  fi

  unfunction conda
  eval "$hook"
  unset hook
  conda "$@"
}
