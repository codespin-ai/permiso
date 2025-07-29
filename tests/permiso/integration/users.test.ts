import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { expectSuccess, expectError, createTestOrganization } from '../utils/test-helpers.js';

describe('Users Integration Tests', () => {
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

  describe('createUser', () => {
    it('should create a user with all fields', async () => {
      const input: persistence.CreateUserInput = {
        id: 'user-1',
        orgId: testOrg.id,
        identityProvider: 'google',
        identityProviderUserId: 'google-123',
        data: JSON.stringify({ email: 'user@example.com', name: 'Test User' }),
        properties: [
          { name: 'department', value: 'engineering', hidden: false },
          { name: 'ssn', value: '123-45-6789', hidden: true }
        ]
      };

      const user = expectSuccess(await persistence.createUser(db, input));

      expect(user.id).to.equal('user-1');
      expect(user.orgId).to.equal(testOrg.id);
      expect(user.identityProvider).to.equal('google');
      expect(user.identityProviderUserId).to.equal('google-123');
      expect(user.data).to.equal(input.data);
      expect(user.properties).to.have.lengthOf(2);
      expect(user.createdAt).to.be.instanceOf(Date);
      expect(user.updatedAt).to.be.instanceOf(Date);
    });

    it('should create a user with minimal fields', async () => {
      const input: persistence.CreateUserInput = {
        id: 'user-2',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'user-2'
      };

      const user = expectSuccess(await persistence.createUser(db, input));

      expect(user.id).to.equal('user-2');
      expect(user.data).to.be.null;
      expect(user.properties).to.have.lengthOf(0);
    });

    it('should fail to create duplicate user ID in same org', async () => {
      const input: persistence.CreateUserInput = {
        id: 'duplicate-user',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'dup-1'
      };

      expectSuccess(await persistence.createUser(db, input));
      
      const duplicate = { ...input, identityProviderUserId: 'dup-2' };
      const result = await persistence.createUser(db, duplicate);
      expectError(result, /duplicate key|already exists/i);
    });

    it('should allow same user ID in different orgs', async () => {
      const org2 = await createTestOrganization(db, { id: 'test-org-2' });

      const input1: persistence.CreateUserInput = {
        id: 'shared-user-id',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'user-1'
      };

      const input2: persistence.CreateUserInput = {
        id: 'shared-user-id',
        orgId: org2.id,
        identityProvider: 'local',
        identityProviderUserId: 'user-2'
      };

      const user1 = expectSuccess(await persistence.createUser(db, input1));
      const user2 = expectSuccess(await persistence.createUser(db, input2));

      expect(user1.id).to.equal(user2.id);
      expect(user1.orgId).to.not.equal(user2.orgId);
    });
  });

  describe('getUser', () => {
    it('should retrieve an existing user', async () => {
      const created = expectSuccess(await persistence.createUser(db, {
        id: 'get-test-user',
        orgId: testOrg.id,
        identityProvider: 'auth0',
        identityProviderUserId: 'auth0-123',
        properties: [{ name: 'role', value: 'admin', hidden: false }]
      }));

      const retrieved = expectSuccess(await persistence.getUser(db, testOrg.id, 'get-test-user'));

      expect(retrieved).to.deep.equal(created);
    });

    it('should return error for non-existent user', async () => {
      const result = await persistence.getUser(db, testOrg.id, 'non-existent');
      expectError(result, /not found/i);
    });

    it('should not find user from different org', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });
      
      expectSuccess(await persistence.createUser(db, {
        id: 'user-in-org2',
        orgId: org2.id,
        identityProvider: 'local',
        identityProviderUserId: 'user-1'
      }));

      const result = await persistence.getUser(db, testOrg.id, 'user-in-org2');
      expectError(result, /not found/i);
    });
  });

  describe('getUsers', () => {
    beforeEach(async () => {
      await Promise.all([
        persistence.createUser(db, {
          id: 'user-1',
          orgId: testOrg.id,
          identityProvider: 'google',
          identityProviderUserId: 'google-1'
        }),
        persistence.createUser(db, {
          id: 'user-2',
          orgId: testOrg.id,
          identityProvider: 'github',
          identityProviderUserId: 'github-2'
        }),
        persistence.createUser(db, {
          id: 'user-3',
          orgId: testOrg.id,
          identityProvider: 'google',
          identityProviderUserId: 'google-3'
        })
      ]);
    });

    it('should retrieve all users in organization', async () => {
      const users = expectSuccess(await persistence.getUsers(db, testOrg.id));

      expect(users).to.have.lengthOf(3);
      expect(users.map(u => u.id)).to.have.members(['user-1', 'user-2', 'user-3']);
    });

    it('should filter users by IDs', async () => {
      const users = expectSuccess(await persistence.getUsers(db, testOrg.id, { 
        ids: ['user-1', 'user-3'] 
      }));

      expect(users).to.have.lengthOf(2);
      expect(users.map(u => u.id)).to.have.members(['user-1', 'user-3']);
    });

    it('should filter users by identity provider', async () => {
      const users = expectSuccess(await persistence.getUsers(db, testOrg.id, { 
        identityProvider: 'google' 
      }));

      expect(users).to.have.lengthOf(2);
      expect(users.map(u => u.id)).to.have.members(['user-1', 'user-3']);
    });

    it('should not return users from other organizations', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });
      
      expectSuccess(await persistence.createUser(db, {
        id: 'user-in-org2',
        orgId: org2.id,
        identityProvider: 'local',
        identityProviderUserId: 'user-org2'
      }));

      const users = expectSuccess(await persistence.getUsers(db, testOrg.id));
      expect(users).to.have.lengthOf(3);
      expect(users.map(u => u.id)).to.not.include('user-in-org2');
    });
  });

  describe('getUsersByIdentity', () => {
    it('should find users by identity provider and user ID', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });

      // Same identity provider user in multiple orgs
      await Promise.all([
        persistence.createUser(db, {
          id: 'user-org1',
          orgId: testOrg.id,
          identityProvider: 'github',
          identityProviderUserId: 'github-shared'
        }),
        persistence.createUser(db, {
          id: 'user-org2',
          orgId: org2.id,
          identityProvider: 'github',
          identityProviderUserId: 'github-shared'
        })
      ]);

      const users = expectSuccess(await persistence.getUsersByIdentity(db, 'github', 'github-shared'));

      expect(users).to.have.lengthOf(2);
      expect(users.map(u => u.orgId)).to.have.members([testOrg.id, org2.id]);
    });

    it('should return empty array for non-existent identity', async () => {
      const users = expectSuccess(await persistence.getUsersByIdentity(db, 'unknown', 'unknown-id'));
      expect(users).to.have.lengthOf(0);
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const user = expectSuccess(await persistence.createUser(db, {
        id: 'update-test',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'update-test',
        data: JSON.stringify({ name: 'Original Name' })
      }));

      const updated = expectSuccess(await persistence.updateUser(db, testOrg.id, user.id, {
        data: JSON.stringify({ name: 'Updated Name' })
      }));

      expect(updated.data).to.equal(JSON.stringify({ name: 'Updated Name' }));
      expect(updated.updatedAt.getTime()).to.be.greaterThan(user.updatedAt.getTime());
    });

    it('should return error for non-existent user', async () => {
      const result = await persistence.updateUser(db, testOrg.id, 'non-existent', {
        data: JSON.stringify({ test: true })
      });
      expectError(result, /not found/i);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and cascade to related entities', async () => {
      const user = expectSuccess(await persistence.createUser(db, {
        id: 'delete-test',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'delete-test'
      }));

      // Create role and assign to user
      const role = expectSuccess(await persistence.createRole(db, {
        id: 'test-role',
        orgId: testOrg.id
      }));

      expectSuccess(await persistence.assignUserRole(db, testOrg.id, user.id, role.id));

      // Delete user
      expectSuccess(await persistence.deleteUser(db, testOrg.id, user.id));

      // Verify user is deleted
      const getResult = await persistence.getUser(db, testOrg.id, user.id);
      expectError(getResult, /not found/i);

      // Verify user-role assignment is also deleted
      const userRoles = expectSuccess(await persistence.getUserRoles(db, testOrg.id, user.id));
      expect(userRoles).to.have.lengthOf(0);
    });
  });

  describe('user properties', () => {
    let testUser: persistence.User;

    beforeEach(async () => {
      testUser = expectSuccess(await persistence.createUser(db, {
        id: 'prop-test-user',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'prop-test'
      }));
    });

    it('should set and get user properties', async () => {
      expectSuccess(await persistence.setUserProperty(db, testOrg.id, testUser.id, {
        name: 'preference',
        value: 'dark-mode',
        hidden: false
      }));

      const prop = expectSuccess(await persistence.getUserProperty(db, testOrg.id, testUser.id, 'preference'));
      expect(prop).to.deep.include({
        name: 'preference',
        value: 'dark-mode',
        hidden: false
      });
    });

    it('should update existing property', async () => {
      expectSuccess(await persistence.setUserProperty(db, testOrg.id, testUser.id, {
        name: 'theme',
        value: 'light',
        hidden: false
      }));

      expectSuccess(await persistence.setUserProperty(db, testOrg.id, testUser.id, {
        name: 'theme',
        value: 'dark',
        hidden: false
      }));

      const prop = expectSuccess(await persistence.getUserProperty(db, testOrg.id, testUser.id, 'theme'));
      expect(prop.value).to.equal('dark');
    });

    it('should delete user property', async () => {
      expectSuccess(await persistence.setUserProperty(db, testOrg.id, testUser.id, {
        name: 'temp',
        value: 'value',
        hidden: false
      }));

      expectSuccess(await persistence.deleteUserProperty(db, testOrg.id, testUser.id, 'temp'));

      const result = await persistence.getUserProperty(db, testOrg.id, testUser.id, 'temp');
      expectError(result, /not found/i);
    });
  });
});