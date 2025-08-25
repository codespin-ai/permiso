# Configuration

All configuration is done via environment variables.

## Required Variables

```bash
# Database connection
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso

# Database users (both required)
RLS_DB_USER=rls_db_user
RLS_DB_USER_PASSWORD=your_rls_password
UNRESTRICTED_DB_USER=unrestricted_db_user
UNRESTRICTED_DB_USER_PASSWORD=your_admin_password
```

## Optional Variables

```bash
# Server
PERMISO_SERVER_PORT=5001              # Default: 5001
PERMISO_SERVER_HOST=0.0.0.0          # Default: 0.0.0.0

# API Authentication
PERMISO_API_KEY=your-secret-key      # Enables API key auth when set
PERMISO_API_KEY_ENABLED=true         # Explicit enable flag

# Docker/Production
PERMISO_AUTO_MIGRATE=true            # Run migrations on startup
PERMISO_AUTO_SEED=true               # Run seeds on startup (dev only)

# Logging
NODE_ENV=production                  # Set to 'production' for less verbose logs
LOG_LEVEL=debug                      # debug, info, warn, error
```

## Docker Configuration

For Docker deployments, use environment variables with `-e`:

```bash
docker run \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e RLS_DB_USER=rls_db_user \
  -e RLS_DB_USER_PASSWORD=password \
  -e UNRESTRICTED_DB_USER=unrestricted_db_user \
  -e UNRESTRICTED_DB_USER_PASSWORD=password \
  ghcr.io/codespin-ai/permiso:latest
```

## Configuration Files

For local development, create a `.env` file:

```bash
# .env
PERMISO_DB_HOST=localhost
PERMISO_DB_NAME=permiso
RLS_DB_USER=rls_db_user
RLS_DB_USER_PASSWORD=changeme_rls
UNRESTRICTED_DB_USER=unrestricted_db_user
UNRESTRICTED_DB_USER_PASSWORD=changeme_admin
```

## Multi-Database Configuration

For additional databases, use prefixed variables:

```bash
# Additional database example
MYDB_DB_HOST=localhost
MYDB_DB_PORT=5432
MYDB_DB_NAME=mydb
MYDB_DB_USER=myuser
MYDB_DB_PASSWORD=mypassword
```