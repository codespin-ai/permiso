#!/bin/bash

# Start script for Permiso GraphQL server
cd "$(dirname "$0")"

# Start the GraphQL server
cd node/packages/permiso-server
node dist/bin/server.js