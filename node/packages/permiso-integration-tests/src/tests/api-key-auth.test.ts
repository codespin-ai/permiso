import { expect } from "chai";
import { gql } from "@apollo/client/core/index.js";
import { testDb } from "../index.js";
import { GraphQLClient } from "../utils/graphql-client.js";
import { TestServer } from "@codespin/permiso-test-utils";

describe("API Key Authentication", () => {
  let authServer: TestServer;
  let authClient: GraphQLClient;
  let unauthClient: GraphQLClient;

  before(async function () {
    this.timeout(60000);

    // Start a server with API key authentication enabled
    authServer = new TestServer({ port: 5003, dbName: "permiso_test" });

    // Set API key for test server
    process.env.PERMISO_API_KEY = "test-secret-key-123";
    process.env.PERMISO_API_KEY_ENABLED = "true";

    await authServer.start();

    // Create clients with and without API key
    authClient = new GraphQLClient("http://localhost:5003/graphql", {
      headers: {
        "x-api-key": "test-secret-key-123",
        "x-org-id": "ROOT",
      },
    });

    unauthClient = new GraphQLClient("http://localhost:5003/graphql", {
      headers: {
        "x-org-id": "ROOT",
      },
    });
  });

  after(async function () {
    this.timeout(30000);

    // Cleanup
    delete process.env.PERMISO_API_KEY;
    delete process.env.PERMISO_API_KEY_ENABLED;

    if (authClient) await authClient.stop();
    if (unauthClient) await unauthClient.stop();
    if (authServer) await authServer.stop();
  });

  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe("with API key enabled", () => {
    it("should allow requests with valid API key", async () => {
      const query = gql`
        query {
          organizations {
            nodes {
              id
              name
            }
            totalCount
          }
        }
      `;

      const result = await authClient.query(query);
      expect(result.data).to.exist;
      expect(result.data.organizations.nodes).to.be.an("array");
    });

    it("should reject requests without API key", async () => {
      const query = gql`
        query {
          organizations {
            nodes {
              id
              name
            }
            totalCount
          }
        }
      `;

      try {
        await unauthClient.query(query);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Check for authentication error in network error result
        expect(error.networkError).to.exist;
        expect(error.networkError.statusCode).to.equal(401);
        expect(error.networkError.result.errors[0].message).to.equal(
          "API key required but not provided",
        );
        expect(error.networkError.result.errors[0].extensions.code).to.equal(
          "UNAUTHENTICATED",
        );
      }
    });

    it("should reject requests with invalid API key", async () => {
      const invalidClient = new GraphQLClient("http://localhost:5003/graphql", {
        headers: {
          "x-api-key": "wrong-key",
        },
      });

      const query = gql`
        query {
          organizations {
            nodes {
              id
              name
            }
            totalCount
          }
        }
      `;

      try {
        await invalidClient.query(query);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Check for authentication error in network error result
        expect(error.networkError).to.exist;
        expect(error.networkError.statusCode).to.equal(401);
        expect(error.networkError.result.errors[0].message).to.equal(
          "Invalid API key",
        );
        expect(error.networkError.result.errors[0].extensions.code).to.equal(
          "UNAUTHENTICATED",
        );
      } finally {
        await invalidClient.stop();
      }
    });

    it("should allow mutations with valid API key", async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
          }
        }
      `;

      const result = await authClient.mutate(mutation, {
        input: {
          id: "org-auth-test",
          name: "Auth Test Organization",
        },
      });

      expect(result.data?.createOrganization).to.exist;
      expect(result.data?.createOrganization.id).to.equal("org-auth-test");
      expect(result.data?.createOrganization.name).to.equal(
        "Auth Test Organization",
      );
    });

    it("should reject mutations without API key", async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
          }
        }
      `;

      try {
        await unauthClient.mutate(mutation, {
          input: {
            id: "org-unauth-test",
            name: "Unauthorized Test Organization",
          },
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Check for authentication error in network error result
        expect(error.networkError).to.exist;
        expect(error.networkError.statusCode).to.equal(401);
        expect(error.networkError.result.errors[0].message).to.equal(
          "API key required but not provided",
        );
        expect(error.networkError.result.errors[0].extensions.code).to.equal(
          "UNAUTHENTICATED",
        );
      }
    });
  });
});
