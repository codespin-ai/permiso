import { setupGlobalHooks } from "./test-setup.js";

// Import all test files
import "./tests/organizations.test.js";
import "./tests/users.test.js";
import "./tests/roles.test.js";
import "./tests/resources.test.js";
import "./tests/permissions.test.js";
import "./tests/api-key-auth.test.js";
import "./tests/properties-complex.test.js";
import "./tests/batch-queries.test.js";
import "./tests/pagination-filtering.test.js";
import "./tests/property-operations.test.js";
import "./tests/edge-cases.test.js";
import "./tests/field-resolvers.test.js";

// Re-export for backward compatibility
export { testDb, server, client } from "./test-setup.js";

// Setup global hooks for full test suite
setupGlobalHooks();
