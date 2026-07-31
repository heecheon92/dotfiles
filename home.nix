{ config, lib, pkgs, user, ... }:

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
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

  # Keep user.name and user.email machine-specific. The company identity
  # remains in this Mac's existing global Git configuration.
  programs.git.enable = true;

  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;      # ghost text from history
    syntaxHighlighting.enable = true;  # commands turn green when valid
    initContent = lib.mkBefore ''
      # Transitional migration: preserve company-specific SDK initialization
      # and local secrets without copying them into this repository.
      if [[ -r "$HOME/.zshrc.before-home-manager" ]]; then
        source "$HOME/.zshrc.before-home-manager"
      fi

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

  # Add the remaining edit-in-place home.file symlinks after their source files
  # exist and any existing destination files have been reviewed.
}
