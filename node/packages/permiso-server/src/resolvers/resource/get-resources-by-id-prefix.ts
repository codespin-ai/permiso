import { getResourcesByIdPrefix } from "../../domain/resource/get-resources-by-id-prefix.js";
import { DataContext } from "../../domain/data-context.js";

export const resourcesByIdPrefixResolver = {
  Query: {
    resourcesByIdPrefix: async (
      _: any,
      args: { orgId: string; idPrefix: string },
      context: DataContext,
    ) => {
      const result = await getResourcesByIdPrefix(
        context,
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
