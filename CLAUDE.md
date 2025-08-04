# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: First Steps When Starting a Session

When you begin working on this project, you MUST:

1. **Read this entire CLAUDE.md file** to understand the project structure and conventions
2. **Read the key documentation files** in this order:
   - `/README.md` - Project overview and quick start
   - `/CODING-STANDARDS.md` - Mandatory coding patterns and conventions
   - `/docs/architecture.md` - System architecture details
   - Any other relevant docs based on the task at hand

Only after reading these documents should you proceed with any implementation or analysis tasks.

## Overview

Permiso is a comprehensive Role-Based Access Control (RBAC) system built with Node.js/TypeScript, providing fine-grained permission management for multi-tenant applications. It's a monorepo that deliberately avoids npm workspaces in favor of a custom build system.

## Essential Commands

### Git Workflow Rules

**IMPORTANT**: NEVER commit or push changes without explicit user instruction
- Only run `git add`, `git commit`, or `git push` when the user explicitly asks
- Common explicit instructions include: "commit", "push", "commit and push", "save to git"
- If unsure, ask the user if they want to commit the changes
- Always wait for user approval before making any git operations
- **DO NOT** automatically commit or push after making changes
- **DO NOT** commit/push even if you think the task is complete
- The user will explicitly tell you when they want to commit/push

### Build Commands
```bash
# Build entire project (from root)
./build.sh              # Standard build
./build.sh --install    # Force npm install in all packages
./build.sh --migrate    # Build + run DB migrations
./build.sh --seed       # Build + run DB seeds

# Clean build artifacts
./clean.sh

# Start the application
./start.sh

# Lint entire project (from root)
./lint-all.sh           # Run ESLint on all packages

# Docker commands
./docker-build.sh       # Build Docker image
./docker-test.sh        # Test Docker image (see Docker section for options)
./docker-push.sh ghcr.io/codespin-ai/permiso latest  # Push to registry
```

### Database Commands

**IMPORTANT**: NEVER run database migrations or seeds unless explicitly instructed by the user
- Only run migration/seed commands that modify the database when the user specifically asks
- You can run status checks and create new migration/seed files without explicit permission
- There is NO DEFAULT database - all commands must specify the database name

```bash
# Check migration status (safe to run)
npm run migrate:permiso:status
npm run migrate:all:status

# Create new migration (safe to run)
npm run migrate:permiso:make migration_name

# Run migrations (ONLY when explicitly asked)
npm run migrate:permiso:latest
npm run migrate:permiso:rollback
npm run migrate:all

# Create seed file (safe to run)
npm run seed:permiso:make seed_name

# Run seeds (ONLY when explicitly asked)
npm run seed:permiso:run
```

### Development Commands
```bash
# Start server
npm start

# TypeScript compilation for individual packages
cd node/packages/[package-name] && npm run build

# Linting commands (from /node directory)
cd node && npm run lint        # Run ESLint on all packages
cd node && npm run lint:fix    # Run ESLint with auto-fix on all packages

# Individual package linting
cd node/packages/[package-name] && npm run lint
cd node/packages/[package-name] && npm run lint:fix

# Integration tests
npm run test:integration:permiso       # Run all integration tests
npm run test:integration:permiso:watch  # Run integration tests in watch mode
npm run test:grep -- "Pattern"         # Run specific integration test suite
npm run test:integration:all           # Run all tests (integration + client)

# Client tests
npm run test:client                    # Run all client tests
npm run test:client:watch              # Run client tests in watch mode
npm run test:client:grep -- "Pattern"  # Run specific client test suite
```

## Critical Architecture Decisions

### 1. Monorepo Without Workspaces
- **NO npm workspaces** - Uses custom `./build.sh` script instead
- Dependencies between packages use `file:` protocol (e.g., `"@codespin/permiso-core": "file:../permiso-core"`)
- **IMPORTANT**: When adding new packages, you MUST update the `PACKAGES` array in `./build.sh`

### 2. Functional Programming Only
- **NO CLASSES** - Export functions from modules only
- Use pure functions with explicit dependency injection
- Prefer `type` over `interface` (use `interface` only for extensible contracts)
- Use Result types for error handling instead of exceptions

