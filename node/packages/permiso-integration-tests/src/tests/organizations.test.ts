import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Organizations', () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
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

      const result = await client.mutate(mutation, {
        input: {
          id: 'org-123',
          name: 'Test Organization',
          properties: [
            { name: 'tier', value: 'premium' },
            { name: 'apiKey', value: 'secret123', hidden: true }
          ]
        }
      });

      const org = result.data?.createOrganization;
      expect(org?.id).to.equal('org-123');
      expect(org?.name).to.equal('Test Organization');
      expect(org?.properties).to.have.lengthOf(2);
      
      const tierProp = org?.properties.find((p: any) => p.name === 'tier');
      expect(tierProp).to.deep.include({ name: 'tier', value: 'premium', hidden: false });
      
      const apiKeyProp = org?.properties.find((p: any) => p.name === 'apiKey');
      expect(apiKeyProp).to.deep.include({ name: 'apiKey', value: 'secret123', hidden: true });
    });

    it('should fail with duplicate organization ID', async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
          }
        }
      `;

      // Create first organization
      await client.mutate(mutation, {
        input: {
          id: 'org-123',
          name: 'First Organization'
        }
      });

      // Try to create duplicate
      try {
        await client.mutate(mutation, {
          input: {
            id: 'org-123',
            name: 'Duplicate Organization'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('duplicate key value violates unique constraint');
      }
    });
  });

  describe('organization query', () => {
    it('should retrieve an organization by ID', async () => {
      // Create organization first
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'org-123',
          name: 'Test Organization',
          properties: [
            { name: 'tier', value: 'premium' }
          ]
        }
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

      const result = await client.query(query, { id: 'org-123' });

      expect(result.data?.organization?.id).to.equal('org-123');
      expect(result.data?.organization?.name).to.equal('Test Organization');
      expect(result.data?.organization?.properties).to.deep.equal([
        { name: 'tier', value: 'premium', hidden: false }
      ]);
      expect(result.data?.organization?.createdAt).to.be.a('string');
      expect(result.data?.organization?.updatedAt).to.be.a('string');
    });

    it('should return null for non-existent organization', async () => {
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
            name
          }
        }
      `;

      const result = await client.query(query, { id: 'non-existent' });

      expect(result.data?.organization).to.be.null;
    });
  });

  describe('organizations query', () => {
    it('should list all organizations', async () => {
      // Create multiple organizations
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(mutation, {
        input: {
          id: 'org-1',
          name: 'Organization 1'
        }
      });

      await client.mutate(mutation, {
        input: {
          id: 'org-2',
          name: 'Organization 2'
        }
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

      const result = await client.query(query);

      expect(result.data?.organizations?.nodes).to.have.lengthOf(2);
      const orgIds = result.data?.organizations?.nodes.map((o: any) => o.id);
      expect(orgIds).to.include.members(['org-1', 'org-2']);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization name', async () => {
      // Create organization
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'org-123',
          name: 'Original Name'
        }
      });

      // Update organization
      const updateMutation = gql`
        mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
          updateOrganization(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const result = await client.mutate(updateMutation, {
        id: 'org-123',
        input: {
          name: 'Updated Name'
        }
      });

      expect(result.data?.updateOrganization?.name).to.equal('Updated Name');
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an organization', async () => {
      // Create organization
      const createMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'org-123',
          name: 'To Be Deleted'
        }
      });

      // Delete organization
      const deleteMutation = gql`
        mutation DeleteOrganization($id: ID!) {
          deleteOrganization(id: $id)
        }
      `;

      const result = await client.mutate(deleteMutation, { id: 'org-123' });

      expect(result.data?.deleteOrganization).to.be.true;

      // Verify it's deleted
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, { id: 'org-123' });

      expect(queryResult.data?.organization).to.be.null;
    });
  });
});