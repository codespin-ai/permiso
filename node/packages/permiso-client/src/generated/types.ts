export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: unknown; output: unknown; }
};

export type CreateOrganizationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  properties?: InputMaybe<Array<PropertyInput>>;
};

export type CreateResourceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  properties?: InputMaybe<Array<PropertyInput>>;
};

export type CreateUserInput = {
  id: Scalars['ID']['input'];
  identityProvider: Scalars['String']['input'];
  identityProviderUserId: Scalars['String']['input'];
  properties?: InputMaybe<Array<PropertyInput>>;
  roleIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type EffectivePermission = {
  __typename?: 'EffectivePermission';
  action: Scalars['String']['output'];
  createdAt: Scalars['Float']['output'];
  resourceId: Scalars['ID']['output'];
  source: Scalars['String']['output'];
  sourceId: Maybe<Scalars['ID']['output']>;
};

export type GrantRolePermissionInput = {
  action: Scalars['String']['input'];
  resourceId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};

export type GrantUserPermissionInput = {
  action: Scalars['String']['input'];
  resourceId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  assignUserRole: User;
  createOrganization: Organization;
  createResource: Resource;
  createRole: Role;
  createUser: User;
  deleteOrganization: Scalars['Boolean']['output'];
  deleteOrganizationProperty: Scalars['Boolean']['output'];
  deleteResource: Scalars['Boolean']['output'];
  deleteRole: Scalars['Boolean']['output'];
  deleteRoleProperty: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteUserProperty: Scalars['Boolean']['output'];
  grantRolePermission: RolePermission;
  grantUserPermission: UserPermission;
  revokeRolePermission: Scalars['Boolean']['output'];
  revokeUserPermission: Scalars['Boolean']['output'];
  setOrganizationProperty: Property;
  setRoleProperty: Property;
  setUserProperty: Property;
  unassignUserRole: User;
  updateOrganization: Organization;
  updateResource: Resource;
  updateRole: Role;
  updateUser: User;
};


export type MutationAssignUserRoleArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationCreateResourceArgs = {
  input: CreateResourceInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteOrganizationArgs = {
  id: Scalars['ID']['input'];
  safetyKey?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteOrganizationPropertyArgs = {
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationDeleteResourceArgs = {
  resourceId: Scalars['ID']['input'];
};


export type MutationDeleteRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteRolePropertyArgs = {
  name: Scalars['String']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationDeleteUserPropertyArgs = {
  name: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationGrantRolePermissionArgs = {
  input: GrantRolePermissionInput;
};


export type MutationGrantUserPermissionArgs = {
  input: GrantUserPermissionInput;
};


export type MutationRevokeRolePermissionArgs = {
  action: Scalars['String']['input'];
  resourceId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationRevokeUserPermissionArgs = {
  action: Scalars['String']['input'];
  resourceId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetOrganizationPropertyArgs = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetRolePropertyArgs = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  roleId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetUserPropertyArgs = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationUnassignUserRoleArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdateResourceArgs = {
  input: UpdateResourceInput;
  resourceId: Scalars['ID']['input'];
};


export type MutationUpdateRoleArgs = {
  input: UpdateRoleInput;
  roleId: Scalars['ID']['input'];
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
  userId: Scalars['ID']['input'];
};

export type Organization = {
  __typename?: 'Organization';
  createdAt: Scalars['Float']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  properties: Array<Property>;
  resources: ResourceConnection;
  roles: RoleConnection;
  updatedAt: Scalars['Float']['output'];
  users: UserConnection;
};


export type OrganizationResourcesArgs = {
  filter?: InputMaybe<ResourceFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type OrganizationRolesArgs = {
  filter?: InputMaybe<RoleFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type OrganizationUsersArgs = {
  filter?: InputMaybe<UserFilter>;
  pagination?: InputMaybe<PaginationInput>;
};

export type OrganizationConnection = {
  __typename?: 'OrganizationConnection';
  nodes: Array<Organization>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type OrganizationFilter = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortDirection?: InputMaybe<SortDirection>;
};

export type Permission = {
  action: Scalars['String']['output'];
  createdAt: Scalars['Float']['output'];
  organization: Organization;
  resource: Resource;
  resourceId: Scalars['ID']['output'];
};

export type Property = {
  __typename?: 'Property';
  createdAt: Scalars['Float']['output'];
  hidden: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  value: Maybe<Scalars['JSON']['output']>;
};

export type PropertyFilter = {
  name: Scalars['String']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type PropertyInput = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type Query = {
  __typename?: 'Query';
  effectivePermissions: Array<EffectivePermission>;
  effectivePermissionsByPrefix: Array<EffectivePermission>;
  hasPermission: Scalars['Boolean']['output'];
  organization: Maybe<Organization>;
  organizationProperty: Maybe<Property>;
  organizations: OrganizationConnection;
  organizationsByIds: Array<Organization>;
  resource: Maybe<Resource>;
  resources: ResourceConnection;
  resourcesByIdPrefix: Array<Resource>;
  role: Maybe<Role>;
  rolePermissions: Array<RolePermission>;
  roleProperty: Maybe<Property>;
  roles: RoleConnection;
  rolesByIds: Array<Role>;
  user: Maybe<User>;
  userPermissions: Array<UserPermission>;
  userProperty: Maybe<Property>;
  users: UserConnection;
  usersByIdentity: Array<User>;
  usersByIds: Array<User>;
};


export type QueryEffectivePermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  resourceId: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryEffectivePermissionsByPrefixArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  resourceIdPrefix: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryHasPermissionArgs = {
  action: Scalars['String']['input'];
  resourceId: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrganizationPropertyArgs = {
  orgId: Scalars['ID']['input'];
  propertyName: Scalars['String']['input'];
};


export type QueryOrganizationsArgs = {
  filter?: InputMaybe<OrganizationFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryOrganizationsByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryResourceArgs = {
  resourceId: Scalars['ID']['input'];
};


export type QueryResourcesArgs = {
  filter?: InputMaybe<ResourceFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryResourcesByIdPrefixArgs = {
  idPrefix: Scalars['String']['input'];
};


export type QueryRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type QueryRolePermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  resourceId?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};


export type QueryRolePropertyArgs = {
  propertyName: Scalars['String']['input'];
  roleId: Scalars['ID']['input'];
};


export type QueryRolesArgs = {
  filter?: InputMaybe<RoleFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryRolesByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUserPermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  resourceId?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryUserPropertyArgs = {
  propertyName: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filter?: InputMaybe<UserFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryUsersByIdentityArgs = {
  identityProvider: Scalars['String']['input'];
  identityProviderUserId: Scalars['String']['input'];
};


export type QueryUsersByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
};

export type Resource = {
  __typename?: 'Resource';
  createdAt: Scalars['Float']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Maybe<Scalars['String']['output']>;
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<Permission>;
  updatedAt: Scalars['Float']['output'];
};

export type ResourceConnection = {
  __typename?: 'ResourceConnection';
  nodes: Array<Resource>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ResourceFilter = {
  idPrefix?: InputMaybe<Scalars['String']['input']>;
};

export type Role = {
  __typename?: 'Role';
  createdAt: Scalars['Float']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<RolePermission>;
  properties: Array<Property>;
  updatedAt: Scalars['Float']['output'];
  users: Array<User>;
};

export type RoleConnection = {
  __typename?: 'RoleConnection';
  nodes: Array<Role>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type RoleFilter = {
  properties?: InputMaybe<Array<PropertyFilter>>;
};

export type RolePermission = Permission & {
  __typename?: 'RolePermission';
  action: Scalars['String']['output'];
  createdAt: Scalars['Float']['output'];
  organization: Organization;
  resource: Resource;
  resourceId: Scalars['ID']['output'];
  role: Role;
  roleId: Scalars['ID']['output'];
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type UpdateOrganizationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateResourceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  identityProvider?: InputMaybe<Scalars['String']['input']>;
  identityProviderUserId?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['Float']['output'];
  effectivePermissions: Array<EffectivePermission>;
  id: Scalars['ID']['output'];
  identityProvider: Scalars['String']['output'];
  identityProviderUserId: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<UserPermission>;
  properties: Array<Property>;
  roles: Array<Role>;
  updatedAt: Scalars['Float']['output'];
};


export type UserEffectivePermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  resourceId?: InputMaybe<Scalars['String']['input']>;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  nodes: Array<User>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type UserFilter = {
  identityProvider?: InputMaybe<Scalars['String']['input']>;
  identityProviderUserId?: InputMaybe<Scalars['String']['input']>;
  properties?: InputMaybe<Array<PropertyFilter>>;
};

export type UserPermission = Permission & {
  __typename?: 'UserPermission';
  action: Scalars['String']['output'];
  createdAt: Scalars['Float']['output'];
  organization: Organization;
  resource: Resource;
  resourceId: Scalars['ID']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};
