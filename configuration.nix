{ manageHomebrewInstallation, migrateHomebrewInstallation, user, ... }:

{
  # This machine uses standard upstream Nix, so let nix-darwin manage it.
  nix = {
    enable = true;
    settings.experimental-features = [ "nix-command" "flakes" ];
  };

  nixpkgs.config.allowUnfree = true;
  # Home Manager owns this user's interactive completion and prompt setup.
  # Keep nix-darwin from repeating compinit, bashcompinit, and a prompt that
  # Starship immediately replaces.
  programs.zsh = {
    enable = true;
    enableCompletion = false;
    enableBashCompletion = false;
    promptInit = "";
  };

  nixpkgs.hostPlatform = "aarch64-darwin"; # use x86_64-darwin for Intel CPU

  system.primaryUser = user;
  users.users.${user} = {
    home = "/Users/${user}";
  };
  system.stateVersion = 6;
  system.defaults = {
    NSGlobalDomain = {
      AppleInterfaceStyle = "Dark";
      KeyRepeat = 2;          # fast key repeat
      InitialKeyRepeat = 15;  # short delay before repeat
      _HIHideMenuBar = true;  # auto-hide the menu bar
      AppleShowAllExtensions = true;
    };
    dock.autohide = true;
    finder.FXPreferredViewStyle = "Nlsv";  # list view by default
    finder.CreateDesktop = false;          # clean desktop
    trackpad.Clicking = true;              # tap to click
  };
  nix-homebrew = {
    # The company Mac keeps its externally managed Homebrew installation. The
    # personal Mac adopts its existing installation into nix-homebrew once.
    enable = manageHomebrewInstallation;
    inherit user;
    autoMigrate = migrateHomebrewInstallation;
  };
  homebrew = {
    enable = true;
    # Keep existing packages while this configuration is being built out.
    onActivation.cleanup = "none";
    onActivation.autoUpdate = true;
    brews = [
      "herdr"
    ];
    casks = [
      "wezterm"
      "claude-code"
      "codex"
    ];
  };
}
