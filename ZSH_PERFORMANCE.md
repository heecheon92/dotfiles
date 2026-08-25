# Maintaining fast and stable Zsh startup

This document is the operational reference for agents changing Zsh in this
dotfiles repository. Optimize the normal shell against the scratch profile,
but preserve first-prompt correctness, first-use command behavior, completion
security, and cross-machine portability.

## Sources of truth

| Concern | Source |
| --- | --- |
| Normal portable Zsh configuration | `home.nix`, under `programs.zsh` and `programs.starship` |
| Normal machine-local environment | `~/.config/zsh/local.zsh` on each Mac; never commit credentials |
| NVM lazy loader | `home/.config/zsh/nvm-lazy.zsh` |
| Conda lazy loader | `home/.config/zsh/conda-lazy.zsh` |
| Scratch reference profile | `home/.config/zsh/scratch/.zprofile` and `.zshrc` |
| Generated active files | `~/.zprofile` and `~/.zshrc`; inspect but do not hand-edit |

Apply portable changes through `home.nix` or the shared loaders, then run
`./rebuild.sh`. The scratch profile is a known-light reference and should remain
independent unless a task explicitly changes it.

## Performance contract

A fast benchmark is not sufficient by itself. A change is acceptable only when
all applicable behavior remains correct:

- The first prompt renders with the configured Starship theme.
- History, aliases, `PATH`, and completion work in a fresh login shell.
- A lazy wrapper preserves the original command's arguments, exit status, and
  current-shell mutations.
- The first invocation works; the user must not need to rerun a command.
- Completion caches are never replaced with partially generated files.
- A parent terminal's activated NVM or Conda state does not leak into a fresh
  deferred shell.
- Missing optional tools fail clearly instead of leaving recursive wrappers.
- The normal profile remains reproducible through Home Manager.
- The scratch profile remains usable as an unchanged control.

On the current Apple Silicon Mac, the established warm-cache reference was
approximately 35 ms for normal `zsh -lic exit` and 30 ms for scratch. Treat
these as dated comparison values, not universal thresholds. Hardware, Nix store
state, filesystem caches, and package versions affect absolute timing. Compare
normal and scratch on the same machine and report medians, not one sample.

## Current eager and deferred boundaries

### Eager for stability

- Home Manager session variables and essential environment values.
- Machine-local exports and executable paths.
- History options and aliases.
- Cached Zsh completion initialization. A full `compinit` discovery and security
  audit occurs when the dump is missing, when the generated `.zshrc` is newer,
  or after one day; otherwise the profile uses `compinit -C`.
- Starship initialization, because delaying it would make the first prompt
  inconsistent.
- Lightweight lazy-loader functions.
- An existing OMP completion cache, when present.

### Deferred until needed

- Zoxide integration: first `z`, `zi`, or aliased `cd`.
- NVM: first `nvm`, `node`, `npm`, `npx`, `corepack`, `pnpm`, `pnpx`, or `yarn`.
- Conda integration: first `conda` command.
- OMP completion regeneration: first `omp` execution after its cache becomes
  stale.
- Zsh autosuggestions and syntax highlighting: one-shot `zle-line-init`, after
  the first prompt becomes visible.

Google Cloud SDK shell initialization and completion are intentionally absent.
Do not restore them on another machine unless the user starts using that SDK.

## Why each boundary exists

### Login environment

Do not execute expensive environment generators from `.zprofile`, such as:

```zsh
eval "$(brew shellenv)"
```

That launches external processes for every login shell. Export stable values
and prepend known paths directly when the installation prefix is known. The
current managed profile targets Apple Silicon Homebrew at `/opt/homebrew`.
Before applying it to an Intel Mac, adapt the portable source to select
`/usr/local` without spawning Homebrew, for example by checking which `brew`
executable exists.

### Completion

Keep one managed `compinit`. Never source a third-party completion script before
Home Manager's completion initialization if that script can call `compinit`
itself. This previously caused two completion scans in every normal shell.

Prefer native completion files on `fpath`. If a tool only generates completion
source, cache the generated output. Source a valid cache eagerly when first-Tab
behavior matters, but regenerate stale content on demand. Write generators to a
same-directory temporary file and use `mv` for atomic replacement.

OMP follows this model. The cache lives at:

```text
${XDG_CACHE_HOME:-$HOME/.cache}/zsh/omp-completions.zsh
```

It becomes stale when the OMP executable, `~/.omp/agent/config.yml`, or
`~/.omp/agent/extensions` is newer. A stale existing cache remains available;
the first `omp` command refreshes and sources it before redispatching the
original invocation.

### Runtime managers

Runtime managers must modify the current shell, so they cannot be initialized
correctly in a background child process. Use command wrappers instead:

1. Locate the integration script or executable.
2. Remove every related wrapper before sourcing the real integration.
3. Initialize in the current shell.
4. Redispatch the same command and arguments exactly once.
5. Return the real command's status.

Persistent terminal applications may pass activated runtime variables and PATH
entries into new shells. The NVM and Conda loaders first remove inherited
activation state so the new shell remains genuinely deferred.

### Interactive visual plugins

