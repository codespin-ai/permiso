import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import { TestDatabase } from '../utils/test-db.js';
import { expectSuccess, expectError, createTestOrganization } from '../utils/test-helpers.js';

describe('Resources Integration Tests', () => {
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

  describe('createResource', () => {
    it('should create a resource with all fields', async () => {
      const input: persistence.CreateResourceInput = {
        path: '/api/users',
        orgId: testOrg.id,
        data: JSON.stringify({ 
          type: 'endpoint',
          method: 'GET',
          description: 'List all users'
        })
      };

      const resource = expectSuccess(await persistence.createResource(db, input));

      expect(resource.id).to.equal('/api/users'); // id is the path
      expect(resource.orgId).to.equal(testOrg.id);
      expect(resource.data).to.equal(input.data);
      expect(resource.createdAt).to.be.instanceOf(Date);
      expect(resource.updatedAt).to.be.instanceOf(Date);
    });

    it('should create a resource with minimal fields', async () => {
      const input: persistence.CreateResourceInput = {
        path: '/api/posts',
        orgId: testOrg.id
      };

      const resource = expectSuccess(await persistence.createResource(db, input));

      expect(resource.id).to.equal('/api/posts');
      expect(resource.data).to.be.null;
    });

    it('should create resources with wildcard paths', async () => {
      const resources = await Promise.all([
        persistence.createResource(db, {
          path: '/api/users/*',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/api/users/*/posts',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/api/**',
          orgId: testOrg.id
        })
      ]);

      resources.forEach(result => {
        expect(result.success).to.be.true;
      });
    });

    it('should fail to create duplicate resource path in same org', async () => {
      const input: persistence.CreateResourceInput = {
        path: '/api/duplicate',
        orgId: testOrg.id
      };

      expectSuccess(await persistence.createResource(db, input));
      
      const result = await persistence.createResource(db, input);
      expectError(result, /duplicate key|already exists/i);
    });

    it('should allow same resource path in different orgs', async () => {
      const org2 = await createTestOrganization(db, { id: 'org-2' });

      const resource1 = expectSuccess(await persistence.createResource(db, {
        path: '/api/shared',
        orgId: testOrg.id
      }));

      const resource2 = expectSuccess(await persistence.createResource(db, {
        path: '/api/shared',
        orgId: org2.id
      }));

      expect(resource1.id).to.equal(resource2.id);
      expect(resource1.orgId).to.not.equal(resource2.orgId);
    });
  });

  describe('getResource', () => {
    it('should retrieve an existing resource', async () => {
      const created = expectSuccess(await persistence.createResource(db, {
        path: '/api/test-resource',
        orgId: testOrg.id,
        data: JSON.stringify({ protected: true })
      }));

      const retrieved = expectSuccess(await persistence.getResource(db, testOrg.id, '/api/test-resource'));

      expect(retrieved).to.deep.equal(created);
    });

    it('should return error for non-existent resource', async () => {
      const result = await persistence.getResource(db, testOrg.id, '/non-existent');
      expectError(result, /not found/i);
    });
  });

  describe('getResources', () => {
    beforeEach(async () => {
      await Promise.all([
        persistence.createResource(db, {
          path: '/api/users',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/api/users/*',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/api/posts',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/api/posts/*',
          orgId: testOrg.id
        }),
        persistence.createResource(db, {
          path: '/admin/dashboard',
          orgId: testOrg.id
        })
      ]);
    });

    it('should retrieve all resources in organization', async () => {
      const resources = expectSuccess(await persistence.getResources(db, testOrg.id));

      expect(resources).to.have.lengthOf(5);
      const paths = resources.map(r => r.id);
      expect(paths).to.include.members([
        '/api/users',
        '/api/users/*',
        '/api/posts',
        '/api/posts/*',
        '/admin/dashboard'
      ]);
    });

    it('should filter resources by paths', async () => {
      const resources = expectSuccess(await persistence.getResources(db, testOrg.id, {
        paths: ['/api/users', '/api/posts']
      }));

      expect(resources).to.have.lengthOf(2);
      expect(resources.map(r => r.id)).to.have.members(['/api/users', '/api/posts']);
    });

    it('should filter resources by path prefix', async () => {
      const resources = expectSuccess(await persistence.getResources(db, testOrg.id, {
        pathPrefix: '/api/'
      }));

      expect(resources).to.have.lengthOf(4);
      resources.forEach(r => {
        expect(r.id).to.match(/^\/api\//);
      });
    });

    it('should support pagination', async () => {
      const page1 = expectSuccess(await persistence.getResources(db, testOrg.id, undefined, {
        limit: 3,
        offset: 0
      }));
      expect(page1).to.have.lengthOf(3);

      const page2 = expectSuccess(await persistence.getResources(db, testOrg.id, undefined, {
        limit: 3,
        offset: 3
      }));
      expect(page2).to.have.lengthOf(2);
    });
  });

  describe('updateResource', () => {
    it('should update resource data', async () => {
      const resource = expectSuccess(await persistence.createResource(db, {
        path: '/api/update-test',
        orgId: testOrg.id,
        data: JSON.stringify({ version: 1 })
      }));

      const updated = expectSuccess(await persistence.updateResource(db, testOrg.id, resource.id, {
        data: JSON.stringify({ version: 2, updated: true })
      }));

      expect(updated.data).to.equal(JSON.stringify({ version: 2, updated: true }));
      expect(updated.updatedAt.getTime()).to.be.greaterThan(resource.updatedAt.getTime());
    });

    it('should return error for non-existent resource', async () => {
      const result = await persistence.updateResource(db, testOrg.id, '/non-existent', {
        data: JSON.stringify({ test: true })
      });
      expectError(result, /not found/i);
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource and cascade to permissions', async () => {
      const resource = expectSuccess(await persistence.createResource(db, {
        path: '/api/delete-test',
        orgId: testOrg.id
      }));

      // Create a user and grant permission on this resource
      const user = expectSuccess(await persistence.createUser(db, {
        id: 'test-user',
        orgId: testOrg.id,
        identityProvider: 'local',
        identityProviderUserId: 'test'
      }));

      expectSuccess(await persistence.grantUserPermission(db, {
        userId: user.id,
        resourceId: resource.id,
        action: 'read'
      }));

      // Delete resource
      expectSuccess(await persistence.deleteResource(db, testOrg.id, resource.id));

      // Verify resource is deleted
      const getResult = await persistence.getResource(db, testOrg.id, resource.id);
      expectError(getResult, /not found/i);

      // Verify permission is also deleted
      const permissions = expectSuccess(await persistence.getUserPermissions(db, testOrg.id, user.id));
      expect(permissions).to.have.lengthOf(0);
    });

    it('should return error for non-existent resource', async () => {
      const result = await persistence.deleteResource(db, testOrg.id, '/non-existent');
      expectError(result, /not found/i);
    });
  });

  describe('resource path matching', () => {
    beforeEach(async () => {
      await Promise.all([
        persistence.createResource(db, { path: '/api', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/*', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/users', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/users/*', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/users/*/posts', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/users/*/posts/*', orgId: testOrg.id }),
        persistence.createResource(db, { path: '/api/**', orgId: testOrg.id })
      ]);
    });

    it('should match exact paths', async () => {
      const matched = expectSuccess(await persistence.getMatchingResources(db, testOrg.id, '/api/users'));
      
      const paths = matched.map(r => r.id);
      expect(paths).to.include('/api/users'); // exact match
      expect(paths).to.include('/api/*');     // wildcard parent
      expect(paths).to.include('/api/**');    // recursive wildcard
    });

    it('should match wildcard paths', async () => {
      const matched = expectSuccess(await persistence.getMatchingResources(db, testOrg.id, '/api/users/123'));
      
      const paths = matched.map(r => r.id);
      expect(paths).to.include('/api/users/*'); // direct wildcard match
      expect(paths).to.include('/api/*');       // parent wildcard
      expect(paths).to.include('/api/**');      // recursive wildcard
      expect(paths).to.not.include('/api/users'); // not an exact match
    });

    it('should match nested wildcard paths', async () => {
      const matched = expectSuccess(await persistence.getMatchingResources(db, testOrg.id, '/api/users/123/posts'));
      
      const paths = matched.map(r => r.id);
      expect(paths).to.include('/api/users/*/posts'); // pattern match
      expect(paths).to.include('/api/**');            // recursive wildcard
      expect(paths).to.not.include('/api/users/*');   // doesn't match full path
    });

    it('should match deeply nested paths', async () => {
      const matched = expectSuccess(await persistence.getMatchingResources(db, testOrg.id, '/api/users/123/posts/456'));
      
      const paths = matched.map(r => r.id);
      expect(paths).to.include('/api/users/*/posts/*'); // pattern match
      expect(paths).to.include('/api/**');              // recursive wildcard
    });

    it('should return empty array for non-matching paths', async () => {
      const matched = expectSuccess(await persistence.getMatchingResources(db, testOrg.id, '/admin/panel'));
      expect(matched).to.have.lengthOf(0);
    });
  });
});