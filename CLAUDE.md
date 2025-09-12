# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: NEVER ACT WITHOUT EXPLICIT USER APPROVAL

**YOU MUST ALWAYS ASK FOR PERMISSION BEFORE:**

- Making architectural decisions or changes
- Implementing new features or functionality
- Modifying APIs, interfaces, or data structures
- Changing expected behavior or test expectations
- Adding new dependencies or patterns

**ONLY make changes AFTER the user explicitly approves.** When you identify issues or potential improvements, explain them clearly and wait for the user's decision. Do NOT assume what the user wants or make "helpful" changes without permission.

## CRITICAL: NEVER USE MULTIEDIT

**NEVER use the MultiEdit tool.** It has caused issues in multiple projects. Always use individual Edit operations instead, even if it means more edits. This ensures better control and prevents unintended changes.

## IMPORTANT: First Steps When Starting a Session

When you begin working on this project, you MUST:

1. **Read this entire CLAUDE.md file** to understand the project structure and conventions
2. **Read the key documentation files** in this order:
   - `/README.md` - Project overview and quick start
   - `/CODING-STANDARDS.md` - Mandatory coding patterns and conventions
   - `/docs/architecture.md` - System architecture details
   - Any other relevant docs based on the task at hand

Only after reading these documents should you proceed with any implementation or analysis tasks.

**IMPORTANT**: After every conversation compact/summary, you MUST re-read this CLAUDE.md file again as your first action. The conversation context gets compressed and critical project-specific instructions may be lost. Always start by reading CLAUDE.md after a compact.

## Overview

This guide helps AI assistants work effectively with the Permiso codebase. For project overview, see [README.md](../README.md).

## Project Context: Greenfield Development

**IMPORTANT**: Permiso is a greenfield project with no legacy constraints. When working on this codebase:

- **No backward compatibility concerns** - There are no existing deployments or users to migrate
- **No legacy code patterns** - All code should follow current best practices without compromise
- **No migration paths needed** - Database schemas, APIs, and data structures can be designed optimally from the start
- **Write code as if starting fresh** - Every implementation should be clean and modern
- **No change tracking in comments** - Avoid comments like "changed from X to Y" or "previously this was..." since there is no "previous" state
- **No deprecation warnings** - Nothing is deprecated because nothing is legacy

This means you should:

- Focus on clean, optimal implementations without worrying about existing systems
- Design data structures and APIs for the ideal case, not for compatibility
- Write code and comments as if everything is being written for the first time
- Make architectural decisions based purely on technical merit

## Documentation Principles

**IMPORTANT**: When writing or updating documentation:

- Write as if the spec was designed from the beginning, not evolved over time
- Avoid phrases like "now allows", "changed from", "previously was", "only X is allowed"
- Present features and constraints as inherent design decisions
- Documentation should be timeless - readable as a complete spec at any point

## Code Principles

**NO BACKWARDS COMPATIBILITY**:

- Do not write backwards compatibility code
- Do not maintain legacy interfaces or environment variables
- When refactoring, completely replace old implementations
- Remove all deprecated code paths
- The codebase should represent the current best design, not historical decisions

## Essential Commands

### Git Workflow Rules

**CRITICAL GIT SAFETY RULES**:

1. **NEVER use `git push --force` or `git push -f`** - Force pushing destroys history and can lose work permanently
2. **ALL git push commands require EXPLICIT user authorization** - Never push to remote without the user explicitly asking
3. **Use revert commits instead of force push** - To undo changes, create revert commits that preserve history
4. **If you need to overwrite remote**, explain the consequences and get explicit confirmation first

**IMPORTANT**: NEVER commit or push changes without explicit user instruction

- Only run `git add`, `git commit`, or `git push` when the user explicitly asks
- Common explicit instructions include: "commit", "push", "commit and push", "save to git"
- If unsure, ask the user if they want to commit the changes
- Always wait for user approval before making any git operations
- **DO NOT** automatically commit or push after making changes
- **DO NOT** commit/push even if you think the task is complete
- The user will explicitly tell you when they want to commit/push

**NEW BRANCH REQUIREMENT**: ALL changes must be made on a new feature branch, never directly on main. When the user asks you to commit and push:

1. **Always create a new branch** with a descriptive name (e.g., `organize-scripts`, `fix-auth-bug`, `add-feature-name`)
2. **Make commits on the feature branch**
3. **Push the feature branch to remote**
4. **Never commit or push directly to main**

When the user asks you to commit and push:

1. Run `./scripts/lint-all.sh` to ensure code passes linting
2. Follow the git commit guidelines in the main Claude system prompt
3. Get explicit user confirmation before any `git push`

**VERSION UPDATES**: Consider incrementing the patch version in package.json files when committing changes. This ensures proper version tracking for all changes.

## Key Technical Decisions

### Security: Never Use npx

**CRITICAL SECURITY REQUIREMENT**: NEVER use `npx` for any commands. This poses grave security risks by executing arbitrary code.

- **ALWAYS use exact dependency versions** in package.json
- **ALWAYS use local node_modules binaries** (e.g., `prettier`, `mocha`, `http-server`)
- **NEVER use `npx prettier`** - use `prettier` from local dependencies
- **NEVER use `npx mocha`** - use `mocha` from local dependencies  
- **NEVER use `npx http-server`** - add `http-server` as dependency and use directly

**Exception**: The only acceptable `npx` usage is for one-time project initialization (e.g., `npx create-react-app`) when explicitly setting up new projects, but NEVER for ongoing development commands.

### Build Commands

```bash
# Build entire project (from root)
./scripts/build.sh              # Standard build with formatting
./scripts/build.sh --install    # Force npm install in all packages
./scripts/build.sh --migrate    # Build + run DB migrations
./scripts/build.sh --seed       # Build + run DB seeds
./scripts/build.sh --no-format  # Skip prettier formatting (faster builds)

# Clean build artifacts
./scripts/clean.sh

# Start the application
./scripts/start.sh

# Lint entire project (from root)
./scripts/lint-all.sh           # Run ESLint on all packages
./scripts/lint-all.sh --fix     # Run ESLint with auto-fix

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

# Run all tests (integration + client)
npm test

# Search for specific tests across BOTH integration and client
npm run test:grep -- "pattern to match"

# Search only integration tests
npm run test:integration:grep -- "pattern to match"

# Search only client tests
npm run test:client:grep -- "pattern to match"

# Examples:
npm run test:grep -- "should create"          # Searches both integration and client
npm run test:grep -- "GraphQL"                # Searches both integration and client
npm run test:integration:grep -- "permission" # Only integration tests
npm run test:client:grep -- "fetch user"      # Only client tests
```

**IMPORTANT**: When running tests with mocha:

- Always use `npm run test:grep -- "pattern"` from the root directory for specific tests
- NEVER use `2>&1` redirection with mocha commands - it will cause errors
- Use plain `npm test` or `npx mocha` without stderr redirection
- If you need to capture output, use `| tee` or similar tools instead

## Critical Architecture Decisions

### 1. Monorepo Without Workspaces

- **NO npm workspaces** - Uses custom `./scripts/build.sh` script instead
- Dependencies between packages use `file:` protocol (e.g., `"@codespin/permiso-core": "file:../permiso-core"`)
- **IMPORTANT**: When adding new packages, you MUST update the `PACKAGES` array in `./scripts/build.sh`

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

### Query Optimization Guidelines

- **Prefer simple separate queries over complex joins** when it only saves 1-3 database calls
- **Use joins only to prevent N+1 query problems** (e.g., fetching data for many items in a loop)
- **Prioritize code simplicity and readability** over minor performance optimizations
- **Example**: Instead of a complex join to fetch related data, use 2-3 simple queries when clearer
- This approach makes the code easier to understand and maintain

