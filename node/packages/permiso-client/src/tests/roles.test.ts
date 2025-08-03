import { expect } from 'chai';
import { createOrganization } from '../api/organizations.js';
import { 
  createRole,
  getRole,
  listRoles,
  getRolesByIds,
  updateRole,
  deleteRole,
  setRoleProperty,
  getRoleProperty,
  deleteRoleProperty
} from '../api/roles.js';
import { getTestConfig, generateTestId } from './utils/test-helpers.js';
import './setup.js';

describe('Roles API', () => {
  const config = getTestConfig();
  let testOrgId: string;

  beforeEach(async () => {
    // Create a test organization for each test
    testOrgId = generateTestId('org');
    const orgResult = await createOrganization(config, {
      id: testOrgId,
      name: 'Test Organization'
    });
    expect(orgResult.success).to.be.true;
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const roleId = generateTestId('role');
      const result = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Administrator',
        description: 'Full system access',
        properties: [
          { name: 'level', value: 'admin' },
          { name: 'permissions', value: { canManageUsers: true, canViewReports: true } }
        ]
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.id).to.equal(roleId);
        expect(result.data.orgId).to.equal(testOrgId);
        expect(result.data.name).to.equal('Administrator');
        expect(result.data.description).to.equal('Full system access');
        expect(result.data.properties).to.have.lengthOf(2);
      }
    });

    it('should handle duplicate role creation', async () => {
      const roleId = generateTestId('role');
      
      // Create first role
      const result1 = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Test Role'
      });
      expect(result1.success).to.be.true;

      // Try to create duplicate
      const result2 = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Duplicate Role'
      });
      expect(result2.success).to.be.false;
      if (!result2.success) {
        expect(result2.error.message).to.include('duplicate key');
      }
    });
  });

  describe('getRole', () => {
    it('should retrieve an existing role', async () => {
      const roleId = generateTestId('role');
      
      // Create role
      const createResult = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Test Role',
        description: 'Test description'
      });
      expect(createResult.success).to.be.true;

      // Get role
      const getResult = await getRole(config, testOrgId, roleId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data?.id).to.equal(roleId);
        expect(getResult.data?.name).to.equal('Test Role');
        expect(getResult.data?.description).to.equal('Test description');
      }
    });

    it('should return null for non-existent role', async () => {
      const result = await getRole(config, testOrgId, 'non-existent-role');
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.null;
      }
    });
  });

  describe('listRoles', () => {
    it('should list roles with pagination', async () => {
      // Create multiple roles
      const roleIds = [];
      for (let i = 0; i < 5; i++) {
        const roleId = generateTestId(`role-${i}`);
        roleIds.push(roleId);
        const result = await createRole(config, {
          id: roleId,
          orgId: testOrgId,
          name: `Role ${i}`
        });
        expect(result.success).to.be.true;
      }

      // List with pagination
      const listResult = await listRoles(config, testOrgId, {
        pagination: { limit: 3, offset: 0 }
      });
      
      expect(listResult.success).to.be.true;
      if (listResult.success) {
        expect(listResult.data.nodes).to.have.lengthOf(3);
        expect(listResult.data.totalCount).to.equal(5);
        expect(listResult.data.pageInfo.hasNextPage).to.be.true;
      }
    });

    it('should list roles with descending sort', async () => {
      // Create roles with specific IDs to test sorting
      const roleIds = ['z-role', 'a-role', 'm-role'];
      for (const roleId of roleIds) {
        const result = await createRole(config, {
          id: roleId,
          orgId: testOrgId,
          name: `Test ${roleId}`
        });
        expect(result.success).to.be.true;
      }

      // List with DESC sort
      const listResult = await listRoles(config, testOrgId, {
        pagination: { sortDirection: 'DESC' }
      });
      
      expect(listResult.success).to.be.true;
      if (listResult.success) {
        const ids = listResult.data.nodes.map(role => role.id);
        const zIndex = ids.indexOf('z-role');
        const aIndex = ids.indexOf('a-role');
        if (zIndex !== -1 && aIndex !== -1) {
          expect(zIndex).to.be.lessThan(aIndex);
        }
      }
    });

    it('should filter roles by properties', async () => {
      // Create roles with different properties
      await createRole(config, {
        id: generateTestId('role-admin'),
        orgId: testOrgId,
        name: 'Admin Role',
        properties: [{ name: 'level', value: 'admin' }]
      });

      await createRole(config, {
        id: generateTestId('role-user'),
        orgId: testOrgId,
        name: 'User Role',
        properties: [{ name: 'level', value: 'user' }]
      });

      // Filter by property
      const result = await listRoles(config, testOrgId, {
        filter: {
          properties: [{ name: 'level', value: 'admin' }]
        }
      });

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.nodes).to.have.lengthOf(1);
        expect(result.data.nodes[0]?.name).to.equal('Admin Role');
      }
    });
  });

  describe('getRolesByIds', () => {
    it('should retrieve multiple roles by IDs', async () => {
      const roleIds = [];
      for (let i = 0; i < 3; i++) {
        const roleId = generateTestId(`role-${i}`);
        roleIds.push(roleId);
        const result = await createRole(config, {
          id: roleId,
          orgId: testOrgId,
          name: `Role ${i}`
        });
        expect(result.success).to.be.true;
      }

      const result = await getRolesByIds(config, testOrgId, roleIds);
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
        const retrievedIds = result.data.map(role => role.id);
        expect(retrievedIds).to.have.members(roleIds);
      }
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const roleId = generateTestId('role');
      
      // Create role
      const createResult = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Original Name',
        description: 'Original description'
      });
      expect(createResult.success).to.be.true;

      // Update role
      const updateResult = await updateRole(config, testOrgId, roleId, {
        name: 'Updated Name',
        description: 'Updated description'
      });
      expect(updateResult.success).to.be.true;
      if (updateResult.success) {
        expect(updateResult.data.name).to.equal('Updated Name');
        expect(updateResult.data.description).to.equal('Updated description');
      }
    });
  });

  describe('Role Properties', () => {
    let roleId: string;

    beforeEach(async () => {
      roleId = generateTestId('role');
      const result = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'Test Role'
      });
      expect(result.success).to.be.true;
    });

    it('should set and get role properties', async () => {
      const propertyValue = {
        permissions: {
          users: ['create', 'read', 'update', 'delete'],
          reports: ['read', 'export'],
          settings: ['read']
        },
        maxApiCalls: 10000,
        enabledFeatures: ['dashboard', 'analytics']
      };

      const setPropResult = await setRoleProperty(
        config,
        testOrgId,
        roleId,
        'config',
        propertyValue,
        false
      );
      expect(setPropResult.success).to.be.true;

      const getPropResult = await getRoleProperty(config, testOrgId, roleId, 'config');
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data?.value).to.deep.equal(propertyValue);
      }
    });

    it('should handle hidden role properties', async () => {
      const setPropResult = await setRoleProperty(
        config,
        testOrgId,
        roleId,
        'secretConfig',
        { apiKey: 'secret-123' },
        true
      );
      expect(setPropResult.success).to.be.true;
      if (setPropResult.success) {
        expect(setPropResult.data.hidden).to.be.true;
      }
    });

    it('should delete role properties', async () => {
      // Set property
      await setRoleProperty(config, testOrgId, roleId, 'temp', 'value', false);

      // Delete property
      const deleteResult = await deleteRoleProperty(config, testOrgId, roleId, 'temp');
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify deletion
      const getPropResult = await getRoleProperty(config, testOrgId, roleId, 'temp');
      expect(getPropResult.success).to.be.true;
      if (getPropResult.success) {
        expect(getPropResult.data).to.be.null;
      }
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const roleId = generateTestId('role');
      
      // Create role
      const createResult = await createRole(config, {
        id: roleId,
        orgId: testOrgId,
        name: 'To Delete'
      });
      expect(createResult.success).to.be.true;

      // Delete role
      const deleteResult = await deleteRole(config, testOrgId, roleId);
      expect(deleteResult.success).to.be.true;
      if (deleteResult.success) {
        expect(deleteResult.data).to.be.true;
      }

      // Verify deletion
      const getResult = await getRole(config, testOrgId, roleId);
      expect(getResult.success).to.be.true;
      if (getResult.success) {
        expect(getResult.data).to.be.null;
      }
    });
  });
});