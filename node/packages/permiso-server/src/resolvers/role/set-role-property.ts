import type { Database } from "@codespin/permiso-db";
import { setRoleProperty } from "../../domain/role/set-role-property.js";

// Re-export domain function
export { setRoleProperty };

export const setRolePropertyResolver = {
  Mutation: {
    setRoleProperty: async (
      _: any,
      args: {
        orgId: string;
        roleId: string;
        name: string;
        value: unknown;
        hidden?: boolean;
      },
      context: { db: Database },
    ) => {
      const result = await setRoleProperty(
        context.db,
        args.orgId,
        args.roleId,
        args.name,
        args.value,
        args.hidden ?? false,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
