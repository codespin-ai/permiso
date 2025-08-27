import { deleteResourcesByIdPrefix } from "../../domain/resource/delete-resources-by-id-prefix.js";
import { DataContext } from "../../domain/data-context.js";

export const deleteResourcesByIdPrefixResolver = {
  Mutation: {
    deleteResourcesByIdPrefix: async (
      _: unknown,
      args: { orgId: string; idPrefix: string; safetyKey?: string },
      context: DataContext & { safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteResourcesByIdPrefix(context, args.idPrefix);
      if (!result.success) {
        throw result.error;
      }
      return {
        success: true,
        deletedCount: result.data,
      };
    },
  },
};
