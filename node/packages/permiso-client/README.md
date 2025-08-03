# @codespin/permiso-client

A TypeScript client library for the Permiso RBAC (Role-Based Access Control) API. This package provides a simple, type-safe way to interact with Permiso without needing to write GraphQL queries.

## Installation

```bash
npm install @codespin/permiso-client
```

## Quick Start

```typescript
import { 
  createOrganization,
  createUser,
  assignUserRole,
  hasPermission,
  PermisoConfig 
} from '@codespin/permiso-client';

// Configure the client
const config: PermisoConfig = {
  endpoint: 'http://localhost:5001',
  apiKey: 'your-api-key', // optional
  timeout: 30000 // optional, in milliseconds
};

// Create an organization
const orgResult = await createOrganization(config, {
  id: 'acme-corp',
  name: 'ACME Corporation',
  description: 'A sample organization'
});

if (orgResult.success) {
  console.log('Created organization:', orgResult.data);
}

// Check if a user has permission
const hasPermResult = await hasPermission(config, {
  orgId: 'acme-corp',
  userId: 'john-doe',
  resourceId: '/api/users/*',
  action: 'read'
});

if (hasPermResult.success) {
  console.log('Has permission:', hasPermResult.data);
}
```

## Error Handling

All functions return a `Result` type that explicitly handles success and failure cases:

```typescript
const result = await createUser(config, {
  id: 'john-doe',
  orgId: 'acme-corp',
  identityProvider: 'google',
  identityProviderUserId: 'john@example.com'
});

if (result.success) {
  // Type-safe access to data
  console.log('User created:', result.data.id);
} else {
  // Type-safe access to error
  console.error('Failed to create user:', result.error.message);
}
```

## API Reference

### Organizations

- `getOrganization(config, id)` - Get an organization by ID
- `listOrganizations(config, options?)` - List organizations with optional filtering and pagination
- `getOrganizationsByIds(config, ids)` - Get multiple organizations by IDs
- `createOrganization(config, input)` - Create a new organization
- `updateOrganization(config, id, input)` - Update an organization
- `deleteOrganization(config, id, safetyKey?)` - Delete an organization
- `getOrganizationProperty(config, orgId, propertyName)` - Get a specific property
- `setOrganizationProperty(config, orgId, name, value, hidden?)` - Set a property
- `deleteOrganizationProperty(config, orgId, name)` - Delete a property

### Users

- `getUser(config, orgId, userId)` - Get a user
- `listUsers(config, orgId, options?)` - List users with optional filtering and pagination
- `getUsersByIds(config, orgId, ids)` - Get multiple users by IDs
- `getUsersByIdentity(config, identityProvider, identityProviderUserId)` - Find users by identity
- `createUser(config, input)` - Create a new user
- `updateUser(config, orgId, userId, input)` - Update a user
- `deleteUser(config, orgId, userId)` - Delete a user
- `getUserProperty(config, orgId, userId, propertyName)` - Get a user property
- `setUserProperty(config, orgId, userId, name, value, hidden?)` - Set a user property
- `deleteUserProperty(config, orgId, userId, name)` - Delete a user property
- `assignUserRole(config, orgId, userId, roleId)` - Assign a role to a user
- `unassignUserRole(config, orgId, userId, roleId)` - Remove a role from a user

### Roles

- `getRole(config, orgId, roleId)` - Get a role
- `listRoles(config, orgId, options?)` - List roles with optional filtering and pagination
- `getRolesByIds(config, orgId, ids)` - Get multiple roles by IDs
- `createRole(config, input)` - Create a new role
- `updateRole(config, orgId, roleId, input)` - Update a role
- `deleteRole(config, orgId, roleId)` - Delete a role
- `getRoleProperty(config, orgId, roleId, propertyName)` - Get a role property
- `setRoleProperty(config, orgId, roleId, name, value, hidden?)` - Set a role property
- `deleteRoleProperty(config, orgId, roleId, name)` - Delete a role property

### Resources

- `getResource(config, orgId, resourceId)` - Get a resource
- `listResources(config, orgId, options?)` - List resources with optional filtering and pagination
- `getResourcesByIdPrefix(config, orgId, idPrefix)` - Get resources by ID prefix
- `createResource(config, input)` - Create a new resource
- `updateResource(config, orgId, resourceId, input)` - Update a resource
- `deleteResource(config, orgId, resourceId)` - Delete a resource

### Permissions

- `hasPermission(config, params)` - Check if a user has permission
- `getUserPermissions(config, params)` - Get user permissions
- `getRolePermissions(config, params)` - Get role permissions
- `getEffectivePermissions(config, params)` - Get effective permissions for a user
- `getEffectivePermissionsByPrefix(config, params)` - Get effective permissions by resource prefix
- `grantUserPermission(config, input)` - Grant permission to a user
- `revokeUserPermission(config, params)` - Revoke permission from a user
- `grantRolePermission(config, input)` - Grant permission to a role
- `revokeRolePermission(config, params)` - Revoke permission from a role

## Pagination

List operations support pagination through the `PaginationInput` type:

```typescript
const result = await listUsers(config, 'acme-corp', {
  pagination: {
    limit: 10,
    offset: 20,
    sortDirection: 'DESC' // 'ASC' or 'DESC', defaults to 'ASC'
  }
});

if (result.success) {
  console.log('Users:', result.data.nodes);
  console.log('Total count:', result.data.totalCount);
  console.log('Has next page:', result.data.pageInfo.hasNextPage);
}
```

## Filtering

List operations support filtering by properties:

```typescript
const result = await listUsers(config, 'acme-corp', {
  filter: {
    properties: [
      { name: 'department', value: 'engineering' },
      { name: 'active', value: true }
    ]
  }
});
```

## Properties

Entities (organizations, users, roles) support custom properties stored as JSON:

```typescript
// Set a property
const setPropResult = await setUserProperty(
  config,
  'acme-corp',
  'john-doe',
  'preferences',
  { theme: 'dark', language: 'en' },
  false // not hidden
);

// Get a property
const getPropResult = await getUserProperty(
  config,
  'acme-corp',
  'john-doe',
  'preferences'
);

if (getPropResult.success && getPropResult.data) {
  console.log('User preferences:', getPropResult.data.value);
}
```

## Types

The client exports all TypeScript types from the Permiso API:

```typescript
import type {
  Organization,
  User,
  Role,
  Resource,
  Permission,
  CreateUserInput,
  PaginationInput,
  // ... and many more
} from '@codespin/permiso-client';
```

## License

MIT