### 4. ESM Modules

- All imports MUST include `.js` extension: `import { foo } from "./bar.js"`
- TypeScript configured for `"module": "NodeNext"`
- Type: `"module"` in all package.json files

## Package Structure

See [Architecture Documentation](docs/architecture.md) for package details. Key point: When adding new packages, you MUST update the `PACKAGES` array in `./scripts/build.sh`.

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

### SQL Helper Functions

Use `sql.insert()` and `sql.update()` from `@codespin/permiso-db` for safer, more consistent SQL generation:

```typescript
import { sql } from "@codespin/permiso-db";

// ✅ Good - Using sql.insert()
const params = {
  id: input.id,
  org_id: input.orgId,
  name: input.name,
};
await db.one(`${sql.insert("user", params)} RETURNING *`, params);

// ✅ Good - Using sql.update() with WHERE clause
const updateParams = { name: input.name };
const query = `
  ${sql.update("role", updateParams)}
  WHERE id = $(roleId) AND org_id = $(orgId)
  RETURNING *
`;
await db.one(query, { ...updateParams, roleId, orgId });
```

### Case Conversion Pattern

When working with database parameters, apply `toSnakeCase` judiciously:

```typescript
// ✅ Good - Use toSnakeCase for incoming camelCase objects
// When you have a GraphQL input or API request object
const snakeParams = stringUtils.toSnakeCase(input); // input has camelCase properties

// ✅ Good - Directly create snake_case when building from individual parameters
const params = {
  user_id: userId,
  org_id: orgId,
  created_at: new Date(),
};
await db.one(`${sql.insert("user", params)} RETURNING *`, params);

// ❌ Unnecessary - Don't use toSnakeCase when manually constructing
const params = stringUtils.toSnakeCase({
  userId: userId,
  orgId: orgId,
});
// Instead, write directly: { user_id: userId, org_id: orgId }
```

**Key guideline**: Use `toSnakeCase` when converting existing camelCase objects (like GraphQL inputs), but directly create snake_case objects when constructing from individual parameters. This is a pattern to apply based on context, not a rigid rule.

## Debugging Tips

1. **Permission issues**: Check RLS policies and user roles
2. **GraphQL errors**: Check resolver return types and error handling
3. **Database connection**: Verify DATABASE_URL and connection pooling
4. **Authentication issues**: Verify JWT tokens and session configuration
5. **Migration issues**: Check migration order and dependencies

## Key Documentation References

- **Project Overview**: See [README.md](../README.md)
- **Architecture**: See [docs/architecture.md](docs/architecture.md) for RLS implementation and system design
- **API Reference**: See [docs/api.md](docs/api.md) for GraphQL schema and examples
- **Database**: See [docs/database.md](docs/database.md) for database users and multi-database setup
- **Configuration**: See [docs/configuration.md](docs/configuration.md) for environment variables
- **Deployment**: See [docs/deployment.md](docs/deployment.md) for Docker and production deployment
- **Coding Standards**: See [CODING-STANDARDS.md](../CODING-STANDARDS.md) for development patterns

## Documentation Guidelines

### When Writing Documentation

1. **Be concise and technical** - Documentation is for engineers, avoid promotional language
2. **No superlatives** - Don't use words like "faster", "very secure", "powerful", etc.
3. **Focus on facts** - State what the system does, not how well it does it
4. **Use active voice** - "The system uses RLS" not "RLS is used by the system"
5. **Include code examples** - Show, don't just tell
6. **Keep README.md as single source of truth** - Most users only read README.md, ensure it covers essentials

## Testing Guidelines

### Test Output Strategy for Full Test Suites

**IMPORTANT**: When running the full test suite (which takes 3+ minutes), use `tee` to both display output to the user AND save to a file:

```bash
# Create .tests directory if it doesn't exist (gitignored)
mkdir -p .tests

# Run full test suite with tee - shows output to user AND saves to file
npm test | tee .tests/run-$(date +%s).txt

# Then you can analyze the saved output multiple times without re-running tests:
grep "failing" .tests/run-*.txt
tail -50 .tests/run-*.txt
grep -A10 "specific test name" .tests/run-*.txt
```

**NEVER use plain redirection (`>` or `2>&1`) as it hides output from the user.** Always use `tee` so the user can see test progress in real-time while you also get a saved copy for analysis.

This strategy prevents the need to re-run lengthy test suites when you need different information from the output. The `.tests/` directory is gitignored to keep test outputs from cluttering the repository.

## Analysis and Documentation

### Analysis Working Directory

**IMPORTANT**: When performing long-running analysis, research, or documentation tasks, use the `.analysis/` directory as your working space:

```bash
# Create .analysis directory if it doesn't exist (gitignored)
mkdir -p .analysis

# Use for analysis outputs, reports, and working files
cd .analysis

# Examples of analysis work:
# - Code complexity reports
# - API documentation generation
# - Dependency analysis
# - Performance profiling results
# - Architecture diagrams and documentation
# - Database schema analysis
# - Security audit reports
```

**Benefits of using `.analysis/` directory:**

- Keeps analysis artifacts separate from source code
- Allows iterative work without cluttering the repository
- Can save large analysis outputs without affecting git
- Provides a consistent location for all analysis work
- Enables saving intermediate results for complex multi-step analysis

**Common analysis patterns:**

```bash
# Save analysis results with timestamps
echo "Analysis results" > .analysis/api-analysis-$(date +%Y%m%d).md

# Create subdirectories for different analysis types
mkdir -p .analysis/performance
mkdir -p .analysis/security
mkdir -p .analysis/dependencies

# Use for generating documentation
npx typedoc --out .analysis/api-docs src/

# Save database schema analysis
pg_dump --schema-only permisodb > .analysis/schema-$(date +%Y%m%d).sql
```

The `.analysis/` directory is gitignored to prevent temporary analysis files from being committed to the repository.

### Testing Guidelines for Debugging and Fixes

**IMPORTANT**: When fixing bugs or debugging issues:

1. **Always run individual tests** when fixing specific issues
2. Use `npm run test:grep -- "test name"` to search both integration and client tests
3. Use `npm run test:integration:grep` or `test:client:grep` for specific test types
4. Test incrementally - run the specific failing test after each change
5. Run `npm test` for the full test suite (integration + client) after individual tests pass

This approach:

- Provides faster feedback loops
- Makes debugging easier
- Prevents breaking other tests while fixing one
- Saves time during development

### Optimizing Build Speed During Debugging

**TIP**: Use `./scripts/build.sh --no-format` during debugging sessions to skip prettier formatting. This:

- Reduces build time significantly
- Minimizes output that gets sent to the AI model (reducing token count)
- Makes the debugging cycle faster

Only use the standard `./scripts/build.sh` (with formatting) for final builds before committing.

### Important Build & Lint Workflow

**ALWAYS follow this sequence:**

1. Run `./scripts/lint-all.sh` first
2. Run `./scripts/build.sh`
3. **If build fails and you make changes**: You MUST run `./scripts/lint-all.sh` again before building
   - Your new changes haven"t been linted yet
   - Build errors often require code changes that may introduce lint issues
   - Always: lint → build → (if changes) → lint → build

See [README.md](../README.md#development) for testing commands and [deployment.md](docs/deployment.md#testing-docker-images) for Docker testing.

## Common Development Tasks

### Adding a New Package

1. Create directory in `/node/packages/`
2. Add package.json with `file:` dependencies
3. **CRITICAL**: Add to `PACKAGES` array in `./scripts/build.sh` (respect dependency order)
4. Create `src/` directory and `tsconfig.json`
5. Run `./scripts/build.sh --install`

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
