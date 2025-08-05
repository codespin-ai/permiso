# Configuration

This document describes all configuration options for Permiso.

## Environment Variables

Permiso uses environment variables for configuration. All variables are optional and have sensible defaults.

### Database Configuration

| Variable              | Description                     | Default     |
| --------------------- | ------------------------------- | ----------- |
| `PERMISO_DB_HOST`     | PostgreSQL host                 | `localhost` |
| `PERMISO_DB_PORT`     | PostgreSQL port                 | `5432`      |
| `PERMISO_DB_NAME`     | Database name                   | `permiso`   |
| `PERMISO_DB_USER`     | Database user                   | `postgres`  |
| `PERMISO_DB_PASSWORD` | Database password               | `postgres`  |

### Server Configuration

| Variable              | Description                     | Default     |
| --------------------- | ------------------------------- | ----------- |
| `PERMISO_SERVER_PORT` | GraphQL server port             | `5001`      |
| `PERMISO_LOG_LEVEL`   | Logging level (debug/info/warn/error) | `info` |

### Authentication Configuration

| Variable                   | Description                        | Default     |
| -------------------------- | ---------------------------------- | ----------- |
| `PERMISO_API_KEY`          | API key for authentication        | (none)      |
| `PERMISO_API_KEY_ENABLED`  | Enable API key authentication     | `false`     |

**Note**: Setting `PERMISO_API_KEY` automatically enables API key authentication.

### Docker-Specific Configuration

| Variable                | Description                          | Default     |
| ----------------------- | ------------------------------------ | ----------- |
| `PERMISO_AUTO_MIGRATE` | Auto-run database migrations on startup | `false`  |

## Configuration Examples

### Development Environment

```bash
export PERMISO_DB_HOST=localhost
export PERMISO_DB_PORT=5432
export PERMISO_DB_NAME=permiso
export PERMISO_DB_USER=postgres
export PERMISO_DB_PASSWORD=postgres
export PERMISO_SERVER_PORT=5001
export PERMISO_LOG_LEVEL=debug
```

### Production Environment with Authentication

```bash
export PERMISO_DB_HOST=prod-db.example.com
export PERMISO_DB_PORT=5432
export PERMISO_DB_NAME=permiso_prod
export PERMISO_DB_USER=permiso_app
export PERMISO_DB_PASSWORD=secure-password-here
export PERMISO_SERVER_PORT=5001
export PERMISO_LOG_LEVEL=info
export PERMISO_API_KEY=your-secure-api-key
```

### Docker Deployment

```bash
# With auto-migration for first deployment
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=postgres \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=postgres \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

## Multi-Database Support

For projects using multiple databases, each database has its own set of environment variables:

```bash
# Permiso database
export PERMISO_DB_HOST=localhost
export PERMISO_DB_NAME=permiso

# Analytics database (example)
export ANALYTICS_DB_HOST=analytics-server
export ANALYTICS_DB_NAME=analytics_prod
export ANALYTICS_DB_USER=analytics_user
export ANALYTICS_DB_PASSWORD=analytics_pass
```

See [Database Configuration](database.md) for more details on multi-database setup.

## Loading Configuration

### Using .env Files

While not included by default, you can use `.env` files with a package like `dotenv`:

```bash
# .env file
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso_dev
```

### Using Docker Compose

```yaml
services:
  permiso:
    image: ghcr.io/codespin-ai/permiso:latest
    environment:
      - PERMISO_DB_HOST=postgres
      - PERMISO_DB_USER=postgres
      - PERMISO_DB_PASSWORD=postgres
    env_file:
      - .env  # Optional: load from .env file
```

## Configuration Validation

The server validates required configuration on startup and will fail fast if critical configuration is missing or invalid.