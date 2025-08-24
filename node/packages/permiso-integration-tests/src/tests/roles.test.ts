import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, client, rootClient, switchToOrgContext, createOrgClient } from "../index.js";

describe("Roles", () => {
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

    // Switch to organization context for RLS operations
    switchToOrgContext("test-org");
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

    it("should fail when trying to access non-existent organization", async () => {
      // Switch to a non-existent organization context
      const nonExistentOrgClient = createOrgClient("non-existent-org");
      
      const mutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      try {
        const result = await nonExistentOrgClient.mutate(mutation, {
          input: {
            id: "admin",
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
          name: "Administrator",
        },
      });

      await client.mutate(createRoleMutation, {
        input: {
          id: "user",
          name: "User",
        },
      });

      // Query roles
      const query = gql`
        query ListRoles {
          roles {
            nodes {
              id
              orgId
              name
              description
            }
          }
        }
      `;

      const result = await client.query(query, {});

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
          name: "Administrator",
          description: "Full access",
          properties: [{ name: "level", value: "high" }],
        },
      });

      // Query role
      const query = gql`
        query GetRole($roleId: ID!) {
          role(roleId: $roleId) {
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
          name: "Administrator",
        },
      });

      // Update role
      const updateMutation = gql`
        mutation UpdateRole(
          $roleId: ID!
          $input: UpdateRoleInput!
        ) {
          updateRole(roleId: $roleId, input: $input) {
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
          $roleId: ID!
          $name: String!
          $value: JSON
          $hidden: Boolean
        ) {
          setRoleProperty(
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

      const setPropResult = await client.mutate(setPropMutation, {
        roleId: "admin",
        name: "level",
        value: "maximum",
      });
      
      // Check if the mutation succeeded
      expect(setPropResult.data?.setRoleProperty).to.exist;
      expect(setPropResult.data?.setRoleProperty.name).to.equal("level");
      expect(setPropResult.data?.setRoleProperty.value).to.equal("maximum");

      // Query role to verify property
      const query = gql`
        query GetRole($roleId: ID!) {
          role(roleId: $roleId) {
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const roleResult = await client.query(query, {
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
          name: "Administrator",
        },
      });

      // Delete role
      const deleteMutation = gql`
        mutation DeleteRole($roleId: ID!) {
          deleteRole(roleId: $roleId)
        }
      `;

      const result = await client.mutate(deleteMutation, {
        roleId: "admin",
      });

      expect(result.data?.deleteRole).to.be.true;

      // Verify deletion
      const query = gql`
        query GetRole($roleId: ID!) {
          role(roleId: $roleId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, {
        roleId: "admin",
      });

      expect(queryResult.data?.role).to.be.null;
    });
  });
});
