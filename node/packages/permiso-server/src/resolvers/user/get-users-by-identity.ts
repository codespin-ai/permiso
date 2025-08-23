import type { Database } from "@codespin/permiso-db";
import { getUsersByIdentity } from "../../domain/user/get-users-by-identity.js";

// Re-export domain function
export { getUsersByIdentity };

export const getUsersByIdentityResolver = {
  Query: {
    usersByIdentity: async (
      _: any,
      args: { identityProvider: string; identityProviderUserId: string },
      context: { db: Database },
    ) => {
      const result = await getUsersByIdentity(
        context,
        args.identityProvider,
        args.identityProviderUserId,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
