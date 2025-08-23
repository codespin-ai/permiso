import type { OrganizationWithProperties } from "../../types.js";
import { getOrganizationProperties } from "../../domain/organization/get-organization-properties.js";
import { getUsers } from "../user/get-users.js";
import { getRoles } from "../role/get-roles.js";
import {
  getResources,
  getResourcesByIdPrefix,
} from "../../domain/resource/get-resources.js";
import { DataContext } from "../../domain/data-context.js";

export const organizationFieldResolvers = {
  Organization: {
    properties: async (
      parent: OrganizationWithProperties,
      _: any,
      context: DataContext,
    ) => {
      const result = await getOrganizationProperties(context, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (
      parent: OrganizationWithProperties,
      args: { filter?: any; pagination?: any },
      context: DataContext,
    ) => {
      const result = await getUsers(
        context,
        parent.id,
        args.filter,
        args.pagination,
      );
      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getUsers(context, parent.id, args.filter);
        if (countResult.success) {
          totalCount = countResult.data.length;
        }
      }

      const hasNextPage =
        args.pagination?.offset !== undefined &&
        args.pagination?.limit !== undefined
          ? args.pagination.offset + args.pagination.limit < totalCount
          : false;
      const hasPreviousPage =
        args.pagination?.offset !== undefined
          ? args.pagination.offset > 0
          : false;

      return {
        nodes: result.data,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: null,
          endCursor: null,
        },
      };
    },

    roles: async (
      parent: OrganizationWithProperties,
      args: { filter?: any; pagination?: any },
      context: DataContext,
    ) => {
      const result = await getRoles(
        context,
        parent.id,
        args.filter,
        args.pagination,
      );
      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getRoles(context, parent.id, args.filter);
        if (countResult.success) {
          totalCount = countResult.data.length;
        }
      }

      const hasNextPage =
        args.pagination?.offset !== undefined &&
        args.pagination?.limit !== undefined
          ? args.pagination.offset + args.pagination.limit < totalCount
          : false;
      const hasPreviousPage =
        args.pagination?.offset !== undefined
          ? args.pagination.offset > 0
          : false;

      return {
        nodes: result.data,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: null,
          endCursor: null,
        },
      };
    },

    resources: async (
      parent: OrganizationWithProperties,
      args: { filter?: any; pagination?: any },
      context: DataContext,
    ) => {
      let result;
      if (args.filter?.idPrefix) {
        result = await getResourcesByIdPrefix(
          context,
          parent.id,
          args.filter.idPrefix,
        );
      } else {
        result = await getResources(context, parent.id, args.pagination);
      }

      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination && !args.filter?.idPrefix) {
        const countResult = await getResources(context, parent.id);
        if (countResult.success) {
          totalCount = countResult.data.length;
        }
      }

      const hasNextPage =
        args.pagination?.offset !== undefined &&
        args.pagination?.limit !== undefined
          ? args.pagination.offset + args.pagination.limit < totalCount
          : false;
      const hasPreviousPage =
        args.pagination?.offset !== undefined
          ? args.pagination.offset > 0
          : false;

      return {
        nodes: result.data,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: null,
          endCursor: null,
        },
      };
    },
  },
};
