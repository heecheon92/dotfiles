{
  aerospace,
  fetchzip,
}:

aerospace.overrideAttrs (finalAttrs: oldAttrs: {
  version = "0.21.3-centered-zoom.1";

  # Preserve the release signatures; stripping invalidates the app bundle.
  dontStrip = true;

  src = fetchzip {
    url = "https://github.com/heecheon92/AeroSpace/releases/download/v${finalAttrs.version}/AeroSpace-v${finalAttrs.version}.zip";
    hash = "sha256-8BX0RNs6+Dnj23FNoXXg5F9/VXwwmqksDhLq6cDFnVg=";
  };

  meta = oldAttrs.meta // {
    homepage = "https://github.com/heecheon92/AeroSpace";
  };
})
