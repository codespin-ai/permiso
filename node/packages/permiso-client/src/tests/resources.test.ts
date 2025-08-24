import { expect } from "chai";
import { createOrganization } from "../api/organizations.js";
import {
  createResource,
  getResource,
  listResources,
  getResourcesByIdPrefix,
  updateResource,
  deleteResource,
} from "../api/resources.js";
import { getTestConfig, generateTestId } from "./utils/test-helpers.js";
import "./setup.js";

describe("Resources API", () => {
  let config: ReturnType<typeof getTestConfig>;
  let testOrgId: string;

  beforeEach(async () => {
    // Create a test organization for each test
    testOrgId = generateTestId("org");
    const rootConfig = getTestConfig(); // Use $ROOT to create org
    const orgResult = await createOrganization(rootConfig, {
      id: testOrgId,
      name: "Test Organization",
    });
    expect(orgResult.success).to.be.true;

    // Update config with the test org ID for subsequent operations
    config = { ...rootConfig, orgId: testOrgId };
  });

  describe("createResource", () => {
    it("should create a resource successfully", async () => {
      const resourceId = "/api/users/*";
      const result = await createResource(config, {
        id: resourceId,
        name: "User API",
        description: "All user-related API endpoints",
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.id).to.equal(resourceId);
        expect(result.data.orgId).to.equal(testOrgId);
        expect(result.data.name).to.equal("User API");
        expect(result.data.description).to.equal(
          "All user-related API endpoints",
        );
      }
    });

    it("should create resources with path-like IDs", async () => {
      const testCases = [
        { id: "/api/posts/*/comments", name: "Post Comments" },
        { id: "/documents/public/*", name: "Public Documents" },
        { id: "/features/billing", name: "Billing Feature" },
        { id: "/*", name: "All Resources" },
      ];

      for (const testCase of testCases) {
        const result = await createResource(config, {
          id: testCase.id,
          name: testCase.name,
        });
        expect(result.success).to.be.true;
        if (result.success) {
          expect(result.data.id).to.equal(testCase.id);
        }
      }
    });

    it("should handle duplicate resource creation", async () => {
      const resourceId = "/api/products/*";

      // Create first resource
      const result1 = await createResource(config, {
        id: resourceId,
        name: "Products API",
      });
      expect(result1.success).to.be.true;

      // Try to create duplicate
      const result2 = await createResource(config, {
        id: resourceId,
        name: "Duplicate Products",
      });
      expect(result2.success).to.be.false;
      if (!result2.success) {
        expect(result2.error.message).to.include("duplicate key");
      }
    });
  });

  describe("getResource", () => {
    it("should retrieve an existing resource", async () => {
      const resourceId = "/api/orders/*";

      // Create resource
      const createResult = await createResource(config, {
        id: resourceId,
        name: "Orders API",
        description: "Order management endpoints",
      });
      expect(createResult.success).to.be.true;

      // Get resource
      const getResult = await getResource(config, resourceId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data?.id).to.equal(resourceId);
        expect(getResult.data?.name).to.equal("Orders API");
        expect(getResult.data?.description).to.equal(
          "Order management endpoints",
        );
      }
    });

    it("should return null for non-existent resource", async () => {
      const result = await getResource(config, "/non/existent/*");
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.null;
      }
    });
  });

  describe("listResources", () => {
    it("should list resources with pagination", async () => {
      // Create multiple resources
      const resourceIds = [];
      for (let i = 0; i < 5; i++) {
        const resourceId = `/api/resource${i}/*`;
        resourceIds.push(resourceId);
        const result = await createResource(config, {
          id: resourceId,
          name: `Resource ${i}`,
        });
        expect(result.success).to.be.true;
      }

      // List with pagination
      const listResult = await listResources(config, {
        pagination: { limit: 3, offset: 0 },
      });

      expect(listResult.success).to.be.true;
      if (listResult.success) {
        expect(listResult.data.nodes).to.have.lengthOf(3);
        expect(listResult.data.totalCount).to.equal(5);
        expect(listResult.data.pageInfo.hasNextPage).to.be.true;
      }
    });

    it("should list resources with descending sort", async () => {
      // Create resources with IDs that will sort differently
      const resourceIds = ["/z-resource", "/a-resource", "/m-resource"];
      for (const resourceId of resourceIds) {
        const result = await createResource(config, {
          id: resourceId,
          name: `Test ${resourceId}`,
        });
        expect(result.success).to.be.true;
      }

      // List with DESC sort
      const listResult = await listResources(config, {
        pagination: { sortDirection: "DESC" },
      });

      expect(listResult.success).to.be.true;
      if (listResult.success) {
        const ids = listResult.data.nodes.map((resource) => resource.id);
        const zIndex = ids.indexOf("/z-resource");
        const aIndex = ids.indexOf("/a-resource");
        if (zIndex !== -1 && aIndex !== -1) {
          expect(zIndex).to.be.lessThan(aIndex);
        }
      }
    });

    it("should filter resources by ID prefix", async () => {
      // Create resources with different prefixes
      await createResource(config, {
        id: "/api/users/create",
        name: "Create User",
      });

      await createResource(config, {
        id: "/api/users/update",
        name: "Update User",
      });

      await createResource(config, {
        id: "/api/posts/create",
        name: "Create Post",
      });

      // Filter by prefix
      const result = await listResources(config, {
        filter: { idPrefix: "/api/users/" },
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.nodes).to.have.lengthOf(2);
        result.data.nodes.forEach((resource) => {
          expect(resource.id).to.include("/api/users/");
        });
      }
    });
  });

  describe("getResourcesByIdPrefix", () => {
    it("should retrieve resources by ID prefix", async () => {
      // Create resources with hierarchical structure
      const resources = [
        { id: "/api/v1/users", name: "Users V1" },
        { id: "/api/v1/posts", name: "Posts V1" },
        { id: "/api/v2/users", name: "Users V2" },
        { id: "/documents/public", name: "Public Docs" },
      ];

      for (const resource of resources) {
        const result = await createResource(config, {
          ...resource,
        });
        expect(result.success).to.be.true;
      }

      // Get resources by prefix
      const result = await getResourcesByIdPrefix(config, "/api/v1/");
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        result.data.forEach((resource) => {
          expect(resource.id).to.include("/api/v1/");
        });
      }
    });

    it("should handle wildcard resources in prefix search", async () => {
      // Create resources with wildcards
      await createResource(config, {
        id: "/api/users/*",
        name: "All User Endpoints",
      });

      await createResource(config, {
        id: "/api/users/profile",
        name: "User Profile",
      });

      // Search with prefix
      const result = await getResourcesByIdPrefix(config, "/api/users/");
      expect(result.success).to.be.true;
      if (result.success) {
        // Should find both the wildcard and specific resource
        expect(result.data).to.have.lengthOf(2);
      }
    });
  });

  describe("updateResource", () => {
    it("should update a resource", async () => {
      const resourceId = "/api/customers/*";

      // Create resource
      const createResult = await createResource(config, {
        id: resourceId,
        name: "Original Name",
        description: "Original description",
      });
      expect(createResult.success).to.be.true;

      // Update resource
      const updateResult = await updateResource(config, resourceId, {
        name: "Customer Management API",
        description: "Complete customer management endpoints",
      });
      expect(updateResult.success).to.be.true;
      if (updateResult.success) {
        expect(updateResult.data.name).to.equal("Customer Management API");
        expect(updateResult.data.description).to.equal(
          "Complete customer management endpoints",
        );
      }
    });

    it("should update only specified fields", async () => {
      const resourceId = "/features/analytics";

      // Create resource
      const createResult = await createResource(config, {
        id: resourceId,
        name: "Analytics Feature",
        description: "Analytics and reporting",
      });
      expect(createResult.success).to.be.true;

      // Update only description
      const updateResult = await updateResource(config, resourceId, {
        description: "Advanced analytics and reporting",
      });
      expect(updateResult.success).to.be.true;
      if (updateResult.success) {
        expect(updateResult.data.name).to.equal("Analytics Feature"); // Unchanged
        expect(updateResult.data.description).to.equal(
          "Advanced analytics and reporting",
        );
      }
    });
  });

  describe("deleteResource", () => {
    it("should delete a resource", async () => {
      const resourceId = "/api/temp/*";

      // Create resource
      const createResult = await createResource(config, {
        id: resourceId,
        name: "Temporary Resource",
      });
      expect(createResult.success).to.be.true;

      // Delete resource
      const deleteResult = await deleteResource(config, resourceId);
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify deletion
      const getResult = await getResource(config, resourceId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data).to.be.null;
      }
    });
  });
});
