import type { Database } from "@codespin/permiso-db";

export type GraphQLContext = {
  db: Database;
  orgId: string;
};
