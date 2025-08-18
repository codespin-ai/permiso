export * from "./types.js";
export { resolvers } from "./resolvers/index.js";

// Export all the resolver functions for direct use
export * from "./resolvers/organization/index.js";
export * from "./resolvers/user/index.js";
export * from "./resolvers/role/index.js";
export * from "./resolvers/resource/index.js";
export * from "./resolvers/permission/index.js";

// Re-export the GraphQL schema as a string
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For now, export the schema path - consumers will need to read it
export const schemaPath = join(__dirname, "schema.graphql");

// Export a function to get the typeDefs
export function getTypeDefs(): string {
  return readFileSync(schemaPath, "utf-8");
}
