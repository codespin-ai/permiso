import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { expectSuccess, expectError, createTestOrganization, createTestUser } from '../utils/test-helpers.js';

describe('Roles Integration Tests', () => {
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

  describe('createRole', () => {
    it('should create a role with all fields', async () => {
      const input: persistence.CreateRoleInput = {
        id: 'admin',
        orgId: testOrg.id,
        data: JSON.stringify({ name: 'Administrator', description: 'Full access' }),
        properties: [
          { name: 'level', value: '10', hidden: false },
          { name: 'internal', value: 'true', hidden: true }
        ]
      };

      const role = expectSuccess(await persistence.createRole(db, input));

      expect(role.id).to.equal('admin');
      expect(role.orgId).to.equal(testOrg.id);
      expect(role.data).to.equal(input.data);
      expect(role.properties).to.have.lengthOf(2);
      expect(role.createdAt).to.be.instanceOf(Date);
      expect(role.updatedAt).to.be.instanceOf(Date);
    });

    it('should create a role with minimal fields', async () => {
      const input: persistence.CreateRoleInput = {
        id: 'viewer',
        orgId: testOrg.id
      };

      const role = expectSuccess(await persistence.createRole(db, input));

      expect(role.id).to.equal('viewer');
      expect(role.data).to.be.null;
      expect(role.properties).to.have.lengthOf(0);
    });

    it('should fail to create duplicate role in same org', async () => {
      const input: persistence.CreateRoleInput = {
        id: 'duplicate-role',
        orgId: testOrg.id
      };

      expectSuccess(await persistence.createRole(db, input));
      
      const result = await persistence.createRole(db, input);
      expectError(result, /duplicate key|already exists/i);
    });

    it('should allow same role ID in different orgs', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });

      const role1 = expectSuccess(await persistence.createRole(db, {
        id: 'admin',
        orgId: testOrg.id
      }));

      const role2 = expectSuccess(await persistence.createRole(db, {
        id: 'admin',
        orgId: org2.id
      }));

      expect(role1.id).to.equal(role2.id);
      expect(role1.orgId).to.not.equal(role2.orgId);
    });
  });

  describe('getRole', () => {
    it('should retrieve an existing role', async () => {
      const created = expectSuccess(await persistence.createRole(db, {
        id: 'get-test-role',
        orgId: testOrg.id,
        data: JSON.stringify({ name: 'Test Role' }),
        properties: [{ name: 'active', value: 'true', hidden: false }]
      }));

      const retrieved = expectSuccess(await persistence.getRole(db, testOrg.id, 'get-test-role'));

      expect(retrieved).to.deep.equal(created);
    });

    it('should return error for non-existent role', async () => {
      const result = await persistence.getRole(db, testOrg.id, 'non-existent');
      expectError(result, /not found/i);
    });
  });

  describe('getRoles', () => {
    beforeEach(async () => {
      await Promise.all([
        persistence.createRole(db, {
          id: 'admin',
          orgId: testOrg.id,
          data: JSON.stringify({ name: 'Admin', level: 10 })
        }),
        persistence.createRole(db, {
          id: 'editor',
          orgId: testOrg.id,
          data: JSON.stringify({ name: 'Editor', level: 5 })
        }),
        persistence.createRole(db, {
          id: 'viewer',
          orgId: testOrg.id,
          data: JSON.stringify({ name: 'Viewer', level: 1 })
        })
      ]);
    });

    it('should retrieve all roles in organization', async () => {
      const roles = expectSuccess(await persistence.getRoles(db, testOrg.id));

      expect(roles).to.have.lengthOf(3);
      expect(roles.map(r => r.id)).to.have.members(['admin', 'editor', 'viewer']);
    });

    it('should filter roles by IDs', async () => {
      const roles = expectSuccess(await persistence.getRoles(db, testOrg.id, {
        ids: ['admin', 'viewer']
      }));

      expect(roles).to.have.lengthOf(2);
      expect(roles.map(r => r.id)).to.have.members(['admin', 'viewer']);
    });

    it('should support pagination', async () => {
      const page1 = expectSuccess(await persistence.getRoles(db, testOrg.id, undefined, {
        limit: 2,
        offset: 0
      }));
      expect(page1).to.have.lengthOf(2);

      const page2 = expectSuccess(await persistence.getRoles(db, testOrg.id, undefined, {
        limit: 2,
        offset: 2
      }));
      expect(page2).to.have.lengthOf(1);
    });
  });

  describe('updateRole', () => {
    it('should update role data', async () => {
      const role = expectSuccess(await persistence.createRole(db, {
        id: 'update-test',
        orgId: testOrg.id,
        data: JSON.stringify({ name: 'Original' })
      }));

      const updated = expectSuccess(await persistence.updateRole(db, testOrg.id, role.id, {
        data: JSON.stringify({ name: 'Updated', active: true })
      }));

      expect(updated.data).to.equal(JSON.stringify({ name: 'Updated', active: true }));
      expect(updated.updatedAt.getTime()).to.be.greaterThan(role.updatedAt.getTime());
    });
  });

  describe('deleteRole', () => {
    it('should delete a role and cascade to related entities', async () => {
      const role = expectSuccess(await persistence.createRole(db, {
        id: 'delete-test',
        orgId: testOrg.id
      }));

      const user = await createTestUser(db, testOrg.id);
      
      // Assign role to user
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user.id, role.id));

      // Delete role
      expectSuccess(await persistence.deleteRole(db, testOrg.id, role.id));

      // Verify role is deleted
      const getResult = await persistence.getRole(db, testOrg.id, role.id);
      expectError(getResult, /not found/i);

      // Verify user-role assignment is also deleted
      const userRoles = expectSuccess(await persistence.getUserRoles(db, testOrg.id, user.id));
      expect(userRoles).to.have.lengthOf(0);
    });
  });

  describe('user-role assignments', () => {
    let user1: persistence.User;
    let user2: persistence.User;
    let adminRole: persistence.Role;
    let editorRole: persistence.Role;

    beforeEach(async () => {
      [user1, user2] = await Promise.all([
        createTestUser(db, testOrg.id, { id: 'user1' }),
        createTestUser(db, testOrg.id, { id: 'user2' })
      ]);

      [adminRole, editorRole] = await Promise.all([
        expectSuccess(await persistence.createRole(db, { id: 'admin', orgId: testOrg.id })),
        expectSuccess(await persistence.createRole(db, { id: 'editor', orgId: testOrg.id }))
      ]);
    });

    it('should assign role to user', async () => {
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id));

      const userRoles = expectSuccess(await persistence.getUserRoles(db, testOrg.id, user1.id));
      expect(userRoles).to.have.lengthOf(1);
      expect(userRoles[0].id).to.equal(adminRole.id);
    });

    it('should assign multiple roles to user', async () => {
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id));
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, editorRole.id));

      const userRoles = expectSuccess(await persistence.getUserRoles(db, testOrg.id, user1.id));
      expect(userRoles).to.have.lengthOf(2);
      expect(userRoles.map(r => r.id)).to.have.members(['admin', 'editor']);
    });

    it('should fail to assign same role twice', async () => {
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id));
      
      const result = await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id);
      expectError(result, /duplicate key|already exists/i);
    });

    it('should get users by role', async () => {
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id));
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user2.id, adminRole.id));

      const users = expectSuccess(await persistence.getUsersByRole(db, testOrg.id, adminRole.id));
      expect(users).to.have.lengthOf(2);
      expect(users.map(u => u.id)).to.have.members(['user1', 'user2']);
    });

    it('should revoke role from user', async () => {
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, adminRole.id));
      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user1.id, editorRole.id));

      expectSuccess(await persistence.revokeUserRole(db, testOrg.id, user1.id, adminRole.id));

      const userRoles = expectSuccess(await persistence.getUserRoles(db, testOrg.id, user1.id));
      expect(userRoles).to.have.lengthOf(1);
      expect(userRoles[0].id).to.equal(editorRole.id);
    });

    it('should return error when revoking non-assigned role', async () => {
      const result = await persistence.revokeUserRole(db, testOrg.id, user1.id, adminRole.id);
      expectError(result, /not found|does not exist/i);
    });
  });

  describe('role properties', () => {
    let testRole: persistence.Role;

    beforeEach(async () => {
      testRole = expectSuccess(await persistence.createRole(db, {
        id: 'prop-test-role',
        orgId: testOrg.id
      }));
    });

    it('should set and get role properties', async () => {
      expectSuccess(await persistence.setRoleProperty(db, testOrg.id, testRole.id, {
        name: 'maxUsers',
        value: '100',
        hidden: false
      }));

      const prop = expectSuccess(await persistence.getRoleProperty(db, testOrg.id, testRole.id, 'maxUsers'));
      expect(prop).to.deep.include({
        name: 'maxUsers',
        value: '100',
        hidden: false
      });
    });

    it('should delete role property', async () => {
      expectSuccess(await persistence.setRoleProperty(db, testOrg.id, testRole.id, {
        name: 'temp',
        value: 'value',
        hidden: false
      }));

      expectSuccess(await persistence.deleteRoleProperty(db, testOrg.id, testRole.id, 'temp'));

      const result = await persistence.getRoleProperty(db, testOrg.id, testRole.id, 'temp');
      expectError(result, /not found/i);
    });
  });
});