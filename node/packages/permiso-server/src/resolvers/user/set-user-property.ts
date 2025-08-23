import { setUserProperty } from "../../domain/user/set-user-property.js";
import { DataContext } from "../../domain/data-context.js";

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
      context: DataContext,
    ) => {
      const result = await setUserProperty(
        context,
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
