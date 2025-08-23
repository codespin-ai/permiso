# Coding Standards

This document outlines the coding standards and patterns used throughout the codebase. All contributors should follow these guidelines to maintain consistency and quality.

## Core Principles

### 1. Functional Programming First

**PREFER FUNCTIONS OVER CLASSES** - Export functions from modules when possible. Classes should only be used when they provide clear benefits.

```typescript
// ✅ Good - Pure function with explicit dependencies
export async function createCustomer(
  db: Database,
  input: CreateCustomerInput,
): Promise<Result<Customer, Error>> {
  // Implementation
}

// ✅ Acceptable - Class when it provides clear value
// Example: Stateful connection management
export class WebSocketConnection {
  private socket: WebSocket;
  private reconnectAttempts = 0;

  constructor(private config: WebSocketConfig) {
    this.socket = new WebSocket(config.url);
  }

  async send(message: Message): Promise<void> {
    if (this.socket.readyState !== WebSocket.OPEN) {
      await this.reconnect();
    }
    this.socket.send(JSON.stringify(message));
  }

  private async reconnect(): Promise<void> {
    // Reconnection logic with exponential backoff
  }
}

// ❌ Bad - Class used unnecessarily for stateless operations
export class CustomerService {
  constructor(private db: Database) {}

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    // This doesn"t need to be a class
  }
}
```

**When classes are appropriate:**

- Managing stateful connections (WebSocket, database pools)
- Third-party library requirements
- Complex state machines with internal state
- When inheritance genuinely simplifies the code
- Framework requirements (some frameworks require class components)

### 2. Explicit Error Handling with Result Types

Use `Result<T, E>` for all operations that can fail. Never throw exceptions for expected errors.

```typescript
// ✅ Good - Using Result type
export async function findOrder(
  db: Database,
  orderId: string
): Promise<Result<Order, Error>> {
  try {
    const order = await db.oneOrNone<OrderDbRow>(...);
    if (!order) {
      return failure(new Error("Order not found"));
    }
    return success(mapOrderFromDb(order));
  } catch (error) {
    return failure(error as Error);
  }
}

// ❌ Bad - Throwing exceptions
export async function findOrder(db: Database, orderId: string): Promise<Order> {
  const order = await db.one<OrderDbRow>(...); // Throws if not found
  return mapOrderFromDb(order);
}
```

### 3. Database Patterns

#### DbRow Types

All database interactions use `*DbRow` types that exactly mirror the database schema with snake_case:

```typescript
// Database type (snake_case) - Example: Customer entity
type CustomerDbRow = {
  id: string;
  org_id: string;
  email: string;
  created_at: Date;
  updated_at: Date | null;
  preferences: unknown; // JSONB fields typed as unknown
};

// Domain/API type (camelCase) - What your application uses
type Customer = {
  id: string;
  orgId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date | null;
  preferences: CustomerPreferences | undefined;
};
```

#### Mapper Functions

Always use mapper functions to convert between different representations. The target representation depends on your needs (REST API, GraphQL, domain models, etc.):

```typescript
// Example: Mapping from database to domain/REST representation
export function mapCustomerFromDb(row: CustomerDbRow): Customer {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preferences: row.preferences as CustomerPreferences | undefined,
  };
}

// Example: Mapping from domain to database representation
export function mapCustomerToDb(
  customer: Partial<Customer>,
): Partial<CustomerDbRow> {
  return {
    id: customer.id,
    org_id: customer.orgId,
    email: customer.email,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
    preferences: customer.preferences || null,
  };
}

// Example: Mapping to GraphQL type (if different from domain)
export function mapCustomerToGraphQL(customer: Customer): CustomerGraphQLType {
  return {
    id: customer.id,
    organizationId: customer.orgId, // GraphQL might use different naming
    emailAddress: customer.email,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt?.toISOString() || null,
    preferences: customer.preferences || defaultPreferences(),
  };
}
```

#### Type-safe Queries

Always specify the type parameter for database queries and use named parameters:

```typescript
// ✅ Good - Type parameter specified with named parameters
// Example: Finding a user by email
const row = await db.one<UserDbRow>(
  `SELECT * FROM "user" WHERE email = $(email)`,
  { email: userEmail },
);

// ❌ Bad - Using positional parameters
const row = await db.one<UserDbRow>(`SELECT * FROM "user" WHERE email = $1`, [
  userEmail,
]);

// ❌ Bad - No type parameter
const row = await db.one(`SELECT * FROM "user" WHERE email = $(email)`, {
  email: userEmail,
});
```

