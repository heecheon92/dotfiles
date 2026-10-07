# Timeline

**Choose for:** Chronology, milestones, narrative stages, and high-level historical events.

**Prefer another type when:** Use Gantt for duration/dependency or sequence for actor interactions.

**Semantic / rendering trap:** A timeline does not encode conditional branches or precise elapsed time unless the data supplies it.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
timeline
    title Illustrative service evolution
    Prototype : Local deterministic answers
    Retrieval : Authorized document context
    Streaming : Incremental answer display
    Continuity : Conversation summaries and file recall
```

## Renderer notes

- Compatibility: See upstream for feature-specific versions.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Timeline syntax](https://mermaid.js.org/syntax/timeline.html)
- [Back to selection catalog](../catalog.md)
