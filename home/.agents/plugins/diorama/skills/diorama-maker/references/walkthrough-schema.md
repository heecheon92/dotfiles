# Walkthrough data format

A walkthrough is data, not prose. Write it as one JSON object first; the page (or the chat
reply) is a rendering of it. This keeps every step the same shape and makes gaps obvious.

Everything in this file after the `template` field is the data shape of the `story`
template: the step story on the isometric stage, the only template today. `templates.md`
holds the contracts a template and a stage follow.

`assets/walkthrough.html` renders exactly this format on an illustrated isometric stage.
`assets/example-walkthrough.json` is a complete walkthrough that follows it.
`visual-craft.md` explains how the stage is drawn and animated. `collection.md` describes
how several walkthroughs are put together into one site.

## The `template` field

```json
{ "id": "badge-tap", "template": "story", "title": "How a Badge Tap Works" }
```

| Field | Type | Rule |
|---|---|---|
| `template` | string, optional | the name of the template that presents this walkthrough, in kebab-case. Leave it out for a step story: no field means `story`, the only name the engine knows today |

A walkthrough written before this field existed needs no edit. A name the engine has no
template for is not drawn as a story instead: the page shows "This walkthrough cannot be
shown", naming the template, and prints a `[diorama]` warning to the console. A value that
is not a kebab-case string gets the same message.

## Top level

| Field | Type | Rule |
|---|---|---|
| `id` | string | kebab-case, used in the deep link and as the file name in a collection |
| `title` | string | 2–5 words, names the thing followed, not the topic area |
| `question` | string, optional | the one question the walkthrough answers, shown directly under the title and more prominent than `summary`. Write it first; see `wording.md` |
| `summary` | string | one sentence, 10–20 words, see `wording.md` |
| `minutes` | number, optional | honest estimate; 8–15 for 8–14 steps. Omit when a duration means nothing (an incident review) |
| `level` | string, optional | `beginner` \| `intermediate` \| `advanced`. Omit outside teaching material |
| `note` | string, optional | one line that labels what is simplified or invented |
| `sources` | entry[], optional | the ledger: where every fact and number comes from (see below). Give one whenever the walkthrough shows numbers |
| `goals` | `{text, step}`[], optional | 4–6 things the reader will be able to say afterwards; `step` is the 0-based step index that shows it. Omit to hide the checklist. The page shows it collapsed at the end of the explanation pane, with a count of how many are covered so far |
| `labels` | object, optional | override the page's headings (see below) |
| `explain` | string, optional | where the explanation sits: `"inside"` (default) as a pane inside the stage card, beside the picture; `"side"` as a column of three cards beside the stage card: the step, the running numbers, the goals and sources. Overrides the collection's `explain`. Any other value is reported in Checks and shown as `"inside"` |
| `metrics` | `{id, label, unit, icon?}`[] | 0–5 running numbers, shown above the stage (in the numbers card with `"side"`); the last is the total. A number the step changed stays tinted until the next step |
| `legend` | `{kind, label}`[] | one entry per flow kind used |
| `nodes` | map id → node | every object that ever appears, with a fixed place on the floor |
| `links` | map id → link | every connection that ever appears |
| `steps` | step[] | 8–14 steps; the last has `chapter: "recap"` |

### Labels

The page's fixed headings come from data, so a walkthrough can be a lesson, a review or a
briefing without sounding like the wrong one. Every key is optional.

| Key | Default | Example override |
|---|---|---|
| `goals` | "What you'll learn" | "What this review covers" |
| `strip` | "In this walkthrough" | "Timeline" |
| `changes` | "What changed" | "What changed on stage" |
| `next` | "Next" | "Then" |
| `back` | "Back" | |
| `restart` | "Start again" | |
| `chapters` | the chapter names | `{ "problem": "what broke", "solution": "the fix" }` |
| `sources` | "Where this comes from" | "Evidence" |
| `sourced` | "sourced" | |
| `assumed` | "assumption" | |
| `try` | "Try it" | "Your turn" |
| `reset` | "Reset" | |
| `numbers` | "Running numbers" | "Time so far" |

In a collection, labels set in `collection.js` apply to every walkthrough and a
walkthrough's own `labels` override them.

### Sources

```json
"sources": [
  { "claim": "The reader sends only the card number", "kind": "data", "source": "sources/reader-protocol.md §2" },
  { "claim": "People notice a wait above 300 ms", "kind": "data", "source": "Team UX guideline", "url": "https://example.com/ux-guideline" },
  { "claim": "Reading a card takes 40 ms", "kind": "assumption", "source": "Illustrative round number" }
]
```