#### Named Parameters

ALWAYS use named parameters for database queries. This improves readability, prevents SQL injection, and makes queries self-documenting:

```typescript
// ✅ Good - Named parameters
// Example: Creating a product record
const product = await db.one<ProductDbRow>(
  `INSERT INTO product (id, name, price, category_id, description) 
   VALUES ($(id), $(name), $(price), $(categoryId), $(description)) 
   RETURNING *`,
  {
    id: input.id,
    name: input.name,
    price: input.price,
    categoryId: input.categoryId,
    description: input.description,
  },
);

// ❌ Bad - Positional parameters
const product = await db.one<ProductDbRow>(
  `INSERT INTO product (id, name, price, category_id, description) 
   VALUES ($1, $2, $3, $4, $5) 
   RETURNING *`,
  [input.id, input.name, input.price, input.categoryId, input.description],
);
```

#### SQL Helper Functions

Use the `sql.insert()` and `sql.update()` helper functions from `@codespin/permiso-db` to construct SQL statements safely and consistently:

```typescript
import { sql } from "@codespin/permiso-db";

// ✅ Good - Using sql.insert() helper
const params = {
  id: input.id,
  org_id: input.orgId,
  name: input.name,
  created_at: new Date(),
};
const user = await db.one<UserDbRow>(
  `${sql.insert("user", params)} RETURNING *`,
  params,
);

// ✅ Good - Using sql.update() helper for partial updates
const updateParams = {
  name: input.name,
  description: input.description,
};
const whereParams = {
  id: resourceId,
  org_id: orgId,
};
const query = `
  ${sql.update("resource", updateParams)}
  WHERE id = $(id) AND org_id = $(org_id)
  RETURNING *
`;
const resource = await db.one<ResourceDbRow>(query, {
  ...updateParams,
  ...whereParams,
});

// The helpers automatically:
// - Build column lists from object keys
// - Create parameter placeholders using named syntax
// - Ensure consistency across INSERT/UPDATE operations
```

#### Case Conversion in Database Operations

When working with database operations, use `toSnakeCase` judiciously:

```typescript
// ✅ Good - Use toSnakeCase when converting incoming camelCase objects
// Example: GraphQL input that needs conversion
const updateParams: Record<string, any> = {};
if (input.firstName !== undefined) {
  updateParams.firstName = input.firstName;
}
if (input.lastName !== undefined) {
  updateParams.lastName = input.lastName;
}
// Convert the camelCase object to snake_case for database
const snakeParams = stringUtils.toSnakeCase(updateParams);

// ✅ Good - Directly create snake_case objects when constructing from individual parameters
// No need for toSnakeCase here since we're manually building the object
const whereParams = {
  user_id: userId,
  org_id: orgId,
};

// ✅ Good - Direct snake_case construction for simple inserts
const params = {
  id: input.id,
  org_id: input.orgId,
  created_at: new Date(),
  status: "active",
};
await db.one(`${sql.insert("user", params)} RETURNING *`, params);

// ❌ Unnecessary - Avoid toSnakeCase when manually constructing objects
const params = stringUtils.toSnakeCase({
  userId: userId,
  orgId: orgId,
  status: "active",
});
// Instead, directly write: { user_id: userId, org_id: orgId, status: 'active' }
```

**Guidelines:**

- Use `toSnakeCase` when you have an existing camelCase object (e.g., from GraphQL input, API requests)
- Directly create snake_case objects when constructing from individual parameters
- This is a pattern to apply judiciously based on context, not a rigid rule
- Consider readability and maintainability when deciding which approach to use

#### Domain Structure Organization

All database-related functions are organized in domain directories. Example for a "user" domain:

