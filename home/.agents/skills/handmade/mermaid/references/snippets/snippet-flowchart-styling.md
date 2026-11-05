# Flowchart styling

One renderable example for `style`, `classDef`, and `linkStyle` as summarized in
[styling and configuration](../styling.md#styling-individual-elements). Fictional content;
colors are illustrative, not a contrast guarantee.

```mermaid
flowchart LR
    A["Draft"] --> B["Approved"]
    A -.-> C["Rejected"]
    style A fill:#f2e8d5,stroke:#8c6d4b,stroke-width:2px
    style B fill:#e0efe4,stroke:#3f7a55,stroke-width:2px
    classDef muted fill:#f4f4f4,stroke:#999,color:#333
    class C muted
    linkStyle 0 stroke-width:2px
    linkStyle 1 stroke-dasharray: 4 4
```
