import { deleteResource } from "../../domain/resource/delete-resource.js";
import { DataContext } from "../../domain/data-context.js";

export const deleteResourceResolver = {
  Mutation: {
    deleteResource: async (
      _: any,
      args: { orgId: string; resourceId: string; safetyKey?: string },
      context: DataContext & { safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteResource(context, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
