# Permiso Client Testing

This document describes the integration testing setup for the @codespin/permiso-client package.

## Overview

The client package includes comprehensive integration tests that:
- Start a real Permiso server instance
- Create a separate test database (`permiso_client_test`)
- Test all client API functions against the running server
- Clean up the database after each test

## Running Tests

```bash
# From the project root
npm run test:client

# From the client package directory
cd node/packages/permiso-client
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Structure

```
src/tests/
├── setup.ts                 # Global test setup and teardown
├── utils/
│   ├── server.ts           # Test server management
│   ├── test-db.ts          # Test database setup
│   └── test-helpers.ts     # Common test utilities
└── *.test.ts               # Test suites for each API module
```

## Test Coverage

The tests cover all API operations:

### Organizations (12 tests)
- Create, read, update, delete organizations
- List with pagination and sorting
- Property management (set, get, delete)
- Duplicate handling

### Users (11 tests)
- CRUD operations
- Role assignment/unassignment  
- Property management
- Filtering and search
- Identity provider lookups

### Roles (13 tests)
- CRUD operations
- Property management with hidden properties
- Filtering by properties
- Pagination and sorting

### Resources (13 tests)
- CRUD operations with path-like IDs
- Wildcard resource support
- Prefix-based filtering
- Hierarchical resource management

### Permissions (15 tests)
- User and role permission grants
- Permission checking with wildcards
- Effective permissions calculation
- Complex inheritance scenarios
- Revocation

## Test Database

- Uses a separate database: `permiso_client_test`
- Automatically created if it doesn't exist
- Migrations run before tests
- Database cleaned after each test
- Uses the same Knex configuration as the main app

## Test Server

- Runs on port 5003 (different from main server)
- Started automatically before tests
- Stopped after all tests complete
- Uses the test database configuration

## Known Issues

1. **User Update Test**: Currently skipped due to a server issue with updating the `data` field. This needs to be fixed in the server implementation.

2. **Duplicate Permission Grant**: The server handles duplicate permission grants as idempotent operations (returns success) rather than errors. The test has been updated to handle both cases.

## Environment Variables

The tests use the same environment variables as the main application:
- `PERMISO_DB_HOST` (default: localhost)
- `PERMISO_DB_PORT` (default: 5432)
- `PERMISO_DB_USER` (default: postgres)
- `PERMISO_DB_PASSWORD` (default: postgres)

## Adding New Tests

1. Create a new test file in `src/tests/`
2. Import the test setup: `import './setup.js'`
3. Use the test config: `const config = getTestConfig()`
4. Follow the existing test patterns for consistency
5. Add the import to `src/tests/index.test.ts`

## Debugging

- Server output is logged to console during tests
- Add `console.log()` statements in tests for debugging
- Use `.only` on describe/it blocks to run specific tests
- Check PostgreSQL logs if database issues occur