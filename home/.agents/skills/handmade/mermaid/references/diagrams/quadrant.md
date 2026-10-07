# Quadrant

**Choose for:** Two-axis prioritization or comparison with defined scales and evidence.

**Prefer another type when:** Not a free-form grouping diagram; unmeasured coordinates must be explicitly subjective or illustrative.

**Semantic / rendering trap:** Explain both axes and where high/low sits. Do not present subjective impact/effort as benchmark data.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
quadrantChart
    title Illustrative improvement priorities
    x-axis Low effort --> High effort
    y-axis Low impact --> High impact
    quadrant-1 Plan carefully
    quadrant-2 Quick gains
    quadrant-3 Low priority
    quadrant-4 Reconsider
    Better labels: [0.20, 0.75]
    Storage redesign: [0.85, 0.85]
    Cosmetic cleanup: [0.15, 0.20]
```

## Renderer notes

- Compatibility: See upstream for feature-specific versions.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official Quadrant syntax](https://mermaid.js.org/syntax/quadrantChart.html)
- [Back to selection catalog](../catalog.md)