### 3. Database Conventions
- **PostgreSQL** with **Knex.js** for migrations
- **pg-promise** for data access (NO ORMs)
- Table names: **singular** and **snake_case** (e.g., `organization`, `user_role`)
- TypeScript: **camelCase** for all variables/properties
- SQL: **snake_case** for all table/column names
- **DbRow Pattern**: All persistence functions use `XxxDbRow` types that mirror exact database schema
- **Mapper Functions**: `mapXxxFromDb()` and `mapXxxToDb()` handle conversions between snake_case DB and camelCase domain types
- **Type-safe Queries**: All queries use `db.one<XxxDbRow>()` with explicit type parameters

### 4. ESM Modules
- All imports MUST include `.js` extension: `import { foo } from './bar.js'`
- TypeScript configured for `"module": "NodeNext"`
- Type: `"module"` in all package.json files

## Package Structure

Located in `/node/packages/`, build order matters:

1. **@codespin/permiso-core** - Core types, utilities, and Result type
2. **@codespin/permiso-logger** - Centralized logging for all packages
3. **@codespin/permiso-db** - Database connection and management utilities
4. **@codespin/permiso-test-utils** - Shared test utilities for integration and client tests (dev only)
5. **@codespin/permiso-server** - GraphQL server for RBAC implementation
6. **@codespin/permiso-client** - TypeScript client library for the GraphQL API (published to npm)
7. **@codespin/permiso-integration-tests** - Integration tests using GraphQL API (separate from production build)

## Environment Variables

Required PostgreSQL connection variables:
- `PERMISO_DB_HOST`
- `PERMISO_DB_PORT`
- `PERMISO_DB_NAME`
- `PERMISO_DB_USER`
- `PERMISO_DB_PASSWORD`

Optional:
- `PERMISO_SERVER_PORT` - GraphQL server port (default: 5001)
- `PERMISO_LOG_LEVEL` - Logging level (default: info)

## Code Patterns

### Database Row Pattern (DbRow)
```typescript
// ✅ Good - DbRow type mirrors exact database schema
type UserDbRow = {
  id: string;
  org_id: string;
  identity_provider: string;
  identity_provider_user_id: string;
  created_at: Date;
  updated_at: Date;
};

// ✅ Good - Mapper functions for DB ↔ Domain conversions
function mapUserFromDb(row: UserDbRow): User {
  return {
    id: row.id,
    orgId: row.org_id,
    identityProvider: row.identity_provider,
    identityProviderUserId: row.identity_provider_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ✅ Good - Type-safe queries with explicit type parameters and named parameters
const result = await db.one<UserDbRow>(
  `SELECT * FROM "user" WHERE id = $(id)`,
  { id }
);
return mapUserFromDb(result);
```

### Function Export Pattern
```typescript
// ✅ Good - Pure function with explicit dependencies
export async function createUser(
  db: Database,
  input: CreateUserInput
): Promise<Result<User, Error>> {
  // Implementation
}

// ❌ Bad - Class-based approach
export class UserService { /* ... */ }
```

### Result Type Pattern
```typescript
import { createLogger } from '@codespin/permiso-logger';

export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Usage
const logger = createLogger('UserValidator');
const result = await validateUser(user);
if (!result.success) {
  logger.error("Validation failed:", result.error);
  return;
}
const validUser = result.data; // Type-safe
```

### Import Pattern
```typescript
// ✅ Good - Always include .js extension
import { createUser } from "./users.js";
import { Result } from "@codespin/permiso-core";

// ❌ Bad - Missing extension
import { createUser } from "./users";
```

### Database Query Pattern
```typescript
// ✅ Good - Named parameters
await db.none(
  `INSERT INTO organization_property (org_id, name, value, hidden) 
   VALUES ($(orgId), $(name), $(value), $(hidden))`,
  { orgId: input.id, name: p.name, value: p.value, hidden: p.hidden ?? false }
);

// ❌ Bad - Positional parameters
await db.none(
  `INSERT INTO organization_property (org_id, name, value, hidden) 
   VALUES ($1, $2, $3, $4)`,
  [input.id, p.name, p.value, p.hidden ?? false]
);
```

