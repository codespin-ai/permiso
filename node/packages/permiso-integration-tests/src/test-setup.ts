import {
  TestDatabase,
  TestServer,
  testLogger,
} from "@codespin/permiso-test-utils";
import { GraphQLClient } from "./utils/graphql-client.js";

export let testDb: TestDatabase;
export let server: TestServer;
export let rootClient: GraphQLClient; // For organization management (ROOT operations)

export async function setupTests() {
  // Setup database
  testDb = TestDatabase.getInstance("permiso_test", testLogger);
  await testDb.setup();

  // Start server
  server = new TestServer({
    port: 5002,
    dbName: "permiso_test",
    logger: testLogger,
  });
  await server.start();

  // Initialize ROOT client for organization management
  // No org ID header = unrestricted database access for ROOT operations
  rootClient = new GraphQLClient("http://localhost:5002/graphql", {
    headers: {
      authorization: "Bearer test-token",
    },
    logger: testLogger,
  });

  testLogger.info("Test environment ready");
}

/**
 * Create a GraphQL client for a specific organization context
 * Use this for RLS operations within a specific organization
 */
export function createOrgClient(orgId: string): GraphQLClient {
  return new GraphQLClient("http://localhost:5002/graphql", {
    headers: {
      authorization: "Bearer test-token",
      "x-org-id": orgId,
    },
    logger: testLogger,
  });
}

export async function teardownTests() {
  try {
    // Stop GraphQL clients
    if (rootClient) {
      await rootClient.stop();
    }

    // Stop server
    if (server) {
      await server.stop();
    }

    // Wait for connections to close
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Teardown database
    if (testDb) {
      await testDb.teardown();
    }

    testLogger.info("Cleanup complete");
  } catch (error) {
    testLogger.error("Error during cleanup:", error);
    process.exit(1);
  }
}

// Global hooks for when running all tests
export function setupGlobalHooks() {
  before(async function () {
    this.timeout(60000);
    await setupTests();
  });

  after(async function () {
    this.timeout(30000);
    await teardownTests();
  });
}
