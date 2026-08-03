{ config, lib, pkgs, user, ... }:

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
  # These existing Herdr integrations are now owned by Home Manager. The local
  # marker lets a later rebuild uninstall an integration only after it has been
  # removed from this Nix-managed list.
  herdrIntegrations = [
    "claude"
    "codex"
    "opencode"
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
    # the font everything renders in
    nerd-fonts.hack
  ];
  fonts.fontconfig.enable = true;
  home.sessionVariables.EDITOR = "nvim";
  home.sessionPath = [
    "${config.home.homeDirectory}/.bun/bin"
  ];

  # Keep user.name and user.email machine-specific. The company identity
  # remains in this Mac's existing global Git configuration.
  programs.git.enable = true;

  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;      # ghost text from history
    syntaxHighlighting.enable = true;  # commands turn green when valid
    initContent = lib.mkBefore ''
      # Keep machine-specific SDK initialization and secrets outside this
      # repository while sharing the portable shell configuration.
      if [[ -r "$HOME/.config/zsh/local.zsh" ]]; then
        source "$HOME/.config/zsh/local.zsh"
      fi

      # macOS login-shell initialization may rebuild PATH after .zshenv has
      # loaded Home Manager's session variables, so restore Bun for Zsh here.
      path=("$HOME/.bun/bin" $path)

      bindkey '^f' autosuggest-accept
    '';
    shellAliases = {
      ".." = "cd ..";
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
  home.file.".codex/AGENTS.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".claude/CLAUDE.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".gemini/GEMINI.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  home.file.".config/opencode/AGENTS.md".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/AGENTS.md";
  # Keep Pi's credential and runtime state local by linking only authored files and directories.
  home.file.".pi/agent/themes".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/themes";
  home.file.".pi/agent/extensions".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.pi/agent/extensions";
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
