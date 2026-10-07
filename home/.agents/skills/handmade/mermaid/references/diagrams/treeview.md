# TreeView

**Choose for:** File/folder structure, ownership hierarchy, and nested inventories.

**Prefer another type when:** Not cross-links, imports, or execution relationships; those are graphs rather than trees.

**Semantic / rendering trap:** Indentation is structure. Mark directories with trailing slashes; do not claim paths exist unless inspected.

## Adaptable example

This is an authored, fictional example, not a description of a live system or measured result.
Replace labels, relationships, and any values with evidence from the user's task.

```mermaid
treeView-beta
    example-project/
        app/
            api.py
            service.py
        tests/
            test_service.py
        docs/
            request-flow.md
```

## Renderer notes

- Compatibility: 11.14.0+.
- Validation baseline and renderer-specific exceptions: [rendering guide](../rendering.md).
- Readability check: verify every intended label, edge, branch, and numerical relationship;
  a successful parse is not sufficient.
- [Official TreeView syntax](https://mermaid.js.org/syntax/treeView.html)
- [Back to selection catalog](../catalog.md)
