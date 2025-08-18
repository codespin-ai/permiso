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

This guide helps AI assistants work effectively with the Permiso codebase. For project overview, see [README.md](../README.md).

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

When the user asks you to commit and push:

1. Run `./format-all.sh` to format all files with Prettier
2. Run `./lint-all.sh` to ensure code passes linting
3. Follow the git commit guidelines in the main Claude system prompt

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
./lint-all.sh --fix     # Run ESLint with auto-fix

# Format code with Prettier (MUST run before committing)
./format-all.sh         # Format all files
./format-all.sh --check # Check formatting without changing files

# Docker commands
./docker-build.sh       # Build Docker image
./docker-test.sh        # Test Docker image (see Docker section for options)
./docker-push.sh latest ghcr.io/codespin-ai  # Push to registry
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

# Testing
npm test                               # Run full integration test suite (recommended)

# Integration tests
npm run test:integration:permiso       # Run all integration tests
npm run test:integration:grep -- "Pattern"         # Run specific integration test suite
npm run test:integration:all           # Run all tests (integration + client)

# Client tests
npm run test:client                    # Run all client tests
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

- All imports MUST include `.js` extension: `import { foo } from "./bar.js"`
- TypeScript configured for `"module": "NodeNext"`
- Type: `"module"` in all package.json files

## Package Structure

See [Architecture Documentation](docs/architecture.md) for package details. Key point: When adding new packages, you MUST update the `PACKAGES` array in `./build.sh`.

## Configuration

See [Configuration Documentation](docs/configuration.md) for all environment variables and settings.

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
    updatedAt: row.updated_at,
  };
}

// ✅ Good - Type-safe queries with explicit type parameters and named parameters
const result = await db.one<UserDbRow>(
  `SELECT * FROM "user" WHERE id = $(id)`,
  { id },
);
return mapUserFromDb(result);
```

### Function Export Pattern

```typescript
// ✅ Good - Pure function with explicit dependencies
export async function createUser(
  db: Database,
  input: CreateUserInput,
): Promise<Result<User, Error>> {
  // Implementation
}

// ❌ Bad - Class-based approach
export class UserService {
  /* ... */
}
```

### Result Type Pattern

```typescript
import { createLogger } from "@codespin/permiso-logger";

export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Usage
const logger = createLogger("UserValidator");
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
  { orgId: input.id, name: p.name, value: p.value, hidden: p.hidden ?? false },
);

// ❌ Bad - Positional parameters
await db.none(
  `INSERT INTO organization_property (org_id, name, value, hidden) 
   VALUES ($1, $2, $3, $4)`,
  [input.id, p.name, p.value, p.hidden ?? false],
);
```

## Key Documentation References

- **Project Overview**: See [README.md](../README.md)
- **Architecture**: See [docs/architecture.md](docs/architecture.md) for RBAC concepts and data model
- **API Reference**: See [docs/api.md](docs/api.md) for GraphQL schema and examples
- **Database**: See [docs/database.md](docs/database.md) for multi-database setup
- **Configuration**: See [docs/configuration.md](docs/configuration.md) for environment variables
- **Deployment**: See [docs/deployment.md](docs/deployment.md) for Docker and production deployment
- **Coding Standards**: See [CODING-STANDARDS.md](../CODING-STANDARDS.md) for development patterns

## Testing Guidelines

### Testing Guidelines for Debugging and Fixes

**IMPORTANT**: When fixing bugs or debugging issues:

1. **Always run individual tests** when fixing specific issues
2. Use `npm run test:integration:grep -- "test name"` to run specific integration test suites
3. Use `npm run test:client:grep -- "test name"` for client-specific tests
4. Test incrementally - run the specific failing test after each change
5. Run `npm test` for the full test suite after individual tests pass

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
   - Your new changes haven"t been linted yet
   - Build errors often require code changes that may introduce lint issues
   - Always: lint → build → (if changes) → lint → build

See [README.md](../README.md#development) for testing commands and [deployment.md](docs/deployment.md#testing-docker-images) for Docker testing.

## Common Development Tasks

### Adding a New Package

1. Create directory in `/node/packages/`
2. Add package.json with `file:` dependencies
3. **CRITICAL**: Add to `PACKAGES` array in `./build.sh` (respect dependency order)
4. Create `src/` directory and `tsconfig.json`
5. Run `./build.sh --install`

### Database Changes

1. Create migration: `npm run migrate:permiso:make your_migration_name`
2. Edit migration file in `/database/permiso/migrations/`
3. Run migration: `npm run migrate:permiso:latest` (only when user explicitly asks)
4. Update types in `@codespin/permiso-server`
5. Update persistence layer functions

### GraphQL Schema Changes

1. Update schema in `/node/packages/permiso-server/src/schema.graphql`
2. Update resolvers in `/node/packages/permiso-server/src/resolvers/`
3. Add/update persistence functions as needed
4. Test with GraphQL playground at `http://localhost:5001/graphql`

For Docker deployment, see [deployment.md](docs/deployment.md).

## GraphQL API

See [API Documentation](docs/api.md) for complete GraphQL schema, queries, mutations, and examples.
