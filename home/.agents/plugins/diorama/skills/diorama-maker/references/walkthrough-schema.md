# Walkthrough data format

A walkthrough is data, not prose. Write it as one JSON object first; the page (or the chat
reply) is a rendering of it. This keeps every step the same shape and makes gaps obvious.

`assets/walkthrough.html` renders exactly this format on an illustrated isometric stage.
`assets/example-walkthrough.json` is a complete walkthrough that follows it.
`visual-craft.md` explains how the stage is drawn and animated. `collection.md` describes
how several walkthroughs are put together into one site.

## Top level

| Field | Type | Rule |
|---|---|---|
| `id` | string | kebab-case, used in the deep link and as the file name in a collection |
| `title` | string | 2–5 words, names the thing followed, not the topic area |
| `summary` | string | one sentence, 10–20 words, see `wording.md` |
| `minutes` | number, optional | honest estimate; 8–15 for 8–14 steps. Omit when a duration means nothing (an incident review) |
| `level` | string, optional | `beginner` \| `intermediate` \| `advanced`. Omit outside teaching material |
| `note` | string, optional | one line that labels what is simplified or invented |
| `goals` | `{text, step}`[], optional | 4–6 things the reader will be able to say afterwards; `step` is the 0-based step index that shows it. Omit to hide the checklist |
| `labels` | object, optional | override the page's headings (see below) |
| `metrics` | `{id, label, unit, icon?}`[] | 0–5 running numbers shown above the stage; the last is the total |
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

In a collection, labels set in `collection.js` apply to every walkthrough and a
walkthrough's own `labels` override them.

### Node

```json
{ "type": "block", "x": 4, "y": 0, "color": "blue", "glyph": "server", "label": "Controller", "sub": "at the door" }
```

| Field | Rule |
|---|---|
| `type` | `block` (a machine or service) \| `db` (a cylinder: stored data) \| `device` (a laptop; `form: "phone"` or `"reader"` for a handset or wall unit) \| `actor` (one person) \| `crowd` (many people on a platform) \| `queue` (a line of waiting items) \| `zone` (a dashed floor area that groups nodes) |
| `x`, `y` | position on the floor in grid units. `x` runs down-right, `y` runs up-right. A block is 4 units wide, so place neighbours 7–9 units apart. A node never moves between steps |
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
    "panel": null
  }
}
```

| Field | Rule |
|---|---|
| `short` | 1–2 words, the label under the step dot |
| `chapter` | `setup` \| `problem` \| `technique` \| `solution` \| `insight` \| `tradeoff` \| `recap` |
| `title` | about 5 words, a statement of what happens, not a noun phrase |
| `body` | exactly 2 paragraphs, each ≤ 40 words. Inline `<b>`, `<em>`, `<code>`, `<span class="term">` only |
| `callout` | optional; `kind` is `insight` \| `tip` \| `warn` \| `next`; one or two sentences |
| `changes` | 1–3 lines, each starting `+ ` (added), `~ ` (changed) or `− ` (removed). Omit on step 1 and on the recap |
| `metrics` | value per metric id; `null` until that number has been earned on stage |
| `scene.show` | node ids visible in this step. Normally the previous list plus at most one or two |
| `scene.state` | per-node condition for this step (see below). Each step states it in full; nothing carries over |
| `scene.links` | link ids visible; value may override `label` or set `style`. Set `"label": ""` to hide the label, as on an `off` link |
| `scene.flows` | moving dots (see below) |
| `scene.panel` | optional `{title, lines[]}` summary card docked in a free corner of the stage; use on the recap step. A line starting `= ` is the emphasised total, `! ` a problem row, `# ` a muted note |

The recap step's `body` is one sentence stating the result in numbers, then an HTML
`<ul class="takeaways">` of 3–5 bullets with the key noun in `<b>`. Its callout is `kind: "next"`;
start the text with the name of what comes next, because the page adds the label itself.
In a collection the shell also links to the next walkthrough, so the callout says why it follows.

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

The page checks rules 1, 2, 3 and 7 when it loads and prints each violation to the browser
console. Rules 4–6 need a reader.

## Other families

The same four regions apply (see `structure.md`), but the data differs. The template renders
only the step-driven families (story, trace-as-steps, procedure-as-steps). An object lab or a
3D scene needs its own stage code; `visual-craft.md` describes how those are built.

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
