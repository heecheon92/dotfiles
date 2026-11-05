# Sequence grouping, menus, and critical regions

One renderable example for the participant box, actor menu, `critical`/`option`, and
`break` constructs summarized in [syntax essentials](../syntax.md#sequence). Fictional
content; the URLs are illustrative and not fetched during rendering.

Rendering note: in a narrow diagram the block keyword label sits at the left edge and can be
clipped by the block border (`reak`, `ritical`). Widen the diagram, shorten the block title,
or add participant spacing before publishing; a successful parse does not catch this.

```mermaid
sequenceDiagram
    autonumber
    actor User
    box Aqua Services
        participant API
        participant DB as Database
    end
    link API: Status @ https://status.example.com
    User->>API: Submit request
    critical Establish connection
        API->>DB: Connect
    option Connection refused
        API-->>User: 503 Unavailable
    end
    break Request invalid
        API-->>User: 400 Bad Request
    end
    API->>DB: Insert record
    DB-->>API: Committed
    API-->>User: 201 Created
```