```typescript
// Example structure: src/domain/user/
// types.ts - Only type definitions
export type UserDbRow = {
  id: string;
  email: string;
  role: string;
  // ... other fields
};

// mappers/map-user-from-db.ts - Single mapper function
export function mapUserFromDb(row: UserDbRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    // ... field conversions
  };
}

// create-user.ts - Single business function
export async function createUser(
  db: Database,
  user: CreateUserInput,
): Promise<User> {
  // Implementation using mapUserToDb and mapUserFromDb
}

// index.ts - Clean exports
export { createUser } from "./create-user.js";
export { getUser } from "./get-user.js";
export { mapUserFromDb } from "./mappers/map-user-from-db.js";
export type { UserDbRow } from "./types.js";
```

### 4. Module Structure

#### Imports

All imports MUST include the `.js` extension:

```typescript
// ✅ Good
import { createOrder } from "./orders.js";
import { validatePayment } from "./payments.js";
import { Result } from "@company/core";

// ❌ Bad
import { createOrder } from "./orders";
import { validatePayment } from "./payments";
```

#### Exports

Use named exports, avoid default exports:

```typescript
// ✅ Good
export function createInvoice() { ... }
export function updateInvoice() { ... }
export type Invoice = { ... };

// ❌ Bad
export default class InvoiceService { ... }
```

### 5. Naming Conventions

#### General Rules

