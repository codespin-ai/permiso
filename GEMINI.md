# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## IMPORTANT: First Steps When Starting a Session

When you begin working on this project, you MUST:

1. **Read this entire GEMINI.md file** to understand the project structure and conventions
2. **Read PROJECT_STATUS.md** - This file tracks the current implementation progress, what's completed, what's in progress, and what needs to be done next. This is specifically maintained for AI assistants to quickly understand where the project stands.
3. **Read the key documentation files** in this order:
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
cd node && npm run lint:fix    # Run ESL-int with auto-fix on all packages

# Individual package linting
cd node/packages/[package-name] && npm run lint
cd node/packages/[package-name] && npm run lint:fix

# Integration tests
npm run test:integration:permiso      # Run integration tests for permiso database
npm run test:integration:permiso:watch # Run integration tests in watch mode
npm run test:integration:all          # Run all integration tests
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
4. **@codespin/permiso-rbac** - Main RBAC implementation with GraphQL API
5. **@codespin/permiso-integration-tests** - Integration tests using GraphQL API (separate from production build)

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
4. **Resources** - Protected entities using Unix-like paths (e.g., `/api/users/*`)
5. **Permissions** - Actions allowed on resources (e.g., `read`, `write`, `delete`)
6. **Custom Properties** - Key-value metadata attached to any entity

### Permission Model
- **User Permissions** - Direct permissions assigned to users
- **Role Permissions** - Permissions assigned to roles
- **Effective Permissions** - Computed combination of user and role permissions
- **Resource Paths** - Support wildcards (`*`) and hierarchical matching

## Key Documentation

- Coding standards: `/CODING-STANDARDS.md`
- Architecture overview: `/docs/architecture.md`
- API specification: `/docs/api-spec.md`
- Database schema: `/database/permiso/migrations/`

## Testing & Quality

- TypeScript strict mode enabled
- Follow functional testing patterns from CODING-STANDARDS.md
- Each package builds independently with `tsc`

### Important Build & Lint Workflow

**ALWAYS follow this sequence:**
1. Run `./lint-all.sh` first
2. Run `./build.sh`
3. **If build fails and you make changes**: You MUST run `./lint-all.sh` again before building
   - Your new changes haven't been linted yet
   - Build errors often require code changes that may introduce lint issues
   - Always: lint → build → (if changes) → lint → build

## Common Tasks

### Adding a New Package
1. Create directory in `/node/packages/`
2. Add package.json with `file:` dependencies
3. Add to `PACKAGES` array in `./build.sh` (respect dependency order)
4. Create `src/` directory and `tsconfig.json`
5. Run `./build.sh --install`

### Database Changes
1. Create migration: `npm run migrate:make your_migration_name`
2. Edit migration file in `/database/permiso/migrations/`
3. Run migration: `npm run migrate:latest`
4. Update types in `@codespin/permiso-rbac`
5. Update persistence layer functions

### GraphQL Schema Changes
1. Update schema in `/node/packages/permiso-rbac/src/graphql/schema.graphql`
2. Update resolvers in `/node/packages/permiso-rbac/src/graphql/resolvers/`
3. Add/update persistence functions as needed
4. Test with GraphQL playground at `http://localhost:5001/graphql`

## GraphQL API Overview

The permiso-rbac package provides a complete GraphQL API for RBAC operations:

### Key Queries
- `organization(id)` - Get organization details
- `organizations` - List all organizations
- `users(orgId)` - List users in an organization
- `roles(orgId)` - List roles in an organization
- `resources(orgId)` - List resources in an organization
- `effectivePermissions(orgId, userId, resourcePath)` - Calculate user's permissions

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
