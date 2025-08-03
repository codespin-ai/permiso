import { expect } from 'chai';
import { createOrganization } from '../api/organizations.js';
import { createUser, assignUserRole } from '../api/users.js';
import { createRole } from '../api/roles.js';
import { createResource } from '../api/resources.js';
import { 
  hasPermission,
  getUserPermissions,
  getRolePermissions,
  getEffectivePermissions,
  getEffectivePermissionsByPrefix,
  grantUserPermission,
  revokeUserPermission,
  grantRolePermission,
  revokeRolePermission
} from '../api/permissions.js';
import { getTestConfig, generateTestId } from './utils/test-helpers.js';
import './setup.js';

describe('Permissions API', () => {
  const config = getTestConfig();
  let testOrgId: string;
  let testUserId: string;
  let testRoleId: string;
  let testResourceId: string;

  beforeEach(async () => {
    // Create test organization
    testOrgId = generateTestId('org');
    const orgResult = await createOrganization(config, {
      id: testOrgId,
      name: 'Test Organization'
    });
    expect(orgResult.success).to.be.true;

    // Create test user
    testUserId = generateTestId('user');
    const userResult = await createUser(config, {
      id: testUserId,
      orgId: testOrgId,
      identityProvider: 'google',
      identityProviderUserId: 'user@example.com'
    });
    expect(userResult.success).to.be.true;

    // Create test role
    testRoleId = generateTestId('role');
    const roleResult = await createRole(config, {
      id: testRoleId,
      orgId: testOrgId,
      name: 'Test Role'
    });
    expect(roleResult.success).to.be.true;

    // Create test resource
    testResourceId = '/api/test/*';
    const resourceResult = await createResource(config, {
      id: testResourceId,
      orgId: testOrgId,
      name: 'Test Resource'
    });
    expect(resourceResult.success).to.be.true;
  });

  describe('User Permissions', () => {
    it('should grant permission to user', async () => {
      const result = await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'read'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.userId).to.equal(testUserId);
        expect(result.data.resourceId).to.equal(testResourceId);
        expect(result.data.action).to.equal('read');
      }
    });

    it('should handle duplicate permission grant', async () => {
      // Grant permission first time
      const result1 = await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'write'
      });
      expect(result1.success).to.be.true;

      // Try to grant same permission again
      const result2 = await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'write'
      });
      
      // The server might handle this as idempotent or as an error
      // If it succeeds, it should return the same permission
      if (result2.success) {
        expect(result2.data.userId).to.equal(testUserId);
        expect(result2.data.resourceId).to.equal(testResourceId);
        expect(result2.data.action).to.equal('write');
      } else {
        expect(result2.error.message).to.include('duplicate key');
      }
    });

    it('should get user permissions', async () => {
      // Grant multiple permissions
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'read'
      });

      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'write'
      });

      // Get all permissions
      const result = await getUserPermissions(config, {
        orgId: testOrgId,
        userId: testUserId
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        const actions = result.data.map(p => p.action);
        expect(actions).to.include('read');
        expect(actions).to.include('write');
      }
    });

    it('should filter user permissions by resource and action', async () => {
      // Create another resource
      const resource2Id = '/api/other/*';
      await createResource(config, {
        id: resource2Id,
        orgId: testOrgId,
        name: 'Other Resource'
      });

      // Grant permissions on different resources
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'read'
      });

      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: resource2Id,
        action: 'read'
      });

      // Filter by resource
      const result = await getUserPermissions(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(1);
        expect(result.data[0]?.resourceId).to.equal(testResourceId);
      }
    });

    it('should revoke user permission', async () => {
      // Grant permission
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'delete'
      });

      // Revoke permission
      const revokeResult = await revokeUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'delete'
      });

      expect(revokeResult.success).to.be.true;
      if (revokeResult.success) {
        expect(revokeResult.data).to.be.true;
      }

      // Verify permission is revoked
      const permissions = await getUserPermissions(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'delete'
      });

      expect(permissions.success).to.be.true;
      if (permissions.success) {
        expect(permissions.data).to.have.lengthOf(0);
      }
    });
  });

  describe('Role Permissions', () => {
    it('should grant permission to role', async () => {
      const result = await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'read'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.roleId).to.equal(testRoleId);
        expect(result.data.resourceId).to.equal(testResourceId);
        expect(result.data.action).to.equal('read');
      }
    });

    it('should get role permissions', async () => {
      // Grant multiple permissions
      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'read'
      });

      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'write'
      });

      // Get all permissions
      const result = await getRolePermissions(config, {
        orgId: testOrgId,
        roleId: testRoleId
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        const actions = result.data.map(p => p.action);
        expect(actions).to.include('read');
        expect(actions).to.include('write');
      }
    });

    it('should revoke role permission', async () => {
      // Grant permission
      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'admin'
      });

      // Revoke permission
      const revokeResult = await revokeRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'admin'
      });

      expect(revokeResult.success).to.be.true;
      if (revokeResult.success) {
        expect(revokeResult.data).to.be.true;
      }
    });
  });

  describe('Permission Checking', () => {
    it('should check if user has permission', async () => {
      // Grant permission
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'read'
      });

      // Check permission
      const result = await hasPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: '/api/test/specific',
        action: 'read'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.true; // Should match wildcard
      }
    });

    it('should check permission through role', async () => {
      // Grant permission to role
      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'write'
      });

      // Assign role to user
      await assignUserRole(config, testOrgId, testUserId, testRoleId);

      // Check permission
      const result = await hasPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: '/api/test/specific',
        action: 'write'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.true;
      }
    });

    it('should handle wildcard resource matching', async () => {
      // Create wildcard resource
      const wildcardResource = '/*';
      await createResource(config, {
        id: wildcardResource,
        orgId: testOrgId,
        name: 'All Resources'
      });

      // Grant permission on wildcard
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: wildcardResource,
        action: 'read'
      });

      // Check permission on specific resource
      const result = await hasPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: '/any/path/here',
        action: 'read'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.true;
      }
    });
  });

  describe('Effective Permissions', () => {
    it('should get effective permissions combining user and role', async () => {
      // Grant direct permission to user
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'read'
      });

      // Grant permission to role
      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'write'
      });

      // Assign role to user
      await assignUserRole(config, testOrgId, testUserId, testRoleId);

      // Get effective permissions
      const result = await getEffectivePermissions(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        
        const userPerm = result.data.find(p => p.source === 'user');
        expect(userPerm?.action).to.equal('read');
        
        const rolePerm = result.data.find(p => p.source === 'role');
        expect(rolePerm?.action).to.equal('write');
        expect(rolePerm?.sourceId).to.equal(testRoleId);
      }
    });

    it('should get effective permissions by prefix', async () => {
      // Create multiple resources
      const resources = [
        '/api/users/create',
        '/api/users/update',
        '/api/posts/create'
      ];

      for (const resourceId of resources) {
        await createResource(config, {
          id: resourceId,
          orgId: testOrgId,
          name: `Resource ${resourceId}`
        });
      }

      // Grant permissions
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: '/api/users/create',
        action: 'execute'
      });

      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: '/api/users/update',
        action: 'execute'
      });

      // Get permissions by prefix
      const result = await getEffectivePermissionsByPrefix(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceIdPrefix: '/api/users/',
        action: 'execute'
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(2);
        result.data.forEach(perm => {
          expect(perm.resourceId).to.include('/api/users/');
          expect(perm.action).to.equal('execute');
        });
      }
    });

    it('should handle complex permission inheritance', async () => {
      // Create another role
      const role2Id = generateTestId('role2');
      await createRole(config, {
        id: role2Id,
        orgId: testOrgId,
        name: 'Second Role'
      });

      // Grant different permissions to roles
      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: testRoleId,
        resourceId: testResourceId,
        action: 'read'
      });

      await grantRolePermission(config, {
        orgId: testOrgId,
        roleId: role2Id,
        resourceId: testResourceId,
        action: 'write'
      });

      // Assign both roles to user
      await assignUserRole(config, testOrgId, testUserId, testRoleId);
      await assignUserRole(config, testOrgId, testUserId, role2Id);

      // Also grant direct permission
      await grantUserPermission(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId,
        action: 'delete'
      });

      // Get effective permissions
      const result = await getEffectivePermissions(config, {
        orgId: testOrgId,
        userId: testUserId,
        resourceId: testResourceId
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
        
        const actions = result.data.map(p => p.action);
        expect(actions).to.include('read');
        expect(actions).to.include('write');
        expect(actions).to.include('delete');
      }
    });
  });
});