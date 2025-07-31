# Permiso

A comprehensive Role-Based Access Control (RBAC) system with GraphQL API, built with TypeScript.

## Features

- 🏢 **Multi-tenant Organizations** - Isolated authorization contexts
- 👥 **Users & Roles** - Flexible user management with role assignments
- 🔐 **Fine-grained Permissions** - Resource-based access control with path-like IDs
- 🏷️ **Properties & Filtering** - Custom metadata with query capabilities
- 🚀 **GraphQL API** - Modern, type-safe API with full CRUD operations
- 📊 **Effective Permissions** - Combined user and role permission calculation

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/codespin-ai/permiso.git
cd permiso

# Install dependencies
npm install

# Build all packages
./build.sh
```

### Database Setup

To run the development environment, use the following scripts from the `devenv` directory:

- **For macOS:** `./run.sh up`
- **For Linux:** `./run-rootless.sh up`

This will start a PostgreSQL container.

You can then set the following environment variables to connect to the database:

```bash
# Set environment variables
export PERMISO_DB_HOST=localhost
export PERMISO_DB_PORT=5432
export PERMISO_DB_NAME=permiso
export PERMISO_DB_USER=postgres
export PERMISO_DB_PASSWORD=your_password

# Run migrations
cd node/packages/permiso-server
npm run migrate:latest
```

### Starting the Server

```bash
# Start the GraphQL server
./start.sh

# The server will be available at http://localhost:5001/graphql
```

## Architecture

Permiso is built as a monorepo with the following packages:

- **`@codespin/permiso-core`** - Core types and utilities (Result type, etc.)
- **`@codespin/permiso-logger`** - Centralized logging with Winston
- **`@codespin/permiso-server`** - GraphQL server for RBAC implementation

## Core Concepts

### Organizations

Root entities that provide isolated authorization contexts. All other entities belong to an organization.

### Users

Represent individuals who need access to resources. Users can:

- Belong to one organization
- Have multiple roles assigned
- Have direct permissions on resources
- Have custom properties for filtering

### Roles

Collections of permissions that can be assigned to users. Useful for common permission sets like "admin", "editor", "viewer".

### Resources

Entities identified by IDs in path-like format that permissions apply to:

- `/documents/contracts/2023/acme.pdf`
- `/features/billing`
- `/api/users/*`

### Permissions

Define what actions can be performed on resources:

- User permissions: Direct user → resource mappings
- Role permissions: Role → resource mappings
- Effective permissions: Combined view of user's direct + role permissions

### Properties

Key-value metadata stored as JSONB that can be attached to organizations, users, and roles:

- **Flexible JSON storage** - Store strings, numbers, booleans, objects, arrays, or null
- **Hidden properties** - Mark sensitive data as hidden
- **Filterable queries** - Query by property names and values
- **Type-safe** - PostgreSQL JSONB validation and operations

#### Property Examples

```graphql
# Set a simple string property
mutation {
  setOrganizationProperty(
    orgId: "acme-corp"
    name: "tier"
    value: "enterprise"
  ) {
    name
    value
  }
}

# Set a complex object property
mutation {
  setUserProperty(
    orgId: "acme-corp"
    userId: "john-doe"
    name: "profile"
    value: {
      department: "engineering"
      level: 3
      skills: ["typescript", "graphql", "postgres"]
      manager: "jane-smith"
    }
  ) {
    name
    value
  }
}

# Set a hidden property (for sensitive data)
mutation {
  setOrganizationProperty(
    orgId: "acme-corp"
    name: "apiKey"
    value: "sk_live_..."
    hidden: true
  ) {
    name
    value
    hidden
  }
}
```

## Usage Example

```typescript
import {
  initializeDatabase,
  createOrganization,
  createUser,
  createRole,
  grantRolePermission,
  assignUserRole,
} from "@codespin/permiso-server";

// Initialize database
const db = initializeDatabase();

// Create an organization with properties
const org = await createOrganization(db, {
  id: "acme-corp",
  name: "ACME Corporation",
  properties: [
    {
      name: "tier",
      value: "enterprise"
    },
    {
      name: "settings",
      value: {
        maxUsers: 5000,
        features: ["sso", "audit", "api"]
      }
    }
  ]
});

// Create a role with properties
const role = await createRole(db, {
  id: "editor",
  orgId: "acme-corp",
  name: "Content Editor Role",
  properties: [
    {
      name: "permissions",
      value: {
        canPublish: true,
        canDelete: false,
        maxDrafts: 10
      }
    }
  ]
});

// Grant permissions to role
await grantRolePermission(db, "acme-corp", "editor", "/documents/*", "read");
await grantRolePermission(db, "acme-corp", "editor", "/documents/*", "write");

// Create a user with properties
const user = await createUser(db, {
  id: "john-doe",
  orgId: "acme-corp",
  identityProvider: "google",
  identityProviderUserId: "john@acme.com",
  properties: [
    {
      name: "profile",
      value: {
        department: "engineering",
        level: 3,
        location: "San Francisco"
      }
    }
  ]
});

// Assign role to user
await assignUserRole(db, "acme-corp", "john-doe", "editor");

// Check permissions
const hasPermission = await hasPermission(
  db,
  "acme-corp",
  "john-doe",
  "/documents/report.pdf",
  "write"
);
// Returns: true
```

## GraphQL API

Permiso provides a complete GraphQL schema for all RBAC operations. Key features:

- Full CRUD operations for all entities
- Filtering and pagination support
- Nested relationship queries
- Batch operations
- Real-time permission checking

Example query:

```graphql
query GetUserPermissions {
  user(orgId: "acme-corp", userId: "john-doe") {
    id
    properties {
      name
      value
      hidden
    }
    roles {
      id
      properties {
        name
        value
      }
      permissions {
        resourceId
        action
      }
    }
    effectivePermissions(resourceId: "/documents/*") {
      resourceId
      action
      source
    }
  }
}
```

## Development

### Project Structure

```
permiso/
├── node/packages/
│   ├── permiso-core/       # Core utilities
│   ├── permiso-logger/     # Logging
│   └── permiso-server/     # GraphQL server
├── build.sh                # Build script
├── clean.sh                # Clean script
└── lint-all.sh            # Lint all packages
```

### Building

```bash
# Build all packages
./build.sh

# Clean build artifacts
./clean.sh

# Run linting
./lint-all.sh
```

### Testing

```bash
# Run tests (coming soon)
npm test
```

## Environment Variables

| Variable              | Description                     | Default     |
| --------------------- | ------------------------------- | ----------- |
| `PERMISO_DB_HOST`     | PostgreSQL host                 | `localhost` |
| `PERMISO_DB_PORT`     | PostgreSQL port                 | `5432`      |
| `PERMISO_DB_NAME`     | Database name                   | `permiso`   |
| `PERMISO_DB_USER`     | Database user                   | `postgres`  |
| `PERMISO_DB_PASSWORD` | Database password               | `postgres`  |
| `PERMISO_API_KEY`     | API key for authentication      | (none)      |
| `PERMISO_API_KEY_ENABLED` | Enable API key auth         | `false`     |
| `PERMISO_SERVER_PORT` | GraphQL server port             | `5001`      |
| `LOG_LEVEL`           | Logging level                   | `info`      |
| `PERMISO_AUTO_MIGRATE` | Auto-run database migrations (Docker) | `false`     |

## Docker Support

Permiso can be run as a Docker container for easy deployment and distribution.

### Using Pre-built Images

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/codespin-ai/permiso:latest

# Run with automatic database setup (recommended for first run)
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=your-db-host \
  -e PERMISO_DB_PORT=5432 \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=your-password \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest

# Run without automatic migrations (for production)
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=your-db-host \
  -e PERMISO_DB_PORT=5432 \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=your-password \
  ghcr.io/codespin-ai/permiso:latest
```

#### Automatic Database Setup

The Docker image includes an intelligent entrypoint that can automatically set up your database:

- **`PERMISO_AUTO_MIGRATE=true`** - Enables automatic database migrations
- On first run: Creates all necessary tables
- On subsequent runs: Applies any pending migrations
- Safe for development and staging environments
- For production: Run migrations manually or in a separate step

### Building Your Own Image

```bash
# Build the Docker image
./docker-build.sh

# Or manually with Docker
docker build -t permiso:latest .

# Run the container
docker run -p 5001:5001 \
  --env-file .env \
  permiso:latest
```

### Docker Compose for Development

For local development with PostgreSQL:

```bash
# macOS users
cd devenv
./run.sh up

# Linux users
cd devenv
./run-rootless.sh up

# Run the application (outside container)
cd ..
./build.sh
./start.sh
```

### Quick Start with Docker Compose

For a complete setup with both PostgreSQL and Permiso:

```bash
# Copy the example file
cp docker-compose.example.yml docker-compose.yml

# Edit passwords and configuration as needed
# Then start everything:
docker-compose up -d

# The application will be available at http://localhost:5001/graphql
# Database migrations will run automatically on first start
```

### Pushing to a Registry

```bash
# Push to GitHub Container Registry (official)
./docker-push.sh ghcr.io/codespin-ai/permiso latest

# Push to your own registry
./docker-push.sh docker.io/yourorg/permiso latest

# Push to AWS ECR
./docker-push.sh 123456789.dkr.ecr.us-east-1.amazonaws.com/permiso latest
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Production Deployment

The Docker image is optimized for production with:
- Multi-stage build for smaller image size
- Node 24 on Ubuntu 24.04 minimal base
- Non-root user execution
- Health checks included
- Proper signal handling for graceful shutdown

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: permiso
spec:
  replicas: 2
  selector:
    matchLabels:
      app: permiso
  template:
    metadata:
      labels:
        app: permiso
    spec:
      containers:
      - name: permiso
        image: ghcr.io/codespin-ai/permiso:latest
        ports:
        - containerPort: 5001
        env:
        - name: PERMISO_DB_HOST
          value: postgres-service
        - name: PERMISO_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: permiso-secrets
              key: db-password
        livenessProbe:
          httpGet:
            path: /graphql
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
```

## API Authentication

Permiso supports optional API key authentication to secure your GraphQL endpoint. When enabled, all requests must include a valid API key in the `x-api-key` header.

### Enabling API Key Authentication

```bash
# Set the API key (this automatically enables authentication)
export PERMISO_API_KEY=your-secret-api-key

# Or explicitly enable with a separate flag
export PERMISO_API_KEY_ENABLED=true
export PERMISO_API_KEY=your-secret-api-key

# Start the server
./start.sh
```

### Making Authenticated Requests

Include the API key in the `x-api-key` header:

```bash
# Using curl
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{"query": "{ organizations { id name } }"}'

# Using Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:5001/graphql',
  headers: {
    'x-api-key': 'your-secret-api-key'
  }
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Codespin

## Acknowledgments

Inspired by [Tankman](https://github.com/lesser-app/tankman)
