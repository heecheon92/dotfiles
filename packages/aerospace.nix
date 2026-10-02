{
  aerospace,
  fetchzip,
}:

aerospace.overrideAttrs (finalAttrs: oldAttrs: {
  version = "0.21.3-centered-zoom.3";

  # Preserve the release signatures; stripping invalidates the app bundle.
  dontStrip = true;

  src = fetchzip {
    url = "https://github.com/heecheon92/AeroSpace/releases/download/v${finalAttrs.version}/AeroSpace-v${finalAttrs.version}.zip";
    hash = "sha256-nqGuSKg8sZmVeoMTClFjCmvDK0boz/R5eSLeh3s3BDs=";
  };

  meta = oldAttrs.meta // {
    homepage = "https://github.com/heecheon92/AeroSpace";
  };
})
