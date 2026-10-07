# Rendering, semantic QA, and delivery

## Portable runtime

The skill is plain Markdown and a Python 3 standard-library helper. It does not require a
specific model, provider key, agent SDK, browser connector, or installed agent UI metadata.
Individual examples use Mermaid core or an explicitly documented renderer integration.

For the full catalog, use **Mermaid CLI 12.0.0 with Mermaid 12.1.0**, the verification baseline.
A locally installed older `mmdc` can still render supported types; do not mistake its failures
on newer types for invalid source. Use case requires 12+, swimlanes and Cynefin require 11.16+.
The official catalog is a dated snapshot; check upstream before adopting new features.

Prerequisites for browser rendering: a compatible Node runtime (the official Mermaid 12 guide
specifies Node 22.12+), Mermaid CLI, and a compatible Chrome/Chromium available to Puppeteer.
A first one-shot CLI run may download packages and a browser and requires network/cache access.
Use environment-approved tools; never silently install globally or alter project dependencies.

```sh
# If a compatible CLI is already installed:
mmdc -i diagram.mmd -o diagram.svg -b white

# Optional scoped execution when package downloads are authorized:
npx --yes --package @mermaid-js/mermaid-cli@12.0.0 mmdc \
  -i diagram.mmd -o diagram.svg -b white
```

CLI 12 uses `--size` where older CLI examples used `-w`/`--width`; check `mmdc --help`
before reusing renderer flags. The helper uses common flags only.

Pinning the CLI alone does not lock transitive Mermaid/browser versions. For reproducible CI,
use an environment-owned lockfile/container and record both CLI and Mermaid versions.
Do not embed a personal Chrome path in shared skill files. When needed, pass a local
Puppeteer JSON config using `mmdc -p /path/to/local-browser.json`.

## Run the bundled examples

Resolve paths relative to the installed skill directory. The commands below assume that
current directory is the skill directory; other harnesses can pass absolute paths instead.
The output directory must be new and outside the skill. Paths shown under `/tmp` are POSIX
examples; choose the host's temporary directory on other platforms.

```sh
python3 scripts/check_examples.py
python3 scripts/check_examples.py --output-dir /tmp/mermaid-examples-source
python3 scripts/check_examples.py --render --output-dir /tmp/mermaid-examples-render
python3 scripts/check_examples.py --render --only swimlane sequence block \
  --mmdc /path/to/mmdc --output-dir /tmp/mermaid-selected-render
```

The helper never installs packages, executes diagram text as shell code, or overwrites an
existing output directory. It produces `.mmd`, SVG, a JSON report and an HTML review gallery.
A nonzero result means a missing prerequisite, invalid reference/source, timeout or rendering
failure. Inspect the report rather than replacing a failing example with a different type
while claiming the original passed. `--puppeteer-config` can select an already-installed browser.

## What to inspect beyond parsing

- Open the image at readable scale: labels, edge direction, cardinalities, loops and branches.
- Check that the renderer did not create unintended nodes from unsupported syntax; block
  links use their own syntax, not automatically the flowchart `-->|label|` convention.
- Check lane order, not just arrow existence. Provisional display should not visually follow
  final completion in a temporal reading unless explicitly explained.
- Put self-transition explanations in notes when loop labels collide. Independent resources
  can share one state view without implying that they expire together.
- Explain partial ERs and application-managed references. A diagram cannot add a foreign key
  or enforce a relationship that the implementation lacks.
- Identify numerical units, denominators and assumptions. No fabricated precision or flow
  conservation; qualify synthetic schedule dates and subjective scores.
- Compare against the actual destination at desktop and narrow widths. Fix crowding by
  shortening/grouping/splitting or changing type before shrinking all text.
- Syntax/semantic tests do not prove model quality, deployment, user satisfaction, or measured
  performance. Match the verification claim to what was actually checked.

## Deliver a usable artifact

Keep editable Mermaid source in the requested Markdown or `.mmd` location. For newer types,
include a generated SVG/PNG fallback or a local HTML preview when the destination's support is
unknown. GitHub's version is not the same as a locally installed CLI. A standalone HTML preview
can embed generated SVGs and avoid loading Mermaid or third-party scripts at viewing time.

Do not send private source to Mermaid Live or an external image host without authorization.
Keep generated browser caches and temporary render reports out of source repositories.
Only retain rendered files in the repository when they serve the requested documentation.
For terminal-only output, a partial text renderer may be appropriate, but verify its supported
subset and tell the user when visual syntax is simplified. This skill does not require Termaid.

## Verification record

Verified on 2026-10-02 on macOS with Node 26.7.0, Mermaid CLI 12.0.0 and Mermaid 12.1.0:

- All 31 examples rendered to SVG, including use case, swimlane and the CLI-bundled ZenUML integration.
- All 31 outputs were visually reviewed; architecture placement, radar label margins and Gantt
  tick spacing were corrected and the three affected examples re-rendered successfully.
- Reference links, example discoverability, extraction and refusal to overwrite existing output
  directories were checked. Skill frontmatter validation passed.
- The pinned CLI was installed in an isolated temporary directory with an existing browser;
  no global renderer, application dependency, provider key, or live service was changed.

The helper's gallery/report are temporary verification artifacts, not bundled assets. These
checks do not certify arbitrary user diagrams, all operating systems, browser provisioning on
a clean machine, GitHub's renderer, or every optional icon/renderer integration. If an older
renderer lacks a type, preserve the source and use a verified export or equivalent supported view.
