import type { Database } from "@codespin/permiso-db";
import { updateResource } from "../../domain/resource/update-resource.js";

export const updateResourceResolver = {
  Mutation: {
    updateResource: async (
      _: any,
      args: { orgId: string; resourceId: string; input: any },
      context: { db: Database },
    ) => {
      const result = await updateResource(
        context.db,
        args.orgId,
        args.resourceId,
        args.input,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
