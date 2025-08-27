import { getResourcesByIdPrefix } from "../../domain/resource/get-resources-by-id-prefix.js";
import { DataContext } from "../../domain/data-context.js";

export const resourcesByIdPrefixResolver = {
  Query: {
    resourcesByIdPrefix: async (
      _: unknown,
      args: { idPrefix: string },
      context: DataContext,
    ) => {
      const result = await getResourcesByIdPrefix(context, args.idPrefix);

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
  },
};
