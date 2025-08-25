import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, rootClient, createOrgClient } from "../index.js";

describe("Resources", () => {
  let testOrgClient: ReturnType<typeof createOrgClient>;

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

    // Create organization-specific client
    testOrgClient = createOrgClient("test-org");
  });

  describe("createResource", () => {
    it("should create a new resource", async () => {
      const mutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
            orgId
            name
            description
          }
        }
      `;

      const result = await testOrgClient.mutate(mutation, {
        input: {
          id: "/api/users/*",
          name: "User API",
          description: "User management endpoints",
        },
      });

      const resource = result.data?.createResource;
      expect(resource?.id).to.equal("/api/users/*");
      expect(resource?.orgId).to.equal("test-org");
      expect(resource?.name).to.equal("User API");
      expect(resource?.description).to.equal("User management endpoints");
    });

    it("should fail when trying to access non-existent organization", async () => {
      // Switch to a non-existent organization context
      const nonExistentOrgClient = createOrgClient("non-existent-org");

      const mutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      try {
        const result = await nonExistentOrgClient.mutate(mutation, {
          input: {
            id: "/api/users/*",
            name: "User API",
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

  describe("resources query", () => {
    it("should list resources in an organization", async () => {
      const createResourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      // Create multiple resources
      await testOrgClient.mutate(createResourceMutation, {
        input: {
          id: "/api/users/*",
          name: "User API",
        },
      });

      await testOrgClient.mutate(createResourceMutation, {
        input: {
          id: "/api/roles/*",
          name: "Role API",
        },
      });

      // Query resources
      const query = gql`
        query ListResources {
          resources {
            nodes {
              id
              orgId
              name
              description
            }
          }
        }
      `;

      const result = await testOrgClient.query(query, {});

      expect(result.data?.resources?.nodes).to.have.lengthOf(2);
      const resourceIds = result.data?.resources?.nodes.map((r: any) => r.id);
      expect(resourceIds).to.include.members(["/api/users/*", "/api/roles/*"]);
    });
  });

  describe("resource query", () => {
    it("should retrieve a resource by orgId and resourceId", async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "/api/users/*",
          name: "User API",
          description: "User management",
        },
      });

      // Query resource
      const query = gql`
        query GetResource($resourceId: ID!) {
          resource(resourceId: $resourceId) {
            id
            orgId
            name
            description
            createdAt
            updatedAt
          }
        }
      `;

      const result = await testOrgClient.query(query, {
        resourceId: "/api/users/*",
      });

      expect(result.data?.resource?.id).to.equal("/api/users/*");
      expect(result.data?.resource?.name).to.equal("User API");
      expect(result.data?.resource?.description).to.equal("User management");
    });
  });

  describe("updateResource", () => {
    it("should update resource details", async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "/api/users/*",
          name: "User API",
        },
      });

      // Update resource
      const updateMutation = gql`
        mutation UpdateResource(
          $resourceId: ID!
          $input: UpdateResourceInput!
        ) {
          updateResource(resourceId: $resourceId, input: $input) {
            id
            name
            description
          }
        }
      `;

      const result = await testOrgClient.mutate(updateMutation, {
        resourceId: "/api/users/*",
        input: {
          name: "User API v2",
          description: "Enhanced user management",
        },
      });

      expect(result.data?.updateResource?.id).to.equal("/api/users/*");
      expect(result.data?.updateResource?.name).to.equal("User API v2");
      expect(result.data?.updateResource?.description).to.equal(
        "Enhanced user management",
      );
    });
  });

  describe("deleteResource", () => {
    it("should delete a resource", async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await testOrgClient.mutate(createMutation, {
        input: {
          id: "/api/users/*",
          name: "User API",
        },
      });

      // Delete resource
      const deleteMutation = gql`
        mutation DeleteResource($resourceId: ID!) {
          deleteResource(resourceId: $resourceId)
        }
      `;

      const result = await testOrgClient.mutate(deleteMutation, {
        resourceId: "/api/users/*",
      });

      expect(result.data?.deleteResource).to.be.true;

      // Verify deletion
      const query = gql`
        query GetResource($resourceId: ID!) {
          resource(resourceId: $resourceId) {
            id
          }
        }
      `;

      const queryResult = await testOrgClient.query(query, {
        resourceId: "/api/users/*",
      });

      expect(queryResult.data?.resource).to.be.null;
    });
  });
});
