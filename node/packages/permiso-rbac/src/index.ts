export * from './types.js';
export * from './db.js';
export * from './persistence/index.js';
export { resolvers } from './resolvers/index.js';

// Re-export the GraphQL schema as a string
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For now, export the schema path - consumers will need to read it
export const schemaPath = join(__dirname, 'schema.graphql');

// Export a function to get the typeDefs
export function getTypeDefs(): string {
  return readFileSync(schemaPath, 'utf-8');
}