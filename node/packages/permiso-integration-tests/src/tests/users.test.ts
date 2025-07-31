import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Users', () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
    
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
        name: 'Test Organization'
      }
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            orgId
            identityProvider
            identityProviderUserId
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
          id: 'user-123',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|12345',
          properties: [
            { name: 'email', value: 'user@example.com' },
            { name: 'apiToken', value: 'secret', hidden: true }
          ]
        }
      });

      const user = result.data?.createUser;
      expect(user?.id).to.equal('user-123');
      expect(user?.orgId).to.equal('test-org');
      expect(user?.identityProvider).to.equal('auth0');
      expect(user?.identityProviderUserId).to.equal('auth0|12345');
      expect(user?.properties).to.have.lengthOf(2);
      
      const emailProp = user?.properties.find((p: any) => p.name === 'email');
      expect(emailProp).to.deep.include({ name: 'email', value: 'user@example.com', hidden: false });
      
      const tokenProp = user?.properties.find((p: any) => p.name === 'apiToken');
      expect(tokenProp).to.deep.include({ name: 'apiToken', value: 'secret', hidden: true });
    });

    it('should fail with non-existent organization', async () => {
      const mutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      try {
        const result = await client.mutate(mutation, {
          input: {
            id: 'user-123',
            orgId: 'non-existent-org',
            identityProvider: 'auth0',
            identityProviderUserId: 'auth0|12345'
          }
        });
        
        // Check if there are errors in the response
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message.toLowerCase();
          expect(errorMessage).to.satisfy((msg: string) => 
            msg.includes('foreign key violation') || 
            msg.includes('is not present in table') ||
            msg.includes('constraint')
          );
        } else {
          expect.fail('Should have returned an error');
        }
      } catch (error: any) {
        // If an exception was thrown, check it
        const errorMessage = error.graphQLErrors?.[0]?.message || error.message || '';
        expect(errorMessage.toLowerCase()).to.satisfy((msg: string) => 
          msg.includes('foreign key violation') || 
          msg.includes('is not present in table') ||
          msg.includes('constraint')
        );
      }
    });
  });

  describe('users query', () => {
    it('should list users in an organization', async () => {
      const createUserMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      // Create multiple users
      await client.mutate(createUserMutation, {
        input: {
          id: 'user-1',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|1'
        }
      });

      await client.mutate(createUserMutation, {
        input: {
          id: 'user-2',
          orgId: 'test-org',
          identityProvider: 'google',
          identityProviderUserId: 'google|2'
        }
      });

      // Query users
      const query = gql`
        query ListUsers($orgId: ID!) {
          users(orgId: $orgId) {
            nodes {
              id
              orgId
              identityProvider
              identityProviderUserId
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org' });

      expect(result.data?.users?.nodes).to.have.lengthOf(2);
      const userIds = result.data?.users?.nodes.map((u: any) => u.id);
      expect(userIds).to.include.members(['user-1', 'user-2']);
    });

    it('should return empty array for organization with no users', async () => {
      const query = gql`
        query ListUsers($orgId: ID!) {
          users(orgId: $orgId) {
            nodes {
              id
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org' });

      expect(result.data?.users?.nodes).to.deep.equal([]);
    });
  });

  describe('user query', () => {
    it('should retrieve a user by orgId and userId', async () => {
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'user-123',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|12345',
          properties: [
            { name: 'email', value: 'user@example.com' }
          ]
        }
      });

      // Query user
      const query = gql`
        query GetUser($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            orgId
            identityProvider
            identityProviderUserId
            properties {
              name
              value
              hidden
            }
            createdAt
            updatedAt
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org', userId: 'user-123' });

      expect(result.data?.user?.id).to.equal('user-123');
      expect(result.data?.user?.orgId).to.equal('test-org');
      expect(result.data?.user?.properties).to.have.lengthOf(1);
      const prop = result.data?.user?.properties[0];
      expect(prop).to.include({ name: 'email', value: 'user@example.com', hidden: false });
    });
  });

  describe('updateUser', () => {
    it('should update user identity provider info', async () => {
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'user-123',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|12345'
        }
      });

      // Update user
      const updateMutation = gql`
        mutation UpdateUser($orgId: ID!, $userId: ID!, $input: UpdateUserInput!) {
          updateUser(orgId: $orgId, userId: $userId, input: $input) {
            id
            identityProvider
            identityProviderUserId
          }
        }
      `;

      const result = await client.mutate(updateMutation, {
        orgId: 'test-org',
        userId: 'user-123',
        input: {
          identityProvider: 'google',
          identityProviderUserId: 'google|67890'
        }
      });

      expect(result.data?.updateUser?.identityProvider).to.equal('google');
      expect(result.data?.updateUser?.identityProviderUserId).to.equal('google|67890');
    });

    it('should update user properties using setUserProperty', async () => {
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'user-123',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|12345'
        }
      });

      // Set user properties
      const setPropMutation = gql`
        mutation SetUserProperty($orgId: ID!, $userId: ID!, $name: String!, $value: JSON, $hidden: Boolean) {
          setUserProperty(orgId: $orgId, userId: $userId, name: $name, value: $value, hidden: $hidden) {
            name
            value
            hidden
          }
        }
      `;

      await client.mutate(setPropMutation, {
        orgId: 'test-org',
        userId: 'user-123',
        name: 'email',
        value: 'updated@example.com'
      });

      await client.mutate(setPropMutation, {
        orgId: 'test-org',
        userId: 'user-123',
        name: 'phone',
        value: '+1234567890'
      });

      // Query user to verify properties
      const query = gql`
        query GetUser($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
            properties {
              name
              value
              hidden
            }
          }
        }
      `;

      const result = await client.query(query, { orgId: 'test-org', userId: 'user-123' });

      expect(result.data?.user?.properties).to.have.lengthOf(2);
      const props = result.data?.user?.properties;
      const emailProp = props.find((p: any) => p.name === 'email');
      const phoneProp = props.find((p: any) => p.name === 'phone');
      
      expect(emailProp).to.deep.include({ name: 'email', value: 'updated@example.com', hidden: false });
      expect(phoneProp).to.deep.include({ name: 'phone', value: '+1234567890', hidden: false });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Create user
      const createMutation = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      await client.mutate(createMutation, {
        input: {
          id: 'user-123',
          orgId: 'test-org',
          identityProvider: 'auth0',
          identityProviderUserId: 'auth0|12345'
        }
      });

      // Delete user
      const deleteMutation = gql`
        mutation DeleteUser($orgId: ID!, $userId: ID!) {
          deleteUser(orgId: $orgId, userId: $userId)
        }
      `;

      const result = await client.mutate(deleteMutation, { orgId: 'test-org', userId: 'user-123' });

      expect(result.data?.deleteUser).to.be.true;

      // Verify deletion
      const query = gql`
        query GetUser($orgId: ID!, $userId: ID!) {
          user(orgId: $orgId, userId: $userId) {
            id
          }
        }
      `;

      const queryResult = await client.query(query, { orgId: 'test-org', userId: 'user-123' });

      expect(queryResult.data?.user).to.be.null;
    });
  });
});