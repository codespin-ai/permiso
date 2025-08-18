import type { Database } from "@codespin/permiso-db";
import { getResourcesByIdPrefix } from "../../domain/resource/get-resources-by-id-prefix.js";

export const resourcesByIdPrefixResolver = {
  Query: {
    resourcesByIdPrefix: async (
      _: any,
      args: { orgId: string; idPrefix: string },
      context: { db: Database },
    ) => {
      const result = await getResourcesByIdPrefix(
        context.db,
        args.orgId,
        args.idPrefix,
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
  },
};
