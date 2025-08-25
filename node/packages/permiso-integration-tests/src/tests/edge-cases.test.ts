import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, rootClient, createOrgClient } from "../index.js";

describe("Edge Cases and Error Scenarios", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe("Resource Pattern Matching", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      // Create organization-specific client
      const testOrgClient = getTestOrgClient();

      // Create test user
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(userMutation, {
        input: {
          id: "test-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });
    });

    it("should handle complex resource patterns with multiple wildcards", async () => {
      const testOrgClient = getTestOrgClient();
      // Create resources with complex patterns
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/api/*/users/*",
          name: "Multi-wildcard Resource",
        },
      });

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/*/data/*",
          name: "Data Resource Pattern",
        },
      });

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/*",
          name: "Root Wildcard",
        },
      });

      // Grant permissions on these resources
      const grantMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            resourceId
          }
        }
      `;

      await testOrgClient.mutate(grantMutation, {
        input: {
          userId: "test-user",
          resourceId: "/api/*/users/*",
          action: "read",
        },
      });

      await testOrgClient.mutate(grantMutation, {
        input: {
          userId: "test-user",
          resourceId: "/*/data/*",
          action: "write",
        },
      });

      await testOrgClient.mutate(grantMutation, {
        input: {
          userId: "test-user",
          resourceId: "/*",
          action: "list",
        },
      });

      // Test pattern matching
      const query = gql`
        query GetEffectivePermissions($userId: ID!, $resourceId: String!) {
          effectivePermissions(userId: $userId, resourceId: $resourceId) {
            resourceId
            action
          }
        }
      `;

      // Should match /api/*/users/*
      const result = await testOrgClient.query(query, {
        userId: "test-user",
        resourceId: "/api/v1/users/123",
      });

      const permissions = result.data?.effectivePermissions;
      expect(permissions).to.have.length.at.least(2); // Should match both /api/*/users/* and /*
      const actions = permissions.map((p: any) => p.action);
      expect(actions).to.include.members(["read", "list"]);

      // Should match /*/data/*
      const result2 = await testOrgClient.query(query, {
        userId: "test-user",
        resourceId: "/europe/data/sensitive",
      });

      const permissions2 = result2.data?.effectivePermissions;
      expect(permissions2).to.have.length.at.least(2); // Should match both /*/data/* and /*
      const actions2 = permissions2.map((p: any) => p.action);
      expect(actions2).to.include.members(["write", "list"]);
    });

    it("should handle edge cases in resource IDs", async () => {
      const testOrgClient = getTestOrgClient();
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      // Create resources with special characters
      const specialResources = [
        "/api/users/:id",
        "/api/users/{id}",
        "/api/users/[id]",
        "/api/users/$id",
        "/api/users/@username",
        "/api/users/#tag",
        "/api/users/user%20name",
        "/api/users/user+name",
        "/api/users/user.name",
        "/api/users/user-name",
        "/api/users/user_name",
      ];

      for (const resourceId of specialResources) {
        const result = await testOrgClient.mutate(resourceMutation, {
          input: {
            id: resourceId,
            name: `Resource: ${resourceId}`,
          },
        });

        expect(result.data?.createResource?.id).to.equal(resourceId);
      }

      // Query to verify they were created
      const query = gql`
        query ListResources {
          resources {
            nodes {
              id
            }
          }
        }
      `;

      const result = await testOrgClient.query(query, { orgId: "test-org" });
      const ids = result.data?.resources?.nodes.map((r: any) => r.id);
      expect(ids).to.include.members(specialResources);
    });
  });

  describe("Permission Queries", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      // Create organization-specific client
      const testOrgClient = getTestOrgClient();

      // Create test user
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(userMutation, {
        input: {
          id: "test-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });

      // Create role
      const roleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(roleMutation, {
        input: {
          id: "test-role",
          name: "Test Role",
        },
      });

      // Create resources
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/api/users/*",
          name: "Users API",
        },
      });

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/api/posts/*",
          name: "Posts API",
        },
      });
    });

    describe("hasPermission query", () => {
      it("should return true when user has direct permission", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant permission
        const grantMutation = gql`
          mutation GrantUserPermission($input: GrantUserPermissionInput!) {
            grantUserPermission(input: $input) {
              userId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "read",
          },
        });

        // Check permission
        const query = gql`
          query HasPermission(
            $userId: ID!
            $resourceId: String!
            $action: String!
          ) {
            hasPermission(
              userId: $userId
              resourceId: $resourceId
              action: $action
            )
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceId: "/api/users/123",
          action: "read",
        });

        expect(result.data?.hasPermission).to.be.true;
      });

      it("should return false when user lacks permission", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query HasPermission(
            $userId: ID!
            $resourceId: String!
            $action: String!
          ) {
            hasPermission(
              userId: $userId
              resourceId: $resourceId
              action: $action
            )
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceId: "/api/users/123",
          action: "delete",
        });

        expect(result.data?.hasPermission).to.be.false;
      });

      it("should return true when user has permission through role", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant permission to role
        const grantRoleMutation = gql`
          mutation GrantRolePermission($input: GrantRolePermissionInput!) {
            grantRolePermission(input: $input) {
              roleId
            }
          }
        `;

        await testOrgClient.mutate(grantRoleMutation, {
          input: {
            roleId: "test-role",
            resourceId: "/api/posts/*",
            action: "write",
          },
        });

        // Assign role to user
        const assignMutation = gql`
          mutation AssignUserRole($userId: ID!, $roleId: ID!) {
            assignUserRole(userId: $userId, roleId: $roleId) {
              id
            }
          }
        `;

        await testOrgClient.mutate(assignMutation, {
          userId: "test-user",
          roleId: "test-role",
        });

        // Check permission
        const query = gql`
          query HasPermission(
            $userId: ID!
            $resourceId: String!
            $action: String!
          ) {
            hasPermission(
              userId: $userId
              resourceId: $resourceId
              action: $action
            )
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceId: "/api/posts/456",
          action: "write",
        });

        expect(result.data?.hasPermission).to.be.true;
      });
    });

    describe("userPermissions query", () => {
      it("should list all user permissions", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant multiple permissions
        const grantMutation = gql`
          mutation GrantUserPermission($input: GrantUserPermissionInput!) {
            grantUserPermission(input: $input) {
              userId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "write",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/posts/*",
            action: "read",
          },
        });

        // Query all permissions
        const query = gql`
          query GetUserPermissions($userId: ID!) {
            userPermissions(userId: $userId) {
              resourceId
              action
              createdAt
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
        });

        expect(result.data?.userPermissions).to.have.lengthOf(3);
      });

      it("should filter user permissions by resource", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant multiple permissions
        const grantMutation = gql`
          mutation GrantUserPermission($input: GrantUserPermissionInput!) {
            grantUserPermission(input: $input) {
              userId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/posts/*",
            action: "read",
          },
        });

        // Query filtered permissions
        const query = gql`
          query GetUserPermissions($userId: ID!, $resourceId: String) {
            userPermissions(userId: $userId, resourceId: $resourceId) {
              resourceId
              action
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceId: "/api/users/*",
        });

        expect(result.data?.userPermissions).to.have.lengthOf(1);
        expect(result.data?.userPermissions[0].resourceId).to.equal(
          "/api/users/*",
        );
      });

      it("should filter user permissions by action", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant multiple permissions
        const grantMutation = gql`
          mutation GrantUserPermission($input: GrantUserPermissionInput!) {
            grantUserPermission(input: $input) {
              userId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/users/*",
            action: "write",
          },
        });

        // Query filtered permissions
        const query = gql`
          query GetUserPermissions($userId: ID!, $action: String) {
            userPermissions(userId: $userId, action: $action) {
              resourceId
              action
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          action: "read",
        });

        expect(result.data?.userPermissions).to.have.lengthOf(1);
        expect(result.data?.userPermissions[0].action).to.equal("read");
      });
    });

    describe("rolePermissions query", () => {
      it("should list all role permissions", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant multiple permissions to role
        const grantMutation = gql`
          mutation GrantRolePermission($input: GrantRolePermissionInput!) {
            grantRolePermission(input: $input) {
              roleId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            roleId: "test-role",
            resourceId: "/api/users/*",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            roleId: "test-role",
            resourceId: "/api/posts/*",
            action: "write",
          },
        });

        // Query all permissions
        const query = gql`
          query GetRolePermissions($roleId: ID!) {
            rolePermissions(roleId: $roleId) {
              resourceId
              action
              createdAt
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          roleId: "test-role",
        });

        expect(result.data?.rolePermissions).to.have.lengthOf(2);
      });
    });

    describe("effectivePermissionsByPrefix query", () => {
      beforeEach(async () => {
        const testOrgClient = getTestOrgClient();
        // Create multiple resources
        const resourceMutation = gql`
          mutation CreateResource($input: CreateResourceInput!) {
            createResource(input: $input) {
              id
            }
          }
        `;

        await testOrgClient.mutate(resourceMutation, {
          input: {
            id: "/api/v1/users",
            name: "V1 Users",
          },
        });

        await testOrgClient.mutate(resourceMutation, {
          input: {
            id: "/api/v2/users",
            name: "V2 Users",
          },
        });

        await testOrgClient.mutate(resourceMutation, {
          input: {
            id: "/api/v1/posts",
            name: "V1 Posts",
          },
        });

        // Grant permissions
        const grantMutation = gql`
          mutation GrantUserPermission($input: GrantUserPermissionInput!) {
            grantUserPermission(input: $input) {
              userId
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/v1/users",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/v2/users",
            action: "read",
          },
        });

        await testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/v1/posts",
            action: "write",
          },
        });
      });

      it("should return permissions matching the prefix", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query GetEffectivePermissionsByPrefix(
            $userId: ID!
            $resourceIdPrefix: String!
            $action: String
          ) {
            effectivePermissionsByPrefix(
              userId: $userId
              resourceIdPrefix: $resourceIdPrefix
              action: $action
            ) {
              resourceId
              action
              source
            }
          }
        `;

        // Get all permissions under /api/v1/
        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceIdPrefix: "/api/v1/",
        });

        expect(result.data?.effectivePermissionsByPrefix).to.have.lengthOf(2);
        const resourceIds = result.data?.effectivePermissionsByPrefix.map(
          (p: any) => p.resourceId,
        );
        expect(resourceIds).to.include.members([
          "/api/v1/users",
          "/api/v1/posts",
        ]);
      });

      it("should filter by action when provided", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query GetEffectivePermissionsByPrefix(
            $userId: ID!
            $resourceIdPrefix: String!
            $action: String
          ) {
            effectivePermissionsByPrefix(
              userId: $userId
              resourceIdPrefix: $resourceIdPrefix
              action: $action
            ) {
              resourceId
              action
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
          resourceIdPrefix: "/api/",
          action: "read",
        });

        expect(result.data?.effectivePermissionsByPrefix).to.have.lengthOf(2);
        const resourceIds = result.data?.effectivePermissionsByPrefix.map(
          (p: any) => p.resourceId,
        );
        expect(resourceIds).to.include.members([
          "/api/v1/users",
          "/api/v2/users",
        ]);
      });
    });
  });

  describe("User Role Operations", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      const testOrgClient = getTestOrgClient();

      // Create test user
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(userMutation, {
        input: {
          id: "test-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });

      // Create roles
      const roleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(roleMutation, {
        input: {
          id: "admin",
          name: "Administrator",
        },
      });

      await testOrgClient.mutate(roleMutation, {
        input: {
          id: "editor",
          name: "Editor",
        },
      });
    });

    describe("unassignUserRole mutation", () => {
      it("should remove a role from a user", async () => {
        const testOrgClient = getTestOrgClient();
        // First assign roles
        const assignMutation = gql`
          mutation AssignUserRole($userId: ID!, $roleId: ID!) {
            assignUserRole(userId: $userId, roleId: $roleId) {
              id
              roles {
                id
              }
            }
          }
        `;

        await testOrgClient.mutate(assignMutation, {
          userId: "test-user",
          roleId: "admin",
        });

        await testOrgClient.mutate(assignMutation, {
          userId: "test-user",
          roleId: "editor",
        });

        // Verify user has both roles
        const query = gql`
          query GetUser($userId: ID!) {
            user(userId: $userId) {
              roles {
                id
              }
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          userId: "test-user",
        });

        expect(result.data?.user?.roles).to.have.lengthOf(2);

        // Unassign one role
        const unassignMutation = gql`
          mutation UnassignUserRole($userId: ID!, $roleId: ID!) {
            unassignUserRole(userId: $userId, roleId: $roleId) {
              id
              roles {
                id
              }
            }
          }
        `;

        const unassignResult = await testOrgClient.mutate(unassignMutation, {
          userId: "test-user",
          roleId: "admin",
        });

        expect(unassignResult.data?.unassignUserRole?.roles).to.have.lengthOf(
          1,
        );
        expect(unassignResult.data?.unassignUserRole?.roles[0].id).to.equal(
          "editor",
        );

        // Verify role was removed
        const verifyResult = await testOrgClient.query(query, {
          userId: "test-user",
        });

        expect(verifyResult.data?.user?.roles).to.have.lengthOf(1);
        expect(verifyResult.data?.user?.roles[0].id).to.equal("editor");
      });

      it("should handle unassigning a role that user does not have", async () => {
        const testOrgClient = getTestOrgClient();
        const unassignMutation = gql`
          mutation UnassignUserRole($userId: ID!, $roleId: ID!) {
            unassignUserRole(userId: $userId, roleId: $roleId) {
              id
              roles {
                id
              }
            }
          }
        `;

        // Should not throw error, just return user unchanged
        const result = await testOrgClient.mutate(unassignMutation, {
          userId: "test-user",
          roleId: "admin",
        });

        expect(result.data?.unassignUserRole?.roles).to.deep.equal([]);
      });
    });
  });

  describe("Role Permission Operations", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      const testOrgClient = getTestOrgClient();

      // Create role
      const roleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(roleMutation, {
        input: {
          id: "test-role",
          name: "Test Role",
        },
      });

      // Create resource
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/api/data/*",
          name: "Data API",
        },
      });
    });

    describe("revokeRolePermission mutation", () => {
      it("should revoke a permission from a role", async () => {
        const testOrgClient = getTestOrgClient();
        // Grant permission first
        const grantMutation = gql`
          mutation GrantRolePermission($input: GrantRolePermissionInput!) {
            grantRolePermission(input: $input) {
              roleId
              resourceId
              action
            }
          }
        `;

        await testOrgClient.mutate(grantMutation, {
          input: {
            roleId: "test-role",
            resourceId: "/api/data/*",
            action: "read",
          },
        });

        // Verify permission exists
        const query = gql`
          query GetRolePermissions($roleId: ID!) {
            rolePermissions(roleId: $roleId) {
              resourceId
              action
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          roleId: "test-role",
        });

        expect(result.data?.rolePermissions).to.have.lengthOf(1);

        // Revoke permission
        const revokeMutation = gql`
          mutation RevokeRolePermission(
            $roleId: ID!
            $resourceId: ID!
            $action: String!
          ) {
            revokeRolePermission(
              roleId: $roleId
              resourceId: $resourceId
              action: $action
            )
          }
        `;

        const revokeResult = await testOrgClient.mutate(revokeMutation, {
          roleId: "test-role",
          resourceId: "/api/data/*",
          action: "read",
        });

        expect(revokeResult.data?.revokeRolePermission).to.be.true;

        // Verify permission is gone
        const verifyResult2 = await testOrgClient.query(query, {
          roleId: "test-role",
        });

        expect(verifyResult2.data?.rolePermissions).to.deep.equal([]);
      });

      it("should return false when revoking non-existent permission", async () => {
        const testOrgClient = getTestOrgClient();
        const revokeMutation = gql`
          mutation RevokeRolePermission(
            $roleId: ID!
            $resourceId: ID!
            $action: String!
          ) {
            revokeRolePermission(
              roleId: $roleId
              resourceId: $resourceId
              action: $action
            )
          }
        `;

        const result = await testOrgClient.mutate(revokeMutation, {
          roleId: "test-role",
          resourceId: "/api/data/*",
          action: "write",
        });

        expect(result.data?.revokeRolePermission).to.be.false;
      });
    });
  });

  describe("Resource Prefix Operations", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      // Create organization-specific client
      const testOrgClient = getTestOrgClient();

      // Create multiple resources
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      const resources = [
        "/api/v1/users",
        "/api/v1/users/*",
        "/api/v1/posts",
        "/api/v1/posts/*",
        "/api/v2/users",
        "/api/v2/users/*",
        "/admin/settings",
        "/admin/users",
        "/public/docs",
      ];

      for (const resourceId of resources) {
        await testOrgClient.mutate(resourceMutation, {
          input: {
            id: resourceId,
            name: `Resource: ${resourceId}`,
          },
        });
      }
    });

    describe("resourcesByIdPrefix query", () => {
      it("should return resources matching exact prefix", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query GetResourcesByIdPrefix($idPrefix: String!) {
            resourcesByIdPrefix(idPrefix: $idPrefix) {
              id
              name
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          idPrefix: "/api/v1/",
        });

        expect(result.data?.resourcesByIdPrefix).to.have.lengthOf(4);
        const ids = result.data?.resourcesByIdPrefix.map((r: any) => r.id);
        expect(ids).to.include.members([
          "/api/v1/users",
          "/api/v1/users/*",
          "/api/v1/posts",
          "/api/v1/posts/*",
        ]);
      });

      it("should handle prefix without trailing slash", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query GetResourcesByIdPrefix($idPrefix: String!) {
            resourcesByIdPrefix(idPrefix: $idPrefix) {
              id
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          idPrefix: "/admin",
        });

        expect(result.data?.resourcesByIdPrefix).to.have.lengthOf(2);
        const ids = result.data?.resourcesByIdPrefix.map((r: any) => r.id);
        expect(ids).to.include.members(["/admin/settings", "/admin/users"]);
      });

      it("should return empty array for non-matching prefix", async () => {
        const testOrgClient = getTestOrgClient();
        const query = gql`
          query GetResourcesByIdPrefix($idPrefix: String!) {
            resourcesByIdPrefix(idPrefix: $idPrefix) {
              id
            }
          }
        `;

        const result = await testOrgClient.query(query, {
          idPrefix: "/nonexistent/",
        });

        expect(result.data?.resourcesByIdPrefix).to.deep.equal([]);
      });
    });
  });

  describe("Cascading Deletes", () => {
    describe("deleteOrganization with safetyKey", () => {
      it("should delete organization with correct safety key", async () => {
        // Create organization
        const createMutation = gql`
          mutation CreateOrganization($input: CreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `;

        await rootClient.mutate(createMutation, {
          input: {
            id: "org-to-delete",
            name: "Organization to Delete",
          },
        });

        // Delete with safety key (which is the org ID)
        const deleteMutation = gql`
          mutation DeleteOrganization($id: ID!, $safetyKey: String) {
            deleteOrganization(id: $id, safetyKey: $safetyKey)
          }
        `;

        const result = await rootClient.mutate(deleteMutation, {
          id: "org-to-delete",
          safetyKey: "org-to-delete",
        });

        expect(result.data?.deleteOrganization).to.be.true;

        // Verify deletion
        const query = gql`
          query GetOrganization($id: ID!) {
            organization(id: $id) {
              id
            }
          }
        `;

        const queryResult = await rootClient.query(query, {
          id: "org-to-delete",
        });
        expect(queryResult.data?.organization).to.be.null;
      });

      it("should not delete organization with incorrect safety key", async () => {
        // Create organization
        const createMutation = gql`
          mutation CreateOrganization($input: CreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `;

        await rootClient.mutate(createMutation, {
          input: {
            id: "org-safe",
            name: "Safe Organization",
          },
        });

        // Try to delete with wrong safety key
        const deleteMutation = gql`
          mutation DeleteOrganization($id: ID!, $safetyKey: String) {
            deleteOrganization(id: $id, safetyKey: $safetyKey)
          }
        `;

        let errorOccurred = false;
        let result;
        try {
          result = await rootClient.mutate(deleteMutation, {
            id: "org-safe",
            safetyKey: "wrong-key",
          });
          // Check if there are errors in the result
          if (result.errors && result.errors.length > 0) {
            errorOccurred = true;
            const errorMessage = result.errors[0].message;
            expect(errorMessage.toLowerCase()).to.include("safety key");
          }
        } catch (error: any) {
          errorOccurred = true;
          // Handle different error structures from Apollo Client
          const errorMessage =
            error.graphQLErrors?.[0]?.message || error.message || "";
          expect(errorMessage.toLowerCase()).to.include("safety key");
        }

        expect(
          errorOccurred,
          "Expected mutation to return an error for invalid safety key",
        ).to.be.true;

        // Verify organization still exists
        const query = gql`
          query GetOrganization($id: ID!) {
            organization(id: $id) {
              id
            }
          }
        `;

        const queryResult = await rootClient.query(query, { id: "org-safe" });
        expect(queryResult.data?.organization?.id).to.equal("org-safe");
      });
    });

    it("should cascade delete all related entities when deleting organization", async () => {
      // Create a complete organization setup using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: {
          id: "cascade-org",
          name: "Cascade Test Org",
          properties: [{ name: "tier", value: "premium" }],
        },
      });

      // Create organization-specific client for cascade org
      const cascadeOrgClient = createOrgClient("cascade-org");

      // Create user
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await cascadeOrgClient.mutate(userMutation, {
        input: {
          id: "cascade-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|cascade",
        },
      });

      // Create role
      const roleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await cascadeOrgClient.mutate(roleMutation, {
        input: {
          id: "cascade-role",
          name: "Cascade Role",
        },
      });

      // Create resource
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await cascadeOrgClient.mutate(resourceMutation, {
        input: {
          id: "/cascade/*",
          name: "Cascade Resource",
        },
      });

      // Assign role to user
      const assignMutation = gql`
        mutation AssignUserRole($userId: ID!, $roleId: ID!) {
          assignUserRole(userId: $userId, roleId: $roleId) {
            id
          }
        }
      `;

      await cascadeOrgClient.mutate(assignMutation, {
        userId: "cascade-user",
        roleId: "cascade-role",
      });

      // Grant permissions
      const grantUserMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
          }
        }
      `;

      await cascadeOrgClient.mutate(grantUserMutation, {
        input: {
          userId: "cascade-user",
          resourceId: "/cascade/*",
          action: "read",
        },
      });

      const grantRoleMutation = gql`
        mutation GrantRolePermission($input: GrantRolePermissionInput!) {
          grantRolePermission(input: $input) {
            roleId
          }
        }
      `;

      await cascadeOrgClient.mutate(grantRoleMutation, {
        input: {
          roleId: "cascade-role",
          resourceId: "/cascade/*",
          action: "write",
        },
      });

      // Delete organization
      const deleteMutation = gql`
        mutation DeleteOrganization($id: ID!) {
          deleteOrganization(id: $id)
        }
      `;

      const result = await rootClient.mutate(deleteMutation, {
        id: "cascade-org",
      });
      expect(result.data?.deleteOrganization).to.be.true;

      // Verify everything is gone
      // Check users are gone
      const usersQuery = gql`
        query ListUsers {
          users {
            nodes {
              id
            }
          }
        }
      `;

      try {
        await cascadeOrgClient.query(usersQuery);
      } catch {
        // Expected - org doesn't exist
      }

      // Check by identity to ensure user is completely gone
      const identityQuery = gql`
        query GetUsersByIdentity(
          $identityProvider: String!
          $identityProviderUserId: String!
        ) {
          usersByIdentity(
            identityProvider: $identityProvider
            identityProviderUserId: $identityProviderUserId
          ) {
            id
          }
        }
      `;

      const identityResult = await rootClient.query(identityQuery, {
        identityProvider: "auth0",
        identityProviderUserId: "auth0|cascade",
      });

      expect(identityResult.data?.usersByIdentity).to.deep.equal([]);
    });
  });

  describe("Empty String and Boundary Cases", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      // Organization-specific client will be created in individual tests
    });

    it("should handle empty string values in various fields", async () => {
      const testOrgClient = getTestOrgClient();
      // Try to create organization with empty description
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
            description
          }
        }
      `;

      const orgResult = await rootClient.mutate(orgMutation, {
        input: {
          id: "empty-desc-org",
          name: "Org with Empty Desc",
          description: "",
        },
      });

      expect(orgResult.data?.createOrganization?.description).to.equal("");

      // Create user with empty property value
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            properties {
              name
              value
            }
          }
        }
      `;

      const userResult = await testOrgClient.mutate(userMutation, {
        input: {
          id: "empty-property-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|empty",
          properties: [{ name: "notes", value: "" }],
        },
      });

      const notesProperty = userResult.data?.createUser?.properties.find(
        (p: any) => p.name === "notes",
      );
      expect(notesProperty?.value).to.equal("");
    });

    it("should handle very long strings", async () => {
      const longString = "a".repeat(10000); // 10k character string

      // Create organization with long description
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            description
          }
        }
      `;

      const result = await rootClient.mutate(orgMutation, {
        input: {
          id: "long-desc-org",
          name: "Long Description Org",
          description: longString,
        },
      });

      expect(result.data?.createOrganization?.description).to.have.lengthOf(
        10000,
      );
    });

    it("should handle special characters in IDs", async () => {
      // IDs with dots, dashes, underscores
      const specialIds = [
        "org.with.dots",
        "org-with-dashes",
        "org_with_underscores",
        "org123numeric",
        "ORG-UPPERCASE",
      ];

      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      for (const id of specialIds) {
        const result = await rootClient.mutate(orgMutation, {
          input: {
            id: id,
            name: `Org ${id}`,
          },
        });

        expect(result.data?.createOrganization?.id).to.equal(id);
      }
    });
  });

  describe("Concurrent Operations", () => {
    const getTestOrgClient = () => createOrgClient("test-org");

    beforeEach(async () => {
      // Create test organization using ROOT client
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });

      // Create organization-specific client
      const testOrgClient = getTestOrgClient();

      // Create test user
      const userMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(userMutation, {
        input: {
          id: "test-user",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|12345",
        },
      });

      // Create resource
      const resourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(resourceMutation, {
        input: {
          id: "/api/concurrent",
          name: "Concurrent Resource",
        },
      });
    });

    it("should handle concurrent permission grants", async () => {
      const testOrgClient = getTestOrgClient();
      const grantMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
            action
          }
        }
      `;

      // Grant multiple permissions concurrently
      const actions = ["read", "write", "delete", "admin"];
      const promises = actions.map((action) =>
        testOrgClient.mutate(grantMutation, {
          input: {
            userId: "test-user",
            resourceId: "/api/concurrent",
            action: action,
          },
        }),
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result, index) => {
        expect(result.data?.grantUserPermission?.action).to.equal(
          actions[index],
        );
      });

      // Verify all permissions were granted
      const query = gql`
        query GetUserPermissions($userId: ID!, $resourceId: String) {
          userPermissions(userId: $userId, resourceId: $resourceId) {
            action
          }
        }
      `;

      const queryResult = await testOrgClient.query(query, {
        userId: "test-user",
        resourceId: "/api/concurrent",
      });

      expect(queryResult.data?.userPermissions).to.have.lengthOf(4);
      const grantedActions = queryResult.data?.userPermissions.map(
        (p: any) => p.action,
      );
      expect(grantedActions).to.include.members(actions);
    });

    it("should handle duplicate permission grants gracefully", async () => {
      const testOrgClient = getTestOrgClient();
      const grantMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
            resourceId
            action
          }
        }
      `;

      // Grant same permission multiple times concurrently
      const promises = Array(5)
        .fill(null)
        .map(() =>
          testOrgClient.mutate(grantMutation, {
            input: {
              userId: "test-user",
              resourceId: "/api/concurrent",
              action: "read",
            },
          }),
        );

      const results = await Promise.all(promises);

      // All should succeed (idempotent operation)
      results.forEach((result) => {
        expect(result.data?.grantUserPermission?.action).to.equal("read");
      });

      // Verify only one permission exists
      const query = gql`
        query GetUserPermissions(
          $userId: ID!
          $resourceId: String
          $action: String
        ) {
          userPermissions(
            userId: $userId
            resourceId: $resourceId
            action: $action
          ) {
            action
          }
        }
      `;

      const queryResult = await testOrgClient.query(query, {
        userId: "test-user",
        resourceId: "/api/concurrent",
        action: "read",
      });

      expect(queryResult.data?.userPermissions).to.have.lengthOf(1);
    });
  });
});
