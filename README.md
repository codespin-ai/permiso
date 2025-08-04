# Permiso

A comprehensive Role-Based Access Control (RBAC) system with GraphQL API, built with TypeScript.

## Features

- 🏢 **Multi-tenant Organizations** - Isolated authorization contexts
- 👥 **Users & Roles** - Flexible user management with role assignments
- 🔐 **Fine-grained Permissions** - Resource-based access control with path-like IDs
- 🏷️ **Properties & Filtering** - Custom metadata with query capabilities
- 🚀 **GraphQL API** - Modern, type-safe API with full CRUD operations
- 📦 **TypeScript Client** - Official client library for easy integration
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

To run the development environment, use the following script from the `devenv` directory:

```bash
./run.sh up
```

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

## Core Concepts

See [Architecture Documentation](docs/architecture.md) for detailed information about:
- Organizations and multi-tenancy
- Users, Roles, and Resources
- Permissions and access control
- Properties and metadata

## GraphQL API

For complete API documentation, examples, and best practices, see [API Documentation](docs/api.md).

### Quick Example

```bash
# Create an organization
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createOrganization(input: { id: \"acme-corp\", name: \"ACME Corporation\" }) { id name } }"}'

# Create a user
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createUser(input: { id: \"john-doe\", orgId: \"acme-corp\", identityProvider: \"google\", identityProviderUserId: \"john@acme.com\" }) { id } }"}'
```

For complete examples and TypeScript usage, see [API Documentation](docs/api.md).

## TypeScript Client

For TypeScript/JavaScript applications, use the official client library that provides a simple, type-safe interface without needing to write GraphQL queries:

```bash
npm install @codespin/permiso-client
```

### Quick Example

```typescript
import { 
  createOrganization,
  createUser,
  hasPermission,
  PermisoConfig 
} from '@codespin/permiso-client';

const config: PermisoConfig = {
  endpoint: 'http://localhost:5001',
  apiKey: 'your-api-key' // optional
};

// Create an organization
const org = await createOrganization(config, {
  id: 'acme-corp',
  name: 'ACME Corporation'
});

// Check permissions
const canAccess = await hasPermission(config, {
  orgId: 'acme-corp',
  userId: 'john-doe',
  resourceId: '/api/users/*',
  action: 'read'
});
```

See the [permiso-client README](node/packages/permiso-client/README.md) for full documentation.

## Development

```bash
# Build all packages
./build.sh

# Run linting
./lint-all.sh

# Run tests
npm run test:integration:permiso  # Run all integration tests
npm run test:client               # Run all client tests
npm run test:integration:all      # Run both integration and client tests

# Run specific test suites
npm run test:grep -- "Organizations"        # Integration tests matching pattern
npm run test:client:grep -- "Permissions"   # Client tests matching pattern

# Clean build artifacts
./clean.sh
```

See [Architecture Documentation](docs/architecture.md) for project structure and design details.

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

### Quick Start with Docker

```bash
# Pull and run the official image
docker pull ghcr.io/codespin-ai/permiso:latest

# Run with environment variables
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=your-db-host \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=your-password \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

**Note**: Set `PERMISO_AUTO_MIGRATE=true` for automatic database setup on first run.

### Docker Compose

```bash
# Use the example configuration
cp docker-compose.example.yml docker-compose.yml
# Edit configuration, then:
docker-compose up -d
```

### Building and Deployment

```bash
# Build image
./scripts/docker-build.sh

# Test image
./scripts/docker-test.sh

# Push to registry
./scripts/docker-push.sh ghcr.io/codespin-ai/permiso latest
```

For production deployment examples (Kubernetes, etc.), see the full Docker section in the documentation.

## Documentation

- [API Documentation](docs/api.md) - Complete GraphQL API reference with examples
- [Architecture Overview](docs/architecture.md) - System design and architecture details
- [Database Configuration](docs/database.md) - Multi-database setup and configuration
- [Coding Standards](CODING-STANDARDS.md) - Development patterns and conventions

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
