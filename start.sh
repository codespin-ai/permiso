#!/bin/bash

# Start script for Permiso GraphQL server
cd "$(dirname "$0")"

# Start the GraphQL server
cd node/packages/permiso-rbac
node dist/bin/server.js