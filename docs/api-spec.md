# Permiso GraphQL API Specification

## Overview

Permiso provides a GraphQL API for all RBAC operations. The API is designed to be intuitive, type-safe, and efficient.

## Endpoint

```
POST http://localhost:5001/graphql
```

## Authentication

*Note: Authentication is not yet implemented. When added, it will use standard HTTP headers.*

```
Authorization: Bearer <token>
```

## Core Types

### Organization

```graphql
type Organization {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### User

```graphql
type User {
  id: ID!
  orgId: ID!
  identityProvider: String!
  identityProviderUserId: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Role

```graphql
type Role {
  id: ID!
  orgId: ID!
  name: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Resource

```graphql
type Resource {
  id: ID!
  orgId: ID!
  path: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Permission

```graphql
type Permission {
  resourceId: ID!
  resource: Resource!
  action: String!
  createdAt: DateTime!
}
```

### CustomProperty

```graphql
type CustomProperty {
  entityType: String!
  entityId: ID!
  key: String!
  value: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## Queries

### Organization Queries

#### Get Single Organization
```graphql
query GetOrganization($id: ID!) {
  organization(id: $id) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

#### List All Organizations
```graphql
query ListOrganizations {
  organizations {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### User Queries

#### List Users in Organization
```graphql
query ListUsers($orgId: ID!) {
  users(orgId: $orgId) {
    id
    orgId
    identityProvider
    identityProviderUserId
    createdAt
    updatedAt
  }
}
```

#### Get User's Roles
```graphql
query GetUserRoles($orgId: ID!, $userId: ID!) {
  userRoles(orgId: $orgId, userId: $userId) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

#### Get User's Direct Permissions
```graphql
query GetUserPermissions($orgId: ID!, $userId: ID!) {
  userPermissions(orgId: $orgId, userId: $userId) {
    resourceId
    resource {
      id
      path
      description
    }
    action
    createdAt
  }
}
```

### Role Queries

#### List Roles in Organization
```graphql
query ListRoles($orgId: ID!) {
  roles(orgId: $orgId) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

#### Get Role Permissions
```graphql
query GetRolePermissions($roleId: ID!) {
  rolePermissions(roleId: $roleId) {
    resourceId
    resource {
      id
      path
      description
    }
    action
    createdAt
  }
}
```

### Resource Queries

#### List Resources in Organization
```graphql
query ListResources($orgId: ID!) {
  resources(orgId: $orgId) {
    id
    path
    description
    createdAt
    updatedAt
  }
}
```

### Permission Queries

#### Calculate Effective Permissions
```graphql
query GetEffectivePermissions($orgId: ID!, $userId: ID!, $resourcePath: String!) {
  effectivePermissions(orgId: $orgId, userId: $userId, resourcePath: $resourcePath) {
    resourceId
    resource {
      id
      path
      description
    }
    action
    source  # "direct" or "role"
  }
}
```

## Mutations

### Organization Mutations

#### Create Organization
```graphql
mutation CreateOrganization($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}

# Variables
{
  "input": {
    "id": "acme-corp",
    "name": "ACME Corporation",
    "description": "Global leader in innovation"
  }
}
```

#### Update Organization
```graphql
mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
  updateOrganization(id: $id, input: $input) {
    id
    name
    description
    updatedAt
  }
}

# Variables
{
  "id": "acme-corp",
  "input": {
    "name": "ACME Corp International",
    "description": "Updated description"
  }
}
```

#### Delete Organization
```graphql
mutation DeleteOrganization($id: ID!) {
  deleteOrganization(id: $id)
}
```

### User Mutations

#### Create User
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    orgId
    identityProvider
    identityProviderUserId
    createdAt
  }
}

# Variables
{
  "input": {
    "id": "john-doe",
    "orgId": "acme-corp",
    "identityProvider": "google",
    "identityProviderUserId": "john.doe@example.com"
  }
}
```

#### Update User
```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    identityProvider
    identityProviderUserId
    updatedAt
  }
}
```

#### Delete User
```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}
```

### Role Mutations

#### Create Role
```graphql
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    id
    orgId
    name
    description
    createdAt
  }
}

# Variables
{
  "input": {
    "id": "admin",
    "orgId": "acme-corp",
    "name": "Administrator",
    "description": "Full system access"
  }
}
```

#### Assign User to Role
```graphql
mutation AssignUserRole($userId: ID!, $roleId: ID!) {
  assignUserRole(userId: $userId, roleId: $roleId)
}
```

#### Revoke User from Role
```graphql
mutation RevokeUserRole($userId: ID!, $roleId: ID!) {
  revokeUserRole(userId: $userId, roleId: $roleId)
}
```

### Resource Mutations

#### Create Resource
```graphql
mutation CreateResource($input: CreateResourceInput!) {
  createResource(input: $input) {
    id
    orgId
    path
    description
    createdAt
  }
}

# Variables
{
  "input": {
    "id": "users-api",
    "orgId": "acme-corp",
    "path": "/api/users/*",
    "description": "User management endpoints"
  }
}
```

### Permission Mutations

#### Grant User Permission
```graphql
mutation GrantUserPermission($userId: ID!, $resourceId: ID!, $action: String!) {
  grantUserPermission(userId: $userId, resourceId: $resourceId, action: $action)
}

# Variables
{
  "userId": "john-doe",
  "resourceId": "users-api",
  "action": "read"
}
```

#### Revoke User Permission
```graphql
mutation RevokeUserPermission($userId: ID!, $resourceId: ID!, $action: String!) {
  revokeUserPermission(userId: $userId, resourceId: $resourceId, action: $action)
}
```

#### Grant Role Permission
```graphql
mutation GrantRolePermission($roleId: ID!, $resourceId: ID!, $action: String!) {
  grantRolePermission(roleId: $roleId, resourceId: $resourceId, action: $action)
}

# Variables
{
  "roleId": "admin",
  "resourceId": "users-api",
  "action": "write"
}
```

#### Revoke Role Permission
```graphql
mutation RevokeRolePermission($roleId: ID!, $resourceId: ID!, $action: String!) {
  revokeRolePermission(roleId: $roleId, resourceId: $resourceId, action: $action)
}
```

### Custom Property Mutations

#### Set Custom Property
```graphql
mutation SetCustomProperty($input: SetCustomPropertyInput!) {
  setCustomProperty(input: $input) {
    entityType
    entityId
    key
    value
    createdAt
    updatedAt
  }
}

# Variables
{
  "input": {
    "entityType": "user",
    "entityId": "john-doe",
    "key": "department",
    "value": "engineering"
  }
}
```

#### Delete Custom Property
```graphql
mutation DeleteCustomProperty($entityType: String!, $entityId: ID!, $key: String!) {
  deleteCustomProperty(entityType: $entityType, entityId: $entityId, key: $key)
}
```

## Common Usage Patterns

### 1. User Onboarding

```graphql
# Step 1: Create user
mutation {
  createUser(input: {
    id: "jane-doe",
    orgId: "acme-corp",
    identityProvider: "okta",
    identityProviderUserId: "jane.doe@acme.com"
  }) {
    id
  }
}

# Step 2: Assign role
mutation {
  assignUserRole(userId: "jane-doe", roleId: "employee")
}

# Step 3: Grant specific permissions
mutation {
  grantUserPermission(
    userId: "jane-doe",
    resourceId: "profile-api",
    action: "write"
  )
}
```

### 2. Check User Access

```graphql
query CheckAccess($userId: ID!, $resourcePath: String!) {
  effectivePermissions(
    orgId: "acme-corp",
    userId: $userId,
    resourcePath: $resourcePath
  ) {
    action
    source
  }
}

# Variables
{
  "userId": "jane-doe",
  "resourcePath": "/api/users/jane-doe/profile"
}
```

### 3. Role Management

```graphql
# Create a new role with permissions
mutation {
  createRole(input: {
    id: "manager",
    orgId: "acme-corp",
    name: "Manager",
    description: "Team management permissions"
  }) {
    id
  }
}

# Grant permissions to the role
mutation {
  grantRolePermission(roleId: "manager", resourceId: "team-api", action: "read")
  grantRolePermission(roleId: "manager", resourceId: "team-api", action: "write")
  grantRolePermission(roleId: "manager", resourceId: "reports-api", action: "read")
}
```

## Error Handling

All mutations can return errors in the standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND",
        "entityType": "user",
        "entityId": "invalid-user"
      }
    }
  ]
}
```

Common error codes:
- `NOT_FOUND` - Entity doesn't exist
- `ALREADY_EXISTS` - Entity with ID already exists
- `INVALID_INPUT` - Validation error
- `PERMISSION_DENIED` - Insufficient permissions
- `INTERNAL_ERROR` - Server error

## Best Practices

1. **Use Specific Queries**: Query only the fields you need
2. **Batch Operations**: Use multiple mutations in a single request when possible
3. **Handle Errors**: Always check for errors in responses
4. **Use Variables**: Pass dynamic values as variables, not string interpolation
5. **Resource Paths**: Use consistent path patterns (e.g., `/api/resource/*`)

## Pagination

*Note: Pagination is not yet implemented but will follow this pattern:*

```graphql
query ListUsersPaginated($orgId: ID!, $limit: Int!, $offset: Int!) {
  users(orgId: $orgId, limit: $limit, offset: $offset) {
    nodes {
      id
      identityProvider
      identityProviderUserId
    }
    totalCount
    hasMore
  }
}
```