import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:users");

export async function getUser(
  ctx: DataContext,
  userId: string,
): Promise<Result<UserWithProperties | null>> {
  try {
    const userResult = await ctx.repos.user.getById(ctx.orgId, userId);
    if (!userResult.success) {
      return userResult;
    }

    if (!userResult.data) {
      return { success: true, data: null };
    }

    const [propertiesResult, roleIdsResult] = await Promise.all([
      ctx.repos.user.getProperties(ctx.orgId, userId),
      ctx.repos.user.getRoleIds(ctx.orgId, userId),
    ]);

    if (!propertiesResult.success) {
      return { success: false, error: propertiesResult.error };
    }

    const result: UserWithProperties = {
      ...userResult.data,
      roleIds: roleIdsResult.success ? roleIdsResult.data : [],
      properties: propertiesResult.data.reduce(
        (acc: Record<string, unknown>, prop: Property) => {
          acc[prop.name] = prop.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get user", { error, userId });
    return { success: false, error: error as Error };
  }
}
