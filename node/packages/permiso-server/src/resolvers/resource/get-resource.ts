import { getResource } from "../../domain/resource/get-resource.js";
import { DataContext } from "../../domain/data-context.js";

export const getResourceResolver = {
  Query: {
    resource: async (
      _: unknown,
      args: { orgId: string; resourceId: string },
      context: DataContext,
    ) => {
      const result = await getResource(context, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
