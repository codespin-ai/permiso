import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { 
  expectSuccess, 
  createTestOrganization,
  createTestUser,
  createTestRole,
  createTestResource,
  setupTestContext
} from '../utils/test-helpers.js';

describe('Effective Permissions Integration Tests', () => {
  let db: Database;
  const testDb = TestDatabase.getInstance();

  before(async () => {
    db = await testDb.setup();
  });

  after(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe('Basic Effective Permissions', () => {
    it('should return direct user permissions', async () => {
      const { org, users, resources } = await setupTestContext(db);
      const user = users[0];
      const resource = resources[0]; // /api/users

      // Grant direct permission
      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'read'
      }));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(1);
      expect(effective[0]).to.include({
        resourceId: resource.id,
        action: 'read',
        source: 'user',
        sourceId: user.id
      });
    });

    it('should return role-based permissions', async () => {
      const { org, users, roles, resources } = await setupTestContext(db);
      const user = users[0];
      const role = roles[0]; // admin
      const resource = resources[2]; // /api/posts

      // Assign role to user
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role.id));

      // Grant permission to role
      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role.id,
        resourceId: resource.id,
        action: 'write'
      }));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(1);
      expect(effective[0]).to.include({
        resourceId: resource.id,
        action: 'write',
        source: 'role',
        sourceId: role.id
      });
    });

    it('should combine user and role permissions', async () => {
      const { org, users, roles, resources } = await setupTestContext(db);
      const user = users[0];
      const role = roles[0];
      const resource = resources[0];

      // Direct user permission
      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'read'
      }));

      // Role permission
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role.id));
      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role.id,
        resourceId: resource.id,
        action: 'write'
      }));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(2);
      const actions = effective.map(p => p.action);
      expect(actions).to.have.members(['read', 'write']);
    });
  });

  describe('Multiple Roles', () => {
    it('should combine permissions from multiple roles', async () => {
      const { org, users, roles, resources } = await setupTestContext(db);
      const user = users[0];
      const adminRole = roles[0];
      const editorRole = roles[1];
      const resource = resources[0];

      // Assign multiple roles
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, adminRole.id));
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, editorRole.id));

      // Grant different permissions to each role
      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: adminRole.id,
        resourceId: resource.id,
        action: 'delete'
      }));

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: editorRole.id,
        resourceId: resource.id,
        action: 'write'
      }));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(2);
      const permissions = effective.map(p => ({ action: p.action, sourceId: p.sourceId }));
      expect(permissions).to.deep.include.members([
        { action: 'delete', sourceId: adminRole.id },
        { action: 'write', sourceId: editorRole.id }
      ]);
    });

    it('should handle duplicate permissions from different sources', async () => {
      const { org, users, roles, resources } = await setupTestContext(db);
      const user = users[0];
      const role1 = roles[0];
      const role2 = roles[1];
      const resource = resources[0];

      // Assign both roles
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role1.id));
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role2.id));

      // Grant same permission to user directly and through both roles
      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'read'
      }));

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role1.id,
        resourceId: resource.id,
        action: 'read'
      }));

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role2.id,
        resourceId: resource.id,
        action: 'read'
      }));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      // Should have all three sources even though action is the same
      expect(effective).to.have.lengthOf(3);
      const sources = effective.map(p => ({ source: p.source, sourceId: p.sourceId }));
      expect(sources).to.deep.include.members([
        { source: 'user', sourceId: user.id },
        { source: 'role', sourceId: role1.id },
        { source: 'role', sourceId: role2.id }
      ]);
    });
  });

  describe('Wildcard Resource Matching', () => {
    it('should include permissions from wildcard resources', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);
      const role = await createTestRole(db, org.id);

      // Create resources with wildcard patterns
      const apiResource = await createTestResource(db, org.id, { path: '/api/*' });
      const usersResource = await createTestResource(db, org.id, { path: '/api/users/*' });

      // Assign role
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role.id));

      // Grant permissions on wildcard resources
      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: apiResource.id,
        action: 'read'
      }));

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role.id,
        resourceId: usersResource.id,
        action: 'write'
      }));

      // Check effective permissions for specific path
      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, '/api/users/123'
      ));

      expect(effective).to.have.lengthOf(2);
      const perms = effective.map(p => ({ resource: p.resourceId, action: p.action }));
      expect(perms).to.deep.include.members([
        { resource: '/api/*', action: 'read' },
        { resource: '/api/users/*', action: 'write' }
      ]);
    });

    it('should handle recursive wildcards', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);

      // Create recursive wildcard resource
      const apiAllResource = await createTestResource(db, org.id, { path: '/api/**' });

      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: apiAllResource.id,
        action: 'admin'
      }));

      // Should match deeply nested paths
      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, '/api/v1/users/123/posts/456/comments'
      ));

      expect(effective).to.have.lengthOf(1);
      expect(effective[0]).to.include({
        resourceId: '/api/**',
        action: 'admin'
      });
    });
  });

  describe('Action Filtering', () => {
    it('should filter effective permissions by action', async () => {
      const { org, users, resources } = await setupTestContext(db);
      const user = users[0];
      const resource = resources[0];

      // Grant multiple permissions
      await Promise.all([
        persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource.id,
          action: 'read'
        }),
        persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource.id,
          action: 'write'
        }),
        persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource.id,
          action: 'delete'
        })
      ]);

      // Filter by specific action
      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id, 'write'
      ));

      expect(effective).to.have.lengthOf(1);
      expect(effective[0].action).to.equal('write');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for user with no permissions', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);
      const resource = await createTestResource(db, org.id);

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(0);
    });

    it('should return empty array for non-existent resource path', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, '/non/existent/path'
      ));

      expect(effective).to.have.lengthOf(0);
    });

    it('should handle user with roles but no permissions', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);
      const role = await createTestRole(db, org.id);
      const resource = await createTestResource(db, org.id);

      // Assign role but don't grant any permissions
      expectSuccess(await persistence.assignUserRole(db, org.id, user.id, role.id));

      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));

      expect(effective).to.have.lengthOf(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should efficiently handle users with many roles and permissions', async () => {
      const org = await createTestOrganization(db);
      const user = await createTestUser(db, org.id);

      // Create many roles and assign them all
      const rolePromises = [];
      for (let i = 0; i < 10; i++) {
        rolePromises.push(createTestRole(db, org.id, { id: `role-${i}` }));
      }
      const roles = await Promise.all(rolePromises);

      // Assign all roles to user
      await Promise.all(roles.map(role => 
        persistence.assignUserRole(db, org.id, user.id, role.id)
      ));

      // Create resources and grant permissions
      const resource = await createTestResource(db, org.id);
      
      // Grant permission through each role
      await Promise.all(roles.map((role, i) => 
        persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource.id,
          action: `action-${i}`
        })
      ));

      // Also grant direct permissions
      await Promise.all([
        persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource.id,
          action: 'direct-1'
        }),
        persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource.id,
          action: 'direct-2'
        })
      ]);

      const startTime = Date.now();
      const effective = expectSuccess(await persistence.getEffectivePermissions(
        db, org.id, user.id, resource.id
      ));
      const duration = Date.now() - startTime;

      expect(effective).to.have.lengthOf(12); // 10 from roles + 2 direct
      expect(duration).to.be.lessThan(100); // Should be fast even with many permissions
    });
  });
});