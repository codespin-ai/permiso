# Migration Guide: Property Values to JSONB

This guide covers the migration of property values from `text` to `jsonb` data type in Permiso.

## Overview

Permiso has migrated property value storage from PostgreSQL `text` type to `jsonb` type. This change provides:

- **Native JSON operations** - Query JSON data using PostgreSQL's powerful operators
- **Type safety** - PostgreSQL validates JSON structure
- **Performance** - GIN indexes for fast JSON queries
- **Flexibility** - Store complex nested data structures

## Breaking Changes

### 1. GraphQL Schema Changes

#### Property Type
```graphql
# Before
type Property {
  name: String!
  value: String!  # Was String
  hidden: Boolean!
  createdAt: DateTime!
}

# After
type Property {
  name: String!
  value: JSON     # Now JSON (nullable)
  hidden: Boolean!
  createdAt: DateTime!
}
```

#### Mutations
All property setter mutations now accept `JSON` type for values:

```graphql
# Before
mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: String!)

# After
mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON)
```

### 2. Database Schema Changes

#### Column Type Changes
All property tables have been migrated:
- `organization_property.value`: `text` → `jsonb`
- `user_property.value`: `text` → `jsonb`
- `role_property.value`: `text` → `jsonb`

#### Column Renames for Consistency
All property tables now use `parent_id` instead of entity-specific names:
- `organization_property.org_id` → `parent_id`
- `user_property.user_id` → `parent_id`
- `role_property.role_id` → `parent_id`

## Migration Process

### 1. Run Database Migrations

```bash
# Run the migrations
npm run migrate:permiso:latest
```

This will apply two migrations:
1. `20250731025613_convert_property_values_to_jsonb.js` - Converts text to JSONB
2. `20250731030944_rename_property_id_columns_to_parent_id.js` - Renames ID columns

### 2. Update Your Code

#### Setting String Values
String values must now be passed as JSON strings:

```typescript
// Before
await setOrganizationProperty(db, "org-123", "tier", "premium");

// After - strings are still strings in TypeScript
await setOrganizationProperty(db, "org-123", "tier", "premium");
// Stored in DB as: "premium" (with quotes)
```

#### Setting Complex Values
You can now store complex JSON structures:

```typescript
// Now possible with JSONB
await setOrganizationProperty(db, "org-123", "settings", {
  maxUsers: 1000,
  features: ["sso", "audit-logs", "api-access"],
  customDomain: true,
  metadata: {
    region: "us-east",
    timezone: "UTC"
  }
});
```

#### Reading Property Values
Property values are now returned as parsed JSON:

```typescript
// Before - always returned strings
const prop = await getOrganizationProperty(db, "org-123", "tier");
console.log(prop.value); // "premium"

// After - returns the actual JSON value
const prop = await getOrganizationProperty(db, "org-123", "tier");
console.log(prop.value); // "premium" (string)

const settings = await getOrganizationProperty(db, "org-123", "settings");
console.log(settings.value.maxUsers); // 1000 (number)
```

### 3. Update GraphQL Queries

#### Setting Properties
```graphql
# String values (no change in mutation, but stored as JSON)
mutation {
  setOrganizationProperty(
    orgId: "org-123"
    name: "tier"
    value: "premium"
  ) {
    name
    value
  }
}

# Complex JSON values (now possible)
mutation {
  setOrganizationProperty(
    orgId: "org-123"
    name: "settings"
    value: {
      maxUsers: 1000
      features: ["sso", "audit"]
      customDomain: true
    }
  ) {
    name
    value
  }
}

# Null values (now supported)
mutation {
  setOrganizationProperty(
    orgId: "org-123"
    name: "deletedAt"
    value: null
  ) {
    name
    value
  }
}
```

## Data Compatibility

### Existing String Data
All existing string values are automatically converted to JSON strings during migration:
- Database value `premium` becomes `"premium"` (JSON string)
- The migration preserves all existing data

### Backward Compatibility
If you need to maintain compatibility with string-only clients:
1. Continue passing string values to mutations
2. They will be stored as JSON strings
3. Retrieved values will be JSON strings (with quotes)

## Performance Improvements

### GIN Indexes
The migration adds GIN indexes for fast JSON queries:

```sql
CREATE INDEX idx_organization_property_value_gin ON organization_property USING gin(value);
CREATE INDEX idx_user_property_value_gin ON user_property USING gin(value);
CREATE INDEX idx_role_property_value_gin ON role_property USING gin(value);
```

### Query Examples
You can now query JSON data efficiently:

```sql
-- Find all organizations with enterprise tier
SELECT * FROM organization o
JOIN organization_property op ON o.id = op.parent_id
WHERE op.name = 'settings' 
AND op.value->>'tier' = 'enterprise';

-- Find users in engineering department
SELECT * FROM "user" u
JOIN user_property up ON u.id = up.parent_id
WHERE up.name = 'profile'
AND up.value->>'department' = 'engineering';

-- Find roles with specific permissions
SELECT * FROM role r
JOIN role_property rp ON r.id = rp.parent_id
WHERE rp.name = 'config'
AND rp.value->'permissions' ? 'canManageUsers';
```

## Best Practices

### 1. Use Appropriate Data Types
```typescript
// Good - use native types
setUserProperty(db, orgId, userId, "active", true);        // boolean
setUserProperty(db, orgId, userId, "level", 3);            // number
setUserProperty(db, orgId, userId, "tags", ["vip", "beta"]); // array

// Avoid - don't stringify unnecessarily
setUserProperty(db, orgId, userId, "active", "true");      // string "true"
setUserProperty(db, orgId, userId, "level", "3");          // string "3"
```

### 2. Structure Complex Data
```typescript
// Good - structured object
setUserProperty(db, orgId, userId, "profile", {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  },
  work: {
    department: "engineering",
    title: "Senior Developer",
    reportsTo: "jane-smith"
  }
});

// Avoid - flat structure with prefixes
setUserProperty(db, orgId, userId, "profile_firstName", "John");
setUserProperty(db, orgId, userId, "profile_lastName", "Doe");
setUserProperty(db, orgId, userId, "profile_department", "engineering");
```

### 3. Use Hidden Flag for Sensitive Data
```typescript
// Mark sensitive data as hidden
setOrganizationProperty(db, orgId, "apiKey", "sk_live_...", true);
setUserProperty(db, orgId, userId, "ssn", "***-**-****", true);
```

## Rollback Procedure

If you need to rollback:

```bash
# Rollback both migrations
npm run migrate:permiso:rollback
npm run migrate:permiso:rollback

# This will:
# 1. Rename parent_id columns back to original names
# 2. Convert JSONB values back to text (stringified)
```

Note: Rolling back will stringify all JSON values. Complex objects will become JSON strings.

## Support

For questions or issues related to this migration:
1. Check the [GitHub Issues](https://github.com/codespin-ai/permiso/issues)
2. Review the migration files in `/database/permiso/migrations/`
3. Consult the updated API documentation