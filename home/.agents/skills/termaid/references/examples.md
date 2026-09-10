# Termaid example catalog

These are small, illustrative diagrams, not measurements or facts about the
user's project. Every source file is runnable with Termaid 0.8.0. Read only the
example you need, adapt its content to the actual task, then render and inspect
it before showing the result.

In the commands below, run from the installed skill directory (the directory
containing `SKILL.md`), or supply an absolute path to the selected example:

```sh
uvx --from 'termaid==0.8.0' termaid examples/flowchart.mmd --width 88 --padding-x 1 --padding-y 1 --gap 2
COLUMNS=88 uvx --from 'termaid[rich]==0.8.0' termaid examples/flowchart.mmd --theme monokai --width 88 --padding-x 1 --padding-y 1 --gap 2
```

| Type | Readable source example | Use it for |
| --- | --- | --- |
| Flowchart | [flowchart.mmd](../examples/flowchart.mmd) | Decisions, processes, request routing |
| Sequence | [sequence.mmd](../examples/sequence.mmd) | Messages over time between participants |
| Class | [class.mmd](../examples/class.mmd) | Types, members, and object relationships |
| Entity relationship | [er.mmd](../examples/er.mmd) | Entities, keys, and cardinality |
| State | [state.mmd](../examples/state.mmd) | Lifecycle states and transitions |
| Block | [block.mmd](../examples/block.mmd) | Explicitly arranged system building blocks |
| Git graph | [git.mmd](../examples/git.mmd) | Branching, commits, and merges |
| Gantt | [gantt.mmd](../examples/gantt.mmd) | Task schedules and dependencies |
| Architecture | [architecture.mmd](../examples/architecture.mmd) | Services, groups, and port-to-port connections |
| Pie | [pie.mmd](../examples/pie.mmd) | Proportions; displayed as horizontal bars |
| Treemap | [treemap.mmd](../examples/treemap.mmd) | Hierarchical weighted categories |
| Mindmap | [mindmap.mmd](../examples/mindmap.mmd) | Hierarchical ideas and decomposition |
| XY chart | [xy.mmd](../examples/xy.mmd) | Values along a numeric/category axis |
| User journey | [journey.mmd](../examples/journey.mmd) | Stages, actors, and satisfaction scores |
| Packet | [packet.mmd](../examples/packet.mmd) | Bit ranges and protocol fields |
| Timeline | [timeline.mmd](../examples/timeline.mmd) | Ordered events and milestones |
| Kanban | [kanban.mmd](../examples/kanban.mmd) | Work items grouped by stage |
| Quadrant | [quadrant.mmd](../examples/quadrant.mmd) | Items positioned along two dimensions |

## Choose syntax deliberately

Architecture uses `architecture-beta`; block uses `block-beta`. Treemap uses
`treemap-beta`, and the XY example uses `xychart-beta`. These are actual diagram
types, not flowcharts with suggestive labels. Preserve indentation in mindmaps
and treemaps. Gantt uses fixed dates so the example does not change with today.

A small example does not establish support for every feature of that Mermaid
type. Check the actual rendered relationships and labels after adding advanced
syntax. Browser-only styling is not a substitute for readable terminal labels.

## Display and width

For ordinary responses, paste the actual plain Unicode result into a fenced
`text` block. Rich themes are for an output surface that really preserves ANSI
colors. `--ascii` is a separate fallback for terminals with limited glyph support.

`--width` requests compaction; it is not a strict clipping boundary. If a render
is still too wide, simplify labels or split it into multiple complete diagrams.
Do not wrap, crop, or omit edges to force a fit.

Observed Termaid 0.8.0 limitations:

- The packet example needs **98 columns** for its 32-bit row. Render it with
  `--width 100 --padding-y 1`; reducing the width flag cannot shrink that fixed
  grid. Zero vertical padding puts its labels on the border. If the available
  display is narrower, explain the limit rather than clipping the fields.
- The quadrant renderer omits the vertical-axis caption. When showing this
  example, explicitly state: **impact increases upward; effort increases to the
  right**. Its x-axis caption and quadrant labels remain visible.
- The pie renderer shows proportions but does not display this example's title.
  Introduce it with a caption, such as “Illustrative weekly workload.”
- Architecture service icons and journey score symbols may look different
  across fonts and terminals. Check alignment on the actual output surface.
- Rich output needs `COLUMNS` set to the same width as `--width`, especially for
  the packet and Gantt examples; a narrower Rich console can wrap their rows.
- `--ascii` is not a strict ASCII guarantee in this version: state start/end
  markers remain Unicode, and adding architecture icons also retains Unicode.
  The bundled architecture example omits icons for more portable alignment.

## Smoke-checking a runtime update

From this skill directory, the following POSIX-shell loop renders every example
without writing generated output into the repository:

```sh
for source in examples/*.mmd; do
  printf '\n--- %s ---\n' "$source"
  uvx --from 'termaid==0.8.0' termaid "$source" --width 100 --padding-x 1 --padding-y 1 --gap 2 || exit 1
done
```

Other shells or agent runtimes can enumerate the same files and execute the same
argument list. Inspect every result, not only exit codes. Also exercise a Rich
render and an ASCII render after changing the pin. Keep the version consistent
between this catalog and `SKILL.md`.
