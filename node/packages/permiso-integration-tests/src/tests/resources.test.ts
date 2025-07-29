import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

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
            name
            description
          }
        }
      `;

      const result = await client.mutate(mutation, {
        input: {
          id: '/api/users/*',
          orgId: 'test-org',
          name: 'User API',
          description: 'User management endpoints'
        }
      });

      const resource = result.data?.createResource;
      expect(resource?.id).to.equal('/api/users/*');
      expect(resource?.orgId).to.equal('test-org');
      expect(resource?.name).to.equal('User API');
      expect(resource?.description).to.equal('User management endpoints');
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
        const result = await client.mutate(mutation, {
          input: {
            id: '/api/users/*',
            orgId: 'non-existent-org',
            name: 'User API'
          }
        });
        
        // Check if there are errors in the response
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message.toLowerCase();
          expect(errorMessage).to.satisfy((msg: string) => 
            msg.includes('foreign key violation') || 
            msg.includes('is not present in table') ||
            msg.includes('constraint')
          );
        } else {
          expect.fail('Should have returned an error');
        }
      } catch (error: any) {
        // If an exception was thrown, check it
        const errorMessage = error.graphQLErrors?.[0]?.message || error.message || '';
        expect(errorMessage.toLowerCase()).to.satisfy((msg: string) => 
          msg.includes('foreign key violation') || 
          msg.includes('is not present in table') ||
          msg.includes('constraint')
        );
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
          id: '/api/users/*',
          orgId: 'test-org',
          name: 'User API'
        }
      });

      await client.mutate(createResourceMutation, {
        input: {
          id: '/api/roles/*',
          orgId: 'test-org',
          name: 'Role API'
        }
      });

      // Query resources
      const query = gql`
        query ListResources($orgId: ID!) {
          resources(orgId: $orgId) {
            nodes {
              id
              orgId
              name
              description
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org' });

      expect(result.data?.resources?.nodes).to.have.lengthOf(2);
      const resourceIds = result.data?.resources?.nodes.map((r: any) => r.id);
      expect(resourceIds).to.include.members(['/api/users/*', '/api/roles/*']);
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
          id: '/api/users/*',
          orgId: 'test-org',
          name: 'User API',
          description: 'User management'
        }
      });

      // Query resource
      const query = gql`
        query GetResource($orgId: ID!, $resourceId: ID!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
            orgId
            name
            description
            createdAt
            updatedAt
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org', resourceId: '/api/users/*' });

      expect(result.data?.resource?.id).to.equal('/api/users/*');
      expect(result.data?.resource?.name).to.equal('User API');
      expect(result.data?.resource?.description).to.equal('User management');
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
          id: '/api/users/*',
          orgId: 'test-org',
          name: 'User API'
        }
      });

      // Update resource
      const updateMutation = gql`
        mutation UpdateResource($orgId: ID!, $resourceId: ID!, $input: UpdateResourceInput!) {
          updateResource(orgId: $orgId, resourceId: $resourceId, input: $input) {
            id
            name
            description
          }
        }
      `;

      const result = await client.mutate(updateMutation, {
        orgId: 'test-org',
        resourceId: '/api/users/*',
        input: {
          name: 'User API v2',
          description: 'Enhanced user management'
        }
      });

      expect(result.data?.updateResource?.id).to.equal('/api/users/*');
      expect(result.data?.updateResource?.name).to.equal('User API v2');
      expect(result.data?.updateResource?.description).to.equal('Enhanced user management');
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
          id: '/api/users/*',
          orgId: 'test-org',
          name: 'User API'
        }
      });

      // Delete resource
      const deleteMutation = gql`
        mutation DeleteResource($orgId: ID!, $resourceId: ID!) {
          deleteResource(orgId: $orgId, resourceId: $resourceId)
        }
      `;

      const result = await client.mutate(deleteMutation, { orgId: 'test-org', resourceId: '/api/users/*' });

      expect(result.data?.deleteResource).to.be.true;

      // Verify deletion
      const query = gql`
        query GetResource($orgId: ID!, $resourceId: ID!) {
          resource(orgId: $orgId, resourceId: $resourceId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, { orgId: 'test-org', resourceId: '/api/users/*' });

      expect(queryResult.data?.resource).to.be.null;
    });
  });
});