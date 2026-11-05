# ER cardinality and keys

One renderable example for the crow's-foot markers, identifying line, attribute keys, and
nullable type summarized in [syntax essentials](../syntax.md#entity-relationship).
Fictional content.

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_LINE : contains
    PRODUCT |o--o{ ORDER_LINE : "appears in"
    CUSTOMER {
        string id PK
        string email UK
    }
    ORDER {
        string id PK
        string customer_id FK
    }
    ORDER_LINE {
        string order_id PK, FK
        string product_id PK, FK
        int quantity
        string? note
    }
    PRODUCT {
        string id PK
        string sku UK
    }
```
