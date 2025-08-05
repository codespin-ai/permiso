# Permiso Architecture

## Overview

Permiso is a comprehensive Role-Based Access Control (RBAC) system designed to provide fine-grained permission management for multi-tenant applications. It provides a GraphQL API for all operations.

## Core Design Principles

### 1. Multi-Tenant Isolation
Every entity in Permiso is scoped to an organization, ensuring complete data isolation between tenants.

### 2. Code Organization
The codebase follows these principles:
- No classes, only pure functions
- Explicit dependency injection
- Immutable data structures
- Result types for error handling

### 3. Type Safety
- TypeScript with strict mode enabled
- Database types (DbRow) separate from domain types
- Explicit type conversions through mapper functions

## System Architecture

```
┌─────────────────────┐
│   GraphQL Client    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   GraphQL Server    │
│  (Apollo Server)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Resolver Layer     │
│  (Business Logic)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Persistence Layer   │
│   (pg-promise)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PostgreSQL DB     │
└─────────────────────┘
```

## Data Model

### Core Entities

#### Organization
The top-level tenant entity. All other entities belong to an organization.
```typescript
type Organization = {
  id: string;
  name: string;
  description?: string;
  properties: Property[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### User
Represents an authenticated principal within an organization.
```typescript
type User = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  properties: Property[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Role
A named collection of permissions that can be assigned to users.
```typescript
type Role = {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  properties: Property[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Resource
A protected entity with an identifier in path-like format.
```typescript
type Resource = {
  id: string;  // e.g., "/api/users/*" - ID in path-like format
  orgId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationship Tables

#### User-Role Assignment
Links users to roles within an organization.
```sql
CREATE TABLE user_role (
  user_id VARCHAR(100),
  role_id VARCHAR(100),
  created_at TIMESTAMP
);
```

#### User Permissions
Direct permissions granted to users.
```sql
CREATE TABLE user_permission (
  user_id VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP
);
```

#### Role Permissions
Permissions granted to roles.
```sql
CREATE TABLE role_permission (
  role_id VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP
);
```

#### Properties
Key-value metadata stored as JSONB that can be attached to organizations, users, and roles.

```typescript
type Property = {
  name: string;
  value: any;  // Stored as JSONB - can be string, number, boolean, object, array, or null
  hidden: boolean;
  createdAt: Date;
}
```

```sql
-- Separate tables for each entity type with unified structure
CREATE TABLE organization_property (
  parent_id VARCHAR(100),    -- Organization ID
  name VARCHAR(100),
  value JSONB,              -- Flexible JSON storage
  hidden BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE user_property (
  parent_id VARCHAR(100),    -- User ID
  org_id VARCHAR(100),       -- Organization scope
  name VARCHAR(100),
  value JSONB,
  hidden BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE role_property (
  parent_id VARCHAR(100),    -- Role ID
  org_id VARCHAR(100),       -- Organization scope
  name VARCHAR(100),
  value JSONB,
  hidden BOOLEAN,
  created_at TIMESTAMP
);
```

**JSONB Advantages:**
- Native JSON operations in PostgreSQL
- GIN indexes for fast JSON queries
- Type-safe storage with validation
- Support for complex nested structures
- Efficient storage and retrieval

## Permission Model

### Permission Types

1. **Direct Permissions**: Explicitly granted to a user for a specific resource
2. **Role-based Permissions**: Inherited through role assignments
3. **Effective Permissions**: The computed combination of direct and role-based permissions

### Resource ID Matching

Resource IDs follow a path-like format with wildcard support:
- `/api/users` - Exact match
- `/api/users/*` - Matches any child path
- `/api/*/read` - Matches any resource with 'read' suffix

### Permission Actions

Common actions include:
- `read` - View resource
- `write` - Modify resource
- `delete` - Remove resource
- `admin` - Full control

Actions are strings and can be customized per application needs.

## API Design

### GraphQL Schema Organization

The schema is organized into logical sections:

1. **Types**: Core entity definitions
2. **Inputs**: Input types for mutations
3. **Queries**: Read operations
4. **Mutations**: Write operations

### Query Design

Queries follow consistent patterns:
- Single entity: `entity(id: ID!): Entity`
- List entities: `entities(orgId: ID!): [Entity!]!`
- Relationship queries: `userRoles(orgId: ID!, userId: ID!): [Role!]!`

### Mutation Design

Mutations follow CRUD patterns:
- Create: `createEntity(input: CreateEntityInput!): Entity!`
- Update: `updateEntity(id: ID!, input: UpdateEntityInput!): Entity!`
- Delete: `deleteEntity(id: ID!): Boolean!`

## Error Handling

### Result Type Pattern

All operations return a Result type:
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }
```

### Error Categories

1. **Validation Errors**: Invalid input data
2. **Not Found Errors**: Entity doesn't exist
3. **Permission Errors**: Insufficient permissions
4. **Conflict Errors**: Duplicate keys or constraint violations
5. **System Errors**: Database or network failures

## Performance Considerations

### Database Optimization

1. **Indexes**: Created on all foreign keys and frequently queried columns
2. **Composite Indexes**: For multi-column queries (e.g., org_id + entity_id)
3. **GIN Indexes**: On JSONB columns for fast JSON queries
4. **Query Optimization**: Using JOINs instead of multiple queries

**Property Query Performance:**
```sql
-- GIN indexes enable fast JSONB queries
CREATE INDEX idx_org_property_value ON organization_property USING gin(value);
CREATE INDEX idx_user_property_value ON user_property USING gin(value);
CREATE INDEX idx_role_property_value ON role_property USING gin(value);

-- Example: Find all users with a specific department
SELECT u.* FROM "user" u
JOIN user_property up ON u.id = up.parent_id
WHERE up.name = 'profile' 
AND up.value->>'department' = 'engineering';
```

### Caching Strategy

While not yet implemented, the architecture supports:
1. **Permission Cache**: Cache effective permissions with TTL
2. **Entity Cache**: Cache frequently accessed entities
3. **Query Result Cache**: Cache expensive query results

## Security Considerations

### Data Isolation

- All queries are scoped by organization ID
- No cross-tenant data access possible
- Organization ID validation on every operation

### Input Validation

- String length limits enforced
- ID format validation for resources (path-like structure)
- Action name validation

### Future Considerations

1. **Audit Logging**: Track all permission changes
2. **Encryption**: Encrypt sensitive custom properties
3. **Rate Limiting**: Prevent abuse of permission checks

## Extension Points

### Properties System

The system supports arbitrary metadata through properties stored as JSONB:

**Features:**
- Attach to organizations, users, and roles
- Store any JSON-compatible data type
- Hidden flag for sensitive data
- Unified `parent_id` pattern across all property tables

**Example Use Cases:**
```typescript
// Organization settings
{
  "name": "settings",
  "value": {
    "maxUsers": 1000,
    "features": ["sso", "audit-logs"],
    "customDomain": "acme.example.com"
  }
}

// User metadata
{
  "name": "profile",
  "value": {
    "department": "engineering",
    "level": 3,
    "skills": ["typescript", "graphql", "postgres"]
  }
}

// Role configuration
{
  "name": "permissions",
  "value": {
    "maxApiCalls": 10000,
    "allowedRegions": ["us-east", "eu-west"],
    "features": {"billing": true, "reporting": false}
  }
}
```

### Permission Actions

Actions are strings, allowing applications to define custom actions:
- Standard: read, write, delete
- Custom: publish, approve, transfer

### Identity Providers

Support for multiple identity providers:
- Each user has identityProvider and identityProviderUserId
- Allows integration with any auth system

## Deployment Architecture

### Configuration

See [Configuration Documentation](configuration.md) for all environment variables and settings.

### Scalability

The stateless architecture supports:
- Horizontal scaling of API servers
- Read replicas for query performance
- Connection pooling for database efficiency

### Monitoring

Recommended monitoring points:
- GraphQL query performance
- Database connection pool metrics
- Permission check latency
- Error rates by type