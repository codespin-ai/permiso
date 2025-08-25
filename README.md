# Permiso

Multi-tenant RBAC system with Row Level Security (RLS) and GraphQL API.

## Architecture

Permiso implements multi-tenant isolation using PostgreSQL Row Level Security. Each organization's data is isolated at the database level, with two database users:

- `rls_db_user`: For organization-scoped operations (automatically filtered by RLS policies)
- `unrestricted_db_user`: For cross-organization operations (organization management, cross-org queries)

## Quick Start

### Docker

```bash
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e PERMISO_DB_NAME=permiso \
  -e RLS_DB_USER=rls_db_user \
  -e RLS_DB_USER_PASSWORD=your_rls_password \
  -e UNRESTRICTED_DB_USER=unrestricted_db_user \
  -e UNRESTRICTED_DB_USER_PASSWORD=your_admin_password \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

### Local Development

```bash
# Clone and build
git clone https://github.com/codespin-ai/permiso.git
cd permiso
./build.sh

# Start PostgreSQL (from devenv directory)
cd devenv && ./run.sh up && cd ..

# Configure database users
export RLS_DB_USER=rls_db_user
export RLS_DB_USER_PASSWORD=changeme_rls
export UNRESTRICTED_DB_USER=unrestricted_db_user
export UNRESTRICTED_DB_USER_PASSWORD=changeme_admin
export PERMISO_DB_HOST=localhost
export PERMISO_DB_NAME=permiso

# Run migrations
cd node/packages/permiso-server
npm run migrate:permiso:latest

# Start server
cd ../../.. && ./start.sh
```

## Core Concepts

### Data Model

- **Organizations**: Top-level tenants (no RLS, globally accessible)
- **Users**: Identity provider integration (RLS-protected)
- **Roles**: Named permission sets (RLS-protected)
- **Resources**: Path-like identifiers supporting wildcards (RLS-protected)
- **Permissions**: User/role to resource+action mappings (RLS-protected)
- **Properties**: JSON metadata on all entities

### API Context

- **With `x-org-id` header**: Operations scoped to that organization (RLS enforced)
- **Without `x-org-id` header**: ROOT context for cross-org operations

## API Usage

### TypeScript Client

```typescript
import { createUser, grantUserPermission } from "@codespin/permiso-client";

const config = {
  endpoint: "http://localhost:5001",
  orgId: "acme-corp", // Optional - omit for ROOT operations
};

await createUser(config, {
  id: "user-123",
  identityProvider: "auth0",
  identityProviderUserId: "auth0|123",
});
```

### GraphQL

```graphql
mutation {
  createUser(
    input: {
      id: "user-123"
      identityProvider: "auth0"
      identityProviderUserId: "auth0|123"
    }
  ) {
    id
    orgId
  }
}
```

## Development

### Commands

```bash
./build.sh                  # Build all packages
./lint-all.sh              # Run ESLint
./format-all.sh            # Format with Prettier, called automatically during build
npm test                   # Run all tests
npm run test:grep -- "pattern"  # Search tests
```

### Project Structure

```
/node/packages/
  permiso-core/           # Shared types and utilities
  permiso-db/             # Database layer with RLS wrapper
  permiso-server/         # GraphQL server
  permiso-client/         # TypeScript client library
  permiso-integration-tests/  # Integration tests
```

### Key Files

- `database/permiso/migrations/` - Database schema and RLS policies
- `node/packages/permiso-server/src/schema.graphql` - GraphQL schema
- `node/packages/permiso-server/src/domain/` - Business logic
- `node/packages/permiso-db/src/rls-wrapper.ts` - RLS enforcement

## Configuration

### Required Environment Variables

```bash
# Database connection
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso

# Database users (required)
RLS_DB_USER=rls_db_user
RLS_DB_USER_PASSWORD=password
UNRESTRICTED_DB_USER=unrestricted_db_user
UNRESTRICTED_DB_USER_PASSWORD=password

# Server
PERMISO_SERVER_PORT=5001

# Optional API key authentication
PERMISO_API_KEY=your-secret-key
```

## Database Setup

### Creating Required Users

```sql
-- Create RLS user for org-scoped operations
CREATE USER rls_db_user WITH PASSWORD 'changeme_rls';
GRANT CONNECT ON DATABASE permiso TO rls_db_user;
GRANT USAGE ON SCHEMA public TO rls_db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rls_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rls_db_user;

-- Create unrestricted user for admin operations
CREATE USER unrestricted_db_user WITH PASSWORD 'changeme_admin';
GRANT CONNECT ON DATABASE permiso TO unrestricted_db_user;
GRANT ALL PRIVILEGES ON DATABASE permiso TO unrestricted_db_user;

-- Bypass RLS for unrestricted user
ALTER USER unrestricted_db_user BYPASSRLS;
```

### Multi-Database Support

Permiso can manage permissions for multiple databases. See [database.md](docs/database.md) for configuration.

## Testing

```bash
# Run all tests
npm test

# Search specific tests
npm run test:grep -- "Organizations"
npm run test:integration:grep -- "Users"
npm run test:client:grep -- "Permissions"

# Docker testing
./docker-test.sh
```

## Documentation

- [API Reference](docs/api.md) - GraphQL schema and examples
- [Architecture](docs/architecture.md) - System design details
- [Database](docs/database.md) - Multi-database configuration
- [Configuration](docs/configuration.md) - All environment variables
- [Deployment](docs/deployment.md) - Production deployment guide
- [Coding Standards](CODING-STANDARDS.md) - Development conventions

## License

MIT
