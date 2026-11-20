# Collections

A collection is a folder that holds several walkthroughs and one shell page that presents
them together: a course, an onboarding guide, a set of incident reviews, an explainer
library. The folder is self-contained. It opens from disk without a server, needs no build
step and no network, and can be zipped, hosted as static files or committed to a repository.

A single walkthrough does not need a collection: use `assets/walkthrough.html`.

## Folder layout

```
<collection>/
├── index.html            the shell; never edited per walkthrough
├── collection.js         the outline: sections, order, status, switches
├── engine/
│   ├── diorama.css       styles of the shell
│   ├── diorama.js        the shell: collection, map, search, progress, links, loader
│   ├── stage-iso.css     styles of the isometric stage
│   ├── stage-iso.js      the isometric stage: draws and animates the scene
│   ├── template-story.css  styles of the step story's page
│   ├── template-story.js   the step story: steps, try steps, sheet, checks
│   └── VERSION           the engine version this folder was created with
├── walkthroughs/
│   └── <id>.js           one file per walkthrough
├── reviews/
│   └── <id>.md           review notes and the decision for one walkthrough
├── sources/              material the walkthroughs' facts and numbers come from
└── AGENTS.md             rules and current state for any agent working in the folder
```

Create one by copying `assets/collection/` and then editing `collection.js`. Never edit
`index.html` or `engine/` inside a collection; to change the engine, change it in this skill
and copy it over (see "Updating the engine").

`index.html` loads only `engine/diorama.css` and `engine/diorama.js`. When a walkthrough
opens, the shell loads the files of its template and stage from `engine/`, so `index.html`
stays the same whatever the engine holds. The step story (`story`) on the isometric stage
is the only template today; `templates.md` describes the layers.

Data files are `.js`, not `.json`, because a page opened from disk may not fetch files.
Each is one call with a JSON object as its only argument, so it stays machine-readable:

```js
Diorama.collection({ "id": "door-access", "title": "How Door Access Works", ... });
```

```js
Diorama.walkthrough({ "id": "badge-tap", "title": "How a Badge Tap Works", ... });
```

Write strict JSON inside the call: double quotes, no comments, no trailing commas.

## collection.js

```json
{
  "id": "door-access",
  "title": "How Door Access Works",
  "summary": "From one badge tap to a building of doors that keep working when the network does not.",
  "note": "Timings are illustrative round numbers.",
  "options": { "ordered": true, "progress": true, "showPlanned": true, "showDrafts": false },
  "labels": { "goals": "What you'll learn" },
  "sections": [
    {
      "id": "one-door",
      "title": "One door",
      "items": [
        { "id": "badge-tap", "title": "How a Badge Tap Works", "summary": "Follow one card tap from the reader to the lock.", "status": "approved" },
        { "id": "sync", "title": "Keeping Copies in Sync", "summary": "How a cancelled card reaches every door in seconds.", "status": "planned" }
      ]
    }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | kebab-case and unique among your collections: reading progress is stored in the browser under it, and pages opened from disk share that storage |
| `title`, `summary` | shown on the home view; same wording rules as a walkthrough |
| `note` | optional one-line caveat shown on the home view |
| `options.ordered` | `true`: sections and items are numbered and each walkthrough ends with a button to the next one. `false`: an unordered library; no numbers, and the last step leads back to the overview |
| `options.progress` | `true`: the shell remembers which walkthroughs were read to the end and where the reader stopped, shows counts per section and offers "Continue" on the home view. Stored in the reader's browser only |
| `options.showPlanned` | `true`: items with status `planned` appear greyed out as "planned". `false`: they are hidden |
| `options.showDrafts` | `true`: items that exist but are not approved are listed with a "draft" tag. `false`: only approved items are listed. Use `true` while building, `false` when sharing |
| `labels` | optional heading overrides applied to every walkthrough (see `walkthrough-schema.md`), plus `sections` ("Sections"), `home` ("Overview"), `continue` ("Continue"), `planned` ("planned"), `draft` ("draft") |
| `sections[]` | 1–9 groups. A collection with one section shows no section heading |
| `sections[].items[]` | the walkthroughs in reading order: `id`, `title`, `summary`, `status`, optional `minutes` and `level` (used on cards, and by the walkthrough when it sets none itself) |

The item's `title` and `summary` are repeated from the walkthrough so that the home view and
the map can be drawn without loading every walkthrough file. Keep them identical; the shell
prints a `[diorama]` warning to the console when they differ. An unknown status is treated
as `drafted`, also with a warning.

## Status

Each item has one status. It is the single record of where the work stands.

| Status | Meaning | File exists |
|---|---|---|
| `planned` | in the outline, not written | no |
| `drafted` | written; its sheet shows no warnings and its author stepped through it once | yes |
| `reviewed` | an independent review is recorded in `reviews/<id>.md` and its findings are resolved | yes |
| `awaiting-approval` | ready for the owner to read | yes |
| `approved` | the owner accepted it | yes |

Only the owner moves an item to `approved`. A change to an approved walkthrough's facts or
steps moves it back to `drafted`.

## What the shell does

- **Home view** (`#/`): title, summary, and the sections with their items as cards. With
  `progress`, a "Continue" button and read counts.
