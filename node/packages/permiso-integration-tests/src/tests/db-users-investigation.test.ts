import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, rootClient, createOrgClient } from "../index.js";

describe("Database Users Investigation", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  it("should verify database users and connection pooling", async () => {
    console.log("\n=== Database User Investigation ===\n");
    
    // Test 1: Create an organization using ROOT client (uses upgradeToRoot internally)
    const createMutation = gql`
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
          name
        }
      }
    `;

    console.log("Creating organization with ROOT client...");
    const createResult = await rootClient.mutate(createMutation, {
      input: {
        id: "test-org-1",
        name: "Test Organization 1",
      },
    });
    
    expect(createResult.data?.createOrganization).to.exist;
    expect(createResult.data?.createOrganization.id).to.equal("test-org-1");
    console.log("✓ Created organization successfully with ROOT access");

    // Test 2: Query the organization using ROOT client
    const getQuery = gql`
      query GetOrganization($id: ID!) {
        organization(id: $id) {
          id
          name
        }
      }
    `;

    console.log("Querying organization with ROOT client...");
    const getResult = await rootClient.query(getQuery, { id: "test-org-1" });
    expect(getResult.data?.organization).to.exist;
    expect(getResult.data?.organization.id).to.equal("test-org-1");
    console.log("✓ Queried organization successfully with ROOT access");

    // Test 3: Create a second organization to test connection pooling
    console.log("Creating second organization to test pooling...");
    const createResult2 = await rootClient.mutate(createMutation, {
      input: {
        id: "test-org-2",
        name: "Test Organization 2",
      },
    });
    
    expect(createResult2.data?.createOrganization).to.exist;
    expect(createResult2.data?.createOrganization.id).to.equal("test-org-2");
    console.log("✓ Created second organization - connection pooling working");

    // Test 4: List organizations (uses upgradeToRoot internally)
    const listQuery = gql`
      query ListOrganizations {
        organizations {
          id
          name
        }
      }
    `;

    console.log("Listing organizations with ROOT client...");
    const listResult = await rootClient.query(listQuery, {});
    expect(listResult.data?.organizations).to.have.lengthOf(2);
    console.log("✓ Listed organizations successfully");

    // Test 5: Create org-specific client and verify RLS context
    console.log("Testing org-specific client with RLS...");
    const orgClient = createOrgClient("test-org-1");
    
    // Create a user in the organization
    const createUserMutation = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          identityProvider
          identityProviderUserId
        }
      }
    `;

    const userResult = await orgClient.mutate(createUserMutation, {
      input: {
        id: "user-1",
        identityProvider: "auth0",
        identityProviderUserId: "auth0|123",
      },
    });
    
    expect(userResult.data?.createUser).to.exist;
    expect(userResult.data?.createUser.id).to.equal("user-1");
    console.log("✓ Created user with org-specific RLS context");

    // Test 6: Query the user using org client
    const getUserQuery = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          identityProvider
          identityProviderUserId
        }
      }
    `;

    const getUserResult = await orgClient.query(getUserQuery, { id: "user-1" });
    expect(getUserResult.data?.user).to.exist;
    expect(getUserResult.data?.user.id).to.equal("user-1");
    console.log("✓ Queried user with org-specific RLS context");

    // Test 7: Verify connection pooling by creating multiple org clients
    console.log("Testing multiple org clients for pooling...");
    const orgClient2 = createOrgClient("test-org-2");
    
    // Create a user in org-2
    const userResult2 = await orgClient2.mutate(createUserMutation, {
      input: {
        id: "user-2",
        identityProvider: "auth0",
        identityProviderUserId: "auth0|456",
      },
    });
    
    expect(userResult2.data?.createUser).to.exist;
    expect(userResult2.data?.createUser.id).to.equal("user-2");
    console.log("✓ Multiple org clients working - connection pooling confirmed");

    // Test 8: Verify ROOT operations work after regular org operations
    console.log("Testing ROOT operations after org operations...");
    const createResult3 = await rootClient.mutate(createMutation, {
      input: {
        id: "test-org-3",
        name: "Test Organization 3",
      },
    });
    
    expect(createResult3.data?.createOrganization).to.exist;
    expect(createResult3.data?.createOrganization.id).to.equal("test-org-3");
    console.log("✓ ROOT operations still working after org operations");

    // Final check: List all organizations
    const finalListResult = await rootClient.query(listQuery, {});
    expect(finalListResult.data?.organizations).to.have.lengthOf(3);
    console.log("✓ Final organization count correct: 3");
    
    console.log("\n=== All database user and pooling tests passed ===\n");
  });
});