- **Functions**: camelCase (`createOrder`, `findUserById`, `validatePayment`)
- **Types/Interfaces**: PascalCase (`Customer`, `CreateOrderInput`, `PaymentStatus`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`, `API_VERSION`)
- **Files**: kebab-case (`order-service.ts`, `create-payment.ts`, `user-validator.ts`)

#### Acronym Handling

- **Two-letter acronyms**: Keep uppercase when not at the beginning (`delayMS`, `apiID`, `xmlIO`)
- **Two-letter acronyms at beginning**: Lowercase (`dbConnection`, `ioStream`, `idGenerator`)
- **Three or more letter acronyms**: Use PascalCase (`HttpClient`, `JsonParser`, `XmlSerializer`)

Examples:

```typescript
// ✅ Good
const delayMS = 1000; // MS = milliseconds (2 letters)
const apiURL = "https://"; // URL = 3+ letters, so PascalCase
const dbConn = connect(); // db at beginning, so lowercase
const totalMS = 5000; // MS in middle, so uppercase
const xmlData = parse(); // xml at beginning, so lowercase
const getXMLData = () => {}; // XML in middle of function, 3 letters, so uppercase

// ❌ Bad
const delayMs = 1000; // Should be delayMS
const apiUrl = "https://"; // Should be apiURL
const DBConn = connect(); // Should be dbConn
const totalms = 5000; // Should be totalMS
```

#### Database Naming

- **Tables**: singular, snake_case (`customer`, `product_category`, `order_item`)
- **Columns**: snake_case (`customer_id`, `created_at`, `is_active`)
- **Indexes**: `idx_table_column` (`idx_order_status`, `idx_customer_email`)

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
// ✅ Good - Using type for data structures
type Product = {
  id: string;
  name: string;
  price: number;
};

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

// Use interface only for extensible contracts
interface PaymentProcessor {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  refundPayment(transactionId: string): Promise<RefundResult>;
}

// For extensible systems like plugins or providers
interface AuthProvider {
  authenticate(credentials: Credentials): Promise<AuthResult>;
  refresh(token: string): Promise<AuthResult>;
  logout(token: string): Promise<void>;
}
```

#### Avoid `any`

Never use `any`. Use `unknown` if the type is truly unknown:

```typescript
// ✅ Good - Handling webhook payloads
function processWebhookPayload(payload: unknown): ProcessedData {
  if (!isValidWebhookPayload(payload)) {
    throw new Error("Invalid webhook payload");
  }
  // Now payload is typed through the type guard
  return transformPayload(payload);
}

// ❌ Bad
function processWebhookPayload(payload: any): ProcessedData {
  return payload.data; // No type safety
}
```

#### Immutable Data Structures

```typescript
// ✅ Good - Readonly properties for cart state
export type ShoppingCart = {
  readonly id: string;
  readonly userId: string;
  readonly items: readonly CartItem[];
  readonly totals: Readonly<CartTotals>;
};

// ✅ Good - Functional updates
export function addItemToCart(
  cart: ShoppingCart,
  item: CartItem,
): ShoppingCart {
  return {
    ...cart,
    items: [...cart.items, item],
    totals: recalculateTotals([...cart.items, item]),
  };
}
```

#### Discriminated Unions

```typescript
// ✅ Good - Payment method types
export type PaymentMethod =
  | {
      readonly type: "credit_card";
      readonly cardNumber: string;
      readonly expiryDate: string;
      readonly cvv: string;
    }
  | {
      readonly type: "paypal";
      readonly email: string;
      readonly paypalId: string;
    }
  | {
      readonly type: "bank_transfer";
      readonly accountNumber: string;
      readonly routingNumber: string;
    };

// Order processing states
export type OrderState =
  | { readonly status: "draft"; readonly createdAt: Date }
  | {
      readonly status: "submitted";
      readonly createdAt: Date;
      readonly submittedAt: Date;
    }
  | {
      readonly status: "processing";
      readonly createdAt: Date;
      readonly submittedAt: Date;
      readonly processingStartedAt: Date;
    }
  | {
      readonly status: "completed";
      readonly createdAt: Date;
      readonly submittedAt: Date;
      readonly processingStartedAt: Date;
      readonly completedAt: Date;
      readonly trackingNumber: string;
    };
```

### 7. Async/Await Pattern

Always use async/await instead of promises with `.then()`:

```typescript
// ✅ Good - Example: Processing an order with inventory check
export async function processOrderWithInventory(
  db: Database,
  orderInput: CreateOrderInput,
  items: OrderItemInput[],
): Promise<Result<Order>> {
  const inventoryResult = await checkInventory(db, items);
  if (!inventoryResult.success) {
    return failure(new Error("Insufficient inventory"));
  }

  const orderResult = await createOrder(db, orderInput);
  if (!orderResult.success) {
    return orderResult;
  }

  for (const item of items) {
    const itemResult = await addOrderItem(db, orderResult.data.id, item);
    if (!itemResult.success) {
      // Rollback logic here
      return failure(itemResult.error);
    }
  }

  return orderResult;
}

// ❌ Bad - Promise chains
export function processOrderWithInventory(
  db: Database,
  orderInput: CreateOrderInput,
  items: OrderItemInput[],
): Promise<Result<Order>> {
  return checkInventory(db, items).then((inventoryResult) => {
    if (!inventoryResult.success) {
      return failure(new Error("Insufficient inventory"));
    }
    return createOrder(db, orderInput).then((orderResult) => {
      // Nested promise chains...
    });
  });
}
```

### 8. Documentation

#### JSDoc Comments

Add JSDoc comments for all exported functions and types:

```typescript
/**
 * Processes a payment for the given order.
 *
 * @param paymentGateway - Payment gateway connection
 * @param order - Order to process payment for
 * @param paymentMethod - Customer"s payment method
 * @returns Result containing the payment transaction or an error
 *
 * @example
 * const result = await processPayment(gateway, {
 *   orderId: "ord-123",
 *   amount: 99.99,
 *   currency: "USD"
 * }, {
 *   type: "credit_card",
 *   cardNumber: "4111111111111111",
 *   expiryDate: "12/25",
 *   cvv: "123"
 * });
 *
 * if (result.success) {
 *   console.log("Payment processed:", result.data.transactionId);
 * }
 */
export async function processPayment(
  paymentGateway: PaymentGateway,
  order: Order,
  paymentMethod: PaymentMethod,
): Promise<Result<PaymentTransaction, PaymentError>> {
  // Implementation
}
```

### 9. Testing

#### Test Structure

- Place tests in `__tests__` directories
- Name test files with `.test.ts` suffix
- Use descriptive test names

```typescript
// Example: Testing user registration
describe("registerUser", () => {
  it("should create a new user with valid email", async () => {
    // Arrange
    const input = {
      email: "test@example.com",
      password: "securePassword123",
      name: "Test User",
    };

    // Act
    const result = await registerUser(db, input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe(input.email);
      expect(result.data.name).toBe(input.name);
    }
  });

  it("should return error when email already exists", async () => {
    // Arrange - create existing user
    await createUser(db, { email: "existing@example.com" });

    // Act
    const result = await registerUser(db, {
      email: "existing@example.com",
      password: "password123",
      name: "Another User",
    });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("already exists");
    }
  });
});
```

### 10. Error Handling Patterns

#### Result Type Implementation

```typescript
export type Result<T, E = Error> =
  | {
      readonly success: true;
      readonly data: T;
    }
  | {
      readonly success: false;
      readonly error: E;
    };

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

#### Validation Functions

```typescript
// ✅ Good - Email validation with type guard
export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Example: Validating order input
export function validateCreateOrderInput(
  input: unknown,
): Result<CreateOrderInput, ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!isObject(input)) {
    return {
      success: false,
      error: [{ field: "root", message: "Input must be an object" }],
    };
  }

  if (!isValidCustomerId(input.customerId)) {
    errors.push({ field: "customerId", message: "Invalid customer ID format" });
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push({
      field: "items",
      message: "Order must contain at least one item",
    });
  }

  if (typeof input.shippingAddress !== "object") {
    errors.push({
      field: "shippingAddress",
      message: "Shipping address is required",
    });
  }

  if (errors.length > 0) {
    return { success: false, error: errors };
  }

  return {
    success: true,
    data: input as CreateOrderInput,
  };
}
```

### 11. Dependency Injection Patterns

```typescript
// ✅ Good - Payment service configuration
export type PaymentServiceConfig = {
  readonly apiKey: string;
  readonly webhookSecret: string;
  readonly environment: "sandbox" | "production";
  readonly timeout: number;
};

