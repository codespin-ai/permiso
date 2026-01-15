import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  client: "better-sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: process.env.PERMISO_SQLITE_PATH || "./data/permiso.db",
  },
  migrations: {
    directory: join(__dirname, "migrations"),
    extension: "js",
    loadExtensions: [".js"],
  },
  seeds: {
    directory: join(__dirname, "seeds"),
    extension: "js",
    loadExtensions: [".js"],
  },
};
