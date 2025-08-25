# Architecture

## System Design

Permiso uses PostgreSQL Row Level Security (RLS) for multi-tenant isolation.

```
┌─────────────────┐
│  GraphQL API    │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Context │ → Determines database user
    └────┬────┘
         │
    ┌────▼────────────────┐
    │ Domain Functions    │
    └────┬────────────────┘
         │
    ┌────▼────────────────────────┐
    │ Database Layer              │
    ├──────────────┬───────────────┤
    │ RLS User     │ Unrestricted  │
    │ (org-scoped) │ (ROOT/admin)  │
    └──────────────┴───────────────┘
```

## Database Users

### RLS User (`rls_db_user`)
- Used when `x-org-id` header is present
- All queries automatically filtered by `org_id` via RLS policies
- Cannot access data from other organizations

### Unrestricted User (`unrestricted_db_user`)
- Used for ROOT operations (no `x-org-id` header)
- Used for organization management
- Can query across all organizations
- Has `BYPASSRLS` privilege

## Row Level Security

All tables except `organization` have RLS policies:

```sql
CREATE POLICY tenant_isolation ON table_name
  USING (org_id = current_setting('app.current_org_id'))
  WITH CHECK (org_id = current_setting('app.current_org_id'));
```

The RLS wrapper sets the context before each query:
```sql
SET LOCAL app.current_org_id = 'org-123';
```

## Context Switching

Domain functions can upgrade from RLS to ROOT context when needed:

```typescript
// Organization operations need ROOT access
const rootDb = ctx.db.upgradeToRoot?.("reason") || ctx.db;
```

This pattern is used for:
- Organization CRUD operations
- Cross-organization queries (e.g., `getUsersByIdentity`)
- Field resolvers that fetch parent organizations

## Data Model

### Core Tables

```sql
organization
├── id (PK)
├── name
└── description

user
├── id (PK)
├── org_id (FK) → RLS column
├── identity_provider
└── identity_provider_user_id

role
├── id (PK)
├── org_id (FK) → RLS column
├── name
└── description

resource
├── id (PK)
├── org_id (FK) → RLS column
├── name
└── description

user_permission
├── user_id (FK)
├── resource_id (FK)
├── action
└── org_id (FK) → RLS column

role_permission
├── role_id (FK)
├── resource_id (FK)
├── action
└── org_id (FK) → RLS column

user_role
├── user_id (FK)
├── role_id (FK)
└── org_id (FK) → RLS column
```

### Property Tables

Each entity has a corresponding property table for JSON metadata:
- `organization_property`
- `user_property`
- `role_property`
- `resource_property`

## Connection Pooling

Database connections are pooled and reused:

```typescript
// Single pool per database user
const connectionPools = new Map<string, Database>();

// Lazy initialization prevents wasteful connections
export class LazyDatabase {
  private actualDb?: Database;
  
  ensureInitialized() {
    if (!this.actualDb) {
      this.actualDb = this.orgId 
        ? createRlsDb(this.orgId)
        : createUnrestrictedDb();
    }
    return this.actualDb;
  }
}
```

## Transaction Handling

ROOT and RLS databases cannot share transactions since they use different database users:

```typescript
// ❌ Won't work - different DB users
await ctx.db.tx(async (t) => {
  await createUser(t, ...);  // RLS user
  const rootDb = t.upgradeToRoot();
  await createOrganization(rootDb, ...);  // Different user!
});

// ✅ Correct - separate transactions
await createUser(ctx.db, ...);  // RLS transaction
const rootDb = ctx.db.upgradeToRoot();
await createOrganization(rootDb, ...);  // ROOT transaction
```

## Code Organization

### Package Structure
- `permiso-core`: Shared types and utilities
- `permiso-db`: Database layer with RLS wrapper
- `permiso-server`: GraphQL server and domain logic
- `permiso-client`: TypeScript client library
- `permiso-logger`: Logging utilities
- `permiso-test-utils`: Testing utilities

### Design Patterns
- **No classes**: Only pure functions with explicit dependencies
- **Result types**: Error handling without exceptions
- **DbRow pattern**: Separate database types from domain types
- **Mapper functions**: Convert between snake_case DB and camelCase domain