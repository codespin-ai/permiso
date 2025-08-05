# Permiso

A comprehensive Role-Based Access Control (RBAC) system with GraphQL API, built with TypeScript.

## Features

- 🏢 **Multi-tenant Organizations** - Isolated authorization contexts
- 👥 **Users & Roles** - Flexible user management with role assignments
- 🔐 **Fine-grained Permissions** - Resource-based access control with path-like IDs
- 🏷️ **Properties & Filtering** - Custom metadata with query capabilities
- 🚀 **GraphQL API** - Modern, type-safe API with full CRUD operations
- 📦 **TypeScript Client** - Official client library with type-safe functions, no GraphQL knowledge required
- 📊 **Effective Permissions** - Combined user and role permission calculation
- 🐳 **Docker Ready** - Official Docker images for easy deployment

## Quick Start

### Option 1: Docker (Recommended)

The fastest way to get started is using our official Docker image:

```bash
# Pull and run with auto-migration
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=postgres \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

The GraphQL API will be available at `http://localhost:5001/graphql`.

See [Deployment Guide](docs/deployment.md) for production configuration and Docker Compose examples.

### Option 2: Local Installation

#### Prerequisites

- Node.js 22+
- PostgreSQL 12+
- npm or yarn

#### Installation

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

- **Organizations**: Top-level tenant isolation
- **Users & Roles**: Flexible user management with role assignments
- **Resources & Permissions**: Fine-grained access control with path-like resource IDs
- **Properties**: Custom metadata with JSON support

See [Architecture Documentation](docs/architecture.md) for detailed information.

## API Access

### TypeScript Client (Recommended)

For TypeScript/JavaScript applications, use our official client library for the best developer experience:

```bash
npm install @codespin/permiso-client
```

**Note**: The client library is published to npm and can be used without building Permiso from source. You just need a running Permiso server (either via Docker or local installation).

```typescript
import { createOrganization, createUser, hasPermission } from '@codespin/permiso-client';

const config = {
  endpoint: 'http://localhost:5001',
  apiKey: 'your-api-key' // optional
};

// Create an organization
const org = await createOrganization(config, {
  id: 'acme-corp',
  name: 'ACME Corporation'
});

// Check permissions
const canRead = await hasPermission(config, {
  orgId: 'acme-corp',
  userId: 'john-doe',
  resourceId: '/api/users/*',
  action: 'read'
});
```

See the [TypeScript Client Documentation](node/packages/permiso-client/README.md) for complete usage guide, examples, and API reference.

### GraphQL API

You can also use the GraphQL API directly. For complete API documentation, see [API Documentation](docs/api.md).

```bash
# Create an organization
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createOrganization(input: { id: \"acme-corp\", name: \"ACME Corporation\" }) { id name } }"}'
```


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


## Configuration

See [Configuration Documentation](docs/configuration.md) for all environment variables and configuration options.

## Deployment

See [Deployment Guide](docs/deployment.md) for detailed instructions on:
- Docker deployment
- Docker Compose setup
- Kubernetes deployment
- Traditional server deployment
- Production best practices

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
