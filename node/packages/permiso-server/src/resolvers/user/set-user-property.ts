import type { Database } from "@codespin/permiso-db";
import { setUserProperty } from "../../domain/user/set-user-property.js";

// Re-export domain function
export { setUserProperty };

export const setUserPropertyResolver = {
  Mutation: {
    setUserProperty: async (
      _: any,
      args: {
        orgId: string;
        userId: string;
        name: string;
        value: unknown;
        hidden?: boolean;
      },
      context: { db: Database },
    ) => {
      const result = await setUserProperty(
        context.db,
        args.orgId,
        args.userId,
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
