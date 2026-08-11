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
    lazygit
    neovim
    tree-sitter # parser compiler used by nvim-treesitter
    tmux        # terminal multiplexer used by omp_parallel_bench.sh
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
      # Register omp's shell completions. This must run after compinit (which
      # Home Manager invokes after the mkBefore block) because the generated
      # script calls compdef.
      (lib.mkAfter ''
        if command -v omp &> /dev/null; then
          eval "$(omp completions zsh)"
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
    };
  };

  programs.starship = {
    enable = true;
    settings = {
      add_newline = false;
      format = "$directory$git_branch$git_status$cmd_duration$line_break$character";
      character = {
        success_symbol = "[❯](purple)";
        error_symbol = "[❯](red)";
      };
      cmd_duration.format = "[$duration]($style) ";
    };
  };

  # Keep WezTerm's live config linked to this repository so its automatic
  # config reload sees edits without needing another rebuild.
  home.file.".config/wezterm".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/wezterm";
  home.file.".config/nvim".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/nvim";
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
  home.file.".local/bin/omp_parallel_bench.sh".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/bin/omp_parallel_bench.sh";
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
  home.file.".omp/agent/extensions/herdr-runtime-context.ts".source =
    config.lib.file.mkOutOfStoreSymlink
      "${dotfiles}/home/.omp/agent/extensions/herdr-runtime-context.ts";

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
