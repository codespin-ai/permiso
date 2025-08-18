import type { Database } from "@codespin/permiso-db";
import { deleteResourcesByIdPrefix } from "../../domain/resource/delete-resources-by-id-prefix.js";

export const deleteResourcesByIdPrefixResolver = {
  Mutation: {
    deleteResourcesByIdPrefix: async (
      _: any,
      args: { orgId: string; idPrefix: string; safetyKey?: string },
      context: { db: Database; safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteResourcesByIdPrefix(
        context.db,
        args.orgId,
        args.idPrefix,
      );
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
