import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:users");

export async function getUsersByIdentity(
  ctx: DataContext,
  identityProvider: string,
  identityProviderUserId: string,
): Promise<Result<UserWithProperties[]>> {
  try {
    // This operation needs to search across all organizations
    // We use the user repository's getByIdentity method for each org
    // For now, we need to list all orgs and search in each one

    // Get all organizations
    const orgsResult = await ctx.repos.organization.list();
    if (!orgsResult.success) {
      return { success: false, error: orgsResult.error };
    }

    const users: UserWithProperties[] = [];

    for (const org of orgsResult.data.nodes) {
      const userResult = await ctx.repos.user.getByIdentity(
        org.id,
        identityProvider,
        identityProviderUserId,
      );

      if (userResult.success && userResult.data) {
        const [propertiesResult, roleIdsResult] = await Promise.all([
          ctx.repos.user.getProperties(org.id, userResult.data.id),
          ctx.repos.user.getRoleIds(org.id, userResult.data.id),
        ]);

        const properties = propertiesResult.success
          ? propertiesResult.data
          : [];

        users.push({
          ...userResult.data,
          roleIds: roleIdsResult.success ? roleIdsResult.data : [],
          properties: properties.reduce(
            (acc: Record<string, unknown>, prop: Property) => {
              acc[prop.name] = prop.value;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        });
      }
    }

    return { success: true, data: users };
  } catch (error) {
    logger.error("Failed to get users by identity", {
      error,
      identityProvider,
      identityProviderUserId,
    });
    return { success: false, error: error as Error };
  }
}
