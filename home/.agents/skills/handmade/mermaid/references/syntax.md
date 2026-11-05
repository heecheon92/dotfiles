# Cross-type syntax essentials

Compact notation reminders for the diagram types this skill uses most. The
[selection catalog](catalog.md) and the individual type references remain authoritative for
choosing a representation and for a complete example; use this page to recall syntax, not to
choose the type.

Checked against the official Mermaid 12 documentation on 2026-11-02. Release markers name the
version that introduced a feature; older renderers may ignore or reject it. The renderable
cross-type examples linked from this page live under [`snippets/`](snippets/) and are
exercised by the helper.
Do not copy a construct into a diagram without checking that the target renderer supports it.

## Common rules

- The first line declares the diagram type. IDs are stable; labels are display text. Quote a
  label that contains spaces, punctuation, or a reserved word.
- `%%` begins a comment. Unknown tokens can fail parsing; some renderer integrations drop
  unsupported options silently, so inspect the render rather than trusting the exit code.
- Prefer YAML frontmatter over the deprecated `%%{init}%%` directive for configuration. See
  [styling and configuration](styling.md).
- Lowercase `end` can break flowcharts. Use `End`, `END`, a quoted label, or another word.
- Color is supplementary. Pair it with a text label, shape, or line style; never make color
  the only carrier of meaning.
- Keep one primary view. Split large graphs instead of shrinking every label.

## Flowchart

Directions: `TB` or `TD` (top to bottom), `BT`, `RL`, `LR`.

| Shape | Syntax | Typical meaning |
| --- | --- | --- |
| Rectangle | `A["Step"]` | Process |
| Rounded | `A("Step")` | Alternate process |
| Stadium | `A(["Start"])` | Entry or exit |
| Subroutine | `A[["Validate"]]` | Predefined process |
| Cylinder | `A[(Store)]` | Database or storage |
| Circle | `A(("Done"))` | Connector or end |
| Rhombus | `A{"Valid?"}` | Decision |
| Hexagon | `A{{"Prepare"}}` | Preparation |
| Parallelogram | `A[/Input/]` | Input or output |
| Trapezoid | `A[/Manual\]` | Manual operation |
| Asymmetric | `A>Event]` | Signal or event |

Link forms: `-->` arrow, `---` open, `-.->` dotted, `==>` thick, `~~~` invisible (layout
hint), `--o` circle end, `--x` cross end. Multi-directional forms include `o--o`, `x--x`, and
`<-->`.

- Labels: `A -->|"text"| B` or `A -- text -->B`; dotted and thick variants use
  `A -. text .-> B` and `A == text ==> B`.
- Chaining: `A --> B --> C`; fan-in/out: `A & B --> C & D`.
- Edge IDs and animation: `A e1@--> B`, then `e1@{ animate: true }`. Treat animation as
  optional decoration.
- Subgraphs: `subgraph api [API] ... end`. A `direction` inside a subgraph is ignored when
  its nodes are linked outside; the subgraph then inherits the parent direction.
- Collapsed subgraph: `api@{ view: collapsed }` (11.17+).
- Metadata shapes: `A@{ shape: rect, label: "Step" }`. Icon and image shapes need a
  registered icon pack or reachable image and are not portable.
- Interaction: `click A "https://example.com" "Tooltip"` works only with
  `securityLevel: 'loose'`. The safe default, `strict`, disables it. Do not loosen security
  for untrusted diagram text.
- Avoid lowercase `o` or `x` as the first character of a connected node; `A---oB` is read as
  a circle-ended edge.

Validated example: [flowchart shapes and link forms](snippets/snippet-flowchart-shapes.md).

## Sequence

Declare participants in display order with `participant API` or `actor User`; use
`participant API as "API service"` to separate the ID from the label.

| Arrow | Meaning |
| --- | --- |
| `->` | Solid line, no arrowhead |
| `-->` | Dotted line, no arrowhead |
| `->>` | Solid request |
| `-->>` | Dotted response |
| `-x` / `--x` | Cross end, often destruction |
| `-)` / `--)` | Open arrow, asynchronous |
| `<<->>` / `<<-->>` | Bidirectional (11.0+) |

- Activations: `activate API` / `deactivate API`, or the `->>+` / `-->>-` shortcuts.
- Blocks, each closed by `end`: `loop`, `alt` / `else`, `opt`, `par` / `and`,
  `critical` / `option`, `break`. Blocks can nest; `break` models an early exit.
- In narrow diagrams the block keyword label can be clipped by the block border even though
  parsing succeeds. Verify the rendered label, and widen or rename rather than assuming it
  is a source error.
- Background region: `rect rgb(235, 245, 245) ... end`.
- Notes: `Note over A,B: text`, `Note right of A: text`, `Note left of A: text`. Use `<br/>`
  for a line break.
- Numbering: `autonumber`, or `autonumber <start> <increment>` (11.15+).
- Actor menus: `link API: Dashboard @ https://example.com`; JSON form
  `links API: {"Dashboard": "https://example.com"}`. These add links, not message order.
- Participant stereotypes use JSON: `participant DB@{ "type": "database" } as Database`.
- Group participants in a vertical box: `box Aqua Label ... end`. Hex colors such as
  `#ff0000` are not accepted there because `#` starts a comment; use a named color,
  `rgb()`, `rgba()`, `hsl()`, or `hsla()`.
- Lowercase `end` in a label has the same caveat as flowcharts.

Validated example: [sequence activations and blocks](snippets/snippet-sequence-blocks.md).
Grouping, actor menus, and `critical`/`break` appear in
[sequence grouping and critical regions](snippets/snippet-sequence-advanced.md).

## Class

| Relation | Syntax | Meaning |
| --- | --- | --- |
| Inheritance | `<\|--` | Is-a |
| Composition | `*--` | Owned lifecycle |
| Aggregation | `o--` | Shared reference |
| Association | `-->` | Uses or knows |
| Link, solid | `--` | Unspecified structural link |
| Dependency | `..>` | Parameter, local, or transient use |
| Realization | `..\|>` | Implements an interface |
| Link, dashed | `..` | Weaker unspecified link |

Reverse arrowheads are valid, for example `--|>`, `--*`, and `--o`. Add labels with
`: label` and multiplicity with quoted values near each end, as in
`Customer "1" --> "0..*" Order : places`.

- Members: `+` public, `-` private, `#` protected, `~` package/internal.
- Methods: `+deposit(amount) bool`; append `*` for abstract and `$` for static.
- Stereotypes: `<<interface>>`, `<<abstract>>`, `<<service>>`, `<<enumeration>>`.
- Generics use tildes: `List~T~`. Nested generics are supported; generic types containing a
  comma are not.
- Direction: `direction LR|RL|TB|BT`.
- Namespaces: `namespace Auth { ... }`, dotted paths, and labels (11.15+).
- Lollipop interface: `bar ()-- foo` or `foo --() bar`.
- Composition means lifecycle ownership, not merely a field reference. Use dependency for a
  call or parameter.

Validated example: [class relations and stereotypes](snippets/snippet-class-relations.md).

## Entity relationship

Cardinality markers sit at each end of the relationship:

| Left | Right | Meaning |
| --- | --- | --- |
| `\|o` | `o\|` | Zero or one |
| `\|\|` | `\|\|` | Exactly one |
| `}o` | `o{` | Zero or more |
| `}\|` | `\|{` | One or more |

- Line: `--` identifying (solid, child depends on the parent for identity); `..`
  non-identifying (dashed). The label describes the relationship from the first entity.
- Attribute block: `type name` with optional `PK`, `FK`, `UK` (or `PK, FK`) and a quoted
  comment. A trailing `?` on the type marks it nullable (11.16+).
- Direction: `direction TB|BT|LR|RL`.
- Subgraphs group entities (11.17+); quoted entity names support spaces and Markdown.
- State whether the model is conceptual or physical. Do not draw an application-managed ID
  as an enforced foreign key, and do not imply an omitted table does not exist.

Validated example: [ER cardinality and keys](snippets/snippet-er-notation.md).

## State

- `stateDiagram-v2`; `[*]` marks start or end; `Running --> Failed : error`.
- Composite state: `state Review { [*] --> Screening }`.
- Direction: `direction LR|RL|TB|BT`, at the top level or inside a composite.
- `state fork_state <<fork>>`, `<<join>>`, and `<<choice>>` for explicit control flow.
- Notes: `note right of State1 ... end note`, or `note left of State2 : text`.
- Concurrency: a `--` line separates regions inside a composite state.
- Name the object whose state changes. Do not use runtime states as substitutes for function
  calls or actor ownership.

## C4

Five diagram types: `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, and
`C4Deployment`. The syntax follows C4-PlantUML.

- Elements: `Person`, `Person_Ext`, `System`, `System_Ext`, `SystemDb`, `SystemQueue`,
  `Container`, `ContainerDb`, `ContainerQueue`, `Component`, plus `_Ext` variants.
- Boundaries: `Enterprise_Boundary`, `System_Boundary`, `Container_Boundary`, `Boundary`.
- Relations: `Rel(from, to, "label", "technology")`, `BiRel`, `Rel_U/D/L/R`, `Rel_Back`,
  `RelIndex`.
- Styling: `UpdateElementStyle`, `UpdateRelStyle`, `UpdateLayoutConfig`. C4 has a fixed
  palette; those calls override individual elements, not the whole theme.
- Shape order controls layout because C4 is not fully auto-laid-out.
- Text wraps by default since 11.17.1; `c4.wrap: false` disables it.
- C4 support and fidelity are renderer-dependent. Choose one C4 level per diagram and do not
  promote a library module to a deployed service.

## Architecture (beta)

`architecture-beta` requires 11.1+ and may still change incompatibly.

- `group api(cloud)[API] [in parent]` and `service db(database)[Database] [in parent]`.
- `junction j1 [in parent]` creates a four-way routing point.
- Edges name the side on each end: `api:R --> L:db`; sides are `T`, `B`, `L`, `R`.
  Prefix `<` or suffix `>` on the appropriate side for the arrowhead.
- `service_id{group}:B --> T:other{group}` routes an edge from the group boundary.
- Built-in icons: `cloud`, `database`, `disk`, `internet`, `server`. Other Iconify icons
  require an installed/registered icon pack, so a portable example uses only built-ins.
- `align row ...` / `align column ...` (11.16+) fixes sibling placement; combining them
  builds grids. `randomize` and `seed` (11.14+) control layout reproducibility.
- Verify the render: beta layout can overlap siblings or ignore a conflicting alignment.

## Beyond syntax

Configuration, themes, styling, accessibility, and export flags are in
[styling and configuration](styling.md). Rendering prerequisites and verification
expectations are in [rendering and delivery](rendering.md).
