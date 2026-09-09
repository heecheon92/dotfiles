{
  aerospace,
  fetchzip,
}:

aerospace.overrideAttrs (finalAttrs: oldAttrs: {
  version = "0.21.3-centered-zoom.2";

  # Preserve the release signatures; stripping invalidates the app bundle.
  dontStrip = true;

  src = fetchzip {
    url = "https://github.com/heecheon92/AeroSpace/releases/download/v${finalAttrs.version}/AeroSpace-v${finalAttrs.version}.zip";
    hash = "sha256-zA17ir+feWgqNH8UQ1E3ZheBi5FIaOScH875jOi6Bn0=";
  };

  meta = oldAttrs.meta // {
    homepage = "https://github.com/heecheon92/AeroSpace";
  };
})
