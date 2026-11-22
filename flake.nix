{
  description = "dotfiles";

  inputs = {
    # Use `github:NixOS/nixpkgs/nixpkgs-26.05-darwin` to use Nixpkgs 26.05.
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";
    # Use `github:nix-darwin/nix-darwin/nix-darwin-26.05` to use Nixpkgs 26.05.
    nix-darwin.url = "github:nix-darwin/nix-darwin/nix-darwin-26.05";
    nix-darwin.inputs.nixpkgs.follows = "nixpkgs";

    home-manager.url = "github:nix-community/home-manager/release-26.05";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
    nix-homebrew.url = "github:zhaofengli/nix-homebrew";
  };

  outputs = inputs@{ self, nix-darwin, nix-homebrew, home-manager, nixpkgs }:
    let
      user = "heecheonpark";
      mkDarwinConfiguration =
        { desktopProfile, manageHomebrewInstallation, migrateHomebrewInstallation ? false }:
        nix-darwin.lib.darwinSystem {
          specialArgs = {
            inherit desktopProfile user manageHomebrewInstallation migrateHomebrewInstallation;
          };
          modules = [
            ./configuration.nix
            nix-homebrew.darwinModules.nix-homebrew
            home-manager.darwinModules.home-manager
            ({ pkgs, ... }: {
              home-manager.useGlobalPkgs = true;
              home-manager.useUserPackages = true;
              # Move a file that blocks a managed link to a unique timestamped
              # name. A fixed extension stops activation as soon as one backup
              # exists, which Tern triggers by replacing its settings link.
              home-manager.backupCommand = pkgs.writeShellScript "home-manager-backup" ''
                set -eu
                # Home Manager's link check also runs this with no argument
                # (backticks inside its log message); do nothing then.
                [ "$#" -ge 1 ] || exit 0
                target="$1"
                stamp="$(${pkgs.coreutils}/bin/date +%Y%m%d-%H%M%S)"
                ${pkgs.coreutils}/bin/mv -- "$target" "$target.before-home-manager.$stamp.$$"
              '';
              home-manager.extraSpecialArgs = { inherit desktopProfile user; };
              home-manager.users.${user} = import ./home.nix;
            })
          ];
        };
    in
    {
      darwinConfigurations."Mac-mini" = mkDarwinConfiguration {
        desktopProfile = "aerospace";
        manageHomebrewInstallation = false;
      };
      darwinConfigurations."MacBook-Pro" = mkDarwinConfiguration {
        desktopProfile = "hammerspoon";
        manageHomebrewInstallation = true;
        migrateHomebrewInstallation = true;
      };
    };
}
