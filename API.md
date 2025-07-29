# Permiso GraphQL API Documentation

Permiso provides a comprehensive GraphQL API for managing Role-Based Access Control (RBAC) in multi-tenant applications. This document covers the complete API schema, query/mutation examples, and best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [GraphQL Schema](#graphql-schema)
- [Query Examples](#query-examples)
- [Mutation Examples](#mutation-examples)
- [Permission System](#permission-system)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Getting Started

### Endpoint

The GraphQL API is available at:
```
http://localhost:5001/graphql
```

### GraphQL Playground

When running in development mode, you can access the GraphQL Playground at the same URL to explore the API interactively.

### Authentication

**Note**: The current implementation does not include authentication. In production, you should implement proper authentication and ensure users can only access data within their organization context.

## Core Concepts

### Organizations
- Top-level tenant isolation
- All entities belong to an organization
- Organizations have unique IDs and properties

### Users
- Represent authenticated principals
- Belong to one organization
- Identified by identity provider + provider user ID
- Can have multiple roles and direct permissions

### Roles
- Named collections of permissions
- Reusable permission sets (e.g., "admin", "editor", "viewer")
- Can be assigned to multiple users

### Resources
- Protected entities identified by paths
- Use Unix-like path notation (e.g., `/api/users/*`)
- Support wildcard matching with `*`

### Permissions
- Define allowed actions on resources
- Can be granted directly to users or to roles
- Actions are arbitrary strings (e.g., "read", "write", "delete")

### Properties
- Key-value metadata for organizations, users, and roles
- Support hidden properties for sensitive data
- Enable filtering and custom business logic

## GraphQL Schema

### Scalar Types

```graphql
scalar DateTime
```

### Core Types

#### Organization
```graphql
type Organization {
  id: ID!
  name: String!
  description: String
  properties: [Property!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
  roles(filter: RoleFilter, pagination: PaginationInput): RoleConnection!
  resources(filter: ResourceFilter, pagination: PaginationInput): ResourceConnection!
}
```

#### User
```graphql
type User {
  id: ID!
  orgId: ID!
  identityProvider: String!
  identityProviderUserId: String!
  data: String
  properties: [Property!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  organization: Organization!
  roles: [Role!]!
  permissions: [UserPermission!]!
  effectivePermissions(resourceId: String, action: String): [Permission!]!
}
```

#### Role
```graphql
type Role {
  id: ID!
  orgId: ID!
  name: String!
  description: String
  properties: [Property!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  organization: Organization!
  users: [User!]!
  permissions: [RolePermission!]!
}
```

#### Resource
```graphql
type Resource {
  id: ID!  # This is the path (e.g., /api/users/*)
  orgId: ID!
  name: String
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  organization: Organization!
  permissions: [Permission!]!
}
```

#### Property
```graphql
type Property {
  name: String!
  value: String!
  hidden: Boolean!
  createdAt: DateTime!
}
```

#### Permission Types
```graphql
interface Permission {
  resourceId: ID!
  action: String!
  createdAt: DateTime!
  organization: Organization!
  resource: Resource!
}

type UserPermission implements Permission {
  userId: ID!
  resourceId: ID!
  action: String!
  createdAt: DateTime!
  organization: Organization!
  resource: Resource!
  user: User!
}

type RolePermission implements Permission {
  roleId: ID!
  resourceId: ID!
  action: String!
  createdAt: DateTime!
  organization: Organization!
  resource: Resource!
  role: Role!
}

type EffectivePermission {
  resourceId: ID!
  action: String!
  source: String! # 'user' or 'role'
  sourceId: ID    # userId or roleId
  createdAt: DateTime!
}
```

### Queries

```graphql
type Query {
  # Organizations
  organization(id: ID!): Organization
  organizations(filter: OrganizationFilter, pagination: PaginationInput): OrganizationConnection!
  organizationsByIds(ids: [ID!]!): [Organization!]!
  organizationProperty(orgId: ID!, propertyName: String!): Property
  
  # Users (scoped to org)
  user(orgId: ID!, userId: ID!): User
  users(orgId: ID!, filter: UserFilter, pagination: PaginationInput): UserConnection!
  usersByIds(orgId: ID!, ids: [ID!]!): [User!]!
  usersByIdentity(identityProvider: String!, identityProviderUserId: String!): [User!]!
  userProperty(orgId: ID!, userId: ID!, propertyName: String!): Property
  
  # Roles (scoped to org)
  role(orgId: ID!, roleId: ID!): Role
  roles(orgId: ID!, filter: RoleFilter, pagination: PaginationInput): RoleConnection!
  rolesByIds(orgId: ID!, ids: [ID!]!): [Role!]!
  roleProperty(orgId: ID!, roleId: ID!, propertyName: String!): Property
  
  # Resources (scoped to org)
  resource(orgId: ID!, resourceId: ID!): Resource
  resources(orgId: ID!, filter: ResourceFilter, pagination: PaginationInput): ResourceConnection!
  resourcesByIdPrefix(orgId: ID!, idPrefix: String!): [Resource!]!
  
  # Permissions
  userPermissions(orgId: ID!, userId: ID!, resourceId: String, action: String): [UserPermission!]!
  rolePermissions(orgId: ID!, roleId: ID!, resourceId: String, action: String): [RolePermission!]!
  effectivePermissions(orgId: ID!, userId: ID!, resourceId: String!, action: String): [EffectivePermission!]!
  effectivePermissionsByPrefix(
    orgId: ID!, 
    userId: ID!, 
    resourceIdPrefix: String!, 
    action: String
  ): [EffectivePermission!]!
  
  # Check permission (returns boolean)
  hasPermission(orgId: ID!, userId: ID!, resourceId: String!, action: String!): Boolean!
}
```

### Mutations

```graphql
type Mutation {
  # Organizations
  createOrganization(input: CreateOrganizationInput!): Organization!
  updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
  deleteOrganization(id: ID!, safetyKey: String): Boolean!
  
  # Organization Properties
  setOrganizationProperty(orgId: ID!, name: String!, value: String!, hidden: Boolean): Property!
  deleteOrganizationProperty(orgId: ID!, name: String!): Boolean!
  
  # Users
  createUser(input: CreateUserInput!): User!
  updateUser(orgId: ID!, userId: ID!, input: UpdateUserInput!): User!
  deleteUser(orgId: ID!, userId: ID!): Boolean!
  
  # User Properties
  setUserProperty(orgId: ID!, userId: ID!, name: String!, value: String!, hidden: Boolean): Property!
  deleteUserProperty(orgId: ID!, userId: ID!, name: String!): Boolean!
  
  # User Roles
  assignUserRole(orgId: ID!, userId: ID!, roleId: ID!): User!
  unassignUserRole(orgId: ID!, userId: ID!, roleId: ID!): User!
  
  # Roles
  createRole(input: CreateRoleInput!): Role!
  updateRole(orgId: ID!, roleId: ID!, input: UpdateRoleInput!): Role!
  deleteRole(orgId: ID!, roleId: ID!): Boolean!
  
  # Role Properties
  setRoleProperty(orgId: ID!, roleId: ID!, name: String!, value: String!, hidden: Boolean): Property!
  deleteRoleProperty(orgId: ID!, roleId: ID!, name: String!): Boolean!
  
  # Resources
  createResource(input: CreateResourceInput!): Resource!
  updateResource(orgId: ID!, resourceId: ID!, input: UpdateResourceInput!): Resource!
  deleteResource(orgId: ID!, resourceId: ID!): Boolean!
  
  # Permissions
  grantUserPermission(input: GrantUserPermissionInput!): UserPermission!
  revokeUserPermission(orgId: ID!, userId: ID!, resourceId: ID!, action: String!): Boolean!
  
  grantRolePermission(input: GrantRolePermissionInput!): RolePermission!
  revokeRolePermission(orgId: ID!, roleId: ID!, resourceId: ID!, action: String!): Boolean!
}
```

### Input Types

```graphql
input CreateOrganizationInput {
  id: ID!
  name: String!
  description: String
  properties: [PropertyInput!]
}

input UpdateOrganizationInput {
  name: String
  description: String
}

input CreateUserInput {
  id: ID!
  orgId: ID!
  identityProvider: String!
  identityProviderUserId: String!
  data: String
  properties: [PropertyInput!]
  roleIds: [ID!]
}

input UpdateUserInput {
  identityProvider: String
  identityProviderUserId: String
  data: String
}

input CreateRoleInput {
  id: ID!
  orgId: ID!
  name: String!
  description: String
  properties: [PropertyInput!]
}

input UpdateRoleInput {
  name: String
  description: String
}

input CreateResourceInput {
  id: ID!
  orgId: ID!
  name: String
  description: String
}

input UpdateResourceInput {
  name: String
  description: String
}

input PropertyInput {
  name: String!
  value: String!
  hidden: Boolean
}

input GrantUserPermissionInput {
  orgId: ID!
  userId: ID!
  resourceId: ID!
  action: String!
}

input GrantRolePermissionInput {
  orgId: ID!
  roleId: ID!
  resourceId: ID!
  action: String!
}
```

### Filter and Pagination Types

```graphql
input OrganizationFilter {
  properties: [PropertyFilter!]
}

input UserFilter {
  properties: [PropertyFilter!]
  identityProvider: String
  identityProviderUserId: String
}

input RoleFilter {
  properties: [PropertyFilter!]
}

input ResourceFilter {
  idPrefix: String
}

input PropertyFilter {
  name: String!
  value: String!
}

input PaginationInput {
  offset: Int
  limit: Int
}

# Connection types for pagination
type OrganizationConnection {
  nodes: [Organization!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type UserConnection {
  nodes: [User!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type RoleConnection {
  nodes: [Role!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type ResourceConnection {
  nodes: [Resource!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Query Examples

### Get Organization with Users and Roles

```graphql
query GetOrganizationDetails {
  organization(id: "acme-corp") {
    id
    name
    description
    properties {
      name
      value
    }
    users(pagination: { limit: 10 }) {
      nodes {
        id
        identityProvider
        identityProviderUserId
        roles {
          id
          name
        }
      }
      totalCount
    }
    roles {
      nodes {
        id
        name
        description
      }
    }
  }
}
```

### Get User with Effective Permissions

```graphql
query GetUserPermissions {
  user(orgId: "acme-corp", userId: "john-doe") {
    id
    identityProvider
    identityProviderUserId
    roles {
      id
      name
      permissions {
        resourceId
        action
      }
    }
    permissions {
      resourceId
      action
    }
    effectivePermissions(resourceId: "/api/users/123") {
      resourceId
      action
      source
      sourceId
    }
  }
}
```

### Check if User Has Permission

```graphql
query CheckPermission {
  hasPermission(
    orgId: "acme-corp"
    userId: "john-doe"
    resourceId: "/api/users/123"
    action: "write"
  )
}
```

### Get Effective Permissions by Prefix

```graphql
query GetPermissionsByPrefix {
  effectivePermissionsByPrefix(
    orgId: "acme-corp"
    userId: "john-doe"
    resourceIdPrefix: "/api/"
    action: "read"
  ) {
    resourceId
    action
    source
    sourceId
  }
}
```

### Filter Users by Property

```graphql
query FilterUsersByDepartment {
  users(
    orgId: "acme-corp"
    filter: {
      properties: [
        { name: "department", value: "engineering" }
      ]
    }
  ) {
    nodes {
      id
      properties {
        name
        value
      }
    }
  }
}
```

### Get Resources by Path Prefix

```graphql
query GetAPIResources {
  resourcesByIdPrefix(orgId: "acme-corp", idPrefix: "/api/") {
    id
    name
    description
  }
}
```

## Mutation Examples

### Create Organization with Properties

```graphql
mutation CreateOrg {
  createOrganization(input: {
    id: "acme-corp"
    name: "ACME Corporation"
    description: "A sample organization"
    properties: [
      { name: "industry", value: "technology" }
      { name: "size", value: "enterprise" }
    ]
  }) {
    id
    name
    properties {
      name
      value
    }
  }
}
```

### Create User with Role Assignment

```graphql
mutation CreateUserWithRoles {
  createUser(input: {
    id: "john-doe"
    orgId: "acme-corp"
    identityProvider: "google"
    identityProviderUserId: "john@acme.com"
    data: "{\"email\": \"john@acme.com\"}"
    roleIds: ["admin", "editor"]
    properties: [
      { name: "department", value: "engineering" }
      { name: "employee_id", value: "E12345", hidden: true }
    ]
  }) {
    id
    roles {
      id
      name
    }
    properties {
      name
      value
      hidden
    }
  }
}
```

### Create Role with Properties

```graphql
mutation CreateEditorRole {
  createRole(input: {
    id: "editor"
    orgId: "acme-corp"
    name: "Content Editor"
    description: "Can edit all content"
    properties: [
      { name: "level", value: "intermediate" }
    ]
  }) {
    id
    name
    description
  }
}
```

### Create Resource

```graphql
mutation CreateAPIResource {
  createResource(input: {
    id: "/api/users/*"
    orgId: "acme-corp"
    name: "User API"
    description: "All user-related API endpoints"
  }) {
    id
    name
    description
  }
}
```

### Grant Permission to User

```graphql
mutation GrantUserPermission {
  grantUserPermission(input: {
    orgId: "acme-corp"
    userId: "john-doe"
    resourceId: "/api/reports/*"
    action: "read"
  }) {
    userId
    resourceId
    action
    createdAt
  }
}
```

### Grant Permission to Role

```graphql
mutation GrantRolePermission {
  grantRolePermission(input: {
    orgId: "acme-corp"
    roleId: "editor"
    resourceId: "/api/content/*"
    action: "write"
  }) {
    roleId
    resourceId
    action
    resource {
      name
    }
  }
}
```

### Assign Role to User

```graphql
mutation AssignRole {
  assignUserRole(
    orgId: "acme-corp"
    userId: "john-doe"
    roleId: "admin"
  ) {
    id
    roles {
      id
      name
    }
  }
}
```

### Update User Property

```graphql
mutation UpdateUserDepartment {
  setUserProperty(
    orgId: "acme-corp"
    userId: "john-doe"
    name: "department"
    value: "product"
    hidden: false
  ) {
    name
    value
    hidden
  }
}
```

### Revoke Permission

```graphql
mutation RevokePermission {
  revokeUserPermission(
    orgId: "acme-corp"
    userId: "john-doe"
    resourceId: "/api/admin/*"
    action: "delete"
  )
}
```

## Permission System

### Resource Path Matching

Permiso uses Unix-like path notation with wildcard support:

- `/api/users` - Exact match
- `/api/users/*` - Matches `/api/users/123`, `/api/users/456`, etc.
- `/api/*` - Matches any path starting with `/api/`
- `/*` - Matches everything

### Permission Resolution

When checking permissions, the system:

1. Checks direct user permissions
2. Checks permissions from all assigned roles
3. Uses prefix matching for wildcard resources

Example:
- User has role "editor" with permission on `/api/content/*`
- System checks if user can "write" to `/api/content/articles/123`
- Permission is granted because `/api/content/articles/123` starts with `/api/content/`

### Effective Permissions

The `effectivePermissions` query returns all applicable permissions for a user on a specific resource, including:
- Direct user permissions
- Permissions inherited from roles
- Source information (whether from user or role)

## Error Handling

The API returns standard GraphQL errors with descriptive messages:

```json
{
  "errors": [
    {
      "message": "Foreign key violation - Key (org_id)=(non-existent) is not present in table \"organization\"",
      "locations": [{"line": 2, "column": 3}],
      "path": ["createUser"],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ],
  "data": null
}
```

Common error scenarios:
- Foreign key violations (referencing non-existent entities)
- Unique constraint violations (duplicate IDs)
- Not found errors (querying non-existent resources)
- Validation errors (invalid input data)

## Best Practices

### 1. Use Meaningful IDs

Instead of auto-generated IDs, use descriptive identifiers:
- Organizations: `acme-corp`, `startup-inc`
- Users: `john-doe`, `jane-smith`
- Roles: `admin`, `editor`, `viewer`
- Resources: `/api/users/*`, `/documents/contracts/*`

### 2. Resource Path Design

Design your resource paths hierarchically:
```
/api/
  /users/
    /{id}
  /posts/
    /{id}
    /comments/
      /{id}
/documents/
  /public/
  /private/
/features/
  /billing
  /analytics
```

### 3. Action Naming

Use consistent action names:
- `read` - View/list resources
- `write` - Create/update resources
- `delete` - Remove resources
- `admin` - Administrative actions

### 4. Property Usage

Use properties for:
- Filtering and searching
- Custom business logic
- Non-security metadata
- Audit information

### 5. Batch Operations

When creating multiple related entities, use transactions:
1. Create organization
2. Create roles
3. Create resources
4. Assign permissions to roles
5. Create users with role assignments

### 6. Permission Testing

Always test permission chains:
1. Grant permission to role
2. Assign role to user
3. Verify user has effective permission
4. Test with actual resource paths

### 7. Wildcard Usage

Use wildcards appropriately:
- Too broad: `/*` gives access to everything
- Too narrow: `/api/users/123` only works for one user
- Just right: `/api/users/*` covers all user operations

## cURL Examples

### Create Organization

```bash
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createOrganization(input: { id: \"test-org\", name: \"Test Organization\" }) { id name } }"
  }'
```

### Check Permission

```bash
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { hasPermission(orgId: \"test-org\", userId: \"user-1\", resourceId: \"/api/users/123\", action: \"read\") }"
  }'
```

### Get User with Permissions

```bash
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { user(orgId: \"test-org\", userId: \"user-1\") { id roles { name } effectivePermissions(resourceId: \"/api/users/*\") { action source } } }"
  }'
```

## Advanced Topics

### Performance Optimization

1. **Batch Loading**: Use DataLoader pattern for N+1 query prevention
2. **Caching**: Cache permission calculations for frequently checked resources
3. **Indexes**: Ensure database indexes on:
   - Foreign keys
   - Resource paths (for prefix matching)
   - Identity provider fields

### Multi-tenancy Considerations

1. Always scope queries by organization
2. Implement organization-level isolation in application layer
3. Consider separate databases per organization for complete isolation

### Integration Patterns

1. **Authentication Integration**:
   ```graphql
   query FindUserByAuth {
     usersByIdentity(
       identityProvider: "auth0"
       identityProviderUserId: "auth0|12345"
     ) {
       id
       orgId
     }
   }
   ```

2. **Middleware Integration**:
   ```javascript
   // Express middleware example
   async function checkPermission(req, res, next) {
     const hasPermission = await graphqlClient.query({
       query: HAS_PERMISSION_QUERY,
       variables: {
         orgId: req.user.orgId,
         userId: req.user.id,
         resourceId: req.path,
         action: req.method.toLowerCase()
       }
     });
     
     if (hasPermission.data.hasPermission) {
       next();
     } else {
       res.status(403).json({ error: 'Forbidden' });
     }
   }
   ```

### Audit Trail

Track permission changes by querying the `createdAt` timestamps:

```graphql
query AuditPermissions {
  userPermissions(orgId: "acme-corp", userId: "john-doe") {
    resourceId
    action
    createdAt
  }
}
```

## Troubleshooting

### Common Issues

1. **"Foreign key violation" errors**
   - Ensure referenced entities exist before creating relationships
   - Check organization ID is correct

2. **Empty permission results**
   - Verify resource paths match (including wildcards)
   - Check user has assigned roles
   - Ensure permissions are granted to roles

3. **Performance issues**
   - Add pagination to large queries
   - Use specific resource paths instead of broad wildcards
   - Consider caching frequently checked permissions

### Debug Queries

```graphql
# Debug user's complete permission state
query DebugUserPermissions {
  user(orgId: "acme-corp", userId: "john-doe") {
    # Direct permissions
    permissions {
      resourceId
      action
    }
    # Roles
    roles {
      id
      name
      # Role permissions
      permissions {
        resourceId
        action
      }
    }
    # Computed effective permissions
    effectivePermissions(resourceId: "/api/*") {
      resourceId
      action
      source
      sourceId
    }
  }
}
```

## Migration Guide

If migrating from another RBAC system:

1. Map existing roles to Permiso roles
2. Convert resource identifiers to path format
3. Import organizations first, then roles, then users
4. Assign permissions to roles before assigning roles to users
5. Verify permissions with test queries

## Support

For questions and support:
- GitHub Issues: [https://github.com/codespin-ai/permiso/issues](https://github.com/codespin-ai/permiso/issues)
- Documentation: [https://github.com/codespin-ai/permiso/docs](https://github.com/codespin-ai/permiso/docs)