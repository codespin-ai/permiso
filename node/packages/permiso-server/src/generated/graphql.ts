import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
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
  orgId: Scalars['ID']['input'];
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  properties?: InputMaybe<Array<PropertyInput>>;
};

export type CreateUserInput = {
  id: Scalars['ID']['input'];
  identityProvider: Scalars['String']['input'];
  identityProviderUserId: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  properties?: InputMaybe<Array<PropertyInput>>;
  roleIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type EffectivePermission = {
  __typename?: 'EffectivePermission';
  action: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  resourceId: Scalars['ID']['output'];
  source: Scalars['String']['output'];
  sourceId: Maybe<Scalars['ID']['output']>;
};

export type GrantRolePermissionInput = {
  action: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};

export type GrantUserPermissionInput = {
  action: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
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
  orgId: Scalars['ID']['input'];
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
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
};


export type MutationDeleteRoleArgs = {
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteRolePropertyArgs = {
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  orgId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationDeleteUserPropertyArgs = {
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
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
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationRevokeUserPermissionArgs = {
  action: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
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
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetUserPropertyArgs = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationUnassignUserRoleArgs = {
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdateResourceArgs = {
  input: UpdateResourceInput;
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
};


export type MutationUpdateRoleArgs = {
  input: UpdateRoleInput;
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
  orgId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type Organization = {
  __typename?: 'Organization';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  properties: Array<Property>;
  resources: ResourceConnection;
  roles: RoleConnection;
  updatedAt: Scalars['DateTime']['output'];
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
  createdAt: Scalars['DateTime']['output'];
  organization: Organization;
  resource: Resource;
  resourceId: Scalars['ID']['output'];
};

export type Property = {
  __typename?: 'Property';
  createdAt: Scalars['DateTime']['output'];
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
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryEffectivePermissionsByPrefixArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  orgId: Scalars['ID']['input'];
  resourceIdPrefix: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryHasPermissionArgs = {
  action: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
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
  orgId: Scalars['ID']['input'];
  resourceId: Scalars['ID']['input'];
};


export type QueryResourcesArgs = {
  filter?: InputMaybe<ResourceFilter>;
  orgId: Scalars['ID']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryResourcesByIdPrefixArgs = {
  idPrefix: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryRoleArgs = {
  orgId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};


export type QueryRolePermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  orgId: Scalars['ID']['input'];
  resourceId?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};


export type QueryRolePropertyArgs = {
  orgId: Scalars['ID']['input'];
  propertyName: Scalars['String']['input'];
  roleId: Scalars['ID']['input'];
};


export type QueryRolesArgs = {
  filter?: InputMaybe<RoleFilter>;
  orgId: Scalars['ID']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryRolesByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
  orgId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  orgId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryUserPermissionsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  orgId: Scalars['ID']['input'];
  resourceId?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryUserPropertyArgs = {
  orgId: Scalars['ID']['input'];
  propertyName: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filter?: InputMaybe<UserFilter>;
  orgId: Scalars['ID']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryUsersByIdentityArgs = {
  identityProvider: Scalars['String']['input'];
  identityProviderUserId: Scalars['String']['input'];
};


export type QueryUsersByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
  orgId: Scalars['ID']['input'];
};

export type Resource = {
  __typename?: 'Resource';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Maybe<Scalars['String']['output']>;
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<Permission>;
  updatedAt: Scalars['DateTime']['output'];
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
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<RolePermission>;
  properties: Array<Property>;
  updatedAt: Scalars['DateTime']['output'];
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
  createdAt: Scalars['DateTime']['output'];
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
  createdAt: Scalars['DateTime']['output'];
  effectivePermissions: Array<EffectivePermission>;
  id: Scalars['ID']['output'];
  identityProvider: Scalars['String']['output'];
  identityProviderUserId: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  organization: Organization;
  permissions: Array<UserPermission>;
  properties: Array<Property>;
  roles: Array<Role>;
  updatedAt: Scalars['DateTime']['output'];
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
  createdAt: Scalars['DateTime']['output'];
  organization: Organization;
  resource: Resource;
  resourceId: Scalars['ID']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  Permission: ( Omit<RolePermission, 'resource'> & { resource: _RefType['Resource'] } ) | ( Omit<UserPermission, 'resource'> & { resource: _RefType['Resource'] } );
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateOrganizationInput: CreateOrganizationInput;
  CreateResourceInput: CreateResourceInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  EffectivePermission: ResolverTypeWrapper<EffectivePermission>;
  GrantRolePermissionInput: GrantRolePermissionInput;
  GrantUserPermissionInput: GrantUserPermissionInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Organization: ResolverTypeWrapper<Omit<Organization, 'resources'> & { resources: ResolversTypes['ResourceConnection'] }>;
  OrganizationConnection: ResolverTypeWrapper<OrganizationConnection>;
  OrganizationFilter: OrganizationFilter;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  Permission: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Permission']>;
  Property: ResolverTypeWrapper<Property>;
  PropertyFilter: PropertyFilter;
  PropertyInput: PropertyInput;
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolverTypeWrapper<Omit<Resource, 'permissions'> & { permissions: Array<ResolversTypes['Permission']> }>;
  ResourceConnection: ResolverTypeWrapper<Omit<ResourceConnection, 'nodes'> & { nodes: Array<ResolversTypes['Resource']> }>;
  ResourceFilter: ResourceFilter;
  Role: ResolverTypeWrapper<Role>;
  RoleConnection: ResolverTypeWrapper<RoleConnection>;
  RoleFilter: RoleFilter;
  RolePermission: ResolverTypeWrapper<Omit<RolePermission, 'resource'> & { resource: ResolversTypes['Resource'] }>;
  SortDirection: SortDirection;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateResourceInput: UpdateResourceInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserConnection: ResolverTypeWrapper<UserConnection>;
  UserFilter: UserFilter;
  UserPermission: ResolverTypeWrapper<Omit<UserPermission, 'resource'> & { resource: ResolversTypes['Resource'] }>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  CreateOrganizationInput: CreateOrganizationInput;
  CreateResourceInput: CreateResourceInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  DateTime: Scalars['DateTime']['output'];
  EffectivePermission: EffectivePermission;
  GrantRolePermissionInput: GrantRolePermissionInput;
  GrantUserPermissionInput: GrantUserPermissionInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: {};
  Organization: Omit<Organization, 'resources'> & { resources: ResolversParentTypes['ResourceConnection'] };
  OrganizationConnection: OrganizationConnection;
  OrganizationFilter: OrganizationFilter;
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  Permission: ResolversInterfaceTypes<ResolversParentTypes>['Permission'];
  Property: Property;
  PropertyFilter: PropertyFilter;
  PropertyInput: PropertyInput;
  Query: {};
  Resource: Omit<Resource, 'permissions'> & { permissions: Array<ResolversParentTypes['Permission']> };
  ResourceConnection: Omit<ResourceConnection, 'nodes'> & { nodes: Array<ResolversParentTypes['Resource']> };
  ResourceFilter: ResourceFilter;
  Role: Role;
  RoleConnection: RoleConnection;
  RoleFilter: RoleFilter;
  RolePermission: Omit<RolePermission, 'resource'> & { resource: ResolversParentTypes['Resource'] };
  String: Scalars['String']['output'];
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateResourceInput: UpdateResourceInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: User;
  UserConnection: UserConnection;
  UserFilter: UserFilter;
  UserPermission: Omit<UserPermission, 'resource'> & { resource: ResolversParentTypes['Resource'] };
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type EffectivePermissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EffectivePermission'] = ResolversParentTypes['EffectivePermission']> = ResolversObject<{
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  resourceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  assignUserRole?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAssignUserRoleArgs, 'orgId' | 'roleId' | 'userId'>>;
  createOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationCreateOrganizationArgs, 'input'>>;
  createResource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType, RequireFields<MutationCreateResourceArgs, 'input'>>;
  createRole?: Resolver<ResolversTypes['Role'], ParentType, ContextType, RequireFields<MutationCreateRoleArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteOrganization?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteOrganizationArgs, 'id'>>;
  deleteOrganizationProperty?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteOrganizationPropertyArgs, 'name' | 'orgId'>>;
  deleteResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteResourceArgs, 'orgId' | 'resourceId'>>;
  deleteRole?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRoleArgs, 'orgId' | 'roleId'>>;
  deleteRoleProperty?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRolePropertyArgs, 'name' | 'orgId' | 'roleId'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'orgId' | 'userId'>>;
  deleteUserProperty?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserPropertyArgs, 'name' | 'orgId' | 'userId'>>;
  grantRolePermission?: Resolver<ResolversTypes['RolePermission'], ParentType, ContextType, RequireFields<MutationGrantRolePermissionArgs, 'input'>>;
  grantUserPermission?: Resolver<ResolversTypes['UserPermission'], ParentType, ContextType, RequireFields<MutationGrantUserPermissionArgs, 'input'>>;
  revokeRolePermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRevokeRolePermissionArgs, 'action' | 'orgId' | 'resourceId' | 'roleId'>>;
  revokeUserPermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRevokeUserPermissionArgs, 'action' | 'orgId' | 'resourceId' | 'userId'>>;
  setOrganizationProperty?: Resolver<ResolversTypes['Property'], ParentType, ContextType, RequireFields<MutationSetOrganizationPropertyArgs, 'name' | 'orgId'>>;
  setRoleProperty?: Resolver<ResolversTypes['Property'], ParentType, ContextType, RequireFields<MutationSetRolePropertyArgs, 'name' | 'orgId' | 'roleId'>>;
  setUserProperty?: Resolver<ResolversTypes['Property'], ParentType, ContextType, RequireFields<MutationSetUserPropertyArgs, 'name' | 'orgId' | 'userId'>>;
  unassignUserRole?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUnassignUserRoleArgs, 'orgId' | 'roleId' | 'userId'>>;
  updateOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationUpdateOrganizationArgs, 'id' | 'input'>>;
  updateResource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType, RequireFields<MutationUpdateResourceArgs, 'input' | 'orgId' | 'resourceId'>>;
  updateRole?: Resolver<ResolversTypes['Role'], ParentType, ContextType, RequireFields<MutationUpdateRoleArgs, 'input' | 'orgId' | 'roleId'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'input' | 'orgId' | 'userId'>>;
}>;

export type OrganizationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  properties?: Resolver<Array<ResolversTypes['Property']>, ParentType, ContextType>;
  resources?: Resolver<ResolversTypes['ResourceConnection'], ParentType, ContextType, Partial<OrganizationResourcesArgs>>;
  roles?: Resolver<ResolversTypes['RoleConnection'], ParentType, ContextType, Partial<OrganizationRolesArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  users?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, Partial<OrganizationUsersArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OrganizationConnection'] = ResolversParentTypes['OrganizationConnection']> = ResolversObject<{
  nodes?: Resolver<Array<ResolversTypes['Organization']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PageInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PermissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Permission'] = ResolversParentTypes['Permission']> = ResolversObject<{
  __resolveType: TypeResolveFn<'RolePermission' | 'UserPermission', ParentType, ContextType>;
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  resource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  resourceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
}>;

export type PropertyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Property'] = ResolversParentTypes['Property']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  effectivePermissions?: Resolver<Array<ResolversTypes['EffectivePermission']>, ParentType, ContextType, RequireFields<QueryEffectivePermissionsArgs, 'orgId' | 'resourceId' | 'userId'>>;
  effectivePermissionsByPrefix?: Resolver<Array<ResolversTypes['EffectivePermission']>, ParentType, ContextType, RequireFields<QueryEffectivePermissionsByPrefixArgs, 'orgId' | 'resourceIdPrefix' | 'userId'>>;
  hasPermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryHasPermissionArgs, 'action' | 'orgId' | 'resourceId' | 'userId'>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<QueryOrganizationArgs, 'id'>>;
  organizationProperty?: Resolver<Maybe<ResolversTypes['Property']>, ParentType, ContextType, RequireFields<QueryOrganizationPropertyArgs, 'orgId' | 'propertyName'>>;
  organizations?: Resolver<ResolversTypes['OrganizationConnection'], ParentType, ContextType, Partial<QueryOrganizationsArgs>>;
  organizationsByIds?: Resolver<Array<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<QueryOrganizationsByIdsArgs, 'ids'>>;
  resource?: Resolver<Maybe<ResolversTypes['Resource']>, ParentType, ContextType, RequireFields<QueryResourceArgs, 'orgId' | 'resourceId'>>;
  resources?: Resolver<ResolversTypes['ResourceConnection'], ParentType, ContextType, RequireFields<QueryResourcesArgs, 'orgId'>>;
  resourcesByIdPrefix?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType, RequireFields<QueryResourcesByIdPrefixArgs, 'idPrefix' | 'orgId'>>;
  role?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<QueryRoleArgs, 'orgId' | 'roleId'>>;
  rolePermissions?: Resolver<Array<ResolversTypes['RolePermission']>, ParentType, ContextType, RequireFields<QueryRolePermissionsArgs, 'orgId' | 'roleId'>>;
  roleProperty?: Resolver<Maybe<ResolversTypes['Property']>, ParentType, ContextType, RequireFields<QueryRolePropertyArgs, 'orgId' | 'propertyName' | 'roleId'>>;
  roles?: Resolver<ResolversTypes['RoleConnection'], ParentType, ContextType, RequireFields<QueryRolesArgs, 'orgId'>>;
  rolesByIds?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<QueryRolesByIdsArgs, 'ids' | 'orgId'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'orgId' | 'userId'>>;
  userPermissions?: Resolver<Array<ResolversTypes['UserPermission']>, ParentType, ContextType, RequireFields<QueryUserPermissionsArgs, 'orgId' | 'userId'>>;
  userProperty?: Resolver<Maybe<ResolversTypes['Property']>, ParentType, ContextType, RequireFields<QueryUserPropertyArgs, 'orgId' | 'propertyName' | 'userId'>>;
  users?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<QueryUsersArgs, 'orgId'>>;
  usersByIdentity?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUsersByIdentityArgs, 'identityProvider' | 'identityProviderUserId'>>;
  usersByIds?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUsersByIdsArgs, 'ids' | 'orgId'>>;
}>;

export type ResourceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ResourceConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ResourceConnection'] = ResolversParentTypes['ResourceConnection']> = ResolversObject<{
  nodes?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['RolePermission']>, ParentType, ContextType>;
  properties?: Resolver<Array<ResolversTypes['Property']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RoleConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RoleConnection'] = ResolversParentTypes['RoleConnection']> = ResolversObject<{
  nodes?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RolePermissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RolePermission'] = ResolversParentTypes['RolePermission']> = ResolversObject<{
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  resource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  resourceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  roleId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  effectivePermissions?: Resolver<Array<ResolversTypes['EffectivePermission']>, ParentType, ContextType, Partial<UserEffectivePermissionsArgs>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  identityProvider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  identityProviderUserId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['UserPermission']>, ParentType, ContextType>;
  properties?: Resolver<Array<ResolversTypes['Property']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserConnection'] = ResolversParentTypes['UserConnection']> = ResolversObject<{
  nodes?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPermissionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['UserPermission'] = ResolversParentTypes['UserPermission']> = ResolversObject<{
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  resource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  resourceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  DateTime?: GraphQLScalarType;
  EffectivePermission?: EffectivePermissionResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationConnection?: OrganizationConnectionResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Permission?: PermissionResolvers<ContextType>;
  Property?: PropertyResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  ResourceConnection?: ResourceConnectionResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  RoleConnection?: RoleConnectionResolvers<ContextType>;
  RolePermission?: RolePermissionResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserConnection?: UserConnectionResolvers<ContextType>;
  UserPermission?: UserPermissionResolvers<ContextType>;
}>;

