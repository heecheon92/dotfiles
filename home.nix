{ config, lib, pkgs, user, ... }:

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
  # These existing Herdr integrations are now owned by Home Manager. The local
  # marker lets a later rebuild uninstall an integration only after it has been
  # removed from this Nix-managed list.
  herdrIntegrations = [
    "claude"
    "codex"
    "omp"
    "opencode"
    "pi"
  ];
  herdrIntegrationsFile = pkgs.writeText "herdr-managed-integrations" ''
    ${lib.concatStringsSep "\n" herdrIntegrations}
  '';
in
{
  home.username = user;
  home.homeDirectory = "/Users/${user}";
  home.stateVersion = "26.05";
  home.packages = with pkgs; [
    # cli i use constantly
    ripgrep   # fast search
    fd        # fast find
    fzf       # fuzzy finder
    jq        # json on the command line
    bun       # runtime and package manager for OMP plugins
    lazygit
    neovim
    tree-sitter # parser compiler used by nvim-treesitter
    tmux        # terminal multiplexer used by omp_parallel_bench
    # the font everything renders in
    nerd-fonts.hack
  ];
  fonts.fontconfig.enable = true;
  home.sessionVariables = {
    EDITOR = "nvim";
    VISUAL = "nvim";
  };
  home.sessionPath = [ "$HOME/.local/bin" ];
  # Keep user.name and user.email machine-specific. The company identity
  # remains in this Mac's existing global Git configuration.
  programs.git.enable = true;

  programs.eza = {
    enable = true;
    enableZshIntegration = false;
  };

  programs.zsh = {
    enable = true;
    # Perform a full completion discovery and security audit once per day or
    # after this generated zshrc changes. Reuse the trusted dump otherwise.
    completionInit = ''
      autoload -U compinit

      zcompdump="''${ZDOTDIR:-$HOME}/.zcompdump"
      if [[ ! -s "$zcompdump" \
        || "$HOME/.zshrc" -nt "$zcompdump" \
        || -n "$(/usr/bin/find "$zcompdump" -mmin +1440 -print -quit 2>/dev/null)" ]]; then
        compinit -d "$zcompdump"
      else
        compinit -C -d "$zcompdump"
      fi
      unset zcompdump
    '';
    autosuggestion.enable = true;      # ghost text from history
    syntaxHighlighting.enable = true;  # commands turn green when valid
    initContent = lib.mkMerge [
      (lib.mkBefore ''
        # Load Home Manager's generated session variables so home.sessionPath
        # and home.sessionVariables are available in every new zsh shell.
        if [[ -r "${config.home.profileDirectory}/etc/profile.d/hm-session-vars.sh" ]]; then
          source "${config.home.profileDirectory}/etc/profile.d/hm-session-vars.sh"
        fi

        # Keep machine-specific SDK initialization and secrets outside this
        # repository while sharing the portable shell configuration.
        if [[ -r "$HOME/.config/zsh/local.zsh" ]]; then
          source "$HOME/.config/zsh/local.zsh"
        fi

        bindkey '^f' autosuggest-accept
      '')
      # OMP completion generation is comparatively expensive. Regenerate it
      # atomically only when OMP or its command-surface inputs change.
      (lib.mkAfter ''
        if command -v omp &> /dev/null; then
          ompCompletionDir="''${XDG_CACHE_HOME:-$HOME/.cache}/zsh"
          ompCompletionCache="$ompCompletionDir/omp-completions.zsh"
          if [[ ! -s "$ompCompletionCache" \
            || $commands[omp] -nt "$ompCompletionCache" \
            || "$HOME/.omp/agent/config.yml" -nt "$ompCompletionCache" \
            || "$HOME/.omp/agent/extensions" -nt "$ompCompletionCache" ]]; then
            mkdir -p "$ompCompletionDir"
            ompCompletionTmp="$ompCompletionCache.tmp.$$"
            if command omp completions zsh >| "$ompCompletionTmp"; then
              mv -f "$ompCompletionTmp" "$ompCompletionCache"
            else
              rm -f "$ompCompletionTmp"
            fi
          fi
          [[ -r "$ompCompletionCache" ]] && source "$ompCompletionCache"
          unset ompCompletionDir ompCompletionCache ompCompletionTmp
        fi
      '')
    ];
    shellAliases = {
      ".." = "cd ..";
      ls = "eza";
      la = "eza --long --all --group";
      ll = "eza --long --all --group --git --header";
      add = "git add .";
      push = "git push";
      pull = "git pull";
      m = "git switch main";
      cc = "claude --dangerously-skip-permissions";
      cx = "codex --yolo";
      omp-budget = "omp --config ~/.omp/agent/config-budget.yml";
    };
  };

  programs.starship = {
    enable = true;
    settings = {
      add_newline = false;
      palette = "omp_titanium";
      format = ''
        [╭──](titanium)$os$hostname[  ](muted)$directory$git_branch$git_status$cmd_duration
        [╰─](titanium)$character
      '';
      palettes.omp_titanium = {
        titanium = "#8B949E";
        text = "#C9D1D9";
        muted = "#6E7681";
        blue = "#58A6FF";
        purple = "#BC8CFF";
        green = "#56D364";
        red = "#F85149";
        yellow = "#E3B341";
      };
      os = {
        disabled = false;
        style = "blue";
        format = "[$symbol]($style)";
        symbols.Macos = " ";
      };
      hostname = {
        ssh_only = false;
        style = "text";
        format = "[$hostname]($style)";
      };
      directory = {
        style = "blue";
        read_only = " 󰌾";
        read_only_style = "yellow";
        format = "[ $path]($style)[$read_only]($read_only_style)";
        truncation_length = 3;
        truncate_to_repo = true;
      };
      git_branch = {
        symbol = " ";
        style = "purple";
        format = "[  ](muted)[$symbol$branch]($style)";
      };
      git_status = {
        style = "yellow";
        format = "([ $all_status$ahead_behind]($style))";
      };
      cmd_duration = {
        min_time = 1000;
        style = "muted";
        format = "[  $duration]($style)";
      };
      character = {
        success_symbol = "[❯](bold green)";
        error_symbol = "[❯](bold red)";
        vimcmd_symbol = "[❮](bold blue)";
      };
    };
  };

  # Keep WezTerm's live config linked to this repository so its automatic
  # config reload sees edits without needing another rebuild.
  home.file.".config/wezterm".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/wezterm";
  home.file.".config/nvim".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/nvim";
  # Keep iTerm's dedicated Hotkey Window profile version-controlled without
  # committing the application's mutable preferences database.
  home.file."Library/Application Support/iTerm2/DynamicProfiles/hotkey-window.json".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.config/iterm2/hotkey-window.json";
  # Give Herdr scratch terminals a separate, lightweight Zsh profile without
  # changing the full interactive shell used by ordinary terminal windows.
  home.file.".config/zsh/scratch".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.config/zsh/scratch";
  # Keep only the portable Herdr configuration in this repository. Runtime
  # state such as session.json and logs stays local to each machine.
  home.file.".config/herdr/config.toml".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/herdr/config.toml";
  # Keep only installable GitHub source names portable. Herdr still owns each
  # machine's resolved checkout, enabled state, configuration, and runtime data.
  home.file.".config/herdr/plugin-sources.txt".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.config/herdr/plugin-sources.txt";
  # Keep personal executable scripts in the repository and expose them through
  # the shared user command path.
  home.file.".local/bin/omp_parallel_bench".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/bin/omp_parallel_bench";
  home.file.".codex/AGENTS.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".claude/CLAUDE.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".gemini/GEMINI.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".config/opencode/AGENTS.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  # Keep authored cross-agent skills in this repository while leaving
  # third-party skills under ~/.agents/skills machine-local.
  home.file.".agents/skills/README.md".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.agents/skills/README.md";
  home.file.".agents/skills/gpt".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.agents/skills/gpt";
  home.file.".agents/skills/lantern".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.agents/skills/lantern";
  home.file.".agents/skills/documentation-lifecycle".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.agents/skills/documentation-lifecycle";

  # Keep OMP credentials, databases, sessions, logs, and Herdr's generated
  # integration local. Link only portable authored configuration and the
  # sibling runtime-context extension.
  home.file.".omp/agent/AGENTS.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".omp/agent/config.yml".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.omp/agent/config.yml";
  home.file.".omp/agent/config-budget.yml".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.omp/agent/config-budget.yml";
  home.file.".omp/agent/extensions/herdr-runtime-context.ts".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.omp/agent/extensions/herdr-runtime-context.ts";
  # Keep OMP's plugin registry reproducible while leaving downloaded packages
  # machine-local. The activation below restores them from the pinned lockfile.
  home.file.".omp/plugins/package.json".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.omp/plugins/package.json";
  home.file.".omp/plugins/bun.lock".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.omp/plugins/bun.lock";
  home.file.".omp/plugins/omp-plugins.lock.json".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.omp/plugins/omp-plugins.lock.json";

  home.activation.syncOmpPlugins =
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      ompPluginsDir="${config.home.homeDirectory}/.omp/plugins"
      run mkdir -p "$ompPluginsDir"
      (
        cd "$ompPluginsDir"
        run ${pkgs.bun}/bin/bun install --frozen-lockfile
      )
    '';

  # The previous generation linked this whole directory into the repository.
  # Replace only that known symlink before Home Manager creates child links, so
  # Herdr can keep its generated Pi integration machine-local.
  home.activation.preparePiExtensions =
    lib.hm.dag.entryBetween [ "linkGeneration" ] [ "writeBoundary" ] ''
      piExtensionsRepoDir="${dotfiles}/home/.pi/agent/extensions"
      piExtensionsLocalDir="${config.home.homeDirectory}/.pi/agent/extensions"

      if [[ -L "$piExtensionsLocalDir" ]] \
        && [[ "$(realpath "$piExtensionsLocalDir")" == "$(realpath "$piExtensionsRepoDir")" ]]; then
        run rm "$piExtensionsLocalDir"
        run mkdir -p "$piExtensionsLocalDir"
      fi
    '';

  # Keep Pi's credential, runtime state, and generated integrations local by
  # linking only authored files and directories.
  home.file.".pi/agent/themes".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/themes";
  home.file.".pi/agent/extensions/calm".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/extensions/calm";
  home.file.".pi/agent/extensions/prompt-prefix.ts".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/extensions/prompt-prefix.ts";
  home.file.".pi/agent/models.json".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/models.json";
  home.file.".pi/agent/settings.json".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/settings.json";

  # The previous setup linked the whole Herdr directory into this repository.
  # Replace only that known symlink with a local directory and preserve its
  # current session before Home Manager links config.toml into the directory.
  home.activation.prepareHerdrState =
    lib.hm.dag.entryBetween [ "linkGeneration" ] [ "writeBoundary" ] ''
      herdrRepoDir="${dotfiles}/home/.config/herdr"
      herdrLocalDir="${config.home.homeDirectory}/.config/herdr"

      if [[ -L "$herdrLocalDir" ]] \
        && [[ "$(realpath "$herdrLocalDir")" == "$(realpath "$herdrRepoDir")" ]]; then
        run rm "$herdrLocalDir"
        run mkdir -p "$herdrLocalDir"

        if [[ -f "$herdrRepoDir/session.json" ]]; then
          run cp -p "$herdrRepoDir/session.json" "$herdrLocalDir/session.json"
        fi
      fi
    '';

  # Keep the integration scripts generated by the installed Herdr version, but
  # make their desired set declarative. Runtime hooks and agent-local settings
  # remain local; Home Manager installs or updates them idempotently.
  home.activation.syncHerdrIntegrations =
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      herdrBin=""
      for candidate in \
        "${config.home.homeDirectory}/.nix-profile/bin/herdr" \
        "/opt/homebrew/bin/herdr" \
        "/usr/local/bin/herdr"; do
        if [[ -x "$candidate" ]]; then
          herdrBin="$candidate"
          break
        fi
      done

      if [[ -z "$herdrBin" ]]; then
        echo "warning: Herdr is not installed yet; run rebuild again to sync its integrations" >&2
      else
        managedFile="${config.home.homeDirectory}/.config/herdr/nix-managed-integrations"
        integrationStatus="$("$herdrBin" integration status)"

        if [[ -f "$managedFile" ]]; then
          while IFS= read -r integration; do
            [[ -n "$integration" ]] || continue
            case " ${lib.concatStringsSep " " herdrIntegrations} " in
              *" $integration "*)
                ;;
              *)
                if ! ${pkgs.gnugrep}/bin/grep -q "^$integration: not installed" \
                  <<< "$integrationStatus"; then
                  run "$herdrBin" integration uninstall "$integration"
                fi
                ;;
            esac
          done < "$managedFile"
        fi

        ${lib.concatMapStringsSep "\n" (integration: ''
          if ! ${pkgs.gnugrep}/bin/grep -q '^${integration}: current' \
            <<< "$integrationStatus"; then
            run "$herdrBin" integration install "${integration}"
          fi
        '') herdrIntegrations}

        run ${pkgs.coreutils}/bin/install -D -m 0600 \
          ${herdrIntegrationsFile} "$managedFile"
      fi
    '';
}
