# Styling, configuration, and accessibility

Use this page when a diagram needs an explicit theme, layout, styling, or accessible
metadata. Choosing the type first is still [the catalog's](catalog.md) job, and syntax
reminders live in [syntax essentials](syntax.md).

Checked against the official Mermaid 12 documentation on 2026-11-02. Features are
version-gated; verify the target renderer before relying on any of them.

## Configure per diagram, not globally

YAML frontmatter (10.5+) is the supported per-diagram mechanism:

```yaml
---
config:
  theme: neutral
  layout: dagre
---
flowchart LR
  A --> B
```

- `%%{init: {...}}%%` directives still render but are deprecated in favor of frontmatter.
- Site-wide settings belong in `mermaid.initialize()`; per-diagram settings win.
- A host may ignore frontmatter or restrict configuration. GitHub, editors, and a locally
  installed CLI can render the same source differently. Verify in the actual destination.
- Do not put configuration inside a user's diagram merely to work around one renderer unless
  the user asks for that; state the tradeoff instead.

## Themes and looks

Mermaid 12 themes: `default`, `neutral`, `dark`, `forest`, `base`, `neo`, `neo-dark`,
`redux`, `redux-dark`, `redux-color`, `redux-dark-color`. Only `base` accepts
`themeVariables`; other themes ignore overrides.

Mermaid 12 changed defaults: flowchart, swimlane, class, ER, requirement, sequence, state,
use case, and Venn use the `redux-color` theme with the `neo` look; other types use
`default` with `classic`. To reproduce the older appearance for one diagram:

```yaml
---
config:
  theme: default
  look: classic
  layout: dagre
---
```

`look` is `classic`, `handDrawn`, or `neo`; `handDrawnSeed` stabilizes sketch-style
layout. Hand-drawn output is a presentation choice, not a clarity fix.

For custom colors, start from `base` and override semantic variables. The engine accepts
hex values, not color names, and derives related colors from the ones you set:

```yaml
---
config:
  theme: base
  themeVariables:
    primaryColor: "#e8f1f5"
    primaryTextColor: "#17323a"
    primaryBorderColor: "#4b7f8c"
    lineColor: "#4b7f8c"
    secondaryColor: "#f2e8d5"
    tertiaryColor: "#ffffff"
---
```

Keep the palette small, preserve contrast, and never let color alone carry meaning. A
legend or label belongs beside any styling that encodes a distinction. Test dark-mode
variants separately if both are delivered.

Validated example: [theme and layout configuration](snippets/snippet-theme-config.md).

## Layout

- `layout: dagre` is the long-standing layered default.
- `layout: elk` is bundled and default in Mermaid 12 for flowchart, state, class, ER,
  requirement, use case, and agentflow. Before 12 it required the separate
  `@mermaid-js/layout-elk` package, so older renderers may reject or ignore it.
- `elk` options include `mergeEdges` and `nodePlacementStrategy` (`SIMPLE`,
  `NETWORK_SIMPLEX`, `LINEAR_SEGMENTS`, `BRANDES_KOEPF`). These tune layout, not meaning.
- `cose-bilkent` and `tidy-tree` remain available where the build registers them.
- A layout that is not registered falls back to dagre with a console warning; a successful
  export is not proof the requested layout ran.

Improve readability by shortening labels, grouping, or splitting views before reaching for
a different engine. Randomized architecture layout can use `randomize` plus `seed` when
reproducibility matters.

## Styling individual elements

Flowchart node and link styling is supported and useful for emphasis. Fictional example:
[flowchart styling with classes and linkStyle](snippets/snippet-flowchart-styling.md).

- `classDef name ...` defines a reusable class; `A:::name` or `class A name` applies it.
- `linkStyle <index|default> ...` targets edges in declaration order; reordering links
  silently changes the styling, so verify after editing. Edge IDs (`A e1@--> B`,
  `e1@{ curve: linear }`) are less brittle where the renderer supports them (11.3+).
- Subgraph container colors are primarily theme-driven. Per-subgraph `style <id> ...` is
  accepted by the flowchart parser in current versions but is not part of the documented
  styling section; treat it as renderer-dependent and inspect the result.
- C4 uses `UpdateElementStyle`, `UpdateRelStyle`, and `UpdateLayoutConfig`; the C4 palette
  is otherwise fixed.
- Styling other types is mostly theme-driven; avoid CSS class names that only one renderer
  emits unless the deliverable targets that renderer.

## Accessibility and interaction

- `accTitle: ...` and `accDescr: ...` (single line) or `accDescr { ... }` (multi-line)
  emit SVG `<title>`/`<desc>` and ARIA references for all diagram types. Add them for
  diagrams published in documentation; a visible caption is still useful.
- Write the diagram's conclusion in prose nearby. A screen reader receives the description,
  not the visual reasoning.
- `click` links and tooltips in flowcharts require `securityLevel: 'loose'`. `strict` is the
  safe default and disables them. Do not weaken security to make links work on untrusted
  diagram text; provide the URL beside the diagram instead.
- Some diagram types offer renderer-specific links (for example sequence actor menus). They
  carry the same trust caveats as any link.

## Export

`mmdc` options worth remembering (Mermaid CLI 12):

```sh
mmdc -i diagram.mmd -o diagram.svg -b white
mmdc -i diagram.mmd -o diagram.png --size 2400 -b transparent
mmdc -i diagram.mmd -o diagram.svg -t neutral
```

- CLI 12 replaced the old `-w`/`-H` width/height flags with `--size`; check `mmdc --help`
  before reusing older examples.
- `-b` sets the background (`white`, `transparent`, or a color); `-t` selects a theme;
  `-c` loads a Mermaid config JSON; `-p` loads a local Puppeteer config.
- `-i input.md -o output.md` rewrites Markdown and writes SVGs beside it; this mutates the
  file rather than only previewing it.
- `--iconPacks` and `--iconPacksNamesAndUrls` require installed or reachable icon packs.
- Exported SVG can embed fonts; use `--no-font-embed` only when the environment provides
  those fonts.
- Do not publish generated files into source repositories unless the task asks for them.

Renderer setup and verification expectations are in [rendering and delivery](rendering.md).
