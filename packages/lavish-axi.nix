{
  lib,
  buildNpmPackage,
  fetchurl,
}:

buildNpmPackage (finalAttrs: {
  pname = "lavish-axi";
  version = "0.1.64";

  src = fetchurl {
    url = "https://registry.npmjs.org/lavish-axi/-/lavish-axi-${finalAttrs.version}.tgz";
    hash = "sha512-LWToM3uqVNYDscd+oPFrmIn8In+eZqAeVTCW2hXhUoGOPrTua/SFtGdFWlz/6TlyZ+OWvr2u4m8y0f0529QGxQ==";
  };
  sourceRoot = "package";

  postPatch = ''
    cp ${./lavish-axi/package.json} package.json
    cp ${./lavish-axi/package-lock.json} package-lock.json
  '';

  npmDepsHash = "sha256-qiXeXiv45EYRYXVBVi7Tvz5UPzSN34UkwXwPy4Rty9Y=";
  npmFlags = [ "--ignore-scripts" ];
  dontNpmBuild = true;

  meta = {
    description = "Collaborative browser review surfaces for agent-generated HTML";
    homepage = "https://github.com/kunchenguid/lavish-axi";
    changelog = "https://github.com/kunchenguid/lavish-axi/blob/lavish-axi-v${finalAttrs.version}/CHANGELOG.md";
    license = lib.licenses.mit;
    mainProgram = "lavish-axi";
  };
})
