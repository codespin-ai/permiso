import { expect } from 'chai';
import type { Database } from '@codespin/permiso-db';
import * as persistence from '@codespin/permiso-rbac';
import type { Organization, User, Role, Resource } from '@codespin/permiso-rbac';

export interface TestContext {
  db: Database;
  org: Organization;
  users: User[];
  roles: Role[];
  resources: Resource[];
}

export async function createTestOrganization(
  db: Database,
  data?: Partial<persistence.CreateOrganizationInput>
): Promise<Organization> {
  const input: persistence.CreateOrganizationInput = {
    id: data?.id || `test-org-${Date.now()}`,
    data: data?.data || JSON.stringify({ name: 'Test Organization' }),
    properties: data?.properties || []
  };

  const result = await persistence.createOrganization(db, input);
  expect(result.success).to.be.true;
  if (!result.success) throw result.error;
  
  return result.data;
}

export async function createTestUser(
  db: Database,
  orgId: string,
  data?: Partial<persistence.CreateUserInput>
): Promise<User> {
  const input: persistence.CreateUserInput = {
    id: data?.id || `test-user-${Date.now()}`,
    orgId,
    identityProvider: data?.identityProvider || 'test',
    identityProviderUserId: data?.identityProviderUserId || `test-${Date.now()}`,
    data: data?.data || JSON.stringify({ name: 'Test User' }),
    properties: data?.properties || []
  };

  const result = await persistence.createUser(db, input);
  expect(result.success).to.be.true;
  if (!result.success) throw result.error;
  
  return result.data;
}

export async function createTestRole(
  db: Database,
  orgId: string,
  data?: Partial<persistence.CreateRoleInput>
): Promise<Role> {
  const input: persistence.CreateRoleInput = {
    id: data?.id || `test-role-${Date.now()}`,
    orgId,
    data: data?.data || JSON.stringify({ name: 'Test Role' }),
    properties: data?.properties || []
  };

  const result = await persistence.createRole(db, input);
  expect(result.success).to.be.true;
  if (!result.success) throw result.error;
  
  return result.data;
}

export async function createTestResource(
  db: Database,
  orgId: string,
  data?: Partial<persistence.CreateResourceInput>
): Promise<Resource> {
  const input: persistence.CreateResourceInput = {
    path: data?.path || `/test/resource/${Date.now()}`,
    orgId,
    data: data?.data || JSON.stringify({ type: 'test' })
  };

  const result = await persistence.createResource(db, input);
  expect(result.success).to.be.true;
  if (!result.success) throw result.error;
  
  return result.data;
}

export async function setupTestContext(db: Database): Promise<TestContext> {
  // Create organization
  const org = await createTestOrganization(db);

  // Create users
  const users = await Promise.all([
    createTestUser(db, org.id, { id: 'user1', identityProviderUserId: 'user1' }),
    createTestUser(db, org.id, { id: 'user2', identityProviderUserId: 'user2' }),
    createTestUser(db, org.id, { id: 'user3', identityProviderUserId: 'user3' })
  ]);

  // Create roles
  const roles = await Promise.all([
    createTestRole(db, org.id, { id: 'admin', data: JSON.stringify({ name: 'Admin' }) }),
    createTestRole(db, org.id, { id: 'editor', data: JSON.stringify({ name: 'Editor' }) }),
    createTestRole(db, org.id, { id: 'viewer', data: JSON.stringify({ name: 'Viewer' }) })
  ]);

  // Create resources
  const resources = await Promise.all([
    createTestResource(db, org.id, { path: '/api/users' }),
    createTestResource(db, org.id, { path: '/api/users/*' }),
    createTestResource(db, org.id, { path: '/api/posts' }),
    createTestResource(db, org.id, { path: '/api/posts/*' }),
    createTestResource(db, org.id, { path: '/api/admin' }),
    createTestResource(db, org.id, { path: '/api/admin/*' })
  ]);

  return { db, org, users, roles, resources };
}

export function expectSuccess<T>(result: persistence.Result<T, Error>): T {
  expect(result.success).to.be.true;
  if (!result.success) {
    throw new Error(`Expected success but got error: ${result.error.message}`);
  }
  return result.data;
}

export function expectError(result: persistence.Result<any, Error>, messagePattern?: RegExp): Error {
  expect(result.success).to.be.false;
  if (result.success) {
    throw new Error('Expected error but got success');
  }
  if (messagePattern) {
    expect(result.error.message).to.match(messagePattern);
  }
  return result.error;
}