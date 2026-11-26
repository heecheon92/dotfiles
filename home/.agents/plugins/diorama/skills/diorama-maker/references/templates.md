# Templates and stages

The engine has three layers. Read this before adding a template (such as the trace) or a stage.

- **Format:** how a piece is presented and moved through: numbered steps, a single page, a
  timeline. **Stage:** how its picture is drawn: the isometric diagram, later a 3D scene.
  **Template:** a format on a stage (or on none). Today: `story`, the step story on the `iso` stage.
- **Shell** (`engine/diorama.js`, `diorama.css`): the single-file page, the collection (outline,
  drawer, search, progress, routing), status messages, labels, and the registries and loader
  below. It knows nothing of steps, nodes or links; it calls templates through the format contract.
- **Stage** (`engine/stage-<name>.js`, `.css`): draws scenes. **Template** (`engine/template-<name>.js`,
  `.css`): everything else about the piece, using its stage through the stage contract.

## Files, loading and naming

- A walkthrough names its template with one optional field, `"template": "trace"`. None means
  `story`. The name is kebab-case and must match the file names.
- A template file is one call, which must open exactly like this (the build tool reads the stage
  from it): `Diorama.defineTemplate('<name>', { stage: '<stage>' }, (kit, stage) => { ...; return {...}; });`
  Use `{ stage: null }` for a template with no stage; the factory then gets `stage` as null.
- A stage file is `Diorama.defineStage('<name>', (kit) => { ...; return {...}; });`.
- Factories run once, on first use. `kit` holds the shell's helpers: `esc`, `clamp`, `lerp`,
  `n1`, `n2`, the easings, `plural`, `isObject`, `KEBAB`, `warn`, `plainText`, `typingIn`,
  `GLYPH`, `iconHtml`, `pillHtml`, `tagHtml`, `TONES`, `toneOf`, `motion` (the reduced-motion
  query), `restartAnim`, `lifetime()` (`later`, `frame`, `listen`, `end`) and `sheetChecks`.
- Every template and stage has both a `.js` and a `.css` file; the CSS may be empty. Its rules
  stay in the page after the reader moves on, so scope them to the template's own class names.
- **Colours and themes:** put light values in `:root` and dark values in
  `:root[data-theme="dark"]`, as `diorama.css` and `stage-iso.css` do. The shell sets
  `data-theme` on `<html>` from the reader's choice (the theme button: light, dark or system)
  and the system setting. Do not use `@media (prefers-color-scheme)`: it would ignore that
  choice. The shell draws the theme button itself, in the map and top bar of a collection and
  in the top right corner of a single page, so a template never adds one. On a single page,
  start with the shell's `.wt-head`, which leaves room for the button, or keep the top right
  46 px of the page clear.
- **Collection:** `index.html` loads only `engine/diorama.css` and `engine/diorama.js`. When a
  walkthrough opens, the shell loads `engine/template-<name>.js`, then the stage's CSS and JS and
  the template's CSS (stage CSS first), with `<script>`/`<link>` tags, and waits for them. A
  missing or broken file shows "This walkthrough cannot be shown", naming the template and the
  file, and warns in the console as `[diorama] <id>: the template "<name>" cannot be used: ...`.
- **Single-file page:** everything is inline and nothing is loaded. A walkthrough naming a
  template the page lacks gets the same kind of message.

## Format contract (template → shell)

The factory returns an object with these members. `w` is the walkthrough object.

| Member | Arguments | Must return / do |
| --- | --- | --- |
| `labels` | | Default words of the template (strings; an object value such as `chapters` merges key by key). The shell adds its own (`next`, `home`, `continue`, `planned`, `draft`, `sections`) and lets `collection.js` and the walkthrough override any. |
| `unusable(w)` | | A reason (string) when the data cannot be shown at all, else `null`. Cheap; must not throw. |
| `prepare(w)` | | Read and check the whole piece once per object (cache by `w`) and print the checks to the console. Throw only on a fault the checks did not foresee; the shell shows it as a problem. |
| `checks(w)` | | `{ warnings: [], notes: [] }`, strings. The same findings `prepare` printed. |
| `positions(w)` | | `{ count, first, last, parse(seg, loose), format(pos), label(pos) }`, below. |
| `mount(host, w, opts)` | see below | Render the reading page into `host`; return a view. |
| `mountSheet(host, w, opts)` | `{ labels, crumb, docTitle }` | Render the review sheet; return `{ focusTitle(), destroy() }`. |
| `search(w)` | | `[{ at, title, sub, text }]`: `at` a position, `text` what is matched, `title`/`sub` what a hit shows. |

**Positions** are whatever values the template likes (the story uses 0-based step indexes, the
test template the string `'page'`). The shell never does arithmetic on them.

- `format(pos)` → the URL segment, as in `#/<id>/<segment>`; letters, digits and `-` only. It must
  not throw on a value it did not produce: stored positions come back as `parse(format(pos), true)`.
- `parse(seg, loose)` → a position or `null`. `loose` is true in a collection: map an out-of-range
  segment to the nearest position if that makes sense. A null in a collection opens where the
  reader left off. The segment `sheet` is the shell's.
- `label(pos)` → words for the reader, such as `step 3`: search results and Continue use it.
- `first`, `last`: positions. Reaching `last` marks the piece read; Next from the previous piece
  opens at `first`, Back from the next one at `last`. `count`: how many positions there are.

**mount opts:** `labels`, `start` (a position), `crumb`, `searchHint` (show the `/` key), `docTitle`,
`minutes`, `level`, `prev` (`{ title, go() }` or null: where Back before `first` leads), `end`
(`{ label, icon, go() }` or absent: what the primary button does at `last`), `onMove(pos)`. Call
`onMove` after every change of position, and from `go()` even when the position stays: the shell
updates the address, the progress and the "read" mark from it.

**The view** returned by `mount`: `position` (getter), `go(pos)`, `key(e)` (return true when the
key was used; the shell has already skipped keys typed into fields or held with Alt, Ctrl or ⌘,
and calls `preventDefault` for you), `focusTitle()`, and `destroy()`, which must cancel every
timer, frame, listener and observer it started and empty `host`. `kit.lifetime()` helps.

The sheet's checks section comes from `kit.sheetChecks(checks, uncoveredHtml)`. Set
`document.title` in `mount` and `mountSheet` (`opts.docTitle` when given).

## Stage contract (stage → template)

The factory returns: `unusable(data)`, `model(data)`, `parts(opts)`, `mount(host, model, opts)`,
`defs()` (SVG `<defs>` markup for a page of stills), and anything else its templates need (the
`iso` stage adds `flowKind(kind)` and `flowIcon(kind)` for a legend).

- `unusable({ nodes, links })` → a reason or `null`.
- `model({ nodes, links, scenes, groups })` reads the picture once. `scenes` is a list of
  `{ scene, name, base }`: the scene keys, a name for messages ("step 3"), and optionally the index
  of an earlier scene this one varies (its own keys replace the base's). `groups` lists scene
  indexes framed by one camera, in reading order (a try step's base and its options); a scene in
  no group frames alone. The template keeps its own list in the same order, so scene `k` means the
  same on both sides. The model offers:
  - `shapes` (problems of nodes and links) and `sceneShapes[k]` (problems of scene `k`'s keys);
  - checks: `wiring()`, `rules(k)`, `spacing()` (string lists), `layout(k)` →
    `{ overlaps, smallest, zoom }` at `reference` (`{ W, H }`), `signature(k)` (equal strings mean
    the same picture), `objects(k)` (ids shown, zones excluded), `numbers()` (a tag shows a digit),
    `bubble(k)` (`{ at, text }` of the bubble scene `k` draws, or `null`);
  - `describe(k)` → one line of text per thing in scene `k`; `still(k, size?)` → `{ viewBox, svg }`,
    scene `k` settled, at the reference size or `{ W, H }`.
- `parts({ replayTitle })` → `{ controls, scene, text }`, HTML for the template to place in its page.
  The stage sizes itself to the element that holds `scene`; a template may lay other things over
  or beside that element (the story puts its explanation pane beside it, inside the stage card).
- `mount(host, model, opts)` binds to those parts inside `host`, measures the room and starts its
  frame loop; call it once the page around them is in place. `opts`: `titleOf(k)` (the title in
  the scene's text alternative), `onReplay()` (the Replay button). The stage view:
  `show(k, { instant, fit })` → ms until the move ends (`-1` empties the stage; the first scene
  opens framed); `replay(k, from)` (scene `from` at once, then animate to `k`); `text(k)` (writes
  the text alternative); `inline(k, animate)` (the summary card under a narrow stage);
  `untrace()`; `pause(v)` and `paused`; `after(ms, fn)` on the stage clock; `zoom(dir)`; `fit()`;
  `destroy()`. The reader's zoom, pan and tracing stay inside the stage.

## Single-file pages

`python3 tools/build-single.py` writes `assets/walkthrough.html` (story); `--check` exits 1 when it
is out of date. For another template: `--template <name>`, `--out <path>`, and `--template-dir`
when its files are not in the engine folder. The page inlines the shell, the template's stage and
the template, each between `BEGIN`/`END` markers, and embeds `--data` or else
`<template-dir>/example-<name>.json` or `.js` (a `Diorama.walkthrough({...});` file).

## Adding a template or a stage

1. Write `engine/template-<name>.js` and `.css` (or `stage-<name>.*`) with the contract above. Do
   not edit `diorama.js`, another template or another stage; if you need something the contract
   lacks, change the contract here and in every layer that uses it.
2. Give it a walkthrough with `"template": "<name>"` and build a single page for it.
3. Check it in a copy of the collection: outline, a direct link, `#/<id>/sheet`, search, going to a
   story walkthrough and back (the story page must look exactly as before), and no console errors.
4. Raise the version in `plugin.json` and `engine/VERSION` together. Adding a template, a
   component or a colour scheme is a **patch** version, as is a fix. Changing the shell, a
   contract in this file, a data format or the existing behaviour of a stage or a template is
   a **minor** version.

## Run the test template

`tools/test-template/` holds `plain`: one page of text, one position, a one-tile sheet, one check,
no stage. It is not shipped in the skill.

- Single page: `python3 tools/build-single.py --template plain --template-dir tools/test-template --out /tmp/plain.html`,
  then open `/tmp/plain.html` (it moves to `#/plain-demo/page`) and `#/plain-demo/sheet`.
- Collection: copy `skills/diorama-maker/assets/collection/` to a scratch folder, copy
  `tools/test-template/template-plain.js` and `.css` into its `engine/`, copy
  `tools/test-template/example-plain.js` to its `walkthroughs/plain-demo.js`, and add to a section
  of its `collection.js`: `{ "id": "plain-demo", "title": "A Page With No Steps", "summary": "A test walkthrough for the plain template: one page of text and no stage.", "status": "approved" }`.
  Open `index.html#/plain-demo`. A walkthrough naming a template with no file, such as
  `"template": "trace"`, shows the "cannot be shown" message instead.
