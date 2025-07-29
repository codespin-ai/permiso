# Permiso

A comprehensive Role-Based Access Control (RBAC) system with GraphQL API, built with TypeScript and functional programming patterns.

## Features

- 🏢 **Multi-tenant Organizations** - Isolated authorization contexts
- 👥 **Users & Roles** - Flexible user management with role assignments
- 🔐 **Fine-grained Permissions** - Resource-based access control with Unix-like paths
- 🏷️ **Properties & Filtering** - Custom metadata with query capabilities
- 🚀 **GraphQL API** - Modern, type-safe API with full CRUD operations
- 📊 **Effective Permissions** - Combined user and role permission calculation
- 🔧 **Functional Design** - Pure functions, immutable data, explicit error handling

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/codespin-ai/permiso.git
cd permiso

# Install dependencies
npm install

# Build all packages
./build.sh
```

### Database Setup

To run the development environment, use the following scripts from the `devenv` directory:
- **For macOS:** `./run.sh up`
- **For Linux:** `./run-rootless.sh up`

This will start a PostgreSQL container.

You can then set the following environment variables to connect to the database:


```bash
# Set environment variables
export PERMISO_DB_HOST=localhost
export PERMISO_DB_PORT=5432
export PERMISO_DB_NAME=permiso
export PERMISO_DB_USER=postgres
export PERMISO_DB_PASSWORD=your_password

# Run migrations
cd node/packages/permiso-rbac
npm run migrate:latest
```

## Architecture

Permiso is built as a monorepo with the following packages:

- **`@codespin/permiso-core`** - Core types and utilities (Result type, etc.)
- **`@codespin/permiso-logger`** - Centralized logging with Winston
- **`@codespin/permiso-rbac`** - Main RBAC implementation with GraphQL

### Design Principles

1. **Functional Programming** - No classes, pure functions only
2. **Explicit Error Handling** - Result<T, E> types instead of exceptions
3. **Type Safety** - Full TypeScript with strict mode
4. **Database Agnostic Design** - Clean separation of concerns
5. **GraphQL First** - Modern API design with strong typing

## Core Concepts

### Organizations
Root entities that provide isolated authorization contexts. All other entities belong to an organization.

### Users
Represent individuals who need access to resources. Users can:
- Belong to one organization
- Have multiple roles assigned
- Have direct permissions on resources
- Have custom properties for filtering

### Roles
Collections of permissions that can be assigned to users. Useful for common permission sets like "admin", "editor", "viewer".

### Resources
Named entities using Unix-like paths that permissions apply to:
- `/documents/contracts/2023/acme.pdf`
- `/features/billing`
- `/api/users/*`

### Permissions
Define what actions can be performed on resources:
- User permissions: Direct user → resource mappings
- Role permissions: Role → resource mappings
- Effective permissions: Combined view of user's direct + role permissions

### Properties
Key-value metadata that can be attached to organizations, users, and roles:
- Support for hidden properties
- Filterable queries
- Useful for custom business logic

## Usage Example

```typescript
import { initializeDatabase, createOrganization, createUser, createRole, grantRolePermission, assignUserRole } from '@codespin/permiso-rbac';

// Initialize database
const db = initializeDatabase();

// Create an organization
const org = await createOrganization(db, {
  id: 'acme-corp',
  data: 'ACME Corporation'
});

// Create a role
const role = await createRole(db, {
  id: 'editor',
  orgId: 'acme-corp',
  data: 'Content Editor Role'
});

// Grant permissions to role
await grantRolePermission(db, 'acme-corp', 'editor', '/documents/*', 'read');
await grantRolePermission(db, 'acme-corp', 'editor', '/documents/*', 'write');

// Create a user
const user = await createUser(db, {
  id: 'john-doe',
  orgId: 'acme-corp',
  identityProvider: 'google',
  identityProviderUserId: 'john@acme.com'
});

// Assign role to user
await assignUserRole(db, 'acme-corp', 'john-doe', 'editor');

// Check permissions
const hasPermission = await hasPermission(db, 'acme-corp', 'john-doe', '/documents/report.pdf', 'write');
// Returns: true
```

## GraphQL API

Permiso provides a complete GraphQL schema for all RBAC operations. Key features:

- Full CRUD operations for all entities
- Filtering and pagination support
- Nested relationship queries
- Batch operations
- Real-time permission checking

Example query:
```graphql
query GetUserPermissions {
  user(orgId: "acme-corp", userId: "john-doe") {
    id
    roles {
      id
      permissions {
        resourceId
        action
      }
    }
    effectivePermissions(resourcePath: "/documents/*") {
      resourceId
      action
      source
    }
  }
}
```

## Development

### Project Structure
```
permiso/
├── node/packages/
│   ├── permiso-core/       # Core utilities
│   ├── permiso-logger/     # Logging
│   └── permiso-rbac/       # RBAC implementation
├── build.sh                # Build script
├── clean.sh                # Clean script
└── lint-all.sh            # Lint all packages
```

### Building
```bash
# Build all packages
./build.sh

# Clean build artifacts
./clean.sh

# Run linting
./lint-all.sh
```

### Testing
```bash
# Run tests (coming soon)
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PERMISO_DB_HOST` | PostgreSQL host | `localhost` |
| `PERMISO_DB_PORT` | PostgreSQL port | `5432` |
| `PERMISO_DB_NAME` | Database name | `permiso` |
| `PERMISO_DB_USER` | Database user | `postgres` |
| `PERMISO_DB_PASSWORD` | Database password | `postgres` |
| `LOG_LEVEL` | Logging level | `info` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Use functional programming patterns (no classes)
- Handle errors with Result types
- Include JSDoc comments for public APIs
- Write tests for new features
- Follow the existing code style

## License

MIT © Codespin

## Acknowledgments

Inspired by [Tankman](https://github.com/lesser-app/tankman) but reimagined with GraphQL and functional programming.