export async function initializePaymentService(
  config: PaymentServiceConfig,
): Promise<PaymentService> {
  // Implementation
}

// ✅ Good - Order processing with injected dependencies
export async function processCustomerOrder(
  order: Order,
  dependencies: {
    inventoryService: (sku: string) => Promise<InventoryStatus>;
    paymentGateway: (payment: PaymentRequest) => Promise<PaymentResult>;
    shippingProvider: (shipment: ShipmentRequest) => Promise<ShipmentResult>;
    notificationService: (message: NotificationMessage) => Promise<void>;
  },
): Promise<OrderProcessingResult> {
  // Check inventory
  for (const item of order.items) {
    const inventory = await dependencies.inventoryService(item.sku);
    if (inventory.available < item.quantity) {
      return { success: false, error: "Insufficient inventory" };
    }
  }

  // Process payment
  const paymentResult = await dependencies.paymentGateway({
    amount: order.total,
    currency: order.currency,
    orderId: order.id,
  });

  // Continue with other steps...
}
```

### 12. Stream Processing

```typescript
// ✅ Good - Streaming large datasets
export async function* streamOrderHistory(
  customerId: string,
  dateRange: DateRange,
  db: Database,
): AsyncIterable<Order> {
  const query = db.stream<OrderDbRow>(
    `SELECT * FROM "order" 
     WHERE customer_id = $(customerId) 
     AND created_at BETWEEN $(startDate) AND $(endDate)
     ORDER BY created_at DESC`,
    {
      customerId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    },
  );

  for await (const row of query) {
    yield mapOrderFromDb(row);
  }
}

// Usage example
import { createLogger } from "@company/logger";
const logger = createLogger("OrderExport");

for await (const order of streamOrderHistory(customerId, dateRange, db)) {
  logger.debug("Processing order:", { orderId: order.id });
  await exportOrder(order);
}
```

### 13. Platform-Specific Patterns

#### Type-safe Tool Implementation

```typescript
// Example: E-commerce platform tools
export type ToolHandler<TInput, TOutput> = (
  input: TInput,
  context: ToolContext,
) => Promise<Result<TOutput, ToolError>>;

export type EcommercePlatformTools = {
  inventory_check: ToolHandler<InventoryCheckInput, InventoryStatus>;
  price_calculate: ToolHandler<PriceCalculationInput, PriceBreakdown>;
  shipping_estimate: ToolHandler<ShippingEstimateInput, ShippingOptions>;
};

