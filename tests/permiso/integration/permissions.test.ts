import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { 
  expectSuccess, 
  expectError, 
  createTestOrganization,
  createTestUser,
  createTestRole,
  createTestResource
} from '../utils/test-helpers.js';

describe('Permissions Integration Tests', () => {
  let db: Database;
  let testOrg: persistence.Organization;
  const testDb = TestDatabase.getInstance();

  before(async () => {
    db = await testDb.setup();
  });

  after(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.truncateAllTables();
    testOrg = await createTestOrganization(db, { id: 'test-org' });
  });

  describe('User Permissions', () => {
    let user: persistence.User;
    let resource1: persistence.Resource;
    let resource2: persistence.Resource;

    beforeEach(async () => {
      user = await createTestUser(db, testOrg.id, { id: 'test-user' });
      resource1 = await createTestResource(db, testOrg.id, { path: '/api/users' });
      resource2 = await createTestResource(db, testOrg.id, { path: '/api/posts' });
    });

    describe('grantUserPermission', () => {
      it('should grant permission to user on resource', async () => {
        const permission = expectSuccess(await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'read'
        }));

        expect(permission.userId).to.equal(user.id);
        expect(permission.resourceId).to.equal(resource1.id);
        expect(permission.action).to.equal('read');
        expect(permission.createdAt).to.be.instanceOf(Date);
      });

      it('should grant multiple actions on same resource', async () => {
        expectSuccess(await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'read'
        }));

        expectSuccess(await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'write'
        }));

        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id, resource1.id));
        expect(permissions).to.have.lengthOf(2);
        expect(permissions.map(p => p.action)).to.have.members(['read', 'write']);
      });

      it('should fail to grant duplicate permission', async () => {
        expectSuccess(await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'read'
        }));

        const result = await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'read'
        });
        expectError(result, /duplicate key|already exists/i);
      });
    });

    describe('getUserPermissions', () => {
      beforeEach(async () => {
        await Promise.all([
          persistence.grantUserPermission(db, {
            userId: user.id,
            resourceId: resource1.id,
            action: 'read'
          }),
          persistence.grantUserPermission(db, {
            userId: user.id,
            resourceId: resource1.id,
            action: 'write'
          }),
          persistence.grantUserPermission(db, {
            userId: user.id,
            resourceId: resource2.id,
            action: 'read'
          })
        ]);
      });

      it('should get all permissions for user', async () => {
        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id));
        
        expect(permissions).to.have.lengthOf(3);
      });

      it('should filter permissions by resource', async () => {
        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id, resource1.id));
        
        expect(permissions).to.have.lengthOf(2);
        permissions.forEach(p => expect(p.resourceId).to.equal(resource1.id));
      });

      it('should filter permissions by action', async () => {
        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id, undefined, 'read'));
        
        expect(permissions).to.have.lengthOf(2);
        permissions.forEach(p => expect(p.action).to.equal('read'));
      });

      it('should filter by both resource and action', async () => {
        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id, resource1.id, 'write'));
        
        expect(permissions).to.have.lengthOf(1);
        expect(permissions[0].resourceId).to.equal(resource1.id);
        expect(permissions[0].action).to.equal('write');
      });
    });

    describe('revokeUserPermission', () => {
      beforeEach(async () => {
        await persistence.grantUserPermission(db, {
          userId: user.id,
          resourceId: resource1.id,
          action: 'read'
        });
      });

      it('should revoke user permission', async () => {
        expectSuccess(await persistence.revokeUserPermission(db, user.id, resource1.id, 'read'));

        const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id));
        expect(permissions).to.have.lengthOf(0);
      });

      it('should return error when revoking non-existent permission', async () => {
        const result = await persistence.revokeUserPermission(db, user.id, resource1.id, 'write');
        expectError(result, /not found|does not exist/i);
      });
    });
  });

  describe('Role Permissions', () => {
    let role: persistence.Role;
    let resource1: persistence.Resource;
    let resource2: persistence.Resource;

    beforeEach(async () => {
      role = await createTestRole(db, testOrg.id, { id: 'test-role' });
      resource1 = await createTestResource(db, testOrg.id, { path: '/api/admin' });
      resource2 = await createTestResource(db, testOrg.id, { path: '/api/reports' });
    });

    describe('grantRolePermission', () => {
      it('should grant permission to role on resource', async () => {
        const permission = expectSuccess(await persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource1.id,
          action: 'read'
        }));

        expect(permission.roleId).to.equal(role.id);
        expect(permission.resourceId).to.equal(resource1.id);
        expect(permission.action).to.equal('read');
      });

      it('should grant multiple actions on same resource', async () => {
        expectSuccess(await persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource1.id,
          action: 'read'
        }));

        expectSuccess(await persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource1.id,
          action: 'write'
        }));

        expectSuccess(await persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource1.id,
          action: 'delete'
        }));

        const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id));
        expect(permissions).to.have.lengthOf(3);
        expect(permissions.map(p => p.action)).to.have.members(['read', 'write', 'delete']);
      });
    });

    describe('getRolePermissions', () => {
      beforeEach(async () => {
        await Promise.all([
          persistence.grantRolePermission(db, {
            roleId: role.id,
            resourceId: resource1.id,
            action: 'read'
          }),
          persistence.grantRolePermission(db, {
            roleId: role.id,
            resourceId: resource1.id,
            action: 'write'
          }),
          persistence.grantRolePermission(db, {
            roleId: role.id,
            resourceId: resource2.id,
            action: 'read'
          })
        ]);
      });

      it('should get all permissions for role', async () => {
        const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id));
        
        expect(permissions).to.have.lengthOf(3);
      });

      it('should filter permissions by resource', async () => {
        const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id, resource1.id));
        
        expect(permissions).to.have.lengthOf(2);
        permissions.forEach(p => expect(p.resourceId).to.equal(resource1.id));
      });

      it('should filter permissions by action', async () => {
        const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id, undefined, 'read'));
        
        expect(permissions).to.have.lengthOf(2);
        permissions.forEach(p => expect(p.action).to.equal('read'));
      });
    });

    describe('revokeRolePermission', () => {
      beforeEach(async () => {
        await persistence.grantRolePermission(db, {
          roleId: role.id,
          resourceId: resource1.id,
          action: 'admin'
        });
      });

      it('should revoke role permission', async () => {
        expectSuccess(await persistence.revokeRolePermission(db, role.id, resource1.id, 'admin'));

        const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id));
        expect(permissions).to.have.lengthOf(0);
      });

      it('should return error when revoking non-existent permission', async () => {
        const result = await persistence.revokeRolePermission(db, role.id, resource1.id, 'write');
        expectError(result, /not found|does not exist/i);
      });
    });
  });

  describe('Permission Cascading', () => {
    it('should cascade delete user permissions when user is deleted', async () => {
      const user = await createTestUser(db, testOrg.id);
      const resource = await createTestResource(db, testOrg.id);

      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'admin'
      }));

      expectSuccess(await persistence.deleteUser(db, testOrg.id, user.id));

      // Permissions should be deleted with user
      const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id));
      expect(permissions).to.have.lengthOf(0);
    });

    it('should cascade delete role permissions when role is deleted', async () => {
      const role = await createTestRole(db, testOrg.id);
      const resource = await createTestResource(db, testOrg.id);

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role.id,
        resourceId: resource.id,
        action: 'admin'
      }));

      expectSuccess(await persistence.deleteRole(db, testOrg.id, role.id));

      // Permissions should be deleted with role
      const permissions = expectSuccess(await persistence.getRolePermissions(db, role.id));
      expect(permissions).to.have.lengthOf(0);
    });

    it('should cascade delete permissions when resource is deleted', async () => {
      const user = await createTestUser(db, testOrg.id);
      const role = await createTestRole(db, testOrg.id);
      const resource = await createTestResource(db, testOrg.id, { path: '/temp' });

      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'read'
      }));

      expectSuccess(await persistence.grantRolePermission(db, {
        roleId: role.id,
        resourceId: resource.id,
        action: 'write'
      }));

      expectSuccess(await persistence.deleteResource(db, testOrg.id, resource.id));

      // Both user and role permissions should be deleted
      const userPerms = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id, resource.id));
      expect(userPerms).to.have.lengthOf(0);

      const rolePerms = expectSuccess(await persistence.getRolePermissions(db, role.id, resource.id));
      expect(rolePerms).to.have.lengthOf(0);
    });
  });

  describe('Cross-Organization Security', () => {
    it('should not allow permissions across organizations', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });
      
      const user1 = await createTestUser(db, testOrg.id);
      const resource2 = await createTestResource(db, org2.id);

      // Should fail - user and resource in different orgs
      const result = await persistence.grantUserPermission(db, {
        userId: user1.id,
        resourceId: resource2.id,
        action: 'read'
      });
      
      expectError(result, /foreign key|constraint/i);
    });
  });
});