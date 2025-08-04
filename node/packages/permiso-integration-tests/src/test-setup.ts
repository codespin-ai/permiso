import { TestDatabase } from './utils/test-db.js';
import { TestServer } from './utils/server.js';
import { GraphQLClient } from './utils/graphql-client.js';

export let testDb: TestDatabase;
export let server: TestServer;
export let client: GraphQLClient;

export async function setupTests() {
  // Setup database
  testDb = TestDatabase.getInstance();
  await testDb.setup();
  
  // Start server
  server = new TestServer(5002);
  await server.start();
  
  // Initialize GraphQL client
  client = new GraphQLClient('http://localhost:5002/graphql');
  
  console.log('Test environment ready');
}

export async function teardownTests() {
  try {
    // Stop GraphQL client first
    if (client) {
      await client.stop();
    }
    
    // Stop server
    if (server) {
      await server.stop();
    }
    
    // Wait for connections to close
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teardown database
    if (testDb) {
      await testDb.teardown();
    }
    
    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Global hooks for when running all tests
export function setupGlobalHooks() {
  before(async function() {
    this.timeout(60000);
    await setupTests();
  });

  after(async function() {
    this.timeout(30000);
    await teardownTests();
  });
}