| Field | Rule |
|---|---|
| `claim` | one fact or one value with its unit, as a short statement |
| `kind` | `data` (you can name where it comes from) or `assumption` (you cannot; this includes illustrative round numbers) |
| `source` | required for `data`: a document, a standard, a measurement, or a file path such as `src/auth/login.ts:42`. Optional for `assumption`, where it may hold the reasoning |
| `url` | optional; shown as a link only when it starts with `http://` or `https://` |

Write the ledger before the steps. Sorting data from assumption before anything is drawn
shows you whether you understand the subject, and a reader trusts a page that says where
its numbers come from; that is why the list is on the page and not only in review notes.
Never invent a number or a source.

The page shows the ledger in the explanation pane below the goals list, collapsed, under a
line with the heading and a count per kind: `Where this comes from · sourced 4 · assumption 2`
(a kind with no entries is left out). Each row is a tag (the `sourced` label in green for
`data`, the `assumed` label in amber for `assumption`), the claim, then where it comes from.

`note` stays the one-line label under the title ("Timings are illustrative"). A walkthrough
that shows numbers needs `sources`; `note` alone does not say which numbers are real.

### Node

```json
{ "type": "block", "x": 4, "y": 0, "color": "blue", "glyph": "server", "label": "Controller", "sub": "at the door" }
```

| Field | Rule |
|---|---|
| `type` | `block` (a machine or service) \| `db` (a cylinder: stored data) \| `device` (a laptop; `form: "phone"` or `"reader"` for a handset or wall unit) \| `actor` (one person) \| `crowd` (many people on a platform) \| `queue` (a line of waiting items) \| `zone` (a dashed floor area that groups nodes) |
| `x`, `y` | position on the floor in grid units. `x` runs down-right, `y` runs up-right. A block is 4 units wide; place neighbours 9 units apart (7 at the least) so each object has floor around it. A node never moves between steps |
| `color` | `blue` \| `orange` \| `yellow` \| `green` \| `violet` \| `gray`. Colour means role: one colour per kind of thing, kept for the whole collection |
| `glyph` | icon on the top face: `server`, `balancer`, `globe`, `database`, `cache`, `lock`, `key`, `cloud`, `chip`, `queue`, `mail`, `user`, `door`, `card`, `clock`, `shield`, `bolt`, `file`, `search`, `gear` |
| `label`, `sub` | name on the front face (1–2 words) and an optional smaller second line |
| `size`, `height` | optional; block footprint in grid units (default 4) and height in px (default 46) |
| `w`, `h` | `zone` only: extent in grid units; `x`, `y` is its centre |

### Link

```json
{ "from": "reader", "to": "controller", "label": "card number", "route": "straight" }
```

`route` is `straight` (default), `x-first` or `y-first` for an elbow along the floor grid.

## Step

```json
{
  "short": "Ask server",
  "chapter": "technique",
  "title": "The controller asks the server",
  "body": ["First paragraph.", "Second paragraph."],
  "callout": { "kind": "insight", "text": "One sentence." },
  "changes": ["+ Access server", "+ Decision: 60 ms"],
  "metrics": { "read": 40, "relay": 10, "decide": 60, "unlock": null, "total": 110 },
  "scene": {
    "show": ["card", "reader", "controller", "server"],
    "state": {
      "server": { "load": 0.3, "tags": [{ "text": "60 ms", "tone": "amber" }] }
    },
    "links": { "tap": {}, "wire": { "label": "card number" }, "ask": { "label": "may 0412 enter?" } },
    "flows": [{ "route": ["ask"], "kind": "request", "bounce": true }],
    "panel": null,
    "bubble": { "at": "server", "text": "The decision is made here, in the office, not at the door." }
  }
}
```

| Field | Rule |
|---|---|
| `short` | 1–2 words, the label under the step dot |
| `chapter` | `setup` \| `problem` \| `technique` \| `solution` \| `insight` \| `tradeoff` \| `recap` |
| `title` | about 5 words, a statement of what happens, not a noun phrase |
| `body` | exactly 2 paragraphs, each ≤ 40 words. Inline `<b>`, `<em>`, `<code>`, `<span class="term">` only |
| `try` | optional; makes this a step where the reader chooses a value (see "Try step") |
| `callout` | optional; `kind` is `insight` \| `tip` \| `warn` \| `next`; one or two sentences |
| `changes` | 1–3 lines, each starting `+ ` (added), `~ ` (changed) or `− ` (removed). Omit on step 1 and on the recap |
| `metrics` | value per metric id; `null` until that number has been earned on stage |
| `scene.show` | node ids visible in this step. Normally the previous list plus at most one or two |
| `scene.state` | per-node condition for this step (see below). Each step states it in full; nothing carries over |
| `scene.links` | link ids visible; value may override `label` or set `style`. Set `"label": ""` to hide the label, as on an `off` link |
| `scene.flows` | moving dots (see below) |
| `scene.panel` | optional `{title, lines[]}` summary card docked in a free corner of the stage; use on the recap step. A line starting `= ` is the emphasised total, `! ` a problem row, `# ` a muted note |
| `scene.bubble` | optional `{at, text}`: a short note drawn beside one object (see "Bubble") |

### Bubble

A step may put one short note on the stage, beside the object the step is about. It is for
the single sentence a reader should take from the picture, read without looking away from
it. `techniques.md` says when a step earns one; `wording.md` has the budget.

| Field | Rule |
|---|---|
| `at` | the id of a node this scene shows. Not a zone |
| `text` | plain text, one or two short sentences, 20 words at most. No markup |

- A step without `scene.bubble` has no bubble. The engine never writes one for you.
- The stage chooses the place: beside its object, nearer to it than to any other object,
  covering nothing, and inside the room the scene already takes where there is some, so the
  step is framed as it would be without the bubble. It has no pointer. You do not position it.
- It appears once its object has arrived and finished changing, and stays put for the step.
- Each step states its bubble; nothing carries over. Two neighbouring steps with the same
  `at` and `text` keep the bubble on screen between them.
- A bubble whose object is unknown, is a zone or is not shown in that scene is not drawn and
  is reported in Checks. A bubble that covers something is a rule 8 overlap: shorten the text
  or move a node.
- The sheet draws the bubble on the step's tile and counts its words; the text alternative
  of the stage reads it as "Note beside <object>: …".

The recap step's `body` is one sentence stating the result in numbers, then an HTML
`<ul class="takeaways">` of 3–5 bullets with the key noun in `<b>`. Its callout is `kind: "next"`;
start the text with the name of what comes next, because the page adds the label itself.
In a collection the shell also links to the next walkthrough, so the callout says why it follows.

### Try step

A step with a `try` field hands one choice to the reader: the page shows a "Try it" block
after the body with the prompt, one button per option, a Reset control and a verdict card.
`techniques.md` says when to use one and how to choose the options; `wording.md` has the
budgets.

```json
"try": {
  "prompt": "Pick how long the server takes to answer.",
  "options": [
    {
      "label": "60 ms",
      "verdict": { "tone": "green", "text": "Opens in time", "why": "110 ms in total, under the 300 ms people notice." },
      "metrics": { "read": 40, "relay": 10, "decide": 60, "unlock": null, "total": 110 },
      "scene": { "state": { "server": { "load": 0.3 } }, "flows": [{ "route": ["ask"], "kind": "request", "bounce": true }] }
    }
  ]
}
```

| Field | Rule |
|---|---|
| `prompt` | one sentence telling the reader what to choose |
| `options` | 2–5 options |
| `options[].label` | the text on the button: the value, with its unit |
| `options[].verdict` | `tone` is a tag tone (`green`, `amber`, `red`, `paper`, `violet`, `gray`); `text` is the outcome in a few words; `why` is one sentence |
| `options[].metrics` | optional; when present it replaces the step's `metrics` as a whole |
| `options[].scene` | optional; may hold `show`, `state`, `links`, `flows`, `panel`, `bubble`. A key that is present replaces the step's value for that key as a whole; a key that is absent is inherited |

- The step's own `scene` and `metrics` are the **base**: what the reader sees before
  choosing. Every option, including the right one, must change something on the stage; a tag
  that names the chosen value is enough. An option identical to the base breaks rule 9.
- Because a key is replaced as a whole, an option that sets `state` restates the state of
  every node that has one, as a step does.
- Choosing an option moves the stage to it with the usual transitions and counts the
  metrics up; the text in the pane stays put, moving only as far as it takes to show the verdict. The view is framed once for the base and
  all options, so choosing never moves the camera. Lay out option-only nodes with that in mind.
- Replay with an option chosen replays the move from the base to that option, the metrics
  and an inline summary card included.
- Reset appears once something is chosen and returns to the base. Leaving the step and
  coming back also resets, and the next step starts from its own data, not from the choice.
- Keys on a try step: `1`–`5` choose an option, `0` resets. The keyboard hint shows them on
  try steps only, and the step strip marks try steps.
- The step's link stays `#/<id>/<step>`; the chosen option is not part of it.
- The verdict is announced to screen readers and the stage's text alternative describes the
  chosen option.

### Node state

State is how a step shows that something is busy, broken or different without a sentence.

| Field | Shows | Use |
|---|---|---|
| `load` | 0–1, a gauge pill above the node (green below 0.6, amber below 0.85, red above); on a `db` it is the fill level | how busy or how full |
| `heat` | 0–1, a warm glow behind the node and a tint over it | the node that is in trouble right now |
| `dead` | grey wash and a red cross; its glyph is hidden | failed or unreachable |
| `dim` | pale wash | present but not involved in this step |
| `count` | `crowd`: how many people stand on the platform (up to about 24 are drawn, default 12); `queue`: how many items wait (default 3) | load arriving, backlog growing |
| `tags` | `[{text, tone, icon?}]` pills stacked beside the node; `tone` is `paper` \| `green` \| `amber` \| `red` \| `violet` \| `gray` | a value or a status in two or three words |
| `label`, `sub` | override the node's text for this step | a renamed or re-purposed node |

### Link style

`solid` (default) · `dashed` (indirect, occasional, background) · `off` (exists but unused in
this step) · `cut` (broken: red, no arrowheads; dots on it die at the break) · `beat`
(heartbeat or health check: thin green dots).

### Flow

```json
{ "route": ["ask", "query"], "kind": "request", "bounce": true, "rate": 0.9, "speed": 1, "fail": 0, "hold": 0 }
```

| Field | Rule |
|---|---|
| `route` | link ids in travel order; each link is travelled from its `from` to its `to` unless prefixed with `~` |
| `kind` | `request` (round, warm) · `response` (round, green) · `heavy` (larger square: an expensive request) · `signal` (small ringed dot: a ping, a pulse, a wire signal) · `write` (dark square: a change being stored) · `message` (amber square: a queued item) |
| `bounce` | the dot returns along the route as a `response` |
| `rate` | dots per second (default 0.8). Raise it to show more traffic, not to decorate |
| `speed` | multiplier on travel speed (default 1; use 0.3 for a visibly slow hop) |
| `fail` | 0–1 chance that a dot dies on arrival with a red burst |
| `hold` | seconds a dot waits at the far end before returning; shows waiting on a slow answer |

## Consistency rules the data must satisfy

1. Every id in `scene.show`, `scene.state`, `scene.links`, `scene.flows[].route` and `goals[].step` exists.
2. A link is shown only when both of its nodes are shown; a flow uses only links shown in that step.
3. `metrics.total` equals the sum of the other non-null metrics in that step.
4. Every number in `body` matches the number in `metrics`, `state` tags and `changes` for that step.
5. Each `changes` line corresponds to something that is visibly different on the stage.
6. Each goal's `step` is the step where that idea is actually shown, not merely mentioned.
7. No two nodes are closer than 6 grid units, and consecutive flow links share an endpoint.
8. Nothing overlaps: in a settled step or option, no node label (including the name on a
   block's face and a zone's name on the floor), tag, gauge, link label or summary card
   covers an object or another of those. A name is not checked against its own object.
9. A `try` is well formed: 2–5 options, each with a `label` and a `verdict.text`, a known
   verdict tone, and no option identical to the base. Rules 1, 2 and 3 also hold for every
   option after it is merged with its step.
10. Every number on the stage (metrics, tags, link labels, the summary card, verdicts) is a
    `sources` claim or follows from those claims by arithmetic the reader could redo.

## What the page checks

The page checks rules 1, 2, 3, 7, 8 and 9 when it loads. Rules 4, 5, 6 and 10 need a reader.
It reports at two levels, both printed once to the browser console and listed on the sheet:

| Level | Console line | Meaning | What to do |
|---|---|---|---|
| Warning | `[diorama] <id>: …` | a rule above is broken, or a `sources` entry has an unknown `kind` or is `data` with no `source` | fix it; a walkthrough with warnings is not finished |
| Note | `[diorama] note: <id>: …` | a budget or a craft guideline is exceeded | fix it, or keep it and say why in the handoff |

A rule 8 warning names the step and the two things that overlap; at most four are listed per
scene, then a count of the rest. Fix it by moving a node or shortening a text
(`visual-craft.md`, "Fixing an overlap"), never by deleting the label.

A field of the wrong type (for example `scene.show` that is not a list, or a tag that is
not an object) is also a warning. It names the step, the option and the field, and the page
draws the rest without it; in an option, the step's value is used instead.

Notes are raised for:

- a non-recap step whose body is not exactly 2 paragraphs, or a paragraph over 40 words
  (tags are not counted, a list such as the recap's takeaways is skipped, and text written
  mostly without spaces, such as Chinese or Japanese, is not counted at all);
- `short` over 2 words, a step title over 8 words, `changes` over 3 lines;
- step 1 showing more than 2 nodes, or a later step adding more than 2 (zones do not count);
- a last step that is not `recap`;
- a view so far out that the smallest label is under 8 px on screen at the reference stage
  size (960×540 px, about a 1440×900 window). This note may stand when it comes from giving
  objects room: the reader zooms and pans the stage. Say so in the handoff;
- more than 2 try steps, a `verdict.text` over 4 words, a `verdict.why` over 20 words;
- metrics or number tags in a walkthrough that has neither `sources` nor `note`.

The automatic checks do not cover facts, numbers in the prose, whether "what changed"
matches the picture, or transitions.

## The sheet

`#/<walkthrough-id>/sheet` shows the whole walkthrough as one scrolling page of stills, in
the single page (`walkthrough.html#/badge-tap/sheet`) and in a collection
(`index.html#/badge-tap/sheet`). It is a review tool; nothing in the reader's page links to it.

1. **Header:** title, question, and counts of steps, try options and sources by kind.
2. **Checks:** every warning and note for this walkthrough, or a line saying the automatic
   checks found nothing, then one line listing what they do not cover.
3. **Tiles:** one per step and one per try option (`6`, `6a`, `6b`…). A tile shows
   `n · short · chapter`, the step title, the settled stage as a still at the framing a
   reader gets (flows as static arrows along the part of the route a dot reaches, summary
   card included), the metric values, and the word count of each body paragraph, flagged
   when over budget. An option tile shows the option's label, its verdict and `why`, and
   their word counts instead. Each still carries the same text description for screen
   readers as the reader's stage.

Open it after every change, at a window about 1440 px wide: tiles are two across and large
enough to read. One or two screenshots of it replace clicking through every step. It does
not show transitions; step through once for those.

## Other families

The same four regions apply (see `structure.md`), but the data differs. The `story` template
renders only the step-driven families (story, trace-as-steps, procedure-as-steps). An object
lab or a 3D scene needs its own stage code; `visual-craft.md` describes how those are built.
None of the shapes below is an engine template, so none is a value for `template`.

### Object lab (a thing you manipulate)

```json
{
  "id": "blink", "title": "Blink an LED",
  "lede": "Two sentences: what is on the stage and what makes it behave that way.",
  "features": ["What it demonstrates", "Click the X to try other values", "Click the Y to change Z"],
  "callouts": [{ "anchor": "part:led", "title": "LED", "body": "Lights up whenever pin 13 goes HIGH." }],
  "controls": [{ "part": "resistor", "label": "How tight Ohm squeezes", "options": ["100 Ω", "220 Ω", "470 Ω", "1 kΩ"] }],
  "tabs": { "overview": "...", "components": "...", "circuit": "...", "maths": "..." }
}
```

- Exactly 3 `features`: one names the idea, two tell the reader what to click.
- Callouts are a title plus at most two short lines, anchored to a part of the object.
- Controls offer 2–5 preset values, never free input, and there is always a reset.
- Tabs run from plain words to formula. The formula tab shows the live numbers substituted in.

### Trace (a real artefact decoded)

Phases → messages → fields. Each phase has `title`, `desc` (4–6 words), `detail` (2–3 sentences)
and `facts` (3 label/value pairs). Each field has a name, its value and a one-line plain note
that says what the field is for, not what it is called.

### Procedure (a physical skill)

Stages → sub-steps. Each stage has a title, a 1–2 sentence instruction and 3–4 imperative
sub-steps ("Stack the fuel wood"). Three tabs: how, why, tips. Objects placed in earlier
stages stay on the stage.
