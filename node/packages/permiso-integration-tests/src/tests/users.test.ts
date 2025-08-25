import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, rootClient, createOrgClient } from "../index.js";

describe("Users", () => {
  const getTestOrgClient = () => createOrgClient("test-org");

  beforeEach(async () => {
    await testDb.truncateAllTables();

    // Create test organization using ROOT client
    const mutation = gql`
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
        }
      }
    `;

    await rootClient.mutate(mutation, {
      input: {
        id: "test-org",
        name: "Test Organization",
      },
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const testOrgClient = getTestOrgClient();
      const mutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            orgId
            identityProvider
            identityProviderUserId
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const result = await testOrgClient.mutate(mutation, {
        input: {
          id: "user-123",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
          properties: [
            { name: "email", value: "user@example.com" },
            { name: "apiToken", value: "secret", hidden: true },
          ],
        },
      });

      const user = result.data?.createUser;
      expect(user?.id).to.equal("user-123");
      expect(user?.orgId).to.equal("test-org");
      expect(user?.identityProvider).to.equal("auth0");
      expect(user?.identityProviderUserId).to.equal("auth0|12345");
      expect(user?.properties).to.have.lengthOf(2);

      const emailProp = user?.properties.find((p: any) => p.name === "email");
      expect(emailProp).to.deep.include({
        name: "email",
        value: "user@example.com",
        hidden: false,
      });

      const tokenProp = user?.properties.find(
        (p: any) => p.name === "apiToken",
      );
      expect(tokenProp).to.deep.include({
        name: "apiToken",
        value: "secret",
        hidden: true,
      });
    });

    it("should fail when trying to access non-existent organization", async () => {
      // Switch to a non-existent organization context
      const nonExistentOrgClient = createOrgClient("non-existent-org");

      const mutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      try {
        const result = await nonExistentOrgClient.mutate(mutation, {
          input: {
            id: "user-123",
            identityProvider: "auth0",
            identityProviderUserId: "auth0|12345",
          },
        });

        // Check if there are errors in the response
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message.toLowerCase();
          expect(errorMessage).to.satisfy(
            (msg: string) =>
              msg.includes("foreign key violation") ||
              msg.includes("is not present in table") ||
              msg.includes("constraint") ||
              msg.includes("organization") ||
              msg.includes("not found"),
          );
        } else {
          expect.fail("Should have returned an error");
        }
      } catch (error: any) {
        // If an exception was thrown, check it
        const errorMessage =
          error.graphQLErrors?.[0]?.message || error.message || "";
        expect(errorMessage.toLowerCase()).to.satisfy(
          (msg: string) =>
            msg.includes("foreign key violation") ||
            msg.includes("is not present in table") ||
            msg.includes("constraint") ||
            msg.includes("organization") ||
            msg.includes("not found"),
        );
      }
    });
  });

  describe("users query", () => {
    it("should list users in an organization", async () => {
      const testOrgClient = getTestOrgClient();
      const createUserMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      // Create multiple users
      await testOrgClient.mutate(createUserMutation, {
        input: {
          id: "user-1",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|1",
        },
      });

      await testOrgClient.mutate(createUserMutation, {
        input: {
          id: "user-2",
          identityProvider: "google",
          identityProviderUserId: "google|2",
        },
      });

      // Query users
      const query = gql`
        query ListUsers {
          users {
            nodes {
              id
              orgId
              identityProvider
              identityProviderUserId
            }
          }
        }
      `;

      const result = await testOrgClient.query(query, {});

      expect(result.data?.users?.nodes).to.have.lengthOf(2);
      const userIds = result.data?.users?.nodes.map((u: any) => u.id);
      expect(userIds).to.include.members(["user-1", "user-2"]);
    });

    it("should return empty array for organization with no users", async () => {
      const testOrgClient = getTestOrgClient();
      const query = gql`
        query ListUsers {
          users {
            nodes {
              id
            }
          }
        }
      `;

      const result = await testOrgClient.query(query, {});

      expect(result.data?.users?.nodes).to.deep.equal([]);
    });
  });

  describe("user query", () => {
    it("should retrieve a user by orgId and userId", async () => {
      const testOrgClient = getTestOrgClient();
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "user-123",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
          properties: [{ name: "email", value: "user@example.com" }],
        },
      });

      // Query user
      const query = gql`
        query GetUser($userId: ID!) {
          user(userId: $userId) {
            id
            orgId
            identityProvider
            identityProviderUserId
            properties {
              name
              value
              hidden
            }
            createdAt
            updatedAt
          }
        }
      `;

      const result = await testOrgClient.query(query, {
        userId: "user-123",
      });

      expect(result.data?.user?.id).to.equal("user-123");
      expect(result.data?.user?.orgId).to.equal("test-org");
      expect(result.data?.user?.properties).to.have.lengthOf(1);
      const prop = result.data?.user?.properties[0];
      expect(prop).to.include({
        name: "email",
        value: "user@example.com",
        hidden: false,
      });
    });
  });

  describe("updateUser", () => {
    it("should update user identity provider info", async () => {
      const testOrgClient = getTestOrgClient();
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "user-123",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });

      // Update user
      const updateMutation = gql`
        mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
          updateUser(userId: $userId, input: $input) {
            id
            identityProvider
            identityProviderUserId
          }
        }
      `;

      const result = await testOrgClient.mutate(updateMutation, {
        userId: "user-123",
        input: {
          identityProvider: "google",
          identityProviderUserId: "google|67890",
        },
      });

      expect(result.data?.updateUser?.identityProvider).to.equal("google");
      expect(result.data?.updateUser?.identityProviderUserId).to.equal(
        "google|67890",
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const testOrgClient = getTestOrgClient();
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "user-123",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });

      // Delete user
      const deleteMutation = gql`
        mutation DeleteUser($userId: ID!) {
          deleteUser(userId: $userId)
        }
      `;

      const result = await testOrgClient.mutate(deleteMutation, {
        userId: "user-123",
      });

      expect(result.data?.deleteUser).to.be.true;

      // Verify deletion
      const query = gql`
        query GetUser($userId: ID!) {
          user(userId: $userId) {
            id
          }
        }
      `;

      const queryResult = await testOrgClient.query(query, {
        userId: "user-123",
      });

      expect(queryResult.data?.user).to.be.null;
    });
  });
});
