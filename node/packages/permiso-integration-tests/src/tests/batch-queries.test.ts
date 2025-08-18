import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb, client } from "../index.js";

describe("Batch Queries", () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe("organizationsByIds", () => {
    it("should fetch multiple organizations by IDs", async () => {
      // Create test organizations
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: { id: "org-1", name: "Organization 1" },
      });
      await client.mutate(createMutation, {
        input: { id: "org-2", name: "Organization 2" },
      });
      await client.mutate(createMutation, {
        input: { id: "org-3", name: "Organization 3" },
      });

      // Query by IDs
      const query = gql`
        query GetOrganizationsByIds($ids: [ID!]!) {
          organizationsByIds(ids: $ids) {
            id
            name
          }
        }
      `;

      const result = await client.query(query, { ids: ["org-1", "org-3"] });

      expect(result.data?.organizationsByIds).to.have.lengthOf(2);
      const orgIds = result.data?.organizationsByIds.map((o: any) => o.id);
      expect(orgIds).to.include.members(["org-1", "org-3"]);
      expect(orgIds).to.not.include("org-2");
    });

    it("should return empty array for non-existent IDs", async () => {
      const query = gql`
        query GetOrganizationsByIds($ids: [ID!]!) {
          organizationsByIds(ids: $ids) {
            id
          }
        }
      `;

      const result = await client.query(query, {
        ids: ["non-existent-1", "non-existent-2"],
      });

      expect(result.data?.organizationsByIds).to.deep.equal([]);
    });

    it("should handle mixed existing and non-existing IDs", async () => {
      // Create one organization
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: { id: "org-exists", name: "Existing Org" },
      });

      // Query with mixed IDs
      const query = gql`
        query GetOrganizationsByIds($ids: [ID!]!) {
          organizationsByIds(ids: $ids) {
            id
            name
          }
        }
      `;

      const result = await client.query(query, {
        ids: ["org-exists", "org-not-exists"],
      });

      expect(result.data?.organizationsByIds).to.have.lengthOf(1);
      expect(result.data?.organizationsByIds[0].id).to.equal("org-exists");
    });
  });

  describe("usersByIds", () => {
    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });
    });

    it("should fetch multiple users by IDs within an organization", async () => {
      // Create test users
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "user-1",
          orgId: "test-org",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|1",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "user-2",
          orgId: "test-org",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|2",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "user-3",
          orgId: "test-org",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|3",
        },
      });

      // Query by IDs
      const query = gql`
        query GetUsersByIds($orgId: ID!, $ids: [ID!]!) {
          usersByIds(orgId: $orgId, ids: $ids) {
            id
            orgId
            identityProvider
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "test-org",
        ids: ["user-1", "user-3"],
      });

      expect(result.data?.usersByIds).to.have.lengthOf(2);
      const userIds = result.data?.usersByIds.map((u: any) => u.id);
      expect(userIds).to.include.members(["user-1", "user-3"]);
      expect(userIds).to.not.include("user-2");
    });

    it("should not return users from different organizations", async () => {
      // Create another organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: "other-org", name: "Other Organization" },
      });

      // Create users in different orgs
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "user-test-org",
          orgId: "test-org",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|test",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "user-other-org",
          orgId: "other-org",
          identityProvider: "auth0",
          identityProviderUserId: "auth0|other",
        },
      });

      // Query should only return user from test-org
      const query = gql`
        query GetUsersByIds($orgId: ID!, $ids: [ID!]!) {
          usersByIds(orgId: $orgId, ids: $ids) {
            id
            orgId
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "test-org",
        ids: ["user-test-org", "user-other-org"],
      });

      expect(result.data?.usersByIds).to.have.lengthOf(1);
      expect(result.data?.usersByIds[0].id).to.equal("user-test-org");
      expect(result.data?.usersByIds[0].orgId).to.equal("test-org");
    });
  });

  describe("rolesByIds", () => {
    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: "test-org", name: "Test Organization" },
      });
    });

    it("should fetch multiple roles by IDs within an organization", async () => {
      // Create test roles
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
      await client.mutate(createMutation, {
        input: {
          id: "editor",
          orgId: "test-org",
          name: "Editor",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "viewer",
          orgId: "test-org",
          name: "Viewer",
        },
      });

      // Query by IDs
      const query = gql`
        query GetRolesByIds($orgId: ID!, $ids: [ID!]!) {
          rolesByIds(orgId: $orgId, ids: $ids) {
            id
            orgId
            name
          }
        }
      `;

      const result = await client.query(query, {
        orgId: "test-org",
        ids: ["admin", "viewer"],
      });

      expect(result.data?.rolesByIds).to.have.lengthOf(2);
      const roleIds = result.data?.rolesByIds.map((r: any) => r.id);
      expect(roleIds).to.include.members(["admin", "viewer"]);
      expect(roleIds).to.not.include("editor");
    });
  });

  describe("usersByIdentity", () => {
    beforeEach(async () => {
      // Create test organizations
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: "org-1", name: "Organization 1" },
      });
      await client.mutate(orgMutation, {
        input: { id: "org-2", name: "Organization 2" },
      });
    });

    it("should find users by identity provider across organizations", async () => {
      // Create users with same identity in different orgs
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "user-org1",
          orgId: "org-1",
          identityProvider: "google",
          identityProviderUserId: "google|12345",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "user-org2",
          orgId: "org-2",
          identityProvider: "google",
          identityProviderUserId: "google|12345",
        },
      });

      // Query by identity
      const query = gql`
        query GetUsersByIdentity(
          $identityProvider: String!
          $identityProviderUserId: String!
        ) {
          usersByIdentity(
            identityProvider: $identityProvider
            identityProviderUserId: $identityProviderUserId
          ) {
            id
            orgId
            identityProvider
            identityProviderUserId
          }
        }
      `;

      const result = await client.query(query, {
        identityProvider: "google",
        identityProviderUserId: "google|12345",
      });

      expect(result.data?.usersByIdentity).to.have.lengthOf(2);
      const orgIds = result.data?.usersByIdentity.map((u: any) => u.orgId);
      expect(orgIds).to.include.members(["org-1", "org-2"]);
    });

    it("should return empty array for non-existent identity", async () => {
      const query = gql`
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

      const result = await client.query(query, {
        identityProvider: "auth0",
        identityProviderUserId: "auth0|nonexistent",
      });

      expect(result.data?.usersByIdentity).to.deep.equal([]);
    });

    it("should only return users matching both provider and ID", async () => {
      // Create users with different providers
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: "user-google",
          orgId: "org-1",
          identityProvider: "google",
          identityProviderUserId: "user123",
        },
      });
      await client.mutate(createMutation, {
        input: {
          id: "user-auth0",
          orgId: "org-1",
          identityProvider: "auth0",
          identityProviderUserId: "user123",
        },
      });

      // Query should only return google user
      const query = gql`
        query GetUsersByIdentity(
          $identityProvider: String!
          $identityProviderUserId: String!
        ) {
          usersByIdentity(
            identityProvider: $identityProvider
            identityProviderUserId: $identityProviderUserId
          ) {
            id
            identityProvider
          }
        }
      `;

      const result = await client.query(query, {
        identityProvider: "google",
        identityProviderUserId: "user123",
      });

      expect(result.data?.usersByIdentity).to.have.lengthOf(1);
      expect(result.data?.usersByIdentity[0].id).to.equal("user-google");
      expect(result.data?.usersByIdentity[0].identityProvider).to.equal(
        "google",
      );
    });
  });
});
