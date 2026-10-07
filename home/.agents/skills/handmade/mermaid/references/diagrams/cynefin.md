# Cynefin

**Choose for:** Classifying problem situations to choose an appropriate decision approach.

**Prefer another type when:** Not a model router, linear escalation workflow, or numeric complexity benchmark.

**Semantic / rendering trap:** Domains are judgments, not immutable task labels. Do not infer that every incident belongs in the same domain.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
cynefin-beta
    title Illustrative operations decisions
    clear
        "Known runbook recovery"
    complicated
        "Query plan investigation"
    complex
        "Trial a new interaction pattern"
    chaotic
        "Contain an active outage"
    confusion
        "Untriaged report"
```

## Renderer notes

- Compatibility: 11.16.0+.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Cynefin syntax](https://mermaid.js.org/syntax/cynefin.html)
- [Back to selection catalog](../catalog.md)
