import type { Database } from "@codespin/permiso-db";
import { getRoleProperty } from "../../domain/role/get-role-property.js";

// Re-export domain function
export { getRoleProperty };

export const getRolePropertyResolver = {
  Query: {
    roleProperty: async (
      _: any,
      args: { orgId: string; roleId: string; propertyName: string },
      context: { db: Database },
    ) => {
      const result = await getRoleProperty(
        context.db,
        args.orgId,
        args.roleId,
        args.propertyName,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
