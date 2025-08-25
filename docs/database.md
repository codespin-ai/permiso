# Database Configuration

## Required Database Users

Permiso requires two PostgreSQL users:

```sql
-- RLS user for organization-scoped operations
CREATE USER rls_db_user WITH PASSWORD 'your_password';
GRANT CONNECT ON DATABASE permiso TO rls_db_user;
GRANT USAGE ON SCHEMA public TO rls_db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rls_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rls_db_user;

-- Unrestricted user for admin operations
CREATE USER unrestricted_db_user WITH PASSWORD 'your_password';
GRANT CONNECT ON DATABASE permiso TO unrestricted_db_user;
GRANT ALL PRIVILEGES ON DATABASE permiso TO unrestricted_db_user;
ALTER USER unrestricted_db_user BYPASSRLS;
```

## Environment Variables

```bash
# Database connection
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso

# Required database users
RLS_DB_USER=rls_db_user
RLS_DB_USER_PASSWORD=your_rls_password
UNRESTRICTED_DB_USER=unrestricted_db_user
UNRESTRICTED_DB_USER_PASSWORD=your_admin_password
```

## Multi-Database Support

Permiso can manage permissions for multiple databases.

### Structure

```
database/
├── permiso/           # Main Permiso database
│   ├── knexfile.js
│   ├── migrations/
│   └── seeds/
└── [other-db]/       # Additional databases
    ├── knexfile.js
    ├── migrations/
    └── seeds/
```

### Commands

```bash
# Permiso database
npm run migrate:permiso:latest
npm run migrate:permiso:rollback
npm run migrate:permiso:status
npm run migrate:permiso:make migration_name

# All databases
npm run migrate:all
npm run migrate:all:status
```

### Adding a Database

1. Create directory: `mkdir -p database/mydb/migrations`
2. Create `database/mydb/knexfile.js`:
   ```javascript
   import { createDbConfig } from "../../knexfile.js";
   export default createDbConfig("mydb", {});
   ```
3. Add npm scripts for the new database
4. Update `scripts/db-all.sh` to include the new database

## Migrations

Migrations are run using Knex.js:

```bash
# Create migration
npm run migrate:permiso:make add_new_table

# Run migrations
npm run migrate:permiso:latest

# Rollback
npm run migrate:permiso:rollback

# Status
npm run migrate:permiso:status
```

## Auto-Migration

For Docker deployments, set `PERMISO_AUTO_MIGRATE=true` to run migrations on startup.
