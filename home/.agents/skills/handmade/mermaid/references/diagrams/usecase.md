# Use case

**Choose for:** Actors and the goals they can achieve within a system boundary.

**Prefer another type when:** Not detailed ordering, database structure, or the legal states of a run.

**Semantic / rendering trap:** Actors must be explicit. Relationships stay outside systemBoundary blocks; include/extend semantics differ from normal control-flow arrows.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
usecase-beta
    direction LR
    actor Reader
    actor Reviewer
    systemBoundary Portal["Document portal"]
        Submit("Submit document")
        Read("Read analysis")
        Approve("Approve result")
    end
    Reader --> Submit
    Reader --> Read
    Reviewer --> Approve
```

## Renderer notes

- Compatibility: 12.0.0+.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Use case syntax](https://mermaid.js.org/syntax/usecase.html)
- [Back to selection catalog](../catalog.md)
