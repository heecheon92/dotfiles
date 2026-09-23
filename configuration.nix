{ desktopProfile, lib, manageHomebrewInstallation, migrateHomebrewInstallation, pkgs, user, ... }:

let
  isAerospace = desktopProfile == "aerospace";
  isHammerspoon = desktopProfile == "hammerspoon";
in
lib.mkMerge [
{
  assertions = [
    {
      assertion = builtins.elem desktopProfile [ "aerospace" "hammerspoon" ];
      message = "desktopProfile must be either \"aerospace\" or \"hammerspoon\"";
    }
  ];
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
      AppleShowAllExtensions = true;
    };
    CustomUserPreferences."com.googlecode.iterm2" = {
      # iTerm's UI exposes cursor blinking but not its interval.
      TimeBetweenBlinks = 0.2;
    };
    dock.autohide = true;
    finder.FXPreferredViewStyle = "Nlsv";  # list view by default
    finder.CreateDesktop = false;          # clean desktop
    trackpad.Clicking = true;              # tap to click
  };
  environment.systemPackages = lib.optional isAerospace (
    pkgs.callPackage ./packages/aerospace.nix { }
  );

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
    ] ++ lib.optionals isAerospace [
      "felixkratz/formulae/borders"
      "felixkratz/formulae/sketchybar"
    ];
    taps = lib.optional isAerospace "felixkratz/formulae";
    casks = [
      "wezterm"
      "claude-code@latest"
      "codex"
    ]
    ++ lib.optional isAerospace "font-sf-pro"
    ++ lib.optional isHammerspoon "hammerspoon";
  };
}
  (lib.mkIf isAerospace {
    system.defaults.NSGlobalDomain._HIHideMenuBar = true;
    system.defaults.CustomUserPreferences.NSGlobalDomain.AppleMenuBarVisibleInFullscreen = false;
    # SketchyBar requires separate Spaces per display (macOS default).
    system.defaults.CustomUserPreferences."com.apple.spaces"."spans-displays" = false;
  })
  (lib.mkIf isHammerspoon {
    system.defaults.NSGlobalDomain._HIHideMenuBar = false;
    system.defaults.CustomUserPreferences.NSGlobalDomain.AppleMenuBarVisibleInFullscreen = true;
  })
]