Autosuggestions and syntax highlighting do not affect command correctness.
Their one-shot ZLE hook allows the prompt to become visible before their source
files are parsed. Keep syntax highlighting last among interactive widget
integrations unless its upstream requirements change.

Do not move arbitrary environment or completion setup into this hook. Non-ZLE
shells, scripts, and `zsh -c` do not run the interactive line editor.

## Adding another shell integration

Use this decision order:

1. **Delete it** if no machine uses it.
2. **Use static configuration** if the generated values are stable.
3. **Use native autoload/completion files** when the package supplies them.
4. **Install a command-triggered wrapper** when initialization must mutate the
   current shell.
5. **Cache generated source** when generation is expensive but definitions are
   needed before command execution.
6. **Keep it eager** only when deferral breaks first-prompt, first-command, or
   first-Tab behavior and a stable lazy boundary is not available.

Before adding to `~/.config/zsh/local.zsh`, determine whether it:

- launches an external process;
- calls `compinit` or `bashcompinit`;
- modifies widgets or prompt hooks;
- activates a runtime or rewrites `PATH`;
- reads credentials or machine-specific state; or
- emits generated shell source through `eval`.

Machine-local does not mean performance-safe. Keep SDK paths, local-only
exports, and secrets there, but apply the same eager-versus-lazy analysis.
Maintain mode `0600` when the file contains sensitive values, and prefer a
secret manager over plaintext exports.

## Measurement procedure

Measure a login shell because normal terminal windows read both `.zprofile` and
`.zshrc`. Warm once after rebuilding because a new generated `.zshrc` correctly
invalidates the completion dump.

```bash
python3 - <<'PY'
import os
import statistics
import subprocess
import time


def benchmark(env, runs=20):
    samples = []
    for _ in range(runs):
        started = time.perf_counter()
        subprocess.run(
            ["/bin/zsh", "-lic", "exit"],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        samples.append((time.perf_counter() - started) * 1000)
    return statistics.median(samples), min(samples), max(samples)

normal_env = os.environ.copy()
scratch_env = normal_env | {
    "ZDOTDIR": os.path.expanduser("~/.config/zsh/scratch")
}

# Warm the normal completion dump after a rebuild.
subprocess.run(
    ["/bin/zsh", "-lic", "exit"],
    env=normal_env,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    check=True,
)

for name, env in (("normal", normal_env), ("scratch", scratch_env)):
    median, minimum, maximum = benchmark(env)
    print(f"{name}: median={median:.1f} ms min={minimum:.1f} ms max={maximum:.1f} ms")
PY
```

Profile functions separately when the median regresses:

```bash
/bin/zsh -dfic 'zmodload zsh/zprof; source "$HOME/.zshrc"; zprof'
```

`zprof` does not account well for external process startup and the command above
does not include `.zprofile`. Use it to locate expensive shell functions, then
confirm the result with the login-shell benchmark.

Common regression signals:

- Two `compinit` or `compaudit` calls: a completion script initialized too early.
- A large first sample only after rebuild: expected completion-dump refresh;
  confirm subsequent samples are stable.
- Every sample is slower: inspect `.zprofile`, external `eval "$(...)"` calls,
  plugin sources, and generated completions.
- Normal is much slower than scratch: compare the normal-only integrations and
  machine-local file.
- A fast `zsh -ic exit` but slow `zsh -lic exit`: investigate `.zprofile` and
  global login initialization.

## Required validation after a change

Run the closest complete sequence:

```bash
cd ~/.dotfiles
nix flake check
./rebuild.sh

/bin/zsh -n ~/.zprofile
/bin/zsh -n ~/.zshrc
/bin/zsh -n ~/.config/zsh/nvm-lazy.zsh
/bin/zsh -n ~/.config/zsh/conda-lazy.zsh
/bin/zsh -n ~/.config/zsh/scratch/.zprofile
/bin/zsh -n ~/.config/zsh/scratch/.zshrc
```

Then use a fresh login shell to exercise the affected behavior, not just syntax:

- Confirm the first prompt renders correctly.
- Press Tab for any changed completion integration before running its command.
- Trigger each changed lazy command once and verify its arguments and result.
- For NVM and Conda, verify inherited activation is absent before first use and
  present afterward.
- If OMP inputs changed, verify the first `omp` refreshes the stale cache and a
  subsequent shell sees the refreshed completion file.
- Run the normal-versus-scratch median benchmark.

Do not claim interactive stability from `zsh -n` or `zsh -lic exit` alone. When
widget, prompt, or completion behavior changes, exercise a real pseudo-terminal
or terminal session.

## Review and rollback

Before editing, inspect the generated active profile to understand ordering, but
change its Home Manager source rather than the Nix-store symlink. After every
rebuild, inspect the new generated ordering if merge priority changed.

If normal startup or first-use behavior regresses:

1. Preserve the failing command, timing samples, and relevant error output.
2. Compare against the unchanged scratch profile.
3. Revert the smallest integration boundary rather than disabling completion,
   security checks, history, or the prompt globally.
4. Move only the unstable integration back to eager loading.
5. Rebuild and repeat behavioral and timing verification.

Stability takes precedence over a few milliseconds. Eager loading is the
correct fallback when a tested lazy boundary cannot preserve first-use
semantics.