---
name: stepwise-explainer
description: Use when asked to explain something step by step, or to show how a new system differs from one the person already knows, and a quick lightweight visual will help. Produces one small self-contained click-through HTML page from a template (actors as columns, one message per step, the data for each step, and a running view of hidden state), or the same structure as a numbered list in chat. Not for one-line answers, reference docs, or large illustrated walkthrough collections.
---

# Stepwise explainer

Build a single self-contained HTML page that lets a person walk through a process one step at a time. The page shows fixed actors as columns, one arrow per step, the concrete data for that step, and a running record of state that is normally invisible. A second tab can show the same scenario in a system the person already knows, so the new idea appears as the few steps that differ.

The format is not what makes this work. The presentation rules below are. A page that breaks them is as hard to follow as a wall of text.

## When to use

- The person asked how something works and it involves three or more actors, or several ordered steps.
- The person wants to know how a new thing differs from one they already understand.
- A first explanation in prose, tables, or code did not land.
- The key idea is about state nobody sees directly: what a model has read, what a transaction has committed, which process holds a resource.

Do not use it for a definition, a single-step answer, a list of options, or reference material. Answer those in chat. Do not use it to deliver a complete solution to an exercise the person is meant to write themselves.

For a short flow with two actors, write the same structure in chat instead: a numbered list where each item is `sender → receiver`, the data, a one-line reason, and the state so far.

## Presentation rules

1. **Start from what the person already understands.** Use the neighbouring idea they named, and the way they said they learned it. If they understood tool calling by reading model responses, show model responses.
2. **One tiny concrete scenario, used throughout.** Real values, not placeholders. If the simplest scenario cannot show why the idea exists, change it as little as possible (three cities instead of one).
3. **Fixed actors.** Three to five, named in the person's words. Every step says who acts.
4. **One event per step.** Each step has a sender and receiver (or one actor working alone), the actual data, and one plain sentence saying why it happens. Never merge several events into one step.
5. **Known flow first, new flow second, same scenario.** Where a step is identical, say so in its text.
6. **Make hidden state visible.** Pick the one or two pieces of state the idea is really about and record what each step adds.
7. **Name the step that matters.** Exactly one step per flow should say, in its text, that it is the point of the whole thing.
8. **Leave the rest out.** Variants, vendor differences, benchmarks, caveats, and library code belong in the chat afterwards, or in at most a couple of footnotes.

## Build the page

1. Decide the output path: the location the person named, or the project's existing place for generated artifacts. Do not write into a repository or directory that is meant to stay read-only or holds only reference material. If there is no obvious place, ask.
2. Copy [`assets/template.html`](assets/template.html) to that path with a descriptive file name. Never edit the template in place.
3. Replace the contents of the `<script id="explainer-data">` block. Leave the engine script and the styles alone. The template ships with a complete worked example (basic tool calling versus programmatic tool calling); read it as the reference for tone and granularity, then overwrite it.
4. Open the page and click through every step of every flow before showing it. Check that each arrow points the right way, no label overlaps a neighbour, and the state panel changes on the steps you intended.
5. Tell the person the file path, how many steps each flow has, and which step to look at closely. State plainly what is simulated or approximate.

The page needs no network access, build step, or dependency. It follows the reader's light or dark setting.

## Data block reference

```js
const EXPLAINER = {
  eyebrow: "short category line",            // optional
  title: "The question this page answers",
  lede: "The scenario, in one or two sentences.",
  simulation: "Simulation: messages are hand-written, not captured from a real run.",  // omit only for real captured data

  lanes: [                                    // actors, left to right; 2 to 5
    { id: "app", name: "Your app", sub: "agent runtime" },
  ],

  flows: [                                    // one or more; first = the familiar one
    {
      id: "basic",                            // used in element ids
      tab: "Tab label",
      unused: ["box"],                        // optional: lanes to grey out in this flow
      buckets: [                              // optional: running state panels
        { id: "model", title: "What the model has read so far", tag: "optional short tag" },
      ],
      steps: [
        // a message between two actors
        { from: "app", to: "model", label: "short arrow label",
          title: "What happens", body: "One or two plain sentences.",
          cap: "Caption for the data", payload: `the concrete data`,      // optional
          adds: { model: [{ label: "User question", size: 1, tone: "warn" }] } },  // optional
        // one actor working alone
        { self: "app", label: "run get_weather × 3", title: "...", body: "..." },
      ],
    },
  ],

  stateNote: "What the bars mean, and that they are illustrative.",   // optional
  summary: { title: "...", columns: ["", "A", "B"], rows: [["row label", "a", "b"]], note: "..." },  // optional
  notes: ["Footnote: limits, approximations, sources."],              // optional
};
```

- `title`, `lede`, `body`, summary cells, `summary.note`, and `notes` accept `` `code` `` and `**bold**`. Everything is inserted as text, so HTML tags are shown literally.
- `payload` is shown verbatim in a monospace block. Use a template literal. Abbreviate with `...` instead of pasting long data.
- `adds` keys are bucket ids. `size` is 1 to 5 and sets the bar length. `tone` is `"warn"` for the cost you want noticed, `"good"` for the saving, or omitted.
- `label` is drawn on the arrow and cannot wrap. Keep it under about 28 characters for adjacent lanes.

## Limits to respect

- **Keep flows short, but do not cap them.** Aim for 6 to 12 steps per flow; more than that often means the scenario is too big or two ideas are being explained at once. This is a recommendation, not a limit: the page accepts any number of steps, so never merge or drop real events to fit a number.
- **Do not invent data.** Take message shapes and field names from documentation or real output. Where you are unsure of a shape, say so in `notes`.
- **Label simulations.** Hand-written messages are a simulation and must say so. Bars are illustrative unless you measured them.
- **Check understanding afterwards.** Ask the person to retell the flow or predict a changed case. If the page did not land, change the starting point or shrink the scenario; do not add detail.
