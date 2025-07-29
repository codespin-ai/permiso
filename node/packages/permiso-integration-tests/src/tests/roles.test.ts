import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../setup.js';

describe('Roles', () => {
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

  describe('createRole', () => {
    it('should create a new role', async () => {
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
          id: 'admin',
          orgId: 'test-org',
          name: 'Administrator',
          description: 'Full system access',
          properties: [
            { name: 'level', value: 'high' },
            { name: 'apiAccess', value: 'true', hidden: true }
          ]
        }
      });

      expect(result.data?.createRole).to.deep.equal({
        id: 'admin',
        orgId: 'test-org',
        name: 'Administrator',
        description: 'Full system access',
        properties: [
          { name: 'level', value: 'high', hidden: false },
          { name: 'apiAccess', value: 'true', hidden: true }
        ]
      });
    });

    it('should fail with non-existent organization', async () => {
      const mutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;

      try {
        await client.mutate(mutation, {
          input: {
            id: 'admin',
            orgId: 'non-existent-org',
            name: 'Administrator'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Organization not found');
      }
    });
  });

  describe('roles query', () => {
    it('should list roles in an organization', async () => {
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
          id: 'admin',
          orgId: 'test-org',
          name: 'Administrator'
        }
      });

      await client.mutate(createRoleMutation, {
        input: {
          id: 'user',
          orgId: 'test-org',
          name: 'User'
        }
      });

      // Query roles
      const query = gql`
        query ListRoles($orgId: String!) {
          roles(orgId: $orgId) {
            id
            orgId
            name
            description
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org' });

      expect(result.data?.roles).to.have.lengthOf(2);
      const roleIds = result.data?.roles.map((r: any) => r.id);
      expect(roleIds).to.include.members(['admin', 'user']);
    });
  });

  describe('role query', () => {
    it('should retrieve a role by orgId and roleId', async () => {
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
          id: 'admin',
          orgId: 'test-org',
          name: 'Administrator',
          description: 'Full access',
          properties: [
            { name: 'level', value: 'high' }
          ]
        }
      });

      // Query role
      const query = gql`
        query GetRole($orgId: String!, $roleId: String!) {
          role(orgId: $orgId, roleId: $roleId) {
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

      const result = await client.query(query, { orgId: 'test-org', roleId: 'admin' });

      expect(result.data?.role?.id).to.equal('admin');
      expect(result.data?.role?.name).to.equal('Administrator');
      expect(result.data?.role?.description).to.equal('Full access');
      expect(result.data?.role?.properties).to.deep.equal([
        { name: 'level', value: 'high', hidden: false }
      ]);
    });
  });

  describe('updateRole', () => {
    it('should update role details', async () => {
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
          id: 'admin',
          orgId: 'test-org',
          name: 'Administrator'
        }
      });

      // Update role
      const updateMutation = gql`
        mutation UpdateRole($orgId: String!, $roleId: String!, $input: UpdateRoleInput!) {
          updateRole(orgId: $orgId, roleId: $roleId, input: $input) {
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
        orgId: 'test-org',
        roleId: 'admin',
        input: {
          name: 'Super Administrator',
          description: 'Enhanced admin privileges',
          properties: [
            { name: 'level', value: 'maximum' }
          ]
        }
      });

      expect(result.data?.updateRole?.name).to.equal('Super Administrator');
      expect(result.data?.updateRole?.description).to.equal('Enhanced admin privileges');
      expect(result.data?.updateRole?.properties).to.deep.equal([
        { name: 'level', value: 'maximum', hidden: false }
      ]);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
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
          id: 'admin',
          orgId: 'test-org',
          name: 'Administrator'
        }
      });

      // Delete role
      const deleteMutation = gql`
        mutation DeleteRole($orgId: String!, $roleId: String!) {
          deleteRole(orgId: $orgId, roleId: $roleId)
        }
      `;

      const result = await client.mutate(deleteMutation, { orgId: 'test-org', roleId: 'admin' });

      expect(result.data?.deleteRole).to.be.true;

      // Verify deletion
      const query = gql`
        query GetRole($orgId: String!, $roleId: String!) {
          role(orgId: $orgId, roleId: $roleId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, { orgId: 'test-org', roleId: 'admin' });

      expect(queryResult.data?.role).to.be.null;
    });
  });
});