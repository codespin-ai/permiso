import { TestServer, TestDatabase, testLogger } from '@codespin/permiso-test-utils';

export const testServer = new TestServer({ port: 5003, dbName: 'permiso_client_test', logger: testLogger });
export const testDb = new TestDatabase({ dbName: 'permiso_client_test', logger: testLogger });

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
  await testDb.truncateAllTables();
});

// Teardown after all tests
after(async function() {
  this.timeout(30000); // 30 seconds for teardown
  
  // Stop server
  await testServer.stop();
  
  // Note: We're not dropping the database here to allow for debugging
  // The database will be cleaned up on the next test run
});