- **Map**: a collapsible left column listing sections and items, with the current one marked.
  On a narrow screen it becomes a drawer.
- **Walkthrough view** (`#/<walkthrough-id>/<step>`): the same four-region page as the
  single-file template. The walkthrough file is loaded when first opened. `#/<walkthrough-id>`
  without a step opens where the reader left off.
- **Sheet** (`#/<walkthrough-id>/sheet`): every step and try option of one walkthrough as
  stills, with the automatic checks (`walkthrough-schema.md`, "The sheet"). It opens for any
  walkthrough whose walkthrough view opens, and nothing in the shell links to it.
- **Next and previous**: with `ordered`, the last step's button leads to the next listed
  walkthrough the reader can open, and Back on the first step leads to the last step of the
  previous one. The final walkthrough ends with a button to the overview. Arrow keys stay
  inside the current walkthrough.
- **Search** (`/` or `Ctrl/⌘ K`): over the titles and summaries of items the reader can
  open, and over their step titles and marked terms. The first search loads walkthrough
  files that have not been opened yet.
- **Keys**: ← → step, R replay, Space pause, `+` and `-` zoom, `F` fit, `1`–`5` and `0` on a
  try step, `g` then `h` for the overview.
- **Problems are shown, not hidden**: a missing file, a file with an error, a file that
  registers another id, a walkthrough naming a template the engine lacks, and a link to a
  planned or hidden item each replace the walkthrough view with a message naming the file,
  the template or the reason, and a way to retry or go back.

The shell needs a browser from 2023 or later (Chrome 105, Safari 16, Firefox 110). Its fixed
interface text (Replay, Pause, search hints, problem messages) is English; the headings
listed under `labels` can be renamed.

## AGENTS.md in a collection

`assets/collection/AGENTS.md` is copied with the folder. It tells an agent that opens the
folder, with or without this skill installed:

- what the collection is for and who reads it (filled in when the folder is created);
- that `collection.js` is the one record of the outline and status;
- that every walkthrough is reviewed on its sheet and lists where its numbers come from;
- the rule that only the owner approves;
- that `index.html` and `engine/` are not edited here;
- where the format and wording rules are (this skill), and what to do if it is not installed.

## Updating the engine

`engine/VERSION` holds the version the folder was created with. To update a collection, copy
`assets/collection/engine/` from this skill over the folder's `engine/` and
`assets/collection/index.html` over its `index.html`, then open the sheet of every
walkthrough and read its Checks block. Walkthrough and collection data are never rewritten
by an engine update, and data written for an earlier engine renders as before. Engine 0.2.0
adds the question, the sources list, try steps, the sheet and the automatic checks, so an
older walkthrough may show warnings or notes it never showed; treat them as review findings.
Engine 0.2.1 is a bug-fix release with no change to the data format. Engine 0.3.0 lets the
reader zoom and pan the stage and trace what an object or a link is connected to, with no
change to the data format.

Engine 0.4.0 splits the engine into the shell, the isometric stage and the step story, so
`engine/` holds six files and `VERSION`. The update is the same procedure, and it must
copy every file in the folder: with a stage or template file missing, a walkthrough shows
"This walkthrough cannot be shown". `index.html` did not change. A walkthrough may now
carry an optional `template` field; without it, it is a step story as before, and no
existing file needs an edit. The step story reads and looks the same. Two details of the
collection differ: for a walkthrough not yet opened under 0.4.0, the home view's Continue
link points at the walkthrough without a step number, and an address whose last segment is
not recognised opens where the reader left off instead of the home view.
