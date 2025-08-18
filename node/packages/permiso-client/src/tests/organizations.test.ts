import { expect } from "chai";
import {
  createOrganization,
  getOrganization,
  listOrganizations,
  getOrganizationsByIds,
  updateOrganization,
  deleteOrganization,
  setOrganizationProperty,
  getOrganizationProperty,
  deleteOrganizationProperty,
} from "../api/organizations.js";
import { getTestConfig, generateTestId } from "./utils/test-helpers.js";
import "./setup.js";

describe("Organizations API", () => {
  const config = getTestConfig();

  describe("createOrganization", () => {
    it("should create an organization successfully", async () => {
      const orgId = generateTestId("org");
      const result = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
        description: "A test organization",
        properties: [
          { name: "industry", value: "technology" },
          { name: "size", value: "small" },
        ],
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.id).to.equal(orgId);
        expect(result.data.name).to.equal("Test Organization");
        expect(result.data.description).to.equal("A test organization");
        expect(result.data.properties).to.have.lengthOf(2);
        expect(result.data.properties[0]?.name).to.equal("industry");
        expect(result.data.properties[0]?.value).to.equal("technology");
      }
    });

    it("should handle duplicate organization creation", async () => {
      const orgId = generateTestId("org");

      // Create first organization
      const result1 = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
      });
      expect(result1.success).to.be.true;

      // Try to create duplicate
      const result2 = await createOrganization(config, {
        id: orgId,
        name: "Duplicate Organization",
      });
      expect(result2.success).to.be.false;
      if (!result2.success) {
        expect(result2.error.message).to.include("duplicate key");
      }
    });
  });

  describe("getOrganization", () => {
    it("should retrieve an existing organization", async () => {
      const orgId = generateTestId("org");

      // Create organization
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
      });
      expect(createResult.success).to.be.true;

      // Get organization
      const getResult = await getOrganization(config, orgId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data?.id).to.equal(orgId);
        expect(getResult.data?.name).to.equal("Test Organization");
      }
    });

    it("should return null for non-existent organization", async () => {
      const result = await getOrganization(config, "non-existent-org");
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.null;
      }
    });
  });

  describe("listOrganizations", () => {
    it("should list organizations with pagination", async () => {
      // Create multiple organizations
      const orgIds = [];
      for (let i = 0; i < 5; i++) {
        const orgId = generateTestId(`org-${i}`);
        orgIds.push(orgId);
        const result = await createOrganization(config, {
          id: orgId,
          name: `Test Org ${i}`,
        });
        expect(result.success).to.be.true;
      }

      // List with pagination
      const listResult = await listOrganizations(config, {
        pagination: { limit: 3, offset: 0 },
      });

      expect(listResult.success).to.be.true;
      if (listResult.success) {
        expect(listResult.data.nodes).to.have.lengthOf(3);
        expect(listResult.data.totalCount).to.be.at.least(5);
        expect(listResult.data.pageInfo.hasNextPage).to.be.true;
      }
    });

    it("should list organizations with descending sort", async () => {
      // Create organizations with specific IDs to test sorting
      const orgIds = ["z-org", "a-org", "m-org"];
      for (const orgId of orgIds) {
        const result = await createOrganization(config, {
          id: orgId,
          name: `Test ${orgId}`,
        });
        expect(result.success).to.be.true;
      }

      // List with DESC sort
      const listResult = await listOrganizations(config, {
        pagination: { sortDirection: "DESC" },
      });

      expect(listResult.success).to.be.true;
      if (listResult.success) {
        const ids = listResult.data.nodes.map((org) => org.id);
        const zIndex = ids.indexOf("z-org");
        const aIndex = ids.indexOf("a-org");
        if (zIndex !== -1 && aIndex !== -1) {
          expect(zIndex).to.be.lessThan(aIndex);
        }
      }
    });
  });

  describe("getOrganizationsByIds", () => {
    it("should retrieve multiple organizations by IDs", async () => {
      const orgIds = [];
      for (let i = 0; i < 3; i++) {
        const orgId = generateTestId(`org-${i}`);
        orgIds.push(orgId);
        const result = await createOrganization(config, {
          id: orgId,
          name: `Test Org ${i}`,
        });
        expect(result.success).to.be.true;
      }

      const result = await getOrganizationsByIds(config, orgIds);
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
        const retrievedIds = result.data.map((org) => org.id);
        expect(retrievedIds).to.have.members(orgIds);
      }
    });
  });

  describe("updateOrganization", () => {
    it("should update an organization", async () => {
      const orgId = generateTestId("org");

      // Create organization
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "Original Name",
        description: "Original description",
      });
      expect(createResult.success).to.be.true;

      // Update organization
      const updateResult = await updateOrganization(config, orgId, {
        name: "Updated Name",
        description: "Updated description",
      });
      expect(updateResult.success).to.be.true;
      if (updateResult.success) {
        expect(updateResult.data.name).to.equal("Updated Name");
        expect(updateResult.data.description).to.equal("Updated description");
      }
    });
  });

  describe("Organization Properties", () => {
    it("should set and get organization properties", async () => {
      const orgId = generateTestId("org");

      // Create organization
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
      });
      expect(createResult.success).to.be.true;

      // Set property with complex JSON value
      const propertyValue = {
        settings: {
          theme: "dark",
          notifications: true,
        },
        limits: {
          maxUsers: 100,
          maxStorage: "10GB",
        },
      };

      const setPropResult = await setOrganizationProperty(
        config,
        orgId,
        "config",
        propertyValue,
        false,
      );
      expect(setPropResult.success).to.be.true;
      if (setPropResult.success) {
        expect(setPropResult.data.name).to.equal("config");
        expect(setPropResult.data.value).to.deep.equal(propertyValue);
        expect(setPropResult.data.hidden).to.be.false;
      }

      // Get property
      const getPropResult = await getOrganizationProperty(
        config,
        orgId,
        "config",
      );
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data?.name).to.equal("config");
        expect(getPropResult.data?.value).to.deep.equal(propertyValue);
      }
    });

    it("should handle hidden properties", async () => {
      const orgId = generateTestId("org");

      // Create organization
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
      });
      expect(createResult.success).to.be.true;

      // Set hidden property
      const setPropResult = await setOrganizationProperty(
        config,
        orgId,
        "apiKey",
        "secret-key-123",
        true,
      );
      expect(setPropResult.success).to.be.true;
      if (setPropResult.success) {
        expect(setPropResult.data.hidden).to.be.true;
      }
    });

    it("should delete organization properties", async () => {
      const orgId = generateTestId("org");

      // Create organization with property
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "Test Organization",
        properties: [{ name: "toDelete", value: "temporary" }],
      });
      expect(createResult.success).to.be.true;

      // Delete property
      const deleteResult = await deleteOrganizationProperty(
        config,
        orgId,
        "toDelete",
      );
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify property is deleted
      const getPropResult = await getOrganizationProperty(
        config,
        orgId,
        "toDelete",
      );
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data).to.be.null;
      }
    });
  });

  describe("deleteOrganization", () => {
    it("should delete an organization", async () => {
      const orgId = generateTestId("org");

      // Create organization
      const createResult = await createOrganization(config, {
        id: orgId,
        name: "To Delete",
      });
      expect(createResult.success).to.be.true;

      // Delete organization
      const deleteResult = await deleteOrganization(config, orgId);
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify organization is deleted
      const getResult = await getOrganization(config, orgId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data).to.be.null;
      }
    });
  });
});
