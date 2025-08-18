# Deployment Guide

This guide covers various deployment options for Permiso.

## Docker Deployment

### Quick Start with Docker

Pull and run the official Docker image:

```bash
# Pull the latest image
docker pull ghcr.io/codespin-ai/permiso:latest

# Run with environment variables
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=your-db-host \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=your-password \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

**Note**: Set `PERMISO_AUTO_MIGRATE=true` for automatic database migrations on first run.

### Building Docker Images

Build your own Docker image:

```bash
# From project root
./docker-build.sh

# Or manually
docker build -t permiso:latest .
```

### Testing Docker Images

Before deploying, test your Docker image:

```bash
# Automated testing
./docker-test.sh                              # Test default image (permiso:latest)
./docker-test.sh ghcr.io/codespin-ai/permiso:latest  # Test specific image
./docker-test.sh permiso:latest 5001          # Test on specific port

# The test script will:
# - Create a temporary test database
# - Run the container with auto-migration
# - Execute comprehensive GraphQL tests
# - Clean up automatically
# - Return exit code 0 on success, 1 on failure
```

### Manual Docker Testing

For debugging or custom testing:

```bash
# Run with host networking (Linux)
docker run --rm -p 5001:5001 \
  --add-host=host.docker.internal:host-gateway \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e PERMISO_DB_PORT=5432 \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=postgres \
  permiso:latest

# On macOS/Windows, host.docker.internal is available by default
docker run --rm -p 5001:5001 \
  -e PERMISO_DB_HOST=host.docker.internal \
  -e PERMISO_DB_PORT=5432 \
  -e PERMISO_DB_NAME=permiso \
  -e PERMISO_DB_USER=postgres \
  -e PERMISO_DB_PASSWORD=postgres \
  permiso:latest
```

### Pushing to Registry

Push your image to a container registry:

```bash
# Push to GitHub Container Registry
./docker-push.sh latest ghcr.io/codespin-ai

# Or manually
docker tag permiso:latest ghcr.io/codespin-ai/permiso:latest
docker push ghcr.io/codespin-ai/permiso:latest
```

## Docker Compose Deployment

### Basic Setup

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: permiso
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  permiso:
    image: ghcr.io/codespin-ai/permiso:latest
    ports:
      - "5001:5001"
    environment:
      PERMISO_DB_HOST: postgres
      PERMISO_DB_PORT: 5432
      PERMISO_DB_NAME: permiso
      PERMISO_DB_USER: postgres
      PERMISO_DB_PASSWORD: postgres
      PERMISO_AUTO_MIGRATE: "true"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

### Production Docker Compose

For production, use environment files and proper secrets:

```yaml
version: "3.8"

services:
  permiso:
    image: ghcr.io/codespin-ai/permiso:${VERSION:-latest}
    ports:
      - "${PERMISO_PORT:-5001}:5001"
    env_file:
      - .env.production
    secrets:
      - db_password
      - api_key
    environment:
      PERMISO_DB_PASSWORD_FILE: /run/secrets/db_password
      PERMISO_API_KEY_FILE: /run/secrets/api_key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

secrets:
  db_password:
    external: true
  api_key:
    external: true
```

## Kubernetes Deployment

### Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: permiso
spec:
  replicas: 3
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
            - name: PERMISO_API_KEY
              valueFrom:
                secretKeyRef:
                  name: permiso-secrets
                  key: api-key
          livenessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: permiso-service
spec:
  selector:
    app: permiso
  ports:
    - port: 5001
      targetPort: 5001
  type: LoadBalancer
```

### Using Helm

Create a `values.yaml`:

```yaml
replicaCount: 3

image:
  repository: ghcr.io/codespin-ai/permiso
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 5001

ingress:
  enabled: true
  hosts:
    - host: permiso.example.com
      paths: ["/"]

database:
  host: postgres-service
  port: 5432
  name: permiso
  user: permiso

env:
  PERMISO_LOG_LEVEL: info
  PERMISO_API_KEY_ENABLED: "true"
```

## Traditional Server Deployment

### Prerequisites

- Node.js 22+
- PostgreSQL 12+
- PM2 or similar process manager

### Setup Steps

1. Clone and build:

```bash
git clone https://github.com/codespin-ai/permiso.git
cd permiso
npm install
./build.sh
```

2. Configure environment:

```bash
# Create production env file
cat > .env.production << EOF
PERMISO_DB_HOST=localhost
PERMISO_DB_PORT=5432
PERMISO_DB_NAME=permiso_prod
PERMISO_DB_USER=permiso_app
PERMISO_DB_PASSWORD=secure-password
PERMISO_SERVER_PORT=5001
PERMISO_LOG_LEVEL=info
PERMISO_API_KEY=your-secure-api-key
EOF
```

3. Run migrations:

```bash
source .env.production
cd node/packages/permiso-server
npm run migrate:latest
```

4. Start with PM2:

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "permiso",
    script: "./start.sh",
    env_production: {
      NODE_ENV: "production"
    },
    instances: "max",
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js --env production
```

## Load Balancing

### Nginx Configuration

```nginx
upstream permiso_backend {
    least_conn;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://permiso_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Check Endpoint

Permiso provides a `/health` endpoint for monitoring:

```bash
curl http://localhost:5001/health
```

### Recommended Monitoring

1. **Application Metrics**
   - Response time
   - Request rate
   - Error rate
   - Active connections

2. **Database Metrics**
   - Connection pool usage
   - Query performance
   - Slow queries

3. **System Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O

### Integration with Monitoring Tools

Example Prometheus configuration:

```yaml
scrape_configs:
  - job_name: "permiso"
    static_configs:
      - targets: ["localhost:5001"]
    metrics_path: "/metrics"
```

## Security Considerations

1. **Always use HTTPS** in production
2. **Enable API key authentication** for public endpoints
3. **Use secrets management** for sensitive configuration
4. **Regular security updates** for dependencies
5. **Network isolation** between application and database
6. **Rate limiting** to prevent abuse

## Troubleshooting Deployment

### Common Issues

1. **Database Connection Failed**
   - Check network connectivity
   - Verify credentials
   - Ensure database is running

2. **Port Already in Use**
   - Change `PERMISO_SERVER_PORT`
   - Check for conflicting services

3. **Migration Failed**
   - Check database permissions
   - Verify migration files exist
   - Review migration logs

### Debug Mode

Enable debug logging:

```bash
export PERMISO_LOG_LEVEL=debug
```

### Container Debugging

```bash
# Get container logs
docker logs <container-id>

# Execute commands in container
docker exec -it <container-id> /bin/sh

# Check environment
docker exec <container-id> env | grep PERMISO
```
