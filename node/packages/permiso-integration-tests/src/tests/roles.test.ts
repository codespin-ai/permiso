import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, client } from "../index.js";

describe("Roles", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();

    // Create test organization
    const mutation = gql`
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
        }
      }
    `;

    await client.mutate(mutation, {
      input: {
        id: "test-org",
        name: "Test Organization",
      },
    });
  });

  describe("createRole", () => {
    it("should create a new role", async () => {
      const mutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
            orgId
            name
            description
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const result = await client.mutate(mutation, {
        input: {
          id: "admin",
          orgId: "test-org",
          name: "Administrator",
          description: "Full system access",
          properties: [
            { name: "level", value: "high" },
            { name: "apiAccess", value: "true", hidden: true },
          ],
        },
      });

      const role = result.data?.createRole;
      expect(role?.id).to.equal("admin");
      expect(role?.orgId).to.equal("test-org");
      expect(role?.name).to.equal("Administrator");
      expect(role?.description).to.equal("Full system access");
      expect(role?.properties).to.have.lengthOf(2);

      const levelProp = role?.properties.find((p: any) => p.name === "level");
      expect(levelProp).to.include({
        name: "level",
        value: "high",
        hidden: false,
      });

      const apiProp = role?.properties.find((p: any) => p.name === "apiAccess");
      expect(apiProp).to.include({
        name: "apiAccess",
        value: "true",
        hidden: true,
      });
    });

    it("should fail with non-existent organization", async () => {
      const mutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      try {
        const result = await client.mutate(mutation, {
          input: {
            id: "admin",
            orgId: "non-existent-org",
            name: "Administrator",
          },
        });

        // Check if there are errors in the response
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message.toLowerCase();
          expect(errorMessage).to.satisfy(
            (msg: string) =>
              msg.includes("foreign key violation") ||
              msg.includes("is not present in table") ||
              msg.includes("constraint"),
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
            msg.includes("constraint"),
        );
      }
    });
  });

  describe("roles query", () => {
    it("should list roles in an organization", async () => {
      const createRoleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      // Create multiple roles
      await client.mutate(createRoleMutation, {
        input: {
          id: "admin",
          orgId: "test-org",
          name: "Administrator",
        },
      });

      await client.mutate(createRoleMutation, {
        input: {
          id: "user",
          orgId: "test-org",
          name: "User",
        },
      });

      // Query roles
      const query = gql`
        query ListRoles($orgId: ID!) {
          roles(orgId: $orgId) {
            nodes {
              id
              orgId
              name
              description
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: "test-org" });

      expect(result.data?.roles?.nodes).to.have.lengthOf(2);
      const roleIds = result.data?.roles?.nodes.map((r: any) => r.id);
      expect(roleIds).to.include.members(["admin", "user"]);
    });
  });

  describe("role query", () => {
    it("should retrieve a role by orgId and roleId", async () => {
      // Create role
      const createMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "admin",
          orgId: "test-org",
          name: "Administrator",
          description: "Full access",
          properties: [{ name: "level", value: "high" }],
        },
      });

      // Query role
      const query = gql`
        query GetRole($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
            orgId
            name
            description
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

      const result = await client.query(query, {
        orgId: "test-org",
        roleId: "admin",
      });

      expect(result.data?.role?.id).to.equal("admin");
      expect(result.data?.role?.name).to.equal("Administrator");
      expect(result.data?.role?.description).to.equal("Full access");
      expect(result.data?.role?.properties).to.have.lengthOf(1);
      const prop = result.data?.role?.properties[0];
      expect(prop).to.include({ name: "level", value: "high", hidden: false });
    });
  });

  describe("updateRole", () => {
    it("should update role details", async () => {
      // Create role
      const createMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "admin",
          orgId: "test-org",
          name: "Administrator",
        },
      });

      // Update role
      const updateMutation = gql`
        mutation UpdateRole(
          $orgId: ID!
          $roleId: ID!
          $input: UpdateRoleInput!
        ) {
          updateRole(orgId: $orgId, roleId: $roleId, input: $input) {
            id
            name
            description
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const result = await client.mutate(updateMutation, {
        orgId: "test-org",
        roleId: "admin",
        input: {
          name: "Super Administrator",
          description: "Enhanced admin privileges",
        },
      });

      expect(result.data?.updateRole?.name).to.equal("Super Administrator");
      expect(result.data?.updateRole?.description).to.equal(
        "Enhanced admin privileges",
      );

      // Set role property separately
      const setPropMutation = gql`
        mutation SetRoleProperty(
          $orgId: ID!
          $roleId: ID!
          $name: String!
          $value: JSON
          $hidden: Boolean
        ) {
          setRoleProperty(
            orgId: $orgId
            roleId: $roleId
            name: $name
            value: $value
            hidden: $hidden
          ) {
            name
            value
            hidden
          }
        }
      `;

      await client.mutate(setPropMutation, {
        orgId: "test-org",
        roleId: "admin",
        name: "level",
        value: "maximum",
      });

      // Query role to verify property
      const query = gql`
        query GetRole($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const roleResult = await client.query(query, {
        orgId: "test-org",
        roleId: "admin",
      });
      expect(roleResult.data?.role?.properties).to.have.lengthOf(1);
      const prop = roleResult.data?.role?.properties[0];
      expect(prop).to.include({
        name: "level",
        value: "maximum",
        hidden: false,
      });
    });
  });

  describe("deleteRole", () => {
    it("should delete a role", async () => {
      // Create role
      const createMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "admin",
          orgId: "test-org",
          name: "Administrator",
        },
      });

      // Delete role
      const deleteMutation = gql`
        mutation DeleteRole($orgId: ID!, $roleId: ID!) {
          deleteRole(orgId: $orgId, roleId: $roleId)
        }
      `;

      const result = await client.mutate(deleteMutation, {
        orgId: "test-org",
        roleId: "admin",
      });

      expect(result.data?.deleteRole).to.be.true;

      // Verify deletion
      const query = gql`
        query GetRole($orgId: ID!, $roleId: ID!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, {
        orgId: "test-org",
        roleId: "admin",
      });

      expect(queryResult.data?.role).to.be.null;
    });
  });
});
