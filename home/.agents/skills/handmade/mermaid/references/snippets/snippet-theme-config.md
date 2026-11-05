# Theme and layout configuration

One renderable example for frontmatter configuration and the preference for `base` when
overriding `themeVariables`, as summarized in
[styling and configuration](../styling.md#themes-and-looks). Fictional content; colors are
illustrative.

```mermaid
---
config:
  theme: base
  layout: dagre
  themeVariables:
    primaryColor: "#e8f1f5"
    primaryTextColor: "#17323a"
    primaryBorderColor: "#4b7f8c"
    lineColor: "#4b7f8c"
    secondaryColor: "#f2e8d5"
    tertiaryColor: "#ffffff"
---
flowchart LR
    A["Request"] --> B{"Authorized?"}
    B -->|"Yes"| C["Serve"]
    B -->|"No"| D["Deny"]
```
