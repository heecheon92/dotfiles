---
name: mermaid
description: Choose, author, review, render, and refine Mermaid diagrams for workflows, architecture, data relationships, lifecycles, and quantitative explanations. Includes a runnable example and selection guidance for each of 31 diagram types. Use for new diagrams or improving diagrams that are crowded, misleading, or use the wrong visual form; not for every ordinary code question.
---

# Mermaid

Make the relationship the reader needs to understand visible. This skill is harness-neutral:
use the available file, command, browser, and image tools; no Codex-specific API or connector is
required. In harnesses that support named invocation, use `$mermaid`; otherwise ask the agent to
use this skill. Keep normal automatic discovery available.

## Select the representation first

Establish the audience, the question, and the delivery surface from the request and context.
Inspect source evidence for factual diagrams; label proposals, synthetic values and uncertainty.
Keep user-requested formats and repository language/file conventions.

Open [the type catalog](references/catalog.md), then only the relevant type references.
The catalog covers all 31 official types at the recorded review date; each reference contains
one extractable Mermaid example and a recommendation, alternative, and common trap.
Do not load all examples for a simple diagram or enforce a minimum number/type variety.

- **Who owns each step?** Swimlane.
- **Who calls whom, in what order?** Sequence; ZenUML only with a compatible renderer.
- **Which path is chosen?** Flowchart.
- **What changes state?** State; identify the particular object/resource.
- **What is stored and how many relate?** ER. For interfaces and methods, Class.
- **What forms the input or pipeline?** Block. For service/resource topology, Architecture or C4.
- **What do users accomplish?** Use case; Journey additionally needs experience scores.
- **What changes quantitatively?** XY, pie, Sankey, radar, quadrant or treemap as the data warrants.
- Use the catalog for chronology, requirements, strategy, causes, sets, task boards and trees.

## Author and refine

Use the selected example as syntax scaffolding, not as domain evidence. Prefer a small primary
view and focused supporting views over one diagram containing every node, state and database.
Keep stable IDs separate from short visible labels; include a nearby legend for collapsed branches,
meaningful colors and any non-obvious notation. Never use color as the only signal.

Preserve semantics: a module is not necessarily a deployed service; a call is not a lifecycle state;
a referenced ID is not necessarily a database FK; candidate fan-in may contain duplicates rather
than conserved flow; provisional output is not durable completion. Include counterpaths that alter
the reader's conclusion, such as rollback, retry, expiry or user input, when supported by evidence.

For an existing diagram, identify its representational problem before rewriting it. Keep a type
that fits and improve grouping/direction/labels. Switch type when the question calls for it, not
merely to look different. State any abstraction that omits implementation edges or timing.

## Verify the result the user sees

Read [rendering and delivery](references/rendering.md) before local rendering or export.
Check the actual renderer version and supported integrations. Some official types are new/beta;
GitHub, an editor and a terminal renderer may support different subsets. Do not silently install or
upgrade global/project tools. Use an existing compatible renderer or a scoped one-shot tool within
the user's authorization. Do not send private diagrams to an online editor to bypass a local limit.

Render when tools are available, inspect the generated image, and correct overlaps, clipped text,
wrong directions, unintended extra nodes and unreadable density. Parser success alone cannot detect
semantic mistakes: block diagrams can accept misplaced edge-label tokens as extra blocks.
Inspect long diagrams at readable scale, not only as a tiny overview. Re-render changed diagrams.

Keep Mermaid source authoritative. If the target cannot render the chosen type, provide a generated
SVG/PNG or standalone HTML preview alongside it, or choose an equivalent supported type and explain
the tradeoff. Browser-friendly previews should offer readable diagrams without page-wide overflow;
zoom/pan is optional when it improves inspection. Never count an unrendered fence as visual verification.

## Reusable example checks

`scripts/check_examples.py` checks reference links/fences and extracts examples using Python 3's
standard library. With `--render`, it calls an existing `mmdc` executable without installing anything.
Use an output directory outside the skill so browser downloads, images and reports stay local.
Exact commands, prerequisites and the current verified tool versions are in the rendering reference.
The checks verify example validity, not the factual correctness of a user's architecture.

## Handoff

Show the rendered result or a directly usable local preview, and provide the editable source.
Briefly explain the important type choices and what was validated. State renderer limits and any
unverified behavior. Update related documentation only where the task requires it. Creating a
skill or diagram does not authorize publishing, committing, deploying or messaging others.
