import { updateResource } from "../../domain/resource/update-resource.js";
import { DataContext } from "../../domain/data-context.js";

export const updateResourceResolver = {
  Mutation: {
    updateResource: async (
      _: any,
      args: { orgId: string; resourceId: string; input: any },
      context: DataContext,
    ) => {
      const result = await updateResource(context, args.resourceId, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
