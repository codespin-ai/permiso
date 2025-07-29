import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../setup.js';

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
        id: 'api-users',
        orgId: 'test-org',
        path: '/api/users/*',
        name: 'User API'
      }
    });
  });

  describe('grantUserPermission', () => {
    it('should grant permission directly to a user', async () => {
      const mutation = gql`
        mutation GrantUserPermission($input: GrantUserPermissionInput!) {
          grantUserPermission(input: $input) {
            orgId
            userId
            resourceId
            action
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
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: 'api-users',
          action: 'read',
          properties: [
            { name: 'scope', value: 'own' },
            { name: 'rateLimit', value: '100', hidden: true }
          ]
        }
      });

      expect(result.data?.grantUserPermission).to.deep.equal({
        orgId: 'test-org',
        userId: 'test-user',
        resourceId: 'api-users',
        action: 'read',
        properties: [
          { name: 'scope', value: 'own', hidden: false },
          { name: 'rateLimit', value: '100', hidden: true }
        ]
      });
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
        await client.mutate(mutation, {
          input: {
            orgId: 'test-org',
            userId: 'non-existent',
            resourceId: 'api-users',
            action: 'read'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('User not found');
      }
    });
  });

  describe('grantRolePermission', () => {
    it('should grant permission to a role', async () => {
      const mutation = gql`
        mutation GrantRolePermission($input: GrantRolePermissionInput!) {
          grantRolePermission(input: $input) {
            orgId
            roleId
            resourceId
            action
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
          orgId: 'test-org',
          roleId: 'admin',
          resourceId: 'api-users',
          action: 'write',
          properties: [
            { name: 'scope', value: 'all' }
          ]
        }
      });

      expect(result.data?.grantRolePermission).to.deep.equal({
        orgId: 'test-org',
        roleId: 'admin',
        resourceId: 'api-users',
        action: 'write',
        properties: [
          { name: 'scope', value: 'all', hidden: false }
        ]
      });
    });
  });

  describe('assignUserRole', () => {
    it('should assign a role to a user', async () => {
      const mutation = gql`
        mutation AssignUserRole($input: AssignUserRoleInput!) {
          assignUserRole(input: $input) {
            orgId
            userId
            roleId
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
          orgId: 'test-org',
          userId: 'test-user',
          roleId: 'admin',
          properties: [
            { name: 'assignedBy', value: 'system' }
          ]
        }
      });

      expect(result.data?.assignUserRole).to.deep.equal({
        orgId: 'test-org',
        userId: 'test-user',
        roleId: 'admin',
        properties: [
          { name: 'assignedBy', value: 'system', hidden: false }
        ]
      });
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
          resourceId: 'api-users',
          action: 'read'
        }
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: String!, $userId: String!, $resourcePath: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourcePath: $resourcePath) {
            action
            source
            resourceId
            properties {
              name
              value
            }
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourcePath: '/api/users/123' 
      });

      expect(result.data?.effectivePermissions).to.have.lengthOf(1);
      expect(result.data?.effectivePermissions[0]).to.deep.include({
        action: 'read',
        source: 'user',
        resourceId: 'api-users'
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
          resourceId: 'api-users',
          action: 'write'
        }
      });

      // Assign role to user
      const assignMutation = gql`
        mutation AssignUserRole($input: AssignUserRoleInput!) {
          assignUserRole(input: $input) {
            userId
          }
        }
      `;

      await client.mutate(assignMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          roleId: 'admin'
        }
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: String!, $userId: String!, $resourcePath: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourcePath: $resourcePath) {
            action
            source
            resourceId
            roleId
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourcePath: '/api/users/123' 
      });

      expect(result.data?.effectivePermissions).to.have.lengthOf(1);
      expect(result.data?.effectivePermissions[0]).to.deep.include({
        action: 'write',
        source: 'role',
        resourceId: 'api-users',
        roleId: 'admin'
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
          resourceId: 'api-users',
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
          resourceId: 'api-users',
          action: 'write'
        }
      });

      // Assign role to user
      const assignMutation = gql`
        mutation AssignUserRole($input: AssignUserRoleInput!) {
          assignUserRole(input: $input) {
            userId
          }
        }
      `;

      await client.mutate(assignMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          roleId: 'admin'
        }
      });

      // Query effective permissions
      const query = gql`
        query GetEffectivePermissions($orgId: String!, $userId: String!, $resourcePath: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourcePath: $resourcePath) {
            action
            source
            resourceId
          }
        }
      `;

      const result = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourcePath: '/api/users/123' 
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
          resourceId: 'api-users',
          action: 'read'
        }
      });

      // Revoke permission
      const revokeMutation = gql`
        mutation RevokeUserPermission($input: RevokeUserPermissionInput!) {
          revokeUserPermission(input: $input)
        }
      `;

      const result = await client.mutate(revokeMutation, {
        input: {
          orgId: 'test-org',
          userId: 'test-user',
          resourceId: 'api-users',
          action: 'read'
        }
      });

      expect(result.data?.revokeUserPermission).to.be.true;

      // Verify permission is revoked
      const query = gql`
        query GetEffectivePermissions($orgId: String!, $userId: String!, $resourcePath: String!) {
          effectivePermissions(orgId: $orgId, userId: $userId, resourcePath: $resourcePath) {
            action
          }
        }
      `;

      const queryResult = await client.query(query, { 
        orgId: 'test-org', 
        userId: 'test-user', 
        resourcePath: '/api/users/123' 
      });

      expect(queryResult.data?.effectivePermissions).to.deep.equal([]);
    });
  });
});