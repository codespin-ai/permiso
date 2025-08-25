import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserDbRow, UserWithProperties, Property } from "../../types.js";
import { mapUserFromDb } from "../../mappers.js";
import { getUserProperties } from "./get-user-properties.js";
import { getUserRoles } from "./get-user-roles.js";

const logger = createLogger("permiso-server:users");

export async function getUsersByIdentity(
  ctx: DataContext,
  identityProvider: string,
  identityProviderUserId: string,
): Promise<Result<UserWithProperties[]>> {
  try {
    // This operation needs to search across all organizations
    const rootDb = ctx.db.upgradeToRoot?.("Search users by identity across organizations");
    if (!rootDb) {
      throw new Error("Cross-organization user search requires administrative access");
    }

    const rows = await rootDb.manyOrNone<UserDbRow>(
      `SELECT * FROM "user" WHERE identity_provider = $(identityProvider) AND identity_provider_user_id = $(identityProviderUserId)`,
      { identityProvider, identityProviderUserId },
    );

    const users = rows.map(mapUserFromDb);

    // Use rootDb context for getting properties and roles
    const rootCtx = { ...ctx, db: rootDb };
    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIds] = await Promise.all([
          getUserProperties(rootCtx, user.id, false),
          getUserRoles(rootCtx, user.id),
        ]);

        if (!propertiesResult.success) {
          throw propertiesResult.error;
        }

        return {
          ...user,
          roleIds: roleIds.success ? roleIds.data : [],
          properties: propertiesResult.data.reduce(
            (acc: Record<string, unknown>, prop: Property) => {
              acc[prop.name] = prop.value;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        };
      }),
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get users by identity", {
      error,
      identityProvider,
      identityProviderUserId,
    });
    return { success: false, error: error as Error };
  }
}
