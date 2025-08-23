import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../context.js";
import type { User, UserDbRow } from "../../types.js";
import type { CreateUserInput } from "../../generated/graphql.js";
import { mapUserFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function createUser(
  ctx: DataContext,
  input: CreateUserInput,
): Promise<Result<User>> {
  try {
    const user = await ctx.db.tx(async (t) => {
      const params = {
        id: input.id,
        org_id: input.orgId,
        identity_provider: input.identityProvider,
        identity_provider_user_id: input.identityProviderUserId,
      };

      const userRow = await t.one<UserDbRow>(
        `${sql.insert('"user"', params)} RETURNING *`,
        params,
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map((p) => ({
          parent_id: input.id,
          org_id: input.orgId,
          name: p.name,
          value: p.value === undefined ? null : JSON.stringify(p.value),
          hidden: p.hidden ?? false,
        }));

        for (const prop of propertyValues) {
          await t.none(sql.insert("user_property", prop), prop);
        }
      }

      if (input.roleIds && input.roleIds.length > 0) {
        for (const roleId of input.roleIds) {
          const roleParams = {
            user_id: input.id,
            role_id: roleId,
            org_id: input.orgId,
          };
          await t.none(sql.insert("user_role", roleParams), roleParams);
        }
      }

      return userRow;
    });

    return { success: true, data: mapUserFromDb(user) };
  } catch (error) {
    logger.error("Failed to create user", { error, input });
    return { success: false, error: error as Error };
  }
}
