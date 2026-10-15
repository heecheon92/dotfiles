{ lib, stdenv }:

stdenv.mkDerivation {
  pname = "neovide-scratch-center";
  version = "1";
  dontUnpack = true;

  buildPhase = ''
    runHook preBuild
    $CC -x objective-c -fobjc-arc -fblocks -Wall -Wextra \
      -framework AppKit -framework ApplicationServices \
      ${./neovide-scratch-center.m} -o neovide-scratch-center
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    install -Dm755 neovide-scratch-center "$out/bin/neovide-scratch-center"
    runHook postInstall
  '';

  meta.platforms = lib.platforms.darwin;
}
