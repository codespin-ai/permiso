import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, rootClient } from "../index.js";

describe("Organizations", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe("createOrganization", () => {
    it("should create a new organization", async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const result = await rootClient.mutate(mutation, {
        input: {
          id: "org-123",
          name: "Test Organization",
          properties: [
            { name: "tier", value: "premium" },
            { name: "apiKey", value: "secret123", hidden: true },
          ],
        },
      });

      const org = result.data?.createOrganization;
      expect(org?.id).to.equal("org-123");
      expect(org?.name).to.equal("Test Organization");
      expect(org?.properties).to.have.lengthOf(2);

      const tierProp = org?.properties.find((p: any) => p.name === "tier");
      expect(tierProp).to.deep.include({
        name: "tier",
        value: "premium",
        hidden: false,
      });

      const apiKeyProp = org?.properties.find((p: any) => p.name === "apiKey");
      expect(apiKeyProp).to.deep.include({
        name: "apiKey",
        value: "secret123",
        hidden: true,
      });
    });

    it("should fail with duplicate organization ID", async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
          }
        }
      `;

      // Create first organization
      const firstResult = await rootClient.mutate(mutation, {
        input: {
          id: "org-dup-test",
          name: "First Organization",
        },
      });

      expect(firstResult.data?.createOrganization?.id).to.equal("org-dup-test");

      // Try to create duplicate
      try {
        const result = await rootClient.mutate(mutation, {
          input: {
            id: "org-dup-test",
            name: "Duplicate Organization",
          },
        });

        // Check if there are errors in the result (due to errorPolicy: 'all')
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message || "";
          expect(errorMessage.toLowerCase()).to.satisfy(
            (msg: string) =>
              msg.includes("duplicate") ||
              msg.includes("already exists") ||
              msg.includes("23505"),
          );
          return; // Test passes if we got the expected error
        }

        // If we get here, the duplicate was created when it shouldn't have been
        expect.fail(
          "Should have thrown an error for duplicate organization ID",
        );
      } catch (error: any) {
        // If this is our expect.fail error, re-throw it
        if (
          error.message?.includes(
            "Should have thrown an error for duplicate organization ID",
          )
        ) {
          throw error;
        }
        // Otherwise check for duplicate key error
        const errorMessage =
          error.graphQLErrors?.[0]?.message || error.message || "";
        expect(errorMessage.toLowerCase()).to.satisfy(
          (msg: string) =>
            msg.includes("duplicate") ||
            msg.includes("already exists") ||
            msg.includes("23505"),
        );
      }
    });
  });

  describe("organization query", () => {
    it("should retrieve an organization by ID", async () => {
      // Create organization first
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(createMutation, {
        input: {
          id: "org-query-test",
          name: "Test Organization",
          properties: [{ name: "tier", value: "premium" }],
        },
      });

      // Query the organization
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
            name
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

      const result = await rootClient.query(query, { id: "org-query-test" });

      expect(result.data?.organization?.id).to.equal("org-query-test");
      expect(result.data?.organization?.name).to.equal("Test Organization");
      expect(result.data?.organization?.properties).to.have.lengthOf(1);
      expect(result.data?.organization?.properties[0]).to.deep.include({
        name: "tier",
        value: "premium",
        hidden: false,
      });
      expect(result.data?.organization?.createdAt).to.be.a("number");
      expect(result.data?.organization?.updatedAt).to.be.a("number");
    });

    it("should return null for non-existent organization", async () => {
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
            name
          }
        }
      `;

      const result = await rootClient.query(query, { id: "non-existent" });

      expect(result.data?.organization).to.be.null;
    });
  });

  describe("organizations query", () => {
    it("should list all organizations", async () => {
      // Create multiple organizations
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await rootClient.mutate(mutation, {
        input: {
          id: "org-1",
          name: "Organization 1",
        },
      });

      await rootClient.mutate(mutation, {
        input: {
          id: "org-2",
          name: "Organization 2",
        },
      });

      // Query all organizations
      const query = gql`
        query ListOrganizations {
          organizations {
            nodes {
              id
              name
            }
          }
        }
      `;

      const result = await rootClient.query(query);

      expect(result.data?.organizations?.nodes).to.have.lengthOf(2);
      const orgIds = result.data?.organizations?.nodes.map((o: any) => o.id);
      expect(orgIds).to.include.members(["org-1", "org-2"]);
    });
  });

  describe("updateOrganization", () => {
    it("should update organization name", async () => {
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
          id: "org-update-test",
          name: "Original Name",
        },
      });

      // Update organization
      const updateMutation = gql`
        mutation UpdateOrganization(
          $id: ID!
          $input: UpdateOrganizationInput!
        ) {
          updateOrganization(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const result = await rootClient.mutate(updateMutation, {
        id: "org-update-test",
        input: {
          name: "Updated Name",
        },
      });

      expect(result.data?.updateOrganization?.name).to.equal("Updated Name");
    });
  });

  describe("deleteOrganization", () => {
    it("should delete an organization", async () => {
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
          id: "org-delete-test",
          name: "To Be Deleted",
        },
      });

      // Delete organization
      const deleteMutation = gql`
        mutation DeleteOrganization($id: ID!) {
          deleteOrganization(id: $id)
        }
      `;

      const result = await rootClient.mutate(deleteMutation, {
        id: "org-delete-test",
      });

      expect(result.data?.deleteOrganization).to.be.true;

      // Verify it's deleted
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
          }
        }
      `;

      const queryResult = await rootClient.query(query, {
        id: "org-delete-test",
      });

      expect(queryResult.data?.organization).to.be.null;
    });
  });
});
