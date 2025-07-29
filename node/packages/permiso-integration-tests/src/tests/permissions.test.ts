import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Permissions', () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
    
    // Create test organization
    const orgMutation = gql`
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
        }
      }
    `;

    await client.mutate(orgMutation, {
      input: {
        id: 'test-org',
        name: 'Test Organization'
      }
    });

    // Create test user
    const userMutation = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
        }
      }
    `;

    await client.mutate(userMutation, {
      input: {
        id: 'test-user',
        orgId: 'test-org',
        identityProvider: 'auth0',
        identityProviderUserId: 'auth0|12345'
      }
    });

    // Create test role
    const roleMutation = gql`
      mutation CreateRole($input: CreateRoleInput!) {
        createRole(input: $input) {
          id
        }
      }
    `;

    await client.mutate(roleMutation, {
      input: {
        id: 'admin',
        orgId: 'test-org',
        name: 'Administrator'
      }
    });

    // Create test resource
    const resourceMutation = gql`
      mutation CreateResource($input: CreateResourceInput!) {
        createResource(input: $input) {
          id
        }
      }
    `;

    await client.mutate(resourceMutation, {
      input: {
        id: '/api/users/*',
        orgId: 'test-org',
        name: 'User API'
      }
    });
  });

  describe('grantUserPermission', () => {
    it('should grant permission directly to a user', async () => {
      const mutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
            resourceId
            action
          }
        }
      `;

      const result = await client.mutate(mutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: '/api/users/*',
          action: 'read'
        }
      });

      const permission = result.data?.grantUserPermission;
      expect(permission?.userId).to.equal('test-user');
      expect(permission?.resourceId).to.equal('/api/users/*');
      expect(permission?.action).to.equal('read');
    });

    it('should fail with non-existent user', async () => {
      const mutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
          }
        }
      `;

      try {
        const result = await client.mutate(mutation, {
          input: {
            orgId: 'test-org',
            userId: 'non-existent',
            resourceId: '/api/users/*',
            action: 'read'
          }
        });
        
        // Check if there are errors in the response
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message.toLowerCase();
          expect(errorMessage).to.satisfy((msg: string) => 
            msg.includes('foreign key violation') || 
            msg.includes('is not present in table') ||
            msg.includes('constraint') ||
            msg.includes('not found')
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
          msg.includes('constraint') ||
          msg.includes('not found')
        );
      }
    });
  });

  describe('grantRolePermission', () => {
    it('should grant permission to a role', async () => {
      const mutation = gql`
        mutation GrantRolePermission($input: GrantRolePermissionInput!) {
          grantRolePermission(input: $input) {
            roleId
            resourceId
            action
          }
        }
      `;

      const result = await client.mutate(mutation, {
        input: {
          orgId: 'test-org',
          roleId: 'admin',
          resourceId: '/api/users/*',
          action: 'write'
        }
      });

      const permission = result.data?.grantRolePermission;
      expect(permission?.roleId).to.equal('admin');
      expect(permission?.resourceId).to.equal('/api/users/*');
      expect(permission?.action).to.equal('write');
    });
  });

  describe('assignUserRole', () => {
    it('should assign a role to a user', async () => {
      const mutation = gql`
        mutation AssignUserRole($orgId: ID!, $userId: ID!, $roleId: ID!) {
          assignUserRole(orgId: $orgId, userId: $userId, roleId: $roleId) {
            id
            roles {
              id
              name
            }
          }
        }
      `;

      const result = await client.mutate(mutation, {
        orgId: 'test-org',
        userId: 'test-user',
        roleId: 'admin'
      });

      const user = result.data?.assignUserRole;
      expect(user?.id).to.equal('test-user');
      expect(user?.roles).to.have.lengthOf(1);
      expect(user?.roles[0]?.id).to.equal('admin');
      expect(user?.roles[0]?.name).to.equal('Administrator');
    });
  });

  describe('effectivePermissions', () => {
    it('should calculate effective permissions from direct user permissions', async () => {
      // Grant direct user permission
      const grantMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
          }
        }
      `;

      await client.mutate(grantMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: '/api/users/*',
          action: 'read'
        }
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: ID!, $userId: ID!, $resourceId: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourceId: $resourceId) {
            action
            source
            resourceId
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourceId: '/api/users/123' 
      });

      expect(result.data?.effectivePermissions).to.have.lengthOf(1);
      expect(result.data?.effectivePermissions[0]).to.include({
        action: 'read',
        source: 'user',
        resourceId: '/api/users/*'
      });
    });

    it('should calculate effective permissions from role assignments', async () => {
      // Grant permission to role
      const grantRoleMutation = gql`
        mutation GrantRolePermission($input: GrantRolePermissionInput!) {
          grantRolePermission(input: $input) {
            roleId
          }
        }
      `;

      await client.mutate(grantRoleMutation, {
        input: {
          orgId: 'test-org',
          roleId: 'admin',
          resourceId: '/api/users/*',
          action: 'write'
        }
      });

      // Assign role to user
      const assignMutation = gql`
        mutation AssignUserRole($orgId: ID!, $userId: ID!, $roleId: ID!) {
          assignUserRole(orgId: $orgId, userId: $userId, roleId: $roleId) {
            id
          }
        }
      `;

      await client.mutate(assignMutation, {
        orgId: 'test-org',
        userId: 'test-user',
        roleId: 'admin'
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: ID!, $userId: ID!, $resourceId: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourceId: $resourceId) {
            action
            source
            resourceId
            sourceId
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourceId: '/api/users/123' 
      });

      expect(result.data?.effectivePermissions).to.have.lengthOf(1);
      expect(result.data?.effectivePermissions[0]).to.include({
        action: 'write',  
        source: 'role',
        resourceId: '/api/users/*',
        sourceId: 'admin'
      });
    });

    it('should combine permissions from both user and role sources', async () => {
      // Grant direct user permission
      const grantUserMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
          }
        }
      `;

      await client.mutate(grantUserMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: '/api/users/*',
          action: 'read'
        }
      });

      // Grant permission to role
      const grantRoleMutation = gql`
        mutation GrantRolePermission($input: GrantRolePermissionInput!) {
          grantRolePermission(input: $input) {
            roleId
          }
        }
      `;

      await client.mutate(grantRoleMutation, {
        input: {
          orgId: 'test-org',
          roleId: 'admin',
          resourceId: '/api/users/*',
          action: 'write'
        }
      });

      // Assign role to user
      const assignMutation = gql`
        mutation AssignUserRole($orgId: ID!, $userId: ID!, $roleId: ID!) {
          assignUserRole(orgId: $orgId, userId: $userId, roleId: $roleId) {
            id
          }
        }
      `;

      await client.mutate(assignMutation, {
        orgId: 'test-org',
        userId: 'test-user',
        roleId: 'admin'
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: ID!, $userId: ID!, $resourceId: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourceId: $resourceId) {
            action
            source
            resourceId
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourceId: '/api/users/123' 
      });

      expect(result.data?.effectivePermissions).to.have.lengthOf(2);
      const actions = result.data?.effectivePermissions.map((p: any) => p.action);
      expect(actions).to.include.members(['read', 'write']);
    });
  });

  describe('revokeUserPermission', () => {
    it('should revoke a user permission', async () => {
      // Grant permission first
      const grantMutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            userId
          }
        }
      `;

      await client.mutate(grantMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: '/api/users/*',
          action: 'read'
        }
      });

      // Revoke permission
      const revokeMutation = gql`
        mutation RevokeUserPermission($orgId: ID!, $userId: ID!, $resourceId: ID!, $action: String!) {
          revokeUserPermission(orgId: $orgId, userId: $userId, resourceId: $resourceId, action: $action)
        }
      `;

      const result = await client.mutate(revokeMutation, {
        orgId: 'test-org',
        userId: 'test-user',
        resourceId: '/api/users/*',
        action: 'read'
      });

      expect(result.data?.revokeUserPermission).to.be.true;

      // Verify permission is revoked
      const query = gql`
        query GetEffectivePermissions($orgId: ID!, $userId: ID!, $resourceId: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourceId: $resourceId) {
            action
          }
        }
      `;

      const queryResult = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourceId: '/api/users/123' 
      });

      expect(queryResult.data?.effectivePermissions).to.deep.equal([]);
    });
  });
});