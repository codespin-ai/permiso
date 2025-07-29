import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { expectSuccess, expectError } from '../utils/test-helpers.js';

describe('Organizations Integration Tests', () => {
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

  describe('createOrganization', () => {
    it('should create an organization with all fields', async () => {
      const input: persistence.CreateOrganizationInput = {
        id: 'test-org-1',
        data: JSON.stringify({ name: 'Test Organization', type: 'enterprise' }),
        properties: [
          { name: 'plan', value: 'premium', hidden: false },
          { name: 'apiKey', value: 'secret-key', hidden: true }
        ]
      };

      const org = expectSuccess(await persistence.createOrganization(db, input));

      expect(org.id).to.equal('test-org-1');
      expect(org.data).to.equal(input.data);
      expect(org.properties).to.have.lengthOf(2);
      expect(org.properties[0]).to.deep.include({ name: 'plan', value: 'premium', hidden: false });
      expect(org.properties[1]).to.deep.include({ name: 'apiKey', value: 'secret-key', hidden: true });
      expect(org.createdAt).to.be.instanceOf(Date);
      expect(org.updatedAt).to.be.instanceOf(Date);
    });

    it('should create an organization with minimal fields', async () => {
      const input: persistence.CreateOrganizationInput = {
        id: 'test-org-2'
      };

      const org = expectSuccess(await persistence.createOrganization(db, input));

      expect(org.id).to.equal('test-org-2');
      expect(org.data).to.be.null;
      expect(org.properties).to.have.lengthOf(0);
    });

    it('should fail to create duplicate organization', async () => {
      const input: persistence.CreateOrganizationInput = {
        id: 'duplicate-org'
      };

      expectSuccess(await persistence.createOrganization(db, input));
      
      const result = await persistence.createOrganization(db, input);
      expectError(result, /duplicate key|already exists/i);
    });
  });

  describe('getOrganization', () => {
    it('should retrieve an existing organization', async () => {
      const created = expectSuccess(await persistence.createOrganization(db, {
        id: 'get-test-org',
        data: JSON.stringify({ name: 'Get Test' }),
        properties: [{ name: 'tier', value: 'gold', hidden: false }]
      }));

      const retrieved = expectSuccess(await persistence.getOrganization(db, 'get-test-org'));

      expect(retrieved).to.deep.equal(created);
    });

    it('should return error for non-existent organization', async () => {
      const result = await persistence.getOrganization(db, 'non-existent');
      expectError(result, /not found/i);
    });
  });

  describe('getOrganizations', () => {
    beforeEach(async () => {
      // Create test organizations
      await Promise.all([
        persistence.createOrganization(db, {
          id: 'org-1',
          data: JSON.stringify({ name: 'Alpha Corp' })
        }),
        persistence.createOrganization(db, {
          id: 'org-2',
          data: JSON.stringify({ name: 'Beta Inc' })
        }),
        persistence.createOrganization(db, {
          id: 'org-3',
          data: JSON.stringify({ name: 'Gamma LLC' })
        })
      ]);
    });

    it('should retrieve all organizations', async () => {
      const orgs = expectSuccess(await persistence.getOrganizations(db));

      expect(orgs).to.have.lengthOf(3);
      expect(orgs.map(o => o.id)).to.have.members(['org-1', 'org-2', 'org-3']);
    });

    it('should filter organizations by IDs', async () => {
      const orgs = expectSuccess(await persistence.getOrganizations(db, { ids: ['org-1', 'org-3'] }));

      expect(orgs).to.have.lengthOf(2);
      expect(orgs.map(o => o.id)).to.have.members(['org-1', 'org-3']);
    });

    it('should support pagination', async () => {
      const page1 = expectSuccess(await persistence.getOrganizations(db, undefined, { limit: 2, offset: 0 }));
      expect(page1).to.have.lengthOf(2);

      const page2 = expectSuccess(await persistence.getOrganizations(db, undefined, { limit: 2, offset: 2 }));
      expect(page2).to.have.lengthOf(1);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization data', async () => {
      expectSuccess(await persistence.createOrganization(db, {
        id: 'update-test',
        data: JSON.stringify({ name: 'Original' })
      }));

      const updated = expectSuccess(await persistence.updateOrganization(db, 'update-test', {
        data: JSON.stringify({ name: 'Updated' })
      }));

      expect(updated.data).to.equal(JSON.stringify({ name: 'Updated' }));
      expect(updated.updatedAt.getTime()).to.be.greaterThan(updated.createdAt.getTime());
    });

    it('should return error for non-existent organization', async () => {
      const result = await persistence.updateOrganization(db, 'non-existent', {
        data: JSON.stringify({ name: 'Test' })
      });
      expectError(result, /not found/i);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an organization and cascade to related entities', async () => {
      // Create organization with related entities
      const org = expectSuccess(await persistence.createOrganization(db, { id: 'delete-test' }));
      
      // Create user in the organization
      expectSuccess(await persistence.createUser(db, {
        id: 'user-1',
        orgId: org.id,
        identityProvider: 'test',
        identityProviderUserId: 'test-user'
      }));

      // Delete organization
      expectSuccess(await persistence.deleteOrganization(db, org.id));

      // Verify organization is deleted
      const getResult = await persistence.getOrganization(db, org.id);
      expectError(getResult, /not found/i);

      // Verify user is also deleted (cascade)
      const users = expectSuccess(await persistence.getUsers(db, org.id));
      expect(users).to.have.lengthOf(0);
    });

    it('should return error for non-existent organization', async () => {
      const result = await persistence.deleteOrganization(db, 'non-existent');
      expectError(result, /not found/i);
    });
  });

  describe('organization properties', () => {
    it('should set and get organization properties', async () => {
      const org = expectSuccess(await persistence.createOrganization(db, { id: 'prop-test' }));

      // Set property
      expectSuccess(await persistence.setOrganizationProperty(db, org.id, {
        name: 'feature',
        value: 'enabled',
        hidden: false
      }));

      // Get property
      const prop = expectSuccess(await persistence.getOrganizationProperty(db, org.id, 'feature'));
      expect(prop).to.deep.include({
        name: 'feature',
        value: 'enabled',
        hidden: false
      });

      // Update property
      expectSuccess(await persistence.setOrganizationProperty(db, org.id, {
        name: 'feature',
        value: 'disabled',
        hidden: false
      }));

      const updated = expectSuccess(await persistence.getOrganizationProperty(db, org.id, 'feature'));
      expect(updated.value).to.equal('disabled');
    });

    it('should delete organization property', async () => {
      const org = expectSuccess(await persistence.createOrganization(db, {
        id: 'prop-delete-test',
        properties: [{ name: 'temp', value: 'value', hidden: false }]
      }));

      expectSuccess(await persistence.deleteOrganizationProperty(db, org.id, 'temp'));

      const result = await persistence.getOrganizationProperty(db, org.id, 'temp');
      expectError(result, /not found/i);
    });
  });
});