import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../setup.js';

describe('Resources', () => {
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
        id: 'test-org',
        name: 'Test Organization'
      }
    });
  });

  describe('createResource', () => {
    it('should create a new resource', async () => {
      const mutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
            orgId
            path
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
          id: 'api-users',
          orgId: 'test-org',
          path: '/api/users/*',
          name: 'User API',
          description: 'User management endpoints',
          properties: [
            { name: 'version', value: 'v1' },
            { name: 'rateLimit', value: '1000', hidden: true }
          ]
        }
      });

      expect(result.data?.createResource).to.deep.equal({
        id: 'api-users',
        orgId: 'test-org',
        path: '/api/users/*',
        name: 'User API',
        description: 'User management endpoints',
        properties: [
          { name: 'version', value: 'v1', hidden: false },
          { name: 'rateLimit', value: '1000', hidden: true }
        ]
      });
    });

    it('should fail with non-existent organization', async () => {
      const mutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      try {
        await client.mutate(mutation, {
          input: {
            id: 'api-users',
            orgId: 'non-existent-org',
            path: '/api/users/*',
            name: 'User API'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Organization not found');
      }
    });
  });

  describe('resources query', () => {
    it('should list resources in an organization', async () => {
      const createResourceMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      // Create multiple resources
      await client.mutate(createResourceMutation, {
        input: {
          id: 'api-users',
          orgId: 'test-org',
          path: '/api/users/*',
          name: 'User API'
        }
      });

      await client.mutate(createResourceMutation, {
        input: {
          id: 'api-roles',
          orgId: 'test-org',
          path: '/api/roles/*',
          name: 'Role API'
        }
      });

      // Query resources
      const query = gql`
        query ListResources($orgId: String!) {
          resources(orgId: $orgId) {
            id
            orgId
            path
            name
            description
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org' });

      expect(result.data?.resources).to.have.lengthOf(2);
      const resourceIds = result.data?.resources.map((r: any) => r.id);
      expect(resourceIds).to.include.members(['api-users', 'api-roles']);
    });
  });

  describe('resource query', () => {
    it('should retrieve a resource by orgId and resourceId', async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'api-users',
          orgId: 'test-org',
          path: '/api/users/*',
          name: 'User API',
          description: 'User management',
          properties: [
            { name: 'version', value: 'v1' }
          ]
        }
      });

      // Query resource
      const query = gql`
        query GetResource($orgId: String!, $resourceId: String!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
            orgId
            path
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

      const result = await client.query(query, { orgId: 'test-org', resourceId: 'api-users' });

      expect(result.data?.resource?.id).to.equal('api-users');
      expect(result.data?.resource?.path).to.equal('/api/users/*');
      expect(result.data?.resource?.name).to.equal('User API');
      expect(result.data?.resource?.properties).to.deep.equal([
        { name: 'version', value: 'v1', hidden: false }
      ]);
    });
  });

  describe('updateResource', () => {
    it('should update resource details', async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'api-users',
          orgId: 'test-org',
          path: '/api/users/*',
          name: 'User API'
        }
      });

      // Update resource
      const updateMutation = gql`
        mutation UpdateResource($orgId: String!, $resourceId: String!, $input: UpdateResourceInput!) {
          updateResource(orgId: $orgId, resourceId: $resourceId, input: $input) {
            id
            path
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
        orgId: 'test-org',
        resourceId: 'api-users',
        input: {
          path: '/api/v2/users/*',
          name: 'User API v2',
          description: 'Enhanced user management',
          properties: [
            { name: 'version', value: 'v2' }
          ]
        }
      });

      expect(result.data?.updateResource?.path).to.equal('/api/v2/users/*');
      expect(result.data?.updateResource?.name).to.equal('User API v2');
      expect(result.data?.updateResource?.description).to.equal('Enhanced user management');
      expect(result.data?.updateResource?.properties).to.deep.equal([
        { name: 'version', value: 'v2', hidden: false }
      ]);
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource', async () => {
      // Create resource
      const createMutation = gql`
        mutation CreateResource($input: CreateResourceInput!) {
          createResource(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'api-users',
          orgId: 'test-org',
          path: '/api/users/*',
          name: 'User API'
        }
      });

      // Delete resource
      const deleteMutation = gql`
        mutation DeleteResource($orgId: String!, $resourceId: String!) {
          deleteResource(orgId: $orgId, resourceId: $resourceId)
        }
      `;

      const result = await client.mutate(deleteMutation, { orgId: 'test-org', resourceId: 'api-users' });

      expect(result.data?.deleteResource).to.be.true;

      // Verify deletion
      const query = gql`
        query GetResource($orgId: String!, $resourceId: String!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, { orgId: 'test-org', resourceId: 'api-users' });

      expect(queryResult.data?.resource).to.be.null;
    });
  });
});