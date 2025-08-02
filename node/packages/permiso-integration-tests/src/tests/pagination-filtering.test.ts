import { expect } from 'chai';
import { gql } from '@apollo/client/core/index.js';
import { testDb, client } from '../index.js';

describe('Pagination and Filtering', () => {
  beforeEach(async () => {
    await testDb.truncateAllTables();
  });

  describe('Pagination', () => {
    describe('organizations pagination', () => {
      beforeEach(async () => {
        // Create multiple organizations
        const mutation = gql`
          mutation CreateOrganization($input: CreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `;

        for (let i = 1; i <= 10; i++) {
          await client.mutate(mutation, {
            input: {
              id: `org-${i.toString().padStart(2, '0')}`,
              name: `Organization ${i}`,
              properties: [
                { name: 'tier', value: i <= 5 ? 'free' : 'premium' },
                { name: 'size', value: i * 10 }
              ]
            }
          });
        }
      });

      it('should paginate organizations with limit', async () => {
        const query = gql`
          query ListOrganizations($pagination: PaginationInput) {
            organizations(pagination: $pagination) {
              nodes {
                id
                name
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `;

        const result = await client.query(query, {
          pagination: { limit: 3 }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(3);
        expect(result.data?.organizations?.totalCount).to.equal(10);
        expect(result.data?.organizations?.pageInfo?.hasNextPage).to.be.true;
        expect(result.data?.organizations?.pageInfo?.hasPreviousPage).to.be.false;
      });

      it('should paginate organizations with offset and limit', async () => {
        const query = gql`
          query ListOrganizations($pagination: PaginationInput) {
            organizations(pagination: $pagination) {
              nodes {
                id
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `;

        const result = await client.query(query, {
          pagination: { offset: 5, limit: 3 }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(3);
        expect(result.data?.organizations?.totalCount).to.equal(10);
        expect(result.data?.organizations?.pageInfo?.hasNextPage).to.be.true;
        expect(result.data?.organizations?.pageInfo?.hasPreviousPage).to.be.true;
        
        // Verify we got the right organizations
        const ids = result.data?.organizations?.nodes.map((o: any) => o.id);
        expect(ids).to.deep.equal(['org-06', 'org-07', 'org-08']);
      });

      it('should handle last page correctly', async () => {
        const query = gql`
          query ListOrganizations($pagination: PaginationInput) {
            organizations(pagination: $pagination) {
              nodes {
                id
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `;

        const result = await client.query(query, {
          pagination: { offset: 8, limit: 5 }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(2); // Only 2 remaining
        expect(result.data?.organizations?.pageInfo?.hasNextPage).to.be.false;
        expect(result.data?.organizations?.pageInfo?.hasPreviousPage).to.be.true;
      });
    });

    describe('users pagination', () => {
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

        // Create multiple users
        const userMutation = gql`
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `;

        for (let i = 1; i <= 15; i++) {
          await client.mutate(userMutation, {
            input: {
              id: `user-${i.toString().padStart(2, '0')}`,
              orgId: 'test-org',
              identityProvider: i % 2 === 0 ? 'google' : 'auth0',
              identityProviderUserId: `user${i}`,
              properties: [
                { name: 'department', value: i <= 5 ? 'engineering' : i <= 10 ? 'sales' : 'marketing' },
                { name: 'level', value: (i % 3) + 1 }
              ]
            }
          });
        }
      });

      it('should paginate users within organization', async () => {
        const query = gql`
          query ListUsers($orgId: ID!, $pagination: PaginationInput) {
            users(orgId: $orgId, pagination: $pagination) {
              nodes {
                id
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          pagination: { offset: 5, limit: 5 }
        });

        expect(result.data?.users?.nodes).to.have.lengthOf(5);
        expect(result.data?.users?.totalCount).to.equal(15);
        expect(result.data?.users?.pageInfo?.hasNextPage).to.be.true;
        expect(result.data?.users?.pageInfo?.hasPreviousPage).to.be.true;
      });
    });
  });

  describe('Filtering', () => {
    describe('organization filtering by properties', () => {
      beforeEach(async () => {
        // Create organizations with different properties
        const mutation = gql`
          mutation CreateOrganization($input: CreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `;

        await client.mutate(mutation, {
          input: {
            id: 'org-free-small',
            name: 'Free Small Org',
            properties: [
              { name: 'tier', value: 'free' },
              { name: 'size', value: 'small' },
              { name: 'active', value: true }
            ]
          }
        });

        await client.mutate(mutation, {
          input: {
            id: 'org-free-large',
            name: 'Free Large Org',
            properties: [
              { name: 'tier', value: 'free' },
              { name: 'size', value: 'large' },
              { name: 'active', value: false }
            ]
          }
        });

        await client.mutate(mutation, {
          input: {
            id: 'org-premium-small',
            name: 'Premium Small Org',
            properties: [
              { name: 'tier', value: 'premium' },
              { name: 'size', value: 'small' },
              { name: 'active', value: true }
            ]
          }
        });
      });

      it('should filter organizations by single property', async () => {
        const query = gql`
          query ListOrganizations($filter: OrganizationFilter) {
            organizations(filter: $filter) {
              nodes {
                id
                name
                properties {
                  name
                  value
                }
              }
            }
          }
        `;

        const result = await client.query(query, {
          filter: {
            properties: [{ name: 'tier', value: 'free' }]
          }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(2);
        const ids = result.data?.organizations?.nodes.map((o: any) => o.id);
        expect(ids).to.include.members(['org-free-small', 'org-free-large']);
        expect(ids).to.not.include('org-premium-small');
      });

      it('should filter organizations by multiple properties (AND condition)', async () => {
        const query = gql`
          query ListOrganizations($filter: OrganizationFilter) {
            organizations(filter: $filter) {
              nodes {
                id
                name
              }
            }
          }
        `;

        const result = await client.query(query, {
          filter: {
            properties: [
              { name: 'tier', value: 'free' },
              { name: 'size', value: 'small' }
            ]
          }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(1);
        expect(result.data?.organizations?.nodes[0].id).to.equal('org-free-small');
      });

      it('should filter with boolean property values', async () => {
        const query = gql`
          query ListOrganizations($filter: OrganizationFilter) {
            organizations(filter: $filter) {
              nodes {
                id
              }
            }
          }
        `;

        const result = await client.query(query, {
          filter: {
            properties: [{ name: 'active', value: true }]
          }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(2);
        const ids = result.data?.organizations?.nodes.map((o: any) => o.id);
        expect(ids).to.include.members(['org-free-small', 'org-premium-small']);
      });
    });

    describe('user filtering', () => {
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

        // Create users with different properties
        const userMutation = gql`
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `;

        await client.mutate(userMutation, {
          input: {
            id: 'user-eng-senior',
            orgId: 'test-org',
            identityProvider: 'google',
            identityProviderUserId: 'google|1',
            properties: [
              { name: 'department', value: 'engineering' },
              { name: 'level', value: 'senior' }
            ]
          }
        });

        await client.mutate(userMutation, {
          input: {
            id: 'user-eng-junior',
            orgId: 'test-org',
            identityProvider: 'auth0',
            identityProviderUserId: 'auth0|2',
            properties: [
              { name: 'department', value: 'engineering' },
              { name: 'level', value: 'junior' }
            ]
          }
        });

        await client.mutate(userMutation, {
          input: {
            id: 'user-sales-senior',
            orgId: 'test-org',
            identityProvider: 'google',
            identityProviderUserId: 'google|3',
            properties: [
              { name: 'department', value: 'sales' },
              { name: 'level', value: 'senior' }
            ]
          }
        });
      });

      it('should filter users by properties', async () => {
        const query = gql`
          query ListUsers($orgId: ID!, $filter: UserFilter) {
            users(orgId: $orgId, filter: $filter) {
              nodes {
                id
                properties {
                  name
                  value
                }
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            properties: [{ name: 'department', value: 'engineering' }]
          }
        });

        expect(result.data?.users?.nodes).to.have.lengthOf(2);
        const ids = result.data?.users?.nodes.map((u: any) => u.id);
        expect(ids).to.include.members(['user-eng-senior', 'user-eng-junior']);
      });

      it('should filter users by identity provider', async () => {
        const query = gql`
          query ListUsers($orgId: ID!, $filter: UserFilter) {
            users(orgId: $orgId, filter: $filter) {
              nodes {
                id
                identityProvider
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            identityProvider: 'google'
          }
        });

        expect(result.data?.users?.nodes).to.have.lengthOf(2);
        const ids = result.data?.users?.nodes.map((u: any) => u.id);
        expect(ids).to.include.members(['user-eng-senior', 'user-sales-senior']);
      });

      it('should filter users by multiple criteria', async () => {
        const query = gql`
          query ListUsers($orgId: ID!, $filter: UserFilter) {
            users(orgId: $orgId, filter: $filter) {
              nodes {
                id
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            identityProvider: 'google',
            properties: [{ name: 'level', value: 'senior' }]
          }
        });

        expect(result.data?.users?.nodes).to.have.lengthOf(2);
        const ids = result.data?.users?.nodes.map((u: any) => u.id);
        expect(ids).to.include.members(['user-eng-senior', 'user-sales-senior']);
      });
    });

    describe('role filtering', () => {
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

        // Create roles with different properties
        const roleMutation = gql`
          mutation CreateRole($input: CreateRoleInput!) {
            createRole(input: $input) {
              id
            }
          }
        `;

        await client.mutate(roleMutation, {
          input: {
            id: 'admin-full',
            orgId: 'test-org',
            name: 'Full Admin',
            properties: [
              { name: 'access_level', value: 'full' },
              { name: 'department', value: 'all' }
            ]
          }
        });

        await client.mutate(roleMutation, {
          input: {
            id: 'admin-limited',
            orgId: 'test-org',
            name: 'Limited Admin',
            properties: [
              { name: 'access_level', value: 'limited' },
              { name: 'department', value: 'engineering' }
            ]
          }
        });

        await client.mutate(roleMutation, {
          input: {
            id: 'viewer',
            orgId: 'test-org',
            name: 'Viewer',
            properties: [
              { name: 'access_level', value: 'read_only' },
              { name: 'department', value: 'all' }
            ]
          }
        });
      });

      it('should filter roles by properties', async () => {
        const query = gql`
          query ListRoles($orgId: ID!, $filter: RoleFilter) {
            roles(orgId: $orgId, filter: $filter) {
              nodes {
                id
                name
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            properties: [{ name: 'department', value: 'all' }]
          }
        });

        expect(result.data?.roles?.nodes).to.have.lengthOf(2);
        const ids = result.data?.roles?.nodes.map((r: any) => r.id);
        expect(ids).to.include.members(['admin-full', 'viewer']);
      });
    });

    describe('resource filtering', () => {
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

        // Create resources with different ID patterns
        const resourceMutation = gql`
          mutation CreateResource($input: CreateResourceInput!) {
            createResource(input: $input) {
              id
            }
          }
        `;

        await client.mutate(resourceMutation, {
          input: {
            id: '/api/users',
            orgId: 'test-org',
            name: 'Users API'
          }
        });

        await client.mutate(resourceMutation, {
          input: {
            id: '/api/users/*',
            orgId: 'test-org',
            name: 'User API Wildcard'
          }
        });

        await client.mutate(resourceMutation, {
          input: {
            id: '/api/posts',
            orgId: 'test-org',
            name: 'Posts API'
          }
        });

        await client.mutate(resourceMutation, {
          input: {
            id: '/api/posts/*',
            orgId: 'test-org',
            name: 'Post API Wildcard'
          }
        });

        await client.mutate(resourceMutation, {
          input: {
            id: '/admin/settings',
            orgId: 'test-org',
            name: 'Admin Settings'
          }
        });
      });

      it('should filter resources by ID prefix', async () => {
        const query = gql`
          query ListResources($orgId: ID!, $filter: ResourceFilter) {
            resources(orgId: $orgId, filter: $filter) {
              nodes {
                id
                name
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            idPrefix: '/api/'
          }
        });

        expect(result.data?.resources?.nodes).to.have.lengthOf(4);
        const ids = result.data?.resources?.nodes.map((r: any) => r.id);
        expect(ids).to.include.members(['/api/users', '/api/users/*', '/api/posts', '/api/posts/*']);
        expect(ids).to.not.include('/admin/settings');
      });

      it('should filter resources by more specific prefix', async () => {
        const query = gql`
          query ListResources($orgId: ID!, $filter: ResourceFilter) {
            resources(orgId: $orgId, filter: $filter) {
              nodes {
                id
              }
            }
          }
        `;

        const result = await client.query(query, {
          orgId: 'test-org',
          filter: {
            idPrefix: '/api/users'
          }
        });

        expect(result.data?.resources?.nodes).to.have.lengthOf(2);
        const ids = result.data?.resources?.nodes.map((r: any) => r.id);
        expect(ids).to.include.members(['/api/users', '/api/users/*']);
      });
    });

    describe('combined pagination and filtering', () => {
      beforeEach(async () => {
        // Create organizations with properties
        const mutation = gql`
          mutation CreateOrganization($input: CreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `;

        for (let i = 1; i <= 20; i++) {
          await client.mutate(mutation, {
            input: {
              id: `org-${i.toString().padStart(2, '0')}`,
              name: `Organization ${i}`,
              properties: [
                { name: 'tier', value: i % 3 === 0 ? 'premium' : 'free' },
                { name: 'active', value: i % 2 === 0 }
              ]
            }
          });
        }
      });

      it('should apply both filtering and pagination', async () => {
        const query = gql`
          query ListOrganizations($filter: OrganizationFilter, $pagination: PaginationInput) {
            organizations(filter: $filter, pagination: $pagination) {
              nodes {
                id
                properties {
                  name
                  value
                }
              }
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `;

        // Filter for premium tier (should be orgs 3, 6, 9, 12, 15, 18)
        const result = await client.query(query, {
          filter: {
            properties: [{ name: 'tier', value: 'premium' }]
          },
          pagination: { offset: 2, limit: 2 }
        });

        expect(result.data?.organizations?.nodes).to.have.lengthOf(2);
        expect(result.data?.organizations?.totalCount).to.equal(6); // Total premium orgs
        expect(result.data?.organizations?.pageInfo?.hasNextPage).to.be.true;
        expect(result.data?.organizations?.pageInfo?.hasPreviousPage).to.be.true;
        
        // Should get orgs 9 and 12 (skipping 3 and 6)
        const ids = result.data?.organizations?.nodes.map((o: any) => o.id);
        expect(ids).to.deep.equal(['org-09', 'org-12']);
      });
    });
  });
});