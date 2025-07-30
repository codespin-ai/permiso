# @codespin/permiso-server

GraphQL server for the Permiso RBAC authorization system. Provides a complete GraphQL API for managing role-based access control.

## Features

- **Organizations**: Root entities that contain all other resources
- **Users**: Belong to organizations, can have roles and direct permissions
- **Roles**: Groups of permissions that can be assigned to users
- **Resources**: Entities with IDs in path-like format (e.g., `/files/documents`, `/features/admin`)
- **Permissions**: Define what actions users/roles can perform on resources
- **Properties**: Custom key-value pairs for organizations, users, and roles with filtering support
- **Effective Permissions**: Combined user and role permissions calculation

## Environment Variables

```bash
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso
PERMISO_DB_USER=postgres
PERMISO_DB_PASSWORD=postgres
```

## Database Setup

```bash
# Run migrations
npm run migrate:latest

# Create a new migration
npm run migrate:make migration_name

# Rollback migrations
npm run migrate:rollback
```

## Architecture

The package follows functional programming patterns:

- **No classes**: All exports are pure functions
- **Result types**: Error handling using `Result<T, E>` pattern
- **DbRow pattern**: Separate types for database rows (snake_case) and domain objects (camelCase)
- **Mapper functions**: Convert between database and domain representations
- **Self-contained**: Has its own database configuration

## GraphQL Schema

The package provides a complete GraphQL schema for RBAC operations:

- Query operations for fetching entities with filtering and pagination
- Mutations for creating, updating, and deleting entities
- Permission checking and effective permissions calculation
- Property management with hidden property support

## Usage

```typescript
import { initializeDatabase } from '@codespin/permiso-server';
import { createOrganization, createUser, grantUserPermission } from '@codespin/permiso-server';

// Initialize database connection
const db = initializeDatabase();

// Create an organization
const orgResult = await createOrganization(db, {
  id: 'acme-corp',
  data: 'ACME Corporation',
  properties: [
    { name: 'country', value: 'USA' }
  ]
});

// Create a user
const userResult = await createUser(db, {
  id: 'john-doe',
  orgId: 'acme-corp',
  identityProvider: 'google',
  identityProviderUserId: 'john@acme.com',
  roleIds: ['admin']
});

// Grant permission
const permResult = await grantUserPermission(db, 
  'acme-corp',
  'john-doe',
  '/files/confidential',
  'read'
);
```