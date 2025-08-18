import type { Database } from "@codespin/permiso-db";
import { deleteResource } from "../../domain/resource/delete-resource.js";

export const deleteResourceResolver = {
  Mutation: {
    deleteResource: async (
      _: any,
      args: { orgId: string; resourceId: string; safetyKey?: string },
      context: { db: Database; safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteResource(
        context.db,
        args.orgId,
        args.resourceId,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
