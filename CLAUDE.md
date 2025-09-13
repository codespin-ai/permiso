# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Permiso codebase.

## Critical Guidelines

### NEVER ACT WITHOUT EXPLICIT USER APPROVAL

**YOU MUST ALWAYS ASK FOR PERMISSION BEFORE:**
- Making architectural decisions or changes
- Implementing new features or functionality
- Modifying APIs, interfaces, or data structures
- Changing expected behavior or test expectations
- Adding new dependencies or patterns

**ONLY make changes AFTER the user explicitly approves.** When you identify issues or potential improvements, explain them clearly and wait for the user's decision. Do NOT assume what the user wants or make "helpful" changes without permission.

### FINISH DISCUSSIONS BEFORE WRITING CODE

**IMPORTANT**: When the user asks a question or you're in the middle of a discussion, DO NOT jump to writing code. Always:
1. **Complete the discussion first** - Understand the problem fully
2. **Analyze and explain** - Work through the issue verbally
3. **Get confirmation** - Ensure the user agrees with the approach
4. **Only then write code** - After the user explicitly asks you to implement

### NEVER USE MULTIEDIT

**NEVER use the MultiEdit tool.** It has caused issues in multiple projects. Always use individual Edit operations instead, even if it means more edits. This ensures better control and prevents unintended changes.

## Session Startup & Task Management

### First Steps When Starting a Session

When you begin working on this project, you MUST:
1. **Read this entire CLAUDE.md file** to understand the project structure and conventions
2. **Check for ongoing tasks in `.todos/` directory** - Look for any in-progress task files
3. **Read the key documentation files** in this order:
   - `/README.md` - Project overview and quick start
   - `/CODING-STANDARDS.md` - Mandatory coding patterns and conventions
   - `/docs/architecture.md` - System architecture details
   - Any other relevant docs based on the task at hand

Only after reading these documents should you proceed with any implementation or analysis tasks.

**IMPORTANT**: After every conversation compact/summary, you MUST re-read this CLAUDE.md file again as your first action.

### Task Management with .todos Directory

**For major multi-step tasks that span sessions:**

1. **Before starting**, create a detailed task file in `.todos/` directory:
   - Filename format: `YYYY-MM-DD-task-name.md` (e.g., `2025-01-13-auth-implementation.md`)
   - Include ALL context, decisions, completed work, and remaining work
   - Write comprehensively so the task can be resumed in any future session

2. **Task file must include**:
   - Task overview and objectives
   - Current status (what's been completed)
   - Detailed list of remaining work
   - Important decisions made
   - Code locations affected
   - Testing requirements
   - Any gotchas or special considerations

3. **When resuming work**, always check `.todos/` first for in-progress tasks
4. **Update the task file** as you make progress
5. **Mark as complete** by renaming to `YYYY-MM-DD-task-name-COMPLETED.md`

The `.todos/` directory is gitignored for persistent task tracking across sessions.

## Project Overview & Principles

This guide helps AI assistants work effectively with the Permiso codebase. For project overview, see [README.md](../README.md).

### Greenfield Development Context

**IMPORTANT**: Permiso is a greenfield project with no legacy constraints:
- **No backward compatibility concerns** - No existing deployments or users to migrate
- **No legacy code patterns** - All code should follow current best practices without compromise
- **No migration paths needed** - Database schemas, APIs, and data structures can be designed optimally
- **Write code as if starting fresh** - Every implementation should be clean and modern
- **No change tracking in comments** - Avoid "changed from X to Y" since there is no "previous" state
- **No deprecation warnings** - Nothing is deprecated because nothing is legacy

This means: Focus on clean, optimal implementations without worrying about existing systems. Design for the ideal case, not for compatibility.

### Documentation & Code Principles

**Documentation Guidelines:**
- Write as if the spec was designed from the beginning, not evolved over time
- Avoid phrases like "now allows", "changed from", "previously was"
- Present features and constraints as inherent design decisions
- Be concise and technical - avoid promotional language, superlatives
- Use active voice and include code examples
- Keep README.md as single source of truth

**Code Principles:**
- **NO BACKWARDS COMPATIBILITY** - Do not write backwards compatibility code
- **NO CLASSES** - Export functions from modules only, use explicit dependency injection
- **NO DYNAMIC IMPORTS** - Always use static imports, never `await import()` or `import()`
- Use pure functions with Result types for error handling instead of exceptions
- Prefer `type` over `interface` (use `interface` only for extensible contracts)

## Essential Commands & Workflow

### Build & Development Commands

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

# Format code with Prettier (MUST run before committing)
./scripts/format-all.sh         # Format all files
./scripts/format-all.sh --check # Check formatting without changing files

# Docker commands
./scripts/docker-build.sh       # Build Docker image
./scripts/docker-test.sh        # Test Docker image
./scripts/docker-push.sh latest ghcr.io/codespin-ai  # Push to registry
```

### Database Commands

**IMPORTANT**: NEVER run database migrations or seeds unless explicitly instructed by the user

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

### Testing Commands

```bash
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

**IMPORTANT**: When running tests with mocha, always use `npm run test:grep -- "pattern"` from the root directory for specific tests. NEVER use `2>&1` redirection with mocha commands. Use `| tee` for output capture.

### Git Workflow

**CRITICAL GIT SAFETY RULES**:
1. **NEVER use `git push --force` or `git push -f`** - Force pushing destroys history
2. **ALL git push commands require EXPLICIT user authorization**
3. **Use revert commits instead of force push** - To undo changes, create revert commits
4. **If you need to overwrite remote**, explain consequences and get explicit confirmation

**IMPORTANT**: NEVER commit or push changes without explicit user instruction
- Only run `git add`, `git commit`, or `git push` when the user explicitly asks
- Common explicit instructions include: "commit", "push", "commit and push", "save to git"
- Always wait for user approval before making any git operations

**NEW BRANCH REQUIREMENT**: ALL changes must be made on a new feature branch, never directly on main.

When the user asks you to commit and push:
1. Run `./scripts/format-all.sh` to format all files with Prettier
2. Run `./scripts/lint-all.sh` to ensure code passes linting
3. Follow the git commit guidelines in the main Claude system prompt
4. Get explicit user confirmation before any `git push`

**VERSION UPDATES**: Whenever committing changes, you MUST increment the patch version in package.json files.

## Technical Architecture

### Security: Never Use npx

**CRITICAL SECURITY REQUIREMENT**: NEVER use `npx` for any commands. This poses grave security risks by executing arbitrary code.
- **ALWAYS use exact dependency versions** in package.json
- **ALWAYS use local node_modules binaries** (e.g., `prettier`, `mocha`, `http-server`)
- **NEVER use `npx prettier`** - use `prettier` from local dependencies
- **NEVER use `npx mocha`** - use `mocha` from local dependencies

**Exception**: Only acceptable `npx` usage is for one-time project initialization when explicitly setting up new projects.

### Monorepo Architecture

- **NO npm workspaces** - Uses custom `./scripts/build.sh` script instead
- Dependencies between packages use `file:` protocol (e.g., `"@codespin/permiso-core": "file:../permiso-core"`)
- **IMPORTANT**: When adding new packages, you MUST update the `PACKAGES` array in `./scripts/build.sh`

### Database Conventions

- **PostgreSQL** with **Knex.js** for migrations, **pg-promise** for data access (NO ORMs)
- Table names: **singular** and **snake_case** (e.g., `organization`, `user_role`)
- TypeScript: **camelCase** for all variables/properties
- SQL: **snake_case** for all table/column names
- **DbRow Pattern**: All persistence functions use `XxxDbRow` types that mirror exact database schema
- **Mapper Functions**: `mapXxxFromDb()` and `mapXxxToDb()` handle conversions between snake_case DB and camelCase domain types
- **Type-safe Queries**: All queries use `db.one<XxxDbRow>()` with explicit type parameters

**Query Optimization Guidelines**:
- **Prefer simple separate queries over complex joins** when it only saves 1-3 database calls
- **Use joins only to prevent N+1 query problems** (e.g., fetching data for many items in a loop)
- **Prioritize code simplicity and readability** over minor performance optimizations

### ESM Modules

- All imports MUST include `.js` extension: `import { foo } from "./bar.js"`
- TypeScript configured for `"module": "NodeNext"`
- Type: `"module"` in all package.json files
- **NO DYNAMIC IMPORTS**: Always use static imports. Never use `await import()` or `import()` in the code

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

### Function Export & Result Type Patterns

```typescript
// ✅ Good - Pure function with explicit dependencies
export async function createUser(
  db: Database,
  input: CreateUserInput,
): Promise<Result<User, Error>> {
  // Implementation
}

// ✅ Good - Result type usage
import { createLogger } from "@codespin/permiso-logger";

export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

const logger = createLogger("UserValidator");
const result = await validateUser(user);
if (!result.success) {
  logger.error("Validation failed:", result.error);
  return;
}
const validUser = result.data; // Type-safe
```

### Import & Database Query Patterns

```typescript
// ✅ Good - Always include .js extension
import { createUser } from "./users.js";
import { Result } from "@codespin/permiso-core";

// ✅ Good - Named parameters
await db.none(
  `INSERT INTO organization_property (org_id, name, value, hidden)
   VALUES ($(orgId), $(name), $(value), $(hidden))`,
  { orgId: input.id, name: p.name, value: p.value, hidden: p.hidden ?? false },
);
```

### SQL Helper Functions

Use `sql.insert()` and `sql.update()` from `@codespin/permiso-db`:

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

**Key guideline**: Use `toSnakeCase` when converting existing camelCase objects (like GraphQL inputs), but directly create snake_case objects when constructing from individual parameters.

```typescript
// ✅ Good - Use toSnakeCase for incoming camelCase objects
const snakeParams = stringUtils.toSnakeCase(input); // input has camelCase properties

// ✅ Good - Directly create snake_case when building from individual parameters
const params = {
  user_id: userId,
  org_id: orgId,
  created_at: new Date(),
};
await db.one(`${sql.insert("user", params)} RETURNING *`, params);
```

## Testing & Development Optimization

### Test Output Strategy

**For full test suites (3+ minutes)**, use `tee` to display output AND save to file:

```bash
# Create .tests directory if it doesn't exist (gitignored)
mkdir -p .tests

# Run full test suite with tee - shows output to user AND saves to file
npm test | tee .tests/run-$(date +%s).txt

# Then analyze saved output without re-running tests:
grep "failing" .tests/run-*.txt
tail -50 .tests/run-*.txt
grep -A10 "specific test name" .tests/run-*.txt
```

**NEVER use plain redirection (`>` or `2>&1`)** - use `tee` for real-time output visibility.

### Analysis Working Directory

**For long-running analysis, research, or documentation tasks**, use `.analysis/` directory:

```bash
# Create .analysis directory if it doesn't exist (gitignored)
mkdir -p .analysis

# Examples of analysis work:
# - Code complexity reports
# - API documentation generation
# - Dependency analysis
# - Performance profiling results
# - Architecture diagrams and documentation
# - Database schema analysis
# - Security audit reports
```

Benefits: Keeps analysis artifacts separate from source code, allows iterative work without cluttering repository.

### Build & Lint Workflow

**ALWAYS follow this sequence:**
1. Run `./scripts/lint-all.sh` first
2. Run `./scripts/build.sh`
3. **If build fails and you make changes**: You MUST run `./scripts/lint-all.sh` again before building

**TIP**: Use `./scripts/build.sh --no-format` during debugging sessions to skip prettier formatting for faster builds.

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

## Documentation References

- **Project Overview**: [README.md](../README.md)
- **Architecture**: [docs/architecture.md](docs/architecture.md) for RLS implementation and system design
- **API Reference**: [docs/api.md](docs/api.md) for GraphQL schema and examples
- **Database**: [docs/database.md](docs/database.md) for database users and multi-database setup
- **Configuration**: [docs/configuration.md](docs/configuration.md) for environment variables
- **Deployment**: [docs/deployment.md](docs/deployment.md) for Docker and production deployment
- **Coding Standards**: [CODING-STANDARDS.md](../CODING-STANDARDS.md) for development patterns

## Debugging Tips

1. **Permission issues**: Check RLS policies and user roles
2. **GraphQL errors**: Check resolver return types and error handling
3. **Database connection**: Verify DATABASE_URL and connection pooling
4. **Authentication issues**: Verify JWT tokens and session configuration
5. **Migration issues**: Check migration order and dependencies