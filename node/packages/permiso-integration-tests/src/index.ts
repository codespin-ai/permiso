import { TestDatabase } from './utils/test-db.js';
import { TestServer } from './utils/server.js';
import { GraphQLClient } from './utils/graphql-client.js';

// Import all test files
import './tests/organizations.test.js';
import './tests/users.test.js';
import './tests/roles.test.js';
import './tests/resources.test.js';
import './tests/permissions.test.js';

export let testDb: TestDatabase;
export let server: TestServer;
export let client: GraphQLClient;

before(async function() {
  this.timeout(60000);
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
});

after(async function() {
  this.timeout(30000);
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Stop server first
    if (server) {
      await server.stop();
    }
    
    // Wait longer for connections to close
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teardown database
    if (testDb) {
      await testDb.teardown();
    }
    
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Force exit on cleanup error
    process.exit(0);
  }
});