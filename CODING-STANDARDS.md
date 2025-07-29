# Permiso Coding Standards

This document outlines the coding standards and patterns used throughout the Permiso codebase. All contributors should follow these guidelines to maintain consistency and quality.

## Core Principles

### 1. Functional Programming Only

**NO CLASSES** - Export functions from modules only.

```typescript
// ✅ Good - Pure function with explicit dependencies
export async function createUser(
  db: Database,
  input: CreateUserInput
): Promise<Result<User, Error>> {
  // Implementation
}

// ❌ Bad - Class-based approach
export class UserService {
  constructor(private db: Database) {}
  
  async createUser(input: CreateUserInput): Promise<User> {
    // Implementation
  }
}
```

### 2. Explicit Error Handling with Result Types

Use `Result<T, E>` for all operations that can fail. Never throw exceptions for expected errors.

```typescript
// ✅ Good - Using Result type
export async function findUser(
  db: Database,
  userId: string
): Promise<Result<User, Error>> {
  try {
    const user = await db.oneOrNone<UserDbRow>(...);
    if (!user) {
      return failure(new Error('User not found'));
    }
    return success(mapUserFromDb(user));
  } catch (error) {
    return failure(error as Error);
  }
}

// ❌ Bad - Throwing exceptions
export async function findUser(db: Database, userId: string): Promise<User> {
  const user = await db.one<UserDbRow>(...); // Throws if not found
  return mapUserFromDb(user);
}
```

### 3. Database Patterns

#### DbRow Types
All database interactions use `*DbRow` types that exactly mirror the database schema with snake_case:

```typescript
// Database type (snake_case)
type UserDbRow = {
  id: string;
  org_id: string;
  created_at: Date;
  is_active: boolean;
};

// Domain type (camelCase)
type User = {
  id: string;
  orgId: string;
  createdAt: Date;
  isActive: boolean;
};
```

#### Mapper Functions
Always use mapper functions to convert between database and domain representations:

```typescript
export function mapUserFromDb(row: UserDbRow): User {
  return {
    id: row.id,
    orgId: row.org_id,
    createdAt: row.created_at,
    isActive: row.is_active
  };
}

export function mapUserToDb(user: Partial<User>): Partial<UserDbRow> {
  return {
    id: user.id,
    org_id: user.orgId,
    created_at: user.createdAt,
    is_active: user.isActive
  };
}
```

#### Type-safe Queries
Always specify the type parameter for database queries:

```typescript
// ✅ Good - Type parameter specified
const row = await db.one<UserDbRow>(
  `SELECT * FROM "user" WHERE id = $1`,
  [userId]
);

// ❌ Bad - No type parameter
const row = await db.one(
  `SELECT * FROM "user" WHERE id = $1`,
  [userId]
);
```

### 4. Module Structure

#### Imports
All imports MUST include the `.js` extension:

```typescript
// ✅ Good
import { createUser } from './users.js';
import { Result } from '@codespin/permiso-core';

// ❌ Bad
import { createUser } from './users';
```

#### Exports
Use named exports, avoid default exports:

```typescript
// ✅ Good
export function createUser() { ... }
export function updateUser() { ... }
export type User = { ... };

// ❌ Bad
export default class UserService { ... }
```

### 5. Naming Conventions

#### General Rules
- **Functions**: camelCase (`createUser`, `findUserById`)
- **Types/Interfaces**: PascalCase (`User`, `CreateUserInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`user-service.ts`, `create-user.ts`)

#### Database Naming
- **Tables**: singular, snake_case (`user`, `role_permission`)
- **Columns**: snake_case (`user_id`, `created_at`)
- **Indexes**: `idx_table_column` (`idx_user_email`)

### 6. TypeScript Guidelines

#### Strict Mode
Always use TypeScript strict mode. The following compiler options must be enabled:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

#### Type vs Interface
Prefer `type` over `interface` unless you need interface-specific features:

```typescript
// ✅ Good - Using type
type User = {
  id: string;
  name: string;
};

// Use interface only for extensible contracts
interface Logger {
  log(message: string): void;
  error(message: string, error: Error): void;
}
```

#### Avoid `any`
Never use `any`. Use `unknown` if the type is truly unknown:

```typescript
// ✅ Good
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

// ❌ Bad
function processValue(value: any): string {
  return value;
}
```

### 7. Async/Await Pattern

Always use async/await instead of promises with `.then()`:

```typescript
// ✅ Good
export async function createUserWithRole(
  db: Database,
  userInput: CreateUserInput,
  roleId: string
): Promise<Result<User>> {
  const userResult = await createUser(db, userInput);
  if (!userResult.success) {
    return userResult;
  }
  
  const roleResult = await assignUserRole(db, userResult.data.id, roleId);
  if (!roleResult.success) {
    return failure(roleResult.error);
  }
  
  return userResult;
}

// ❌ Bad
export function createUserWithRole(
  db: Database,
  userInput: CreateUserInput,
  roleId: string
): Promise<Result<User>> {
  return createUser(db, userInput).then(userResult => {
    if (!userResult.success) {
      return userResult;
    }
    return assignUserRole(db, userResult.data.id, roleId).then(roleResult => {
      if (!roleResult.success) {
        return failure(roleResult.error);
      }
      return userResult;
    });
  });
}
```

### 8. Documentation

#### JSDoc Comments
Add JSDoc comments for all exported functions and types:

```typescript
/**
 * Creates a new user in the specified organization.
 * 
 * @param db - Database connection
 * @param input - User creation parameters
 * @returns Result containing the created user or an error
 * 
 * @example
 * const result = await createUser(db, {
 *   id: 'john-doe',
 *   orgId: 'acme-corp',
 *   identityProvider: 'google',
 *   identityProviderUserId: 'john@example.com'
 * });
 */
export async function createUser(
  db: Database,
  input: CreateUserInput
): Promise<Result<User, Error>> {
  // Implementation
}
```

### 9. Testing

#### Test Structure
- Place tests in `__tests__` directories
- Name test files with `.test.ts` suffix
- Use descriptive test names

```typescript
describe('createUser', () => {
  it('should create a user with valid input', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await createUser(db, input);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ ... });
  });
  
  it('should return error when organization does not exist', async () => {
    // Test implementation
  });
});
```

### 10. Performance Considerations

#### Database Queries
- Use parameterized queries to prevent SQL injection
- Add appropriate indexes for frequently queried columns
- Use transactions for operations that modify multiple tables
- Avoid N+1 queries by using joins or batch operations

#### Memory Management
- Stream large result sets instead of loading all data into memory
- Use pagination for list operations
- Clean up resources (close database connections, etc.)

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] All functions use Result types for error handling
- [ ] No classes are used
- [ ] All imports include `.js` extension
- [ ] Database queries use typed parameters
- [ ] JSDoc comments are present for public APIs
- [ ] Tests are included for new functionality
- [ ] No `any` types are used
- [ ] Code follows the naming conventions
- [ ] No console.log statements (use logger instead)