## RBAC Concepts

### Core Entities
1. **Organizations** - Top-level tenant isolation
2. **Users** - Authenticated principals within an organization
3. **Roles** - Named collections of permissions
4. **Resources** - Protected entities with IDs in path-like format (e.g., `/api/users/*`)
5. **Permissions** - Actions allowed on resources (e.g., `read`, `write`, `delete`)
6. **Custom Properties** - Key-value metadata attached to any entity

### Permission Model
- **User Permissions** - Direct permissions assigned to users
- **Role Permissions** - Permissions assigned to roles
- **Effective Permissions** - Computed combination of user and role permissions
- **Resource IDs** - Support wildcards (`*`) and hierarchical matching in path-like format

## Key Documentation

- API documentation: `/docs/api.md`
- Architecture overview: `/docs/architecture.md`
- Database configuration: `/docs/database.md`
- Database schema: `/database/permiso/migrations/`
- Coding standards: `/CODING-STANDARDS.md`

## Testing & Quality

- TypeScript strict mode enabled
- Follow functional testing patterns from CODING-STANDARDS.md
- Each package builds independently with `tsc`

### Testing Guidelines for Debugging and Fixes

**IMPORTANT**: When fixing bugs or debugging issues:
1. **Always run individual tests** when fixing specific issues
2. Use `npm run test:grep -- "test name"` to run specific test suites
3. Use `npm run test:client:grep -- "test name"` for client-specific tests
4. Test incrementally - run the specific failing test after each change
5. Only run the full test suite after individual tests pass

This approach:
- Provides faster feedback loops
- Makes debugging easier
- Prevents breaking other tests while fixing one
- Saves time during development

### Important Build & Lint Workflow

**ALWAYS follow this sequence:**
1. Run `./lint-all.sh` first
2. Run `./build.sh`
3. **If build fails and you make changes**: You MUST run `./lint-all.sh` again before building
   - Your new changes haven't been linted yet
   - Build errors often require code changes that may introduce lint issues
   - Always: lint → build → (if changes) → lint → build

### Shared Test Utilities

The `@codespin/permiso-test-utils` package provides shared test infrastructure:
- **TestServer**: Manages GraphQL server lifecycle for tests
- **TestDatabase**: Handles test database setup/teardown

This package is used by both integration tests and client tests as a devDependency, eliminating code duplication while keeping the client package independent for npm publishing.

### Running Tests

#### Prerequisites for Testing

**IMPORTANT**: Before running any tests, you MUST have the PostgreSQL container running:

```bash
# From the project root
cd devenv
./run.sh up

# Verify PostgreSQL is running
./run.sh logs postgres
```

The development environment will:
- Start a PostgreSQL 16 container on port 5432
- Create the `permiso` database automatically via `init.sql`
- Use credentials: `postgres:postgres`

#### Integration Tests

Integration tests are located in `/node/packages/permiso-integration-tests` and test the full GraphQL API:

```bash
# Run all integration tests (from project root)
npm run test:integration:permiso

# Run specific test suite
npm run test:grep -- "Organizations"
npm run test:grep -- "Permissions"
npm run test:grep -- "Users"

# Run all tests (integration + client)
npm run test:integration:all
```

**Test Configuration**:
- Tests automatically use a separate `permiso_test` database
- Database is cleaned before each test run
- Migrations are automatically applied to the test database
- Default timeout: 30 seconds per test
- Uses Mocha with TypeScript support via ts-node
- Tests exit properly after completion (no hanging processes)

**Environment Variables for Tests**:
Tests will use these defaults, or you can override them:
```bash
PERMISO_DB_HOST=localhost       # Default: localhost
PERMISO_DB_PORT=5432           # Default: 5432
PERMISO_DB_USER=postgres       # Default: postgres
PERMISO_DB_PASSWORD=postgres   # Default: postgres
# Note: Test database name is hardcoded to 'permiso_test'
```

**Test Coverage**:
Integration tests cover:
- Organization CRUD operations
- User and Role management
- Resource and Permission handling
- Property operations with JSON support
- Complex permission calculations
- GraphQL API error handling

