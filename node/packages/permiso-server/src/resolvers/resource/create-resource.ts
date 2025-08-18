import type { Database } from "@codespin/permiso-db";
import { createResource } from "../../domain/resource/create-resource.js";

export const createResourceResolver = {
  Mutation: {
    createResource: async (
      _: any,
      args: { input: any },
      context: { db: Database },
    ) => {
      const result = await createResource(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
