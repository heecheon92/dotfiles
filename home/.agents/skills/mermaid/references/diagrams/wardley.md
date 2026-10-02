# Wardley map

**Choose for:** Value-chain dependencies and strategic evolution/build-versus-buy discussion.

**Prefer another type when:** Not observed runtime topology, benchmark ranking, or objective maturity measurement.

**Semantic / rendering trap:** Component coordinates are [visibility,evolution], not ordinary x/y. These positions are illustrative strategic judgments.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
wardley-beta
    title Illustrative document product strategy
    anchor Reader [0.95, 0.65]
    component Answer [0.82, 0.35]
    component Retrieval [0.60, 0.55]
    component Storage [0.25, 0.90]
    Reader -> Answer
    Answer -> Retrieval
    Retrieval -> Storage
```

## Renderer notes

- Compatibility: 11.14.0+.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Wardley map syntax](https://mermaid.js.org/syntax/wardley.html)
- [Back to selection catalog](../catalog.md)