// Type-safe handler implementation
export function createPlatformToolHandlers(
  dependencies: PlatformDependencies,
): EcommercePlatformTools {
  return {
    inventory_check: async (input, context) => {
      const status = await dependencies.inventory.checkAvailability({
        sku: input.sku,
        warehouse: input.warehouse,
        quantity: input.requestedQuantity,
      });
      return { success: true, data: status };
    },

    price_calculate: async (input, context) => {
      const breakdown = await dependencies.pricing.calculate({
        items: input.items,
        discountCodes: input.discountCodes,
        taxRegion: input.taxRegion,
      });
      return { success: true, data: breakdown };
    },

    shipping_estimate: async (input, context) => {
      const options = await dependencies.shipping.getOptions({
        origin: input.origin,
        destination: input.destination,
        weight: input.weight,
        dimensions: input.dimensions,
      });
      return { success: true, data: options };
    },
  };
}
```

### 14. Performance Considerations

#### Database Queries

- ALWAYS use named parameters (e.g., `$(paramName)`) instead of positional parameters (e.g., `$1`)
- Use parameterized queries to prevent SQL injection
- Add appropriate indexes for frequently queried columns
- Use transactions for operations that modify multiple tables
- Avoid N+1 queries by using joins or batch operations

Example of batch operation:

```typescript
// ✅ Good - Batch fetch product details
export async function getProductsWithCategories(
  productIds: string[],
  db: Database,
): Promise<ProductWithCategory[]> {
  const products = await db.manyOrNone<ProductWithCategoryDbRow>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM product p
     JOIN category c ON p.category_id = c.id
     WHERE p.id = ANY($(productIds))`,
    { productIds },
  );

  return products.map(mapProductWithCategoryFromDb);
}

// ❌ Bad - N+1 query pattern
export async function getProductsWithCategories(
  productIds: string[],
  db: Database,
): Promise<ProductWithCategory[]> {
  const products = [];
  for (const id of productIds) {
    const product = await getProduct(db, id);
    const category = await getCategory(db, product.categoryId);
    products.push({ ...product, category });
  }
  return products;
}
```

#### Memory Management

- Stream large result sets instead of loading all data into memory
- Use pagination for list operations
- Clean up resources (close database connections, etc.)

### 15. Module Organization

#### Clear Module Exports

```typescript
// src/services/inventory-manager.ts

// Types first
export type InventoryCheck = {
  readonly sku: string;
  readonly available: number;
  readonly reserved: number;
  readonly incoming: number;
};

export type ReservationOptions = {
  readonly duration: number;
  readonly allowBackorder: boolean;
};

// Main functions
export async function checkInventory(
  sku: string,
  warehouse: string,
  options: ReservationOptions = { duration: 3600, allowBackorder: false },
): Promise<Result<InventoryCheck, InventoryError>> {
  // Implementation
}

export async function reserveInventory(
  items: ReservationItem[],
  orderId: string,
): Promise<Result<ReservationConfirmation, ReservationError>> {
  // Implementation
}

// Helper functions (can be internal)
function calculateAvailableQuantity(
  physical: number,
  reserved: number,
): number {
  // Implementation
}
```

#### Direct Imports vs Index Files

**Direct imports are perfectly fine and often preferred:**

```typescript
// ✅ Good - Direct import
import { checkInventory } from "@/services/inventory-manager.js";
import { processPayment } from "@/services/payment-processor.js";
import { validateAddress } from "@/utils/address-validator.js";
```

**Use index files only when they add value:**

```typescript
// ✅ Good - Index file for public API of a complex module
// src/auth/index.ts - Exposing only the public interface
export { authenticate, logout } from "./authentication.js";
export { authorize } from "./authorization.js";
export type { AuthToken, Permission } from "./types.js";
// Not exporting internal utilities and helpers

// ✅ Good - Index file for grouping related constants
// src/constants/index.ts
export * from "./error-codes.js";
export * from "./api-endpoints.js";
export * from "./validation-rules.js";
```

**Avoid index files that just re-export everything:**

```typescript
// ❌ Bad - Unnecessary index file that just re-exports
// src/services/index.ts
export * from "./inventory-manager.js";
export * from "./payment-processor.js";
export * from "./shipping-calculator.js";
// This adds no value and creates maintenance overhead
```

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] All functions use Result types for error handling
- [ ] Classes are only used when they provide clear benefits
- [ ] All imports include `.js` extension
- [ ] Database queries use typed parameters with named parameters
- [ ] JSDoc comments are present for public APIs
- [ ] Tests are included for new functionality
- [ ] No `any` types are used
- [ ] Code follows the naming conventions including acronym rules
- [ ] No console.log statements (use logger instead)
- [ ] All database code uses the DbRow pattern
- [ ] Mappers are used for all database-domain conversions
- [ ] Functions have explicit return types
- [ ] Dependencies are injected explicitly
- [ ] Immutable data structures are used where appropriate
