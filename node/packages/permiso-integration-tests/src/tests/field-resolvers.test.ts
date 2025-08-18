import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, client } from "../index.js";

describe("Field Resolvers and Nested Queries", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();

    // Create test data
    await setupTestData();
  });

  async function setupTestData() {
    // Create organizations
    const orgMutation = gql`
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
        }
      }
    `;

    await client.mutate(orgMutation, {
      input: {
        id: "acme-corp",
        name: "ACME Corporation",
        description: "A test organization",
        properties: [
          { name: "tier", value: "enterprise" },
          { name: "employees", value: 500 },
        ],
      },
    });

    await client.mutate(orgMutation, {
      input: {
        id: "startup-inc",
        name: "Startup Inc",
        properties: [{ name: "tier", value: "startup" }],
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

    await client.mutate(roleMutation, {
      input: {
        id: "admin",
        orgId: "acme-corp",
        name: "Administrator",
        description: "Full system access",
        properties: [{ name: "level", value: "super" }],
      },
    });

    await client.mutate(roleMutation, {
      input: {
        id: "editor",
        orgId: "acme-corp",
        name: "Editor",
        description: "Content management access",
      },
    });

    await client.mutate(roleMutation, {
      input: {
        id: "viewer",
        orgId: "acme-corp",
        name: "Viewer",
        description: "Read-only access",
      },
    });

    // Create users
    const userMutation = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
        }
      }
    `;

    await client.mutate(userMutation, {
      input: {
        id: "john-doe",
        orgId: "acme-corp",
        identityProvider: "google",
        identityProviderUserId: "google|john",
        properties: [
          { name: "department", value: "engineering" },
          { name: "level", value: "senior" },
          { name: "email", value: "john@acme.com" },
        ],
        roleIds: ["admin", "editor"],
      },
    });

    await client.mutate(userMutation, {
      input: {
        id: "jane-smith",
        orgId: "acme-corp",
        identityProvider: "auth0",
        identityProviderUserId: "auth0|jane",
        properties: [{ name: "department", value: "sales" }],
        roleIds: ["viewer"],
      },
    });

    await client.mutate(userMutation, {
      input: {
        id: "bob-wilson",
        orgId: "acme-corp",
        identityProvider: "google",
        identityProviderUserId: "google|bob",
        roleIds: ["editor"],
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

    await client.mutate(resourceMutation, {
      input: {
        id: "/api/users",
        orgId: "acme-corp",
        name: "Users API",
        description: "User management endpoints",
      },
    });

    await client.mutate(resourceMutation, {
      input: {
        id: "/api/users/*",
        orgId: "acme-corp",
        name: "User Details API",
      },
    });

    await client.mutate(resourceMutation, {
      input: {
        id: "/api/posts/*",
        orgId: "acme-corp",
        name: "Posts API",
      },
    });

    await client.mutate(resourceMutation, {
      input: {
        id: "/admin/*",
        orgId: "acme-corp",
        name: "Admin Panel",
      },
    });

    // Grant permissions
    const grantUserMutation = gql`
      mutation GrantUserPermission($input: GrantUserPermissionInput!) {
        grantUserPermission(input: $input) {
          userId
        }
      }
    `;

    await client.mutate(grantUserMutation, {
      input: {
        orgId: "acme-corp",
        userId: "john-doe",
        resourceId: "/admin/*",
        action: "admin",
      },
    });

    await client.mutate(grantUserMutation, {
      input: {
        orgId: "acme-corp",
        userId: "jane-smith",
        resourceId: "/api/users",
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

    await client.mutate(grantRoleMutation, {
      input: {
        orgId: "acme-corp",
        roleId: "admin",
        resourceId: "/api/users/*",
        action: "write",
      },
    });

    await client.mutate(grantRoleMutation, {
      input: {
        orgId: "acme-corp",
        roleId: "admin",
        resourceId: "/api/users/*",
        action: "delete",
      },
    });

    await client.mutate(grantRoleMutation, {
      input: {
        orgId: "acme-corp",
        roleId: "editor",
        resourceId: "/api/posts/*",
        action: "write",
      },
    });

    await client.mutate(grantRoleMutation, {
      input: {
        orgId: "acme-corp",
        roleId: "viewer",
        resourceId: "/api/users/*",
        action: "read",
      },
    });

    await client.mutate(grantRoleMutation, {
      input: {
        orgId: "acme-corp",
        roleId: "viewer",
        resourceId: "/api/posts/*",
        action: "read",
      },
    });
  }

  describe("Organization Field Resolvers", () => {
    it("should resolve nested users with pagination and filtering", async () => {
      const query = gql`
        query GetOrganizationWithUsers(
          $id: ID!
          $userFilter: UserFilter
          $userPagination: PaginationInput
        ) {
          organization(id: $id) {
            id
            name
            users(filter: $userFilter, pagination: $userPagination) {
              nodes {
                id
                identityProvider
                properties {
                  name
                  value
                }
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        }
      `;

      // Test with filter
      const result = await client.query(query, {
        id: "acme-corp",
        userFilter: {
          properties: [{ name: "department", value: "engineering" }],
        },
      });

      expect(result.data?.organization?.users?.nodes).to.have.lengthOf(1);
      expect(result.data?.organization?.users?.nodes[0].id).to.equal(
        "john-doe",
      );
      expect(result.data?.organization?.users?.totalCount).to.equal(1);

      // Test with pagination
      const paginatedResult = await client.query(query, {
        id: "acme-corp",
        userPagination: { limit: 2, offset: 0 },
      });

      expect(paginatedResult.data?.organization?.users?.nodes).to.have.lengthOf(
        2,
      );
      expect(paginatedResult.data?.organization?.users?.totalCount).to.equal(3);
      expect(paginatedResult.data?.organization?.users?.pageInfo?.hasNextPage)
        .to.be.true;
    });

    it("should resolve nested roles with filtering", async () => {
      const query = gql`
        query GetOrganizationWithRoles($id: ID!, $roleFilter: RoleFilter) {
          organization(id: $id) {
            id
            name
            roles(filter: $roleFilter) {
              nodes {
                id
                name
                description
                properties {
                  name
                  value
                }
              }
              totalCount
            }
          }
        }
      `;

      // Test with property filter
      const result = await client.query(query, {
        id: "acme-corp",
        roleFilter: {
          properties: [{ name: "level", value: "super" }],
        },
      });

      expect(result.data?.organization?.roles?.nodes).to.have.lengthOf(1);
      expect(result.data?.organization?.roles?.nodes[0].id).to.equal("admin");
      expect(result.data?.organization?.roles?.totalCount).to.equal(1);

      // Test without filter
      const allRolesResult = await client.query(query, {
        id: "acme-corp",
      });

      expect(allRolesResult.data?.organization?.roles?.nodes).to.have.lengthOf(
        3,
      );
      expect(allRolesResult.data?.organization?.roles?.totalCount).to.equal(3);
    });

    it("should resolve nested resources with filtering", async () => {
      const query = gql`
        query GetOrganizationWithResources(
          $id: ID!
          $resourceFilter: ResourceFilter
        ) {
          organization(id: $id) {
            id
            name
            resources(filter: $resourceFilter) {
              nodes {
                id
                name
                description
              }
              totalCount
            }
          }
        }
      `;

      // Test with ID prefix filter
      const result = await client.query(query, {
        id: "acme-corp",
        resourceFilter: {
          idPrefix: "/api/",
        },
      });

      expect(result.data?.organization?.resources?.nodes).to.have.lengthOf(3);
      const resourceIds = result.data?.organization?.resources?.nodes.map(
        (r: any) => r.id,
      );
      expect(resourceIds).to.include.members([
        "/api/users",
        "/api/users/*",
        "/api/posts/*",
      ]);
      expect(resourceIds).to.not.include("/admin/*");
    });
  });

  describe("User Field Resolvers", () => {
    it("should resolve user organization", async () => {
      const query = gql`
        query GetUserWithOrganization($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            organization {
              id
              name
              description
              properties {
                name
                value
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      expect(result.data?.user?.organization?.id).to.equal("acme-corp");
      expect(result.data?.user?.organization?.name).to.equal(
        "ACME Corporation",
      );
      expect(result.data?.user?.organization?.properties).to.have.lengthOf(2);
    });

    it("should resolve user roles", async () => {
      const query = gql`
        query GetUserWithRoles($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            roles {
              id
              name
              description
              properties {
                name
                value
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      expect(result.data?.user?.roles).to.have.lengthOf(2);
      const roleIds = result.data?.user?.roles.map((r: any) => r.id);
      expect(roleIds).to.include.members(["admin", "editor"]);

      const adminRole = result.data?.user?.roles.find(
        (r: any) => r.id === "admin",
      );
      expect(adminRole?.properties).to.have.lengthOf(1);
      expect(adminRole?.properties[0]).to.deep.include({
        name: "level",
        value: "super",
      });
    });

    it("should resolve user permissions", async () => {
      const query = gql`
        query GetUserWithPermissions($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            permissions {
              resourceId
              action
              createdAt
              resource {
                id
                name
                description
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      expect(result.data?.user?.permissions).to.have.lengthOf(1);
      expect(result.data?.user?.permissions[0].resourceId).to.equal("/admin/*");
      expect(result.data?.user?.permissions[0].action).to.equal("admin");
      expect(result.data?.user?.permissions[0].resource?.name).to.equal(
        "Admin Panel",
      );
    });

    it("should resolve user effective permissions with filtering", async () => {
      const query = gql`
        query GetUserEffectivePermissions(
          $orgId: ID!
          $userId: ID!
          $resourceId: String
          $action: String
        ) {
          user(orgId: $orgId, userId: $userId) {
            id
            effectivePermissions(resourceId: $resourceId, action: $action) {
              resourceId
              action
              source
              sourceId
            }
          }
        }
      `;

      // Test without filters - should get all effective permissions
      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      // john-doe has: direct admin on /admin/*, write and delete on /api/users/* via admin role, write on /api/posts/* via editor role
      expect(result.data?.user?.effectivePermissions.length).to.be.at.least(4);

      // Test with resource filter
      const filteredResult = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
        resourceId: "/api/users/123",
      });

      const userApiPermissions =
        filteredResult.data?.user?.effectivePermissions;
      const actions = userApiPermissions.map((p: any) => p.action);
      expect(actions).to.include.members(["write", "delete"]);

      // All should be from role 'admin'
      userApiPermissions.forEach((p: any) => {
        if (p.resourceId === "/api/users/*") {
          expect(p.source).to.equal("role");
          expect(p.sourceId).to.equal("admin");
        }
      });

      // Test with action filter
      const actionFilteredResult = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
        action: "write",
      });

      const writePermissions =
        actionFilteredResult.data?.user?.effectivePermissions;
      writePermissions.forEach((p: any) => {
        expect(p.action).to.equal("write");
      });
    });
  });

  describe("Role Field Resolvers", () => {
    it("should resolve role organization", async () => {
      const query = gql`
        query GetRoleWithOrganization($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
            organization {
              id
              name
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        roleId: "admin",
      });

      expect(result.data?.role?.organization?.id).to.equal("acme-corp");
      expect(result.data?.role?.organization?.name).to.equal(
        "ACME Corporation",
      );
    });

    it("should resolve role users", async () => {
      const query = gql`
        query GetRoleWithUsers($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
            users {
              id
              identityProvider
              identityProviderUserId
              properties {
                name
                value
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        roleId: "editor",
      });

      expect(result.data?.role?.users).to.have.lengthOf(2);
      const userIds = result.data?.role?.users.map((u: any) => u.id);
      expect(userIds).to.include.members(["john-doe", "bob-wilson"]);
    });

    it("should resolve role permissions", async () => {
      const query = gql`
        query GetRoleWithPermissions($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
            permissions {
              resourceId
              action
              createdAt
              resource {
                id
                name
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        roleId: "viewer",
      });

      expect(result.data?.role?.permissions).to.have.lengthOf(2);
      const permissions = result.data?.role?.permissions;
      const actions = permissions.map((p: any) => ({
        resourceId: p.resourceId,
        action: p.action,
      }));

      expect(actions).to.deep.include.members([
        { resourceId: "/api/users/*", action: "read" },
        { resourceId: "/api/posts/*", action: "read" },
      ]);

      // Check nested resource resolution
      permissions.forEach((p: any) => {
        expect(p.resource).to.not.be.null;
        expect(p.resource.id).to.equal(p.resourceId);
      });
    });
  });

  describe("Resource Field Resolvers", () => {
    it("should resolve resource organization", async () => {
      const query = gql`
        query GetResourceWithOrganization($orgId: ID!, $resourceId: ID!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
            organization {
              id
              name
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        resourceId: "/api/users/*",
      });

      expect(result.data?.resource?.organization?.id).to.equal("acme-corp");
      expect(result.data?.resource?.organization?.name).to.equal(
        "ACME Corporation",
      );
    });

    it("should resolve resource permissions", async () => {
      const query = gql`
        query GetResourceWithPermissions($orgId: ID!, $resourceId: ID!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
            permissions {
              __typename
              action
              createdAt
              ... on UserPermission {
                userId
                user {
                  id
                  identityProvider
                }
              }
              ... on RolePermission {
                roleId
                role {
                  id
                  name
                }
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        resourceId: "/api/users/*",
      });

      expect(result.data?.resource?.permissions.length).to.be.at.least(3);

      // Check for role permissions (admin role has write and delete)
      const rolePermissions = result.data?.resource?.permissions.filter(
        (p: any) => p.__typename === "RolePermission",
      );
      expect(rolePermissions.length).to.be.at.least(3); // admin has write/delete, viewer has read

      const adminPermissions = rolePermissions.filter(
        (p: any) => p.roleId === "admin",
      );
      const adminActions = adminPermissions.map((p: any) => p.action);
      expect(adminActions).to.include.members(["write", "delete"]);

      // Check nested role resolution
      adminPermissions.forEach((p: any) => {
        expect(p.role?.name).to.equal("Administrator");
      });
    });
  });

  describe("Permission Field Resolvers", () => {
    it("should resolve permission organization", async () => {
      const query = gql`
        query GetUserPermissions($orgId: ID!, $userId: ID!) {
          userPermissions(orgId: $orgId, userId: $userId) {
            resourceId
            action
            organization {
              id
              name
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      expect(result.data?.userPermissions).to.have.lengthOf(1);
      expect(result.data?.userPermissions[0].organization?.id).to.equal(
        "acme-corp",
      );
      expect(result.data?.userPermissions[0].organization?.name).to.equal(
        "ACME Corporation",
      );
    });

    it("should resolve permission resource", async () => {
      const query = gql`
        query GetRolePermissions($orgId: ID!, $roleId: ID!) {
          rolePermissions(orgId: $orgId, roleId: $roleId) {
            resourceId
            action
            resource {
              id
              name
              description
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        roleId: "admin",
      });

      expect(result.data?.rolePermissions.length).to.be.at.least(2);
      result.data?.rolePermissions.forEach((p: any) => {
        expect(p.resource).to.not.be.null;
        expect(p.resource.id).to.equal(p.resourceId);
        expect(p.resource.name).to.be.a("string");
      });
    });
  });

  describe("Deep Nested Queries", () => {
    it("should handle deeply nested queries efficiently", async () => {
      const query = gql`
        query DeepNestedQuery($orgId: ID!) {
          organization(id: $orgId) {
            id
            name
            users(pagination: { limit: 5 }) {
              nodes {
                id
                roles {
                  id
                  name
                  permissions {
                    resourceId
                    action
                    resource {
                      id
                      name
                      organization {
                        id
                        name
                      }
                    }
                  }
                }
                permissions {
                  resourceId
                  action
                  resource {
                    id
                    permissions {
                      __typename
                      action
                    }
                  }
                }
                effectivePermissions {
                  resourceId
                  action
                  source
                }
              }
            }
            roles {
              nodes {
                id
                users {
                  id
                  organization {
                    id
                  }
                }
                permissions {
                  resourceId
                  action
                  resource {
                    id
                  }
                }
              }
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: "acme-corp" });

      // Verify the structure is resolved correctly
      const org = result.data?.organization;
      expect(org?.id).to.equal("acme-corp");

      // Check users
      expect(org?.users?.nodes).to.have.length.at.least(1);
      const user = org?.users?.nodes[0];
      expect(user?.roles).to.have.length.at.least(1);

      // Check role permissions are resolved
      const role = user?.roles[0];
      expect(role?.permissions).to.have.length.at.least(1);
      expect(role?.permissions[0]?.resource?.id).to.be.a("string");
      expect(role?.permissions[0]?.resource?.organization?.id).to.equal(
        "acme-corp",
      );

      // Check effective permissions
      expect(user?.effectivePermissions).to.have.length.at.least(1);

      // Check roles
      expect(org?.roles?.nodes).to.have.length.at.least(1);
      const orgRole = org?.roles?.nodes[0];
      expect(orgRole?.users).to.have.length.at.least(0);
      expect(orgRole?.permissions).to.have.length.at.least(0);
    });

    it("should handle circular references in nested queries", async () => {
      const query = gql`
        query CircularQuery($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            organization {
              id
              users(pagination: { limit: 2 }) {
                nodes {
                  id
                  organization {
                    id
                    name
                  }
                  roles {
                    id
                    users {
                      id
                      roles {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      // Verify circular references are handled correctly
      const user = result.data?.user;
      expect(user?.id).to.equal("john-doe");
      expect(user?.organization?.id).to.equal("acme-corp");

      const orgUsers = user?.organization?.users?.nodes;
      expect(orgUsers).to.have.length.at.least(1);

      // Check that nested organization reference works
      orgUsers?.forEach((u: any) => {
        expect(u.organization?.id).to.equal("acme-corp");

        // Check role users
        u.roles?.forEach((r: any) => {
          expect(r.users).to.have.length.at.least(1);
          r.users?.forEach((ru: any) => {
            expect(ru.roles).to.have.length.at.least(1);
          });
        });
      });
    });
  });

  describe("Complex Query Scenarios", () => {
    it("should handle mixed queries with multiple root fields", async () => {
      const query = gql`
        query ComplexMultiRootQuery($orgId: ID!) {
          organization(id: $orgId) {
            id
            name
            users {
              totalCount
            }
          }
          users(orgId: $orgId, pagination: { limit: 1 }) {
            nodes {
              id
              roles {
                id
              }
            }
            totalCount
          }
          roles(orgId: $orgId) {
            nodes {
              id
              users {
                id
              }
            }
          }
          resources(orgId: $orgId, filter: { idPrefix: "/api/" }) {
            nodes {
              id
              permissions {
                __typename
                action
              }
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: "acme-corp" });

      // Verify all root fields resolved
      expect(result.data?.organization?.id).to.equal("acme-corp");
      expect(result.data?.organization?.users?.totalCount).to.equal(3);

      expect(result.data?.users?.nodes).to.have.lengthOf(1);
      expect(result.data?.users?.totalCount).to.equal(3);

      expect(result.data?.roles?.nodes).to.have.length.at.least(1);

      expect(result.data?.resources?.nodes).to.have.length.at.least(1);
      result.data?.resources?.nodes.forEach((r: any) => {
        expect(r.id).to.match(/^\/api\//);
      });
    });

    it("should handle field aliases correctly", async () => {
      const query = gql`
        query AliasedQuery($orgId: ID!, $userId: ID!) {
          primaryUser: user(orgId: $orgId, userId: $userId) {
            id
            userRoles: roles {
              roleId: id
              roleName: name
            }
            directPerms: permissions {
              res: resourceId
              act: action
            }
          }
          allUsers: users(orgId: $orgId) {
            count: totalCount
            items: nodes {
              userId: id
            }
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "acme-corp",
        userId: "john-doe",
      });

      // Check aliases work correctly
      expect(result.data?.primaryUser?.id).to.equal("john-doe");
      expect(result.data?.primaryUser?.userRoles).to.have.length.at.least(1);
      expect(result.data?.primaryUser?.userRoles[0]).to.have.property("roleId");
      expect(result.data?.primaryUser?.userRoles[0]).to.have.property(
        "roleName",
      );

      expect(result.data?.primaryUser?.directPerms).to.have.length.at.least(1);
      expect(result.data?.primaryUser?.directPerms[0]).to.have.property("res");
      expect(result.data?.primaryUser?.directPerms[0]).to.have.property("act");

      expect(result.data?.allUsers?.count).to.equal(3);
      expect(result.data?.allUsers?.items).to.have.lengthOf(3);
      expect(result.data?.allUsers?.items[0]).to.have.property("userId");
    });

    it("should handle fragments correctly", async () => {
      const query = gql`
        fragment UserBasics on User {
          id
          identityProvider
          identityProviderUserId
        }

        fragment RoleDetails on Role {
          id
          name
          description
          properties {
            name
            value
          }
        }

        query FragmentQuery($orgId: ID!) {
          users(orgId: $orgId) {
            nodes {
              ...UserBasics
              roles {
                ...RoleDetails
              }
            }
          }
          roles(orgId: $orgId) {
            nodes {
              ...RoleDetails
              users {
                ...UserBasics
              }
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: "acme-corp" });

      // Verify fragments expanded correctly
      expect(result.data?.users?.nodes).to.have.length.at.least(1);
      const user = result.data?.users?.nodes[0];
      expect(user).to.include.all.keys([
        "id",
        "identityProvider",
        "identityProviderUserId",
        "roles",
      ]);

      if (user?.roles?.length > 0) {
        const role = user.roles[0];
        expect(role).to.include.all.keys([
          "id",
          "name",
          "description",
          "properties",
        ]);
      }

      expect(result.data?.roles?.nodes).to.have.length.at.least(1);
      const roleNode = result.data?.roles?.nodes[0];
      expect(roleNode).to.include.all.keys([
        "id",
        "name",
        "description",
        "properties",
        "users",
      ]);
    });
  });
});
