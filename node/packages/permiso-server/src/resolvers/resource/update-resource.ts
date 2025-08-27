import { updateResource } from "../../domain/resource/update-resource.js";
import { DataContext } from "../../domain/data-context.js";
import type { UpdateResourceInput } from "../../generated/graphql.js";

export const updateResourceResolver = {
  Mutation: {
    updateResource: async (
      _: unknown,
      args: { orgId: string; resourceId: string; input: UpdateResourceInput },
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
