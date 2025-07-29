import { TestDatabase } from './utils/test-db.js';
import { TestServer } from './utils/server.js';
import { GraphQLClient } from './utils/graphql-client.js';

export let testDb: TestDatabase;
export let server: TestServer;
export let client: GraphQLClient;

export async function mochaGlobalSetup() {
  console.log('🚀 Starting test environment...');
  
  // Setup database
  testDb = TestDatabase.getInstance();
  await testDb.setup();
  
  // Start server
  server = new TestServer(5002);
  await server.start();
  
  // Initialize GraphQL client
  client = new GraphQLClient('http://localhost:5002/graphql');
  
  console.log('✅ Test environment ready');
}

export async function mochaGlobalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Stop server
  if (server) {
    await server.stop();
  }
  
  // Teardown database
  if (testDb) {
    await testDb.teardown();
  }
  
  console.log('✅ Cleanup complete');
}