#### Client Tests

Client tests are located in `/node/packages/permiso-client` and test the TypeScript client library:

```bash
# Run all client tests (from project root)
npm run test:client

# Run specific client test suite
npm run test:client:grep -- "Organizations"
npm run test:client:grep -- "Permissions"

# Watch mode
npm run test:client:watch
```

**Client Test Configuration**:
- Uses a separate `permiso_client_test` database
- Runs server on port 5003 (different from integration tests)
- Tests the client API functions directly
- Validates Result types and error handling

#### Docker Image Testing

To test Docker images before deployment:

```bash
# Automated testing
./docker-test.sh                              # Test default image (permiso:latest)
./docker-test.sh ghcr.io/codespin-ai/permiso:latest  # Test specific image
./docker-test.sh permiso:latest 5001          # Test on specific port

# The test script will:
# - Create a temporary test database
# - Run the container with auto-migration
# - Execute comprehensive GraphQL tests
# - Clean up automatically
# - Return exit code 0 on success, 1 on failure
```

## Common Tasks

### Adding a New Package
1. Create directory in `/node/packages/`
2. Add package.json with `file:` dependencies
3. Add to `PACKAGES` array in `./build.sh` (respect dependency order)
4. Create `src/` directory and `tsconfig.json`
5. Run `./build.sh --install`

### Docker Deployment
1. Build image: `./docker-build.sh`
2. Test locally: `docker run -p 5001:5001 --env-file .env permiso:latest`
3. Push to registry: `./docker-push.sh ghcr.io/codespin-ai/permiso latest`
4. Official images available at: `ghcr.io/codespin-ai/permiso`

### Testing Docker Images

**Automated Testing**: Use the `./docker-test.sh` script to validate Docker images:

```bash
# Test default image (permiso:latest) on default port (5099)
./docker-test.sh

# Test specific image
./docker-test.sh ghcr.io/codespin-ai/permiso:latest

# Test on specific port
./docker-test.sh permiso:latest 5001

# Show help
./docker-test.sh --help
```

The test script:
- Creates a temporary test database
- Runs the container with auto-migration
- Executes comprehensive GraphQL tests including:
  - Organization creation
  - All JSON property types (string, number, boolean, null, array, object)
  - User and Role creation with properties
  - Complex nested JSON structures
- Cleans up automatically after tests
- Returns exit code 0 on success, 1 on failure

**Manual Testing**: For debugging or custom testing:
```bash
# Run with host networking (Linux)
docker run --rm -p 5001:5001 \
  --add-host=host.docker.internal:host-gateway \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e PERMISO_DB_PORT=5432 \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=postgres \
  permiso:latest
```

### Database Changes
1. Create migration: `npm run migrate:make your_migration_name`
2. Edit migration file in `/database/permiso/migrations/`
3. Run migration: `npm run migrate:latest`
4. Update types in `@codespin/permiso-server`
5. Update persistence layer functions

### GraphQL Schema Changes
1. Update schema in `/node/packages/permiso-server/src/schema.graphql`
2. Update resolvers in `/node/packages/permiso-server/src/resolvers/`
3. Add/update persistence functions as needed
4. Test with GraphQL playground at `http://localhost:5001/graphql`

## GraphQL API Overview

The permiso-server package provides a complete GraphQL API for RBAC operations:

### Key Queries
- `organization(id)` - Get organization details
- `organizations` - List all organizations
- `users(orgId)` - List users in an organization
- `roles(orgId)` - List roles in an organization
- `resources(orgId)` - List resources in an organization
- `effectivePermissions(orgId, userId, resourceId)` - Calculate user's permissions

### Key Mutations
- `createOrganization` - Create new organization
- `createUser` - Create user in organization
- `createRole` - Create role
- `createResource` - Create protected resource
- `assignUserRole` - Assign role to user
- `grantUserPermission` - Grant direct permission to user
- `grantRolePermission` - Grant permission to role

## Performance Considerations

- Use database indexes on frequently queried columns (already included in migrations)
- Batch operations when possible to reduce database round trips
- Cache effective permissions calculations when appropriate
- Use transactions for operations that modify multiple tables