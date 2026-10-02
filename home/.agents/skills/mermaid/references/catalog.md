# Mermaid type selection catalog

Use the question the diagram must answer, then read only the chosen reference(s).
This catalog covers the **31 types** in the official syntax index checked 2026-10-02.
“Other Examples” is a gallery, not a type. Pie/donut and the C4 sublevels are variants,
not extra top-level catalog entries. New upstream types need deliberate catalog/example validation.

| Type and example | Best question to answer | Prefer another view when |
| --- | --- | --- |
| [Flowchart](diagrams/flowchart.md) | Decisions, branching algorithms, fallback paths, and control flow. | Use swimlanes for ownership or sequence for request/reply timing. |
| [Swimlane](diagrams/swimlane.md) | Work crossing people, teams, or systems; who owns each step. | A single-owner decision tree needs only a flowchart. |
| [Sequence](diagrams/sequence.md) | Ordered calls, asynchronous messages, streaming, transactions, and human resume. | Use state diagrams for one object lifecycle or ER for stored relationships. |
| [Class](diagrams/class.md) | Types, interfaces, methods, inheritance, and code-level composition. | Use ER for physical FK/cardinality questions and sequence for execution. |
| [State](diagrams/state.md) | Legal transitions of a run, order, connection, file, or other identifiable object. | Do not use runtime states as substitutes for function calls or actor ownership. |
| [Entity relationship](diagrams/er.md) | Persistent entities, enforced ownership, cardinality, and logical data models. | Use class diagrams for behavior/methods. Do not draw app-managed IDs as enforced foreign keys. |
| [User journey](diagrams/journey.md) | User tasks by phase with observed or explicitly hypothetical experience scores. | Do not invent satisfaction scores for an architecture walkthrough; use swimlanes instead. |
| [Gantt](diagrams/gantt.md) | Schedules, planned dates, dependencies, and measured spans on a time axis. | Do not infer runtime latency from code or use invented dates in a factual incident report. |
| [Pie / donut](diagrams/pie.md) | Parts of a meaningful total: measured outcome shares or category proportions. | Not for control flow, unrelated measures, or negative quantities. |
| [Quadrant](diagrams/quadrant.md) | Two-axis prioritization or comparison with defined scales and evidence. | Not a free-form grouping diagram; unmeasured coordinates must be explicitly subjective or illustrative. |
| [Requirement](diagrams/requirement.md) | Requirements linked to implementations, verification methods, and satisfaction evidence. | Not a runtime flow. A satisfies edge is not proof that a test passed. |
| [Use case](diagrams/usecase.md) | Actors and the goals they can achieve within a system boundary. | Not detailed ordering, database structure, or the legal states of a run. |
| [Git graph](diagrams/gitgraph.md) | Commit ancestry, branch strategies, merges, and release histories. | Do not represent conversation replay, parallel tasks, or database transactions as Git operations. |
| [C4](diagrams/c4.md) | System context, deployable containers, components, and architectural boundaries. | Avoid inventing independently deployed services from module names. Use sequence for one request. |
| [Mindmap](diagrams/mindmap.md) | Concept taxonomy, brainstorming, and a hierarchy of related concerns. | Not causality, exact dependencies, state transitions, or time order. |
| [Timeline](diagrams/timeline.md) | Chronology, milestones, narrative stages, and high-level historical events. | Use Gantt for duration/dependency or sequence for actor interactions. |
| [ZenUML](diagrams/zenuml.md) | Sequence interactions with a code-like DSL, nested calls, and alternatives. | Prefer native sequenceDiagram if the target cannot load the ZenUML renderer. |
| [Sankey](diagrams/sankey.md) | Quantitative transfers of conserved or explicitly reconciled amounts. | Not candidate fan-in with duplicate hits, arbitrary control flow, or unmeasured token flows. |
| [XY chart](diagrams/xy.md) | Measured numeric comparisons and trends, such as latency or quality over time. | Not topology, causality, or scores with incomparable units. |
| [Block](diagrams/block.md) | Explicitly arranged components, context composition, pipeline stages, and layers. | Use flowchart when decision routing dominates; use Sankey only for measured quantities. |
| [Packet](diagrams/packet.md) | Bit/byte fields of a binary protocol or fixed-width record. | JSON keys and SSE events are not fixed-width packets. |
| [Kanban](diagrams/kanban.md) | A work-item snapshot grouped by workflow column or ownership stage. | Not an authoritative runtime state machine or proof a task completed. |
| [Architecture](diagrams/architecture.md) | Service/resource topology, cloud boundaries, storage, and infrastructure connections. | Not function call order; never equate a library module with a deployed service. |
| [Radar](diagrams/radar.md) | Multiple comparable metrics for a small number of alternatives. | Do not mix units or hide uncertainty behind a polygon; subjective ratings are not measurements. |
| [Event modeling](diagrams/event-modeling.md) | Commands, business events, read models, and the information visible to a user. | Do not imply event sourcing merely because an app logs activity or sends SSE. |
| [Treemap](diagrams/treemap.md) | Hierarchical quantitative composition, such as measured storage by category. | Not a plain hierarchy or a non-additive score breakdown. |
| [Venn](diagrams/venn.md) | Membership and overlap among a small number of sets. | Not data lineage, step ordering, or exact proportional quantities without verified set sizes. |
| [Ishikawa / fishbone](diagrams/ishikawa.md) | Possible causes of an observed problem, grouped by category. | Not a verified root cause merely because it appears on a branch; not a normal service-flow chart. |
| [Wardley map](diagrams/wardley.md) | Value-chain dependencies and strategic evolution/build-versus-buy discussion. | Not observed runtime topology, benchmark ranking, or objective maturity measurement. |
| [Cynefin](diagrams/cynefin.md) | Classifying problem situations to choose an appropriate decision approach. | Not a model router, linear escalation workflow, or numeric complexity benchmark. |
| [TreeView](diagrams/treeview.md) | File/folder structure, ownership hierarchy, and nested inventories. | Not cross-links, imports, or execution relationships; those are graphs rather than trees. |

## Choose views, not decoration

For a service request, combine swimlane (owner), sequence (order), block (context/evidence),
state (run lifecycle), and ER (durable records) only where each answers a different question.
Keep flowchart for real branches. Do not replace a good sequence just to increase variety.

For an incident, distinguish measured chronology from causal hypotheses: a timeline or sequence
shows what happened; an Ishikawa map organizes candidate causes. Neither establishes causation alone.

For a performance report, use XY for measured comparisons and Sankey only for reconciled flows.
Avoid invented scores to satisfy journey/radar/quadrant syntax. A missing number is a reason to
choose another type or request the data, not to silently fabricate it.

[Official Mermaid index](https://mermaid.js.org/intro/) · [Rendering and delivery](rendering.md)
