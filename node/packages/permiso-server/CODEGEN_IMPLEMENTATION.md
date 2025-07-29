# GraphQL Code Generator Implementation

This document summarizes the GraphQL Code Generator implementation in the permiso-server package.

## Overview

GraphQL Code Generator has been successfully integrated to automatically generate TypeScript types from the GraphQL schema, replacing manually maintained types and ensuring type safety.

## Key Changes

### 1. Installation and Configuration

- Added `@graphql-codegen/cli`, `@graphql-codegen/typescript`, and `@graphql-codegen/typescript-resolvers` as dev dependencies
- Created `codegen.yml` configuration file with proper settings for the project

### 2. Build Process Updates

- Modified npm scripts to run code generation before TypeScript compilation
- Updated `.gitignore` to exclude generated files
- Added ESLint ignore pattern for generated directory

### 3. Type System Changes

- Removed manually maintained GraphQL types from `types.ts`
- Re-exported generated types from `./generated/graphql.js`
- Created specialized types for internal use:
  - `UserPermissionWithOrgId` and `RolePermissionWithOrgId` for persistence layer
  - These types include `orgId` which isn't exposed in the GraphQL schema

### 4. Mapper Functions

- Updated all mapper functions to return GraphQL-compliant types
- Nested fields (like `properties`, `roles`, `users`) are populated by GraphQL resolvers
- Direct mapping from database snake_case to GraphQL camelCase

### 5. Resolver Updates

- Updated resource resolver to properly construct `UserPermission` and `RolePermission` objects
- Nested fields are set to empty/null values and populated by their respective resolvers

## Benefits

1. **Type Safety**: All GraphQL types are now automatically generated from the schema
2. **No Manual Sync**: Eliminates the need to manually keep TypeScript types in sync with GraphQL schema
3. **Better DX**: IDE autocomplete and type checking for all GraphQL operations
4. **Maintainability**: Changes to the GraphQL schema automatically update TypeScript types

## Usage

The code generation runs automatically during the build process:
```bash
npm run build  # Runs codegen, then tsc
```

To run code generation manually:
```bash
npm run codegen
```