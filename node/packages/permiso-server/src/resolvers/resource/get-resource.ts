import type { Database } from "@codespin/permiso-db";
import { getResource } from "../../domain/resource/get-resource.js";

export const getResourceResolver = {
  Query: {
    resource: async (
      _: any,
      args: { orgId: string; resourceId: string },
      context: { db: Database },
    ) => {
      const result = await getResource(context.db, args.orgId, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
