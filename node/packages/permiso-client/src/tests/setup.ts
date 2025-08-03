import { TestServer } from './utils/server.js';
import { TestDatabase } from './utils/test-db.js';

export const testServer = new TestServer(5003);
export const testDb = new TestDatabase();

// Setup before all tests
before(async function() {
  this.timeout(60000); // 60 seconds for setup
  
  // Setup database
  await testDb.setup();
  
  // Start server
  await testServer.start();
});

// Cleanup after each test
afterEach(async function() {
  await testDb.cleanup();
});

// Teardown after all tests
after(async function() {
  this.timeout(30000); // 30 seconds for teardown
  
  // Stop server
  await testServer.stop();
  
  // Note: We're not dropping the database here to allow for debugging
  // The database will be cleaned up on the next test run
});