# Swimlane

**Choose for:** Work crossing people, teams, or systems; who owns each step.

**Prefer another type when:** A single-owner decision tree needs only a flowchart.

**Semantic / rendering trap:** Top-level subgraphs are lanes. Do not mix actor, phase, and status lanes. Check that visual vertical order does not put completion before provisional work.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
swimlane-beta TB
    subgraph client["Client"]
        Send["Submit request"]
        Show["Display result"]
    end
    subgraph api["API"]
        Validate["Validate request"]
        Reply["Return committed result"]
    end
    subgraph storage["Storage"]
        Commit["Commit record"]
    end
    Send --> Validate
    Validate --> Commit
    Commit --> Reply
    Reply --> Show
```

## Renderer notes

- Compatibility: 11.16.0+.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Swimlane syntax](https://mermaid.js.org/syntax/swimlanes.html)
- [Back to selection catalog](../catalog.md)
