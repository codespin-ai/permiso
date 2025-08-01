import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Property Operations', () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe('Organization Properties', () => {
    beforeEach(async () => {
      // Create test organization
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(mutation, {
        input: {
          id: 'test-org',
          name: 'Test Organization',
          properties: [
            { name: 'existing_prop', value: 'initial_value' }
          ]
        }
      });
    });

    describe('organizationProperty query', () => {
      it('should retrieve a single organization property', async () => {
        const query = gql`
          query GetOrganizationProperty($orgId: ID!, $propertyName: String!) {
            organizationProperty(orgId: $orgId, propertyName: $propertyName) {
              name
              value
              hidden
              createdAt
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          propertyName: 'existing_prop'
        });

        expect(result.data?.organizationProperty).to.not.be.null;
        expect(result.data?.organizationProperty?.name).to.equal('existing_prop');
        expect(result.data?.organizationProperty?.value).to.equal('initial_value');
        expect(result.data?.organizationProperty?.hidden).to.be.false;
        expect(result.data?.organizationProperty?.createdAt).to.be.a('string');
      });

      it('should return null for non-existent property', async () => {
        const query = gql`
          query GetOrganizationProperty($orgId: ID!, $propertyName: String!) {
            organizationProperty(orgId: $orgId, propertyName: $propertyName) {
              name
              value
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          propertyName: 'non_existent'
        });

        expect(result.data?.organizationProperty).to.be.null;
      });
    });

    describe('setOrganizationProperty mutation', () => {
      it('should create a new organization property', async () => {
        const mutation = gql`
          mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON, $hidden: Boolean) {
            setOrganizationProperty(orgId: $orgId, name: $name, value: $value, hidden: $hidden) {
              name
              value
              hidden
            }
          }
        `;

        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'new_prop',
          value: { complex: 'object', with: ['array', 'values'] },
          hidden: false
        });

        expect(result.data?.setOrganizationProperty?.name).to.equal('new_prop');
        expect(result.data?.setOrganizationProperty?.value).to.deep.equal({
          complex: 'object',
          with: ['array', 'values']
        });
        expect(result.data?.setOrganizationProperty?.hidden).to.be.false;
      });

      it('should update an existing organization property', async () => {
        const mutation = gql`
          mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON, $hidden: Boolean) {
            setOrganizationProperty(orgId: $orgId, name: $name, value: $value, hidden: $hidden) {
              name
              value
              hidden
            }
          }
        `;

        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'existing_prop',
          value: 'updated_value',
          hidden: true
        });

        expect(result.data?.setOrganizationProperty?.value).to.equal('updated_value');
        expect(result.data?.setOrganizationProperty?.hidden).to.be.true;

        // Verify it was updated
        const query = gql`
          query GetOrganization($id: ID!) {
            organization(id: $id) {
              properties {
                name
                value
                hidden
              }
            }
          }
        `;

        const queryResult = await client.query(query, { id: 'test-org' });
        expect(queryResult.data?.organization?.properties).to.have.lengthOf(1);
        expect(queryResult.data?.organization?.properties[0]).to.deep.include({
          name: 'existing_prop',
          value: 'updated_value',
          hidden: true
        });
      });

      it('should handle null values', async () => {
        const mutation = gql`
          mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
            setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
              name
              value
            }
          }
        `;

        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'null_prop',
          value: null
        });

        expect(result.data?.setOrganizationProperty?.value).to.be.null;
      });

      it('should handle various JSON types', async () => {
        const mutation = gql`
          mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
            setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
              name
              value
            }
          }
        `;

        // Test number
        let result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'number_prop',
          value: 42.5
        });
        expect(result.data?.setOrganizationProperty?.value).to.equal(42.5);

        // Test boolean
        result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'bool_prop',
          value: true
        });
        expect(result.data?.setOrganizationProperty?.value).to.equal(true);

        // Test array
        result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'array_prop',
          value: [1, 'two', { three: 3 }, null]
        });
        expect(result.data?.setOrganizationProperty?.value).to.deep.equal([1, 'two', { three: 3 }, null]);

        // Test nested object
        result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'nested_prop',
          value: {
            level1: {
              level2: {
                level3: 'deep',
                array: [1, 2, 3]
              }
            }
          }
        });
        expect(result.data?.setOrganizationProperty?.value).to.deep.equal({
          level1: {
            level2: {
              level3: 'deep',
              array: [1, 2, 3]
            }
          }
        });
      });
    });

    describe('deleteOrganizationProperty mutation', () => {
      it('should delete an existing organization property', async () => {
        // First add a property
        const setPropMutation = gql`
          mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
            setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
              name
            }
          }
        `;

        await client.mutate(setPropMutation, {
          orgId: 'test-org',
          name: 'to_delete',
          value: 'delete_me'
        });

        // Delete the property
        const deleteMutation = gql`
          mutation DeleteOrganizationProperty($orgId: ID!, $name: String!) {
            deleteOrganizationProperty(orgId: $orgId, name: $name)
          }
        `;

        const result = await client.mutate(deleteMutation, {
          orgId: 'test-org',
          name: 'to_delete'
        });

        expect(result.data?.deleteOrganizationProperty).to.be.true;

        // Verify it's deleted
        const query = gql`
          query GetOrganizationProperty($orgId: ID!, $propertyName: String!) {
            organizationProperty(orgId: $orgId, propertyName: $propertyName) {
              name
            }
          }
        `;

        const queryResult = await client.query(query, {
          orgId: 'test-org',
          propertyName: 'to_delete'
        });

        expect(queryResult.data?.organizationProperty).to.be.null;
      });

      it('should return false when deleting non-existent property', async () => {
        const mutation = gql`
          mutation DeleteOrganizationProperty($orgId: ID!, $name: String!) {
            deleteOrganizationProperty(orgId: $orgId, name: $name)
          }
        `;

        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: 'non_existent'
        });

        expect(result.data?.deleteOrganizationProperty).to.be.false;
      });
    });
  });

  describe('User Properties', () => {
    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: 'test-org', name: 'Test Organization' }
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
          identityProviderUserId: 'auth0|12345',
          properties: [
            { name: 'existing_prop', value: 'initial_value' }
          ]
        }
      });
    });

    describe('userProperty query', () => {
      it('should retrieve a single user property', async () => {
        const query = gql`
          query GetUserProperty($orgId: ID!, $userId: ID!, $propertyName: String!) {
            userProperty(orgId: $orgId, userId: $userId, propertyName: $propertyName) {
              name
              value
              hidden
              createdAt
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          userId: 'test-user',
          propertyName: 'existing_prop'
        });

        expect(result.data?.userProperty).to.not.be.null;
        expect(result.data?.userProperty?.name).to.equal('existing_prop');
        expect(result.data?.userProperty?.value).to.equal('initial_value');
        expect(result.data?.userProperty?.hidden).to.be.false;
      });

      it('should return null for non-existent property', async () => {
        const query = gql`
          query GetUserProperty($orgId: ID!, $userId: ID!, $propertyName: String!) {
            userProperty(orgId: $orgId, userId: $userId, propertyName: $propertyName) {
              name
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          userId: 'test-user',
          propertyName: 'non_existent'
        });

        expect(result.data?.userProperty).to.be.null;
      });
    });

    describe('deleteUserProperty mutation', () => {
      it('should delete an existing user property', async () => {
        // First add a property
        const setPropMutation = gql`
          mutation SetUserProperty($orgId: ID!, $userId: ID!, $name: String!, $value: JSON) {
            setUserProperty(orgId: $orgId, userId: $userId, name: $name, value: $value) {
              name
            }
          }
        `;

        await client.mutate(setPropMutation, {
          orgId: 'test-org',
          userId: 'test-user',
          name: 'to_delete',
          value: 'delete_me'
        });

        // Delete the property
        const deleteMutation = gql`
          mutation DeleteUserProperty($orgId: ID!, $userId: ID!, $name: String!) {
            deleteUserProperty(orgId: $orgId, userId: $userId, name: $name)
          }
        `;

        const result = await client.mutate(deleteMutation, {
          orgId: 'test-org',
          userId: 'test-user',
          name: 'to_delete'
        });

        expect(result.data?.deleteUserProperty).to.be.true;

        // Verify it's deleted
        const query = gql`
          query GetUserProperty($orgId: ID!, $userId: ID!, $propertyName: String!) {
            userProperty(orgId: $orgId, userId: $userId, propertyName: $propertyName) {
              name
            }
          }
        `;

        const queryResult = await client.query(query, {
          orgId: 'test-org',
          userId: 'test-user',
          propertyName: 'to_delete'
        });

        expect(queryResult.data?.userProperty).to.be.null;
      });
    });
  });

  describe('Role Properties', () => {
    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: 'test-org', name: 'Test Organization' }
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
          id: 'test-role',
          orgId: 'test-org',
          name: 'Test Role',
          properties: [
            { name: 'existing_prop', value: 'initial_value' }
          ]
        }
      });
    });

    describe('roleProperty query', () => {
      it('should retrieve a single role property', async () => {
        const query = gql`
          query GetRoleProperty($orgId: ID!, $roleId: ID!, $propertyName: String!) {
            roleProperty(orgId: $orgId, roleId: $roleId, propertyName: $propertyName) {
              name
              value
              hidden
              createdAt
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          roleId: 'test-role',
          propertyName: 'existing_prop'
        });

        expect(result.data?.roleProperty).to.not.be.null;
        expect(result.data?.roleProperty?.name).to.equal('existing_prop');
        expect(result.data?.roleProperty?.value).to.equal('initial_value');
        expect(result.data?.roleProperty?.hidden).to.be.false;
      });
    });

    describe('setRoleProperty mutation', () => {
      it('should create and update role properties', async () => {
        const mutation = gql`
          mutation SetRoleProperty($orgId: ID!, $roleId: ID!, $name: String!, $value: JSON, $hidden: Boolean) {
            setRoleProperty(orgId: $orgId, roleId: $roleId, name: $name, value: $value, hidden: $hidden) {
              name
              value
              hidden
            }
          }
        `;

        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          roleId: 'test-role',
          name: 'permissions_config',
          value: {
            maxApiCalls: 10000,
            allowedRegions: ['us-east', 'eu-west'],
            features: {
              billing: true,
              reporting: false
            }
          },
          hidden: false
        });

        expect(result.data?.setRoleProperty?.name).to.equal('permissions_config');
        expect(result.data?.setRoleProperty?.value).to.deep.equal({
          maxApiCalls: 10000,
          allowedRegions: ['us-east', 'eu-west'],
          features: {
            billing: true,
            reporting: false
          }
        });
      });
    });

    describe('deleteRoleProperty mutation', () => {
      it('should delete an existing role property', async () => {
        // First add a property
        const setPropMutation = gql`
          mutation SetRoleProperty($orgId: ID!, $roleId: ID!, $name: String!, $value: JSON) {
            setRoleProperty(orgId: $orgId, roleId: $roleId, name: $name, value: $value) {
              name
            }
          }
        `;

        await client.mutate(setPropMutation, {
          orgId: 'test-org',
          roleId: 'test-role',
          name: 'to_delete',
          value: 'delete_me'
        });

        // Delete the property
        const deleteMutation = gql`
          mutation DeleteRoleProperty($orgId: ID!, $roleId: ID!, $name: String!) {
            deleteRoleProperty(orgId: $orgId, roleId: $roleId, name: $name)
          }
        `;

        const result = await client.mutate(deleteMutation, {
          orgId: 'test-org',
          roleId: 'test-role',
          name: 'to_delete'
        });

        expect(result.data?.deleteRoleProperty).to.be.true;
      });
    });
  });

  describe('Property Edge Cases', () => {
    beforeEach(async () => {
      // Create test organization
      const orgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;

      await client.mutate(orgMutation, {
        input: { id: 'test-org', name: 'Test Organization' }
      });
    });

    it('should handle very large JSON objects', async () => {
      const largeObject: any = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key_${i}`] = {
          value: i,
          nested: {
            data: `Some data string ${i}`,
            array: Array(10).fill(i)
          }
        };
      }

      const mutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      const result = await client.mutate(mutation, {
        orgId: 'test-org',
        name: 'large_object',
        value: largeObject
      });

      expect(result.data?.setOrganizationProperty?.value).to.deep.equal(largeObject);
    });

    it('should handle deeply nested JSON structures', async () => {
      const deepObject: any = { level: 1 };
      let current = deepObject;
      for (let i = 2; i <= 10; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      current.value = 'deep value';

      const mutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      const result = await client.mutate(mutation, {
        orgId: 'test-org',
        name: 'deep_object',
        value: deepObject
      });

      expect(result.data?.setOrganizationProperty?.value).to.deep.equal(deepObject);
    });

    it('should handle special characters in property names', async () => {
      const mutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      const specialNames = [
        'prop.with.dots',
        'prop-with-dashes',
        'prop_with_underscores',
        'prop@with@at',
        'prop#with#hash',
        'prop$with$dollar',
        'prop%with%percent'
      ];

      for (const name of specialNames) {
        const result = await client.mutate(mutation, {
          orgId: 'test-org',
          name: name,
          value: `value for ${name}`
        });

        expect(result.data?.setOrganizationProperty?.name).to.equal(name);
        expect(result.data?.setOrganizationProperty?.value).to.equal(`value for ${name}`);
      }
    });

    it('should handle empty strings and whitespace', async () => {
      const mutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      // Empty string value
      let result = await client.mutate(mutation, {
        orgId: 'test-org',
        name: 'empty_string',
        value: ''
      });
      expect(result.data?.setOrganizationProperty?.value).to.equal('');

      // Whitespace value
      result = await client.mutate(mutation, {
        orgId: 'test-org',
        name: 'whitespace',
        value: '   '
      });
      expect(result.data?.setOrganizationProperty?.value).to.equal('   ');
    });

    it('should handle unicode and emoji in values', async () => {
      const mutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      const result = await client.mutate(mutation, {
        orgId: 'test-org',
        name: 'unicode_prop',
        value: {
          emoji: '🚀🌟😊',
          chinese: '你好世界',
          arabic: 'مرحبا بالعالم',
          russian: 'Привет мир'
        }
      });

      expect(result.data?.setOrganizationProperty?.value).to.deep.equal({
        emoji: '🚀🌟😊',
        chinese: '你好世界',
        arabic: 'مرحبا بالعالم',
        russian: 'Привет мир'
      });
    });
  });
});