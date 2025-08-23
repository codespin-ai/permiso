import { createResource } from "../../domain/resource/create-resource.js";
import { DataContext } from "../../domain/data-context.js";

export const createResourceResolver = {
  Mutation: {
    createResource: async (
      _: any,
      args: { input: any },
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
