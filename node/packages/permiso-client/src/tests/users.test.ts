import { expect } from "chai";
import { createOrganization } from "../api/organizations.js";
import {
  createUser,
  getUser,
  listUsers,
  getUsersByIds,
  getUsersByIdentity,
  updateUser,
  deleteUser,
  setUserProperty,
  getUserProperty,
  deleteUserProperty,
  assignUserRole,
  unassignUserRole,
} from "../api/users.js";
import { createRole } from "../api/roles.js";
import { getTestConfig, generateTestId } from "./utils/test-helpers.js";
import "./setup.js";

describe("Users API", () => {
  const config = getTestConfig();
  let testOrgId: string;

  beforeEach(async () => {
    // Create a test organization for each test
    testOrgId = generateTestId("org");
    const orgResult = await createOrganization(config, {
      id: testOrgId,
      name: "Test Organization",
    });
    expect(orgResult.success).to.be.true;
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const userId = generateTestId("user");
      const result = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "user@example.com",
        properties: [
          { name: "department", value: "engineering" },
          { name: "level", value: 3 },
        ],
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.id).to.equal(userId);
        expect(result.data.orgId).to.equal(testOrgId);
        expect(result.data.identityProvider).to.equal("google");
        expect(result.data.identityProviderUserId).to.equal("user@example.com");
        expect(result.data.properties).to.have.lengthOf(2);
      }
    });

    it("should create a user with role assignments", async () => {
      // Create roles first
      const role1Id = generateTestId("role");
      const role2Id = generateTestId("role");

      const role1Result = await createRole(config, {
        id: role1Id,
        name: "Admin",
      });
      expect(role1Result.success).to.be.true;

      const role2Result = await createRole(config, {
        id: role2Id,
        name: "Editor",
      });
      expect(role2Result.success).to.be.true;

      // Create user with roles
      const userId = generateTestId("user");
      const result = await createUser(config, {
        id: userId,
        identityProvider: "auth0",
        identityProviderUserId: "auth0|123456",
        roleIds: [role1Id, role2Id],
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.roles).to.have.lengthOf(2);
        const roleIds = result.data.roles.map((r) => r.id);
        expect(roleIds).to.include(role1Id);
        expect(roleIds).to.include(role2Id);
      }
    });
  });

  describe("getUser", () => {
    it("should retrieve an existing user", async () => {
      const userId = generateTestId("user");

      // Create user
      const createResult = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "user@example.com",
      });
      expect(createResult.success).to.be.true;

      // Get user
      const getResult = await getUser(config, testOrgId, userId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data?.id).to.equal(userId);
        expect(getResult.data?.orgId).to.equal(testOrgId);
      }
    });

    it("should return null for non-existent user", async () => {
      const result = await getUser(config, testOrgId, "non-existent-user");
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.null;
      }
    });
  });

  describe("listUsers", () => {
    it("should list users with pagination", async () => {
      // Create multiple users
      const userIds = [];
      for (let i = 0; i < 5; i++) {
        const userId = generateTestId(`user-${i}`);
        userIds.push(userId);
        const result = await createUser(config, {
          id: userId,
          identityProvider: "google",
          identityProviderUserId: `user${i}@example.com`,
        });
        expect(result.success).to.be.true;
      }

      // List with pagination
      const listResult = await listUsers(config, testOrgId, {
        pagination: { limit: 3, offset: 0 },
      });

      expect(listResult.success).to.be.true;
      if (listResult.success) {
        expect(listResult.data.nodes).to.have.lengthOf(3);
        expect(listResult.data.totalCount).to.equal(5);
        expect(listResult.data.pageInfo.hasNextPage).to.be.true;
      }
    });

    it("should filter users by identity provider", async () => {
      // Create users with different providers
      await createUser(config, {
        id: generateTestId("user-google"),
        identityProvider: "google",
        identityProviderUserId: "google@example.com",
      });

      await createUser(config, {
        id: generateTestId("user-auth0"),
        identityProvider: "auth0",
        identityProviderUserId: "auth0|123",
      });

      // Filter by identity provider
      const result = await listUsers(config, testOrgId, {
        filter: { identityProvider: "google" },
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.nodes).to.have.lengthOf(1);
        expect(result.data.nodes[0]?.identityProvider).to.equal("google");
      }
    });
  });

  describe("getUsersByIds", () => {
    it("should retrieve multiple users by IDs", async () => {
      const userIds = [];
      for (let i = 0; i < 3; i++) {
        const userId = generateTestId(`user-${i}`);
        userIds.push(userId);
        const result = await createUser(config, {
          id: userId,
          identityProvider: "google",
          identityProviderUserId: `user${i}@example.com`,
        });
        expect(result.success).to.be.true;
      }

      const result = await getUsersByIds(config, testOrgId, userIds);
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
        const retrievedIds = result.data.map((user) => user.id);
        expect(retrievedIds).to.have.members(userIds);
      }
    });
  });

  describe("getUsersByIdentity", () => {
    it("should find users by identity provider info", async () => {
      const identityProvider = "okta";
      const identityProviderUserId = "okta-user-123";

      // Create user in one org
      await createUser(config, {
        id: generateTestId("user1"),
        identityProvider,
        identityProviderUserId,
      });

      // Create another org and user with same identity
      const org2Id = generateTestId("org2");
      await createOrganization(config, {
        id: org2Id,
        name: "Second Org",
      });

      await createUser(config, {
        id: generateTestId("user2"),
        identityProvider,
        identityProviderUserId,
      });

      // Find users by identity
      const result = await getUsersByIdentity(
        config,
        identityProvider,
        identityProviderUserId,
      );
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        result.data.forEach((user) => {
          expect(user.identityProvider).to.equal(identityProvider);
          expect(user.identityProviderUserId).to.equal(identityProviderUserId);
        });
      }
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      const userId = generateTestId("user");

      // Create user
      const createResult = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "old@example.com",
      });
      expect(createResult.success).to.be.true;

      // Update user
      const updateResult = await updateUser(config, testOrgId, userId, {
        identityProviderUserId: "new@example.com",
      });
      expect(updateResult.success).to.be.true;
      if (updateResult.success) {
        expect(updateResult.data.identityProviderUserId).to.equal(
          "new@example.com",
        );
      }
    });
  });

  describe("User Properties", () => {
    let userId: string;

    beforeEach(async () => {
      userId = generateTestId("user");
      const result = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "user@example.com",
      });
      expect(result.success).to.be.true;
    });

    it("should set and get user properties", async () => {
      const propertyValue = {
        preferences: {
          theme: "dark",
          language: "en",
          notifications: {
            email: true,
            push: false,
          },
        },
      };

      const setPropResult = await setUserProperty(
        config,
        testOrgId,
        userId,
        "settings",
        propertyValue,
        false,
      );
      expect(setPropResult.success).to.be.true;

      const getPropResult = await getUserProperty(
        config,
        testOrgId,
        userId,
        "settings",
      );
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data?.value).to.deep.equal(propertyValue);
      }
    });

    it("should delete user properties", async () => {
      // Set property
      await setUserProperty(config, testOrgId, userId, "temp", "value", false);

      // Delete property
      const deleteResult = await deleteUserProperty(
        config,
        testOrgId,
        userId,
        "temp",
      );
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify deletion
      const getPropResult = await getUserProperty(
        config,
        testOrgId,
        userId,
        "temp",
      );
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data).to.be.null;
      }
    });
  });

  describe("User Role Management", () => {
    let userId: string;
    let roleId: string;

    beforeEach(async () => {
      // Create user
      userId = generateTestId("user");
      const userResult = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "user@example.com",
      });
      expect(userResult.success).to.be.true;

      // Create role
      roleId = generateTestId("role");
      const roleResult = await createRole(config, {
        id: roleId,
        name: "Test Role",
      });
      expect(roleResult.success).to.be.true;
    });

    it("should assign and unassign roles", async () => {
      // Assign role
      const assignResult = await assignUserRole(
        config,
        testOrgId,
        userId,
        roleId,
      );
      expect(assignResult.success).to.be.true;
      if (assignResult.success) {
        expect(assignResult.data.roles).to.have.lengthOf(1);
        expect(assignResult.data.roles[0]?.id).to.equal(roleId);
      }

      // Unassign role
      const unassignResult = await unassignUserRole(
        config,
        testOrgId,
        userId,
        roleId,
      );
      expect(unassignResult.success).to.be.true;
      if (unassignResult.success) {
        expect(unassignResult.data.roles).to.have.lengthOf(0);
      }
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const userId = generateTestId("user");

      // Create user
      const createResult = await createUser(config, {
        id: userId,
        identityProvider: "google",
        identityProviderUserId: "user@example.com",
      });
      expect(createResult.success).to.be.true;

      // Delete user
      const deleteResult = await deleteUser(config, testOrgId, userId);
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify deletion
      const getResult = await getUser(config, testOrgId, userId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data).to.be.null;
      }
    });
  });
});
