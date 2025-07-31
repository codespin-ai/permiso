import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Properties with JSONB values', () => {
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
        input: { id: 'test-org', name: 'Test Organization' }
      });
    });

    it('should store and retrieve different JSON types', async () => {
      const setPropMutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON, $hidden: Boolean) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value, hidden: $hidden) {
            name
            value
            hidden
          }
        }
      `;

      // Test string value
      const stringResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'stringProp',
        value: 'hello world'
      });
      expect(stringResult.data?.setOrganizationProperty.value).to.equal('hello world');

      // Test number value
      const numberResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'numberProp',
        value: 42
      });
      expect(numberResult.data?.setOrganizationProperty.value).to.equal(42);

      // Test boolean value
      const boolResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'boolProp',
        value: true
      });
      expect(boolResult.data?.setOrganizationProperty.value).to.equal(true);

      // Test null value
      const nullResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'nullProp',
        value: null
      });
      expect(nullResult.data?.setOrganizationProperty.value).to.equal(null);

      // Test array value
      const arrayResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'arrayProp',
        value: ['item1', 'item2', 3, true]
      });
      expect(arrayResult.data?.setOrganizationProperty.value).to.deep.equal(['item1', 'item2', 3, true]);

      // Test object value
      const objectResult = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        name: 'objectProp',
        value: {
          name: 'Test',
          count: 10,
          enabled: true,
          metadata: {
            tags: ['tag1', 'tag2']
          }
        }
      });
      expect(objectResult.data?.setOrganizationProperty.value).to.deep.equal({
        name: 'Test',
        count: 10,
        enabled: true,
        metadata: {
          tags: ['tag1', 'tag2']
        }
      });
    });

    it('should retrieve properties with correct JSON types', async () => {
      // Set various properties
      const setPropMutation = gql`
        mutation SetOrganizationProperty($orgId: ID!, $name: String!, $value: JSON) {
          setOrganizationProperty(orgId: $orgId, name: $name, value: $value) {
            name
          }
        }
      `;

      await client.mutate(setPropMutation, { orgId: 'test-org', name: 'str', value: 'text' });
      await client.mutate(setPropMutation, { orgId: 'test-org', name: 'num', value: 123.45 });
      await client.mutate(setPropMutation, { orgId: 'test-org', name: 'bool', value: false });
      await client.mutate(setPropMutation, { orgId: 'test-org', name: 'arr', value: [1, 2, 3] });
      await client.mutate(setPropMutation, { orgId: 'test-org', name: 'obj', value: { key: 'value' } });

      // Query organization with properties
      const query = gql`
        query GetOrganization($id: ID!) {
          organization(id: $id) {
            id
            properties {
              name
              value
            }
          }
        }
      `;

      const result = await client.query(query, { id: 'test-org' });
      const props = result.data?.organization.properties;
      expect(props).to.have.lengthOf(5);

      // Check each property maintains its type
      const propMap = props.reduce((acc: any, p: any) => {
        acc[p.name] = p.value;
        return acc;
      }, {});

      expect(propMap.str).to.equal('text');
      expect(propMap.num).to.equal(123.45);
      expect(propMap.bool).to.equal(false);
      expect(propMap.arr).to.deep.equal([1, 2, 3]);
      expect(propMap.obj).to.deep.equal({ key: 'value' });
    });
  });

  describe('User Properties', () => {
    beforeEach(async () => {
      // Create test organization and user
      const createOrgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;
      await client.mutate(createOrgMutation, {
        input: { id: 'test-org', name: 'Test Organization' }
      });

      const createUserMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;
      await client.mutate(createUserMutation, {
        input: {
          id: 'test-user',
          orgId: 'test-org',
          identityProvider: 'test',
          identityProviderUserId: 'user123'
        }
      });
    });

    it('should handle complex JSON objects in user properties', async () => {
      const setPropMutation = gql`
        mutation SetUserProperty($orgId: ID!, $userId: ID!, $name: String!, $value: JSON) {
          setUserProperty(orgId: $orgId, userId: $userId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      const complexValue = {
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            frequency: 'daily'
          }
        },
        metadata: {
          lastLogin: '2024-01-01T00:00:00Z',
          loginCount: 42,
          features: ['feature1', 'feature2']
        }
      };

      const result = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        userId: 'test-user',
        name: 'settings',
        value: complexValue
      });

      expect(result.data?.setUserProperty.value).to.deep.equal(complexValue);
    });
  });

  describe('Role Properties', () => {
    beforeEach(async () => {
      // Create test organization and role
      const createOrgMutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `;
      await client.mutate(createOrgMutation, {
        input: { id: 'test-org', name: 'Test Organization' }
      });

      const createRoleMutation = gql`
        mutation CreateRole($input: CreateRoleInput!) {
          createRole(input: $input) {
            id
          }
        }
      `;
      await client.mutate(createRoleMutation, {
        input: {
          id: 'test-role',
          orgId: 'test-org',
          name: 'Test Role'
        }
      });
    });

    it('should handle arrays and nested structures in role properties', async () => {
      const setPropMutation = gql`
        mutation SetRoleProperty($orgId: ID!, $roleId: ID!, $name: String!, $value: JSON) {
          setRoleProperty(orgId: $orgId, roleId: $roleId, name: $name, value: $value) {
            name
            value
          }
        }
      `;

      // Test array of objects
      const permissionsValue = [
        { resource: '/api/users', actions: ['read', 'write'] },
        { resource: '/api/products', actions: ['read'] },
        { resource: '/api/admin/*', actions: ['*'] }
      ];

      const result = await client.mutate(setPropMutation, {
        orgId: 'test-org',
        roleId: 'test-role',
        name: 'customPermissions',
        value: permissionsValue
      });

      expect(result.data?.setRoleProperty.value).to.deep.equal(permissionsValue);
    });
  });

  describe('Property creation with initial values', () => {
    it('should create organization with JSON property values', async () => {
      const mutation = gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
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
          id: 'org-with-props',
          name: 'Organization with JSON props',
          properties: [
            { name: 'config', value: { tier: 'premium', maxUsers: 100 } },
            { name: 'features', value: ['feature1', 'feature2', 'feature3'] },
            { name: 'active', value: true },
            { name: 'score', value: 98.5 }
          ]
        }
      });

      const props = result.data?.createOrganization.properties;
      expect(props).to.have.lengthOf(4);

      const propMap = props.reduce((acc: any, p: any) => {
        acc[p.name] = p.value;
        return acc;
      }, {});

      expect(propMap.config).to.deep.equal({ tier: 'premium', maxUsers: 100 });
      expect(propMap.features).to.deep.equal(['feature1', 'feature2', 'feature3']);
      expect(propMap.active).to.equal(true);
      expect(propMap.score).to.equal(98.5);
    });

    it('should create user with JSON property values', async () => {
      // First create organization
      await client.mutate(gql`
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `, {
        input: { id: 'test-org', name: 'Test Organization' }
      });

      const mutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            properties {
              name
              value
            }
          }
        }
      `;

      const result = await client.mutate(mutation, {
        input: {
          id: 'user-with-props',
          orgId: 'test-org',
          identityProvider: 'test',
          identityProviderUserId: 'user456',
          properties: [
            { name: 'profile', value: { firstName: 'John', lastName: 'Doe', age: 30 } },
            { name: 'tags', value: ['admin', 'developer'] }
          ]
        }
      });

      const props = result.data?.createUser.properties;
      expect(props).to.have.lengthOf(2);

      const profileProp = props.find((p: any) => p.name === 'profile');
      expect(profileProp?.value).to.deep.equal({ firstName: 'John', lastName: 'Doe', age: 30 });

      const tagsProp = props.find((p: any) => p.name === 'tags');
      expect(tagsProp?.value).to.deep.equal(['admin', 'developer']);
    });
  });
});