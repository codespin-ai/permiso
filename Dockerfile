# Build stage
FROM node:24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY node/package*.json ./node/
COPY node/packages/permiso-core/package*.json ./node/packages/permiso-core/
COPY node/packages/permiso-logger/package*.json ./node/packages/permiso-logger/
COPY node/packages/permiso-db/package*.json ./node/packages/permiso-db/
COPY node/packages/permiso-server/package*.json ./node/packages/permiso-server/

# Copy build scripts
COPY build.sh clean.sh format-all.sh ./

# Copy source code
COPY tsconfig.base.json ./
COPY knexfile.js ./
COPY node ./node
COPY database ./database

# Install dependencies and build
RUN chmod +x build.sh clean.sh format-all.sh && \
    ./build.sh --install

# Runtime stage - Ubuntu minimal
FROM ubuntu:24.04 AS runtime

# Install Node.js 24 and minimal dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -r -u 1001 -g root -s /bin/bash permiso && \
    mkdir -p /home/permiso && \
    chown -R permiso:root /home/permiso

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=permiso:root /app/node ./node
COPY --from=builder --chown=permiso:root /app/database ./database
COPY --from=builder --chown=permiso:root /app/package*.json ./
COPY --from=builder --chown=permiso:root /app/node_modules ./node_modules
COPY --from=builder --chown=permiso:root /app/knexfile.js ./

# Copy start script and entrypoint
COPY --chown=permiso:root start.sh docker-entrypoint.sh ./
RUN chmod +x start.sh docker-entrypoint.sh

# Switch to non-root user
USER permiso

# Expose GraphQL server port
EXPOSE 5001

# Set default environment variables (non-sensitive only)
ENV NODE_ENV=production \
    PERMISO_SERVER_PORT=5001 \
    LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PERMISO_SERVER_PORT || 5001) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Use entrypoint for automatic setup
ENTRYPOINT ["./docker-entrypoint.sh"]