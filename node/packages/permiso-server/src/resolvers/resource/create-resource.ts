import { createResource } from "../../domain/resource/create-resource.js";
import { DataContext } from "../../domain/data-context.js";
import type { CreateResourceInput } from "../../generated/graphql.js";

export const createResourceResolver = {
  Mutation: {
    createResource: async (
      _: unknown,
      args: { input: CreateResourceInput },
      context: DataContext,
    ) => {
      const result = await createResource(context, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
