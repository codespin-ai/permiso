# Deployment

## Docker

### Quick Start

```bash
docker run -p 5001:5001 \
  -e PERMISO_DB_HOST=your-db-host \
  -e PERMISO_DB_NAME=permiso \
  -e RLS_DB_USER=rls_db_user \
  -e RLS_DB_USER_PASSWORD=your_rls_password \
  -e UNRESTRICTED_DB_USER=unrestricted_db_user \
  -e UNRESTRICTED_DB_USER_PASSWORD=your_admin_password \
  -e PERMISO_AUTO_MIGRATE=true \
  ghcr.io/codespin-ai/permiso:latest
```

### Docker Compose

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: permiso
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  permiso:
    image: ghcr.io/codespin-ai/permiso:latest
    ports:
      - "5001:5001"
    environment:
      PERMISO_DB_HOST: postgres
      PERMISO_DB_NAME: permiso
      RLS_DB_USER: rls_db_user
      RLS_DB_USER_PASSWORD: changeme_rls
      UNRESTRICTED_DB_USER: unrestricted_db_user
      UNRESTRICTED_DB_USER_PASSWORD: changeme_admin
      PERMISO_AUTO_MIGRATE: true
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Create `init.sql`:

```sql
CREATE USER rls_db_user WITH PASSWORD 'changeme_rls';
CREATE USER unrestricted_db_user WITH PASSWORD 'changeme_admin';
GRANT ALL PRIVILEGES ON DATABASE permiso TO unrestricted_db_user;
ALTER USER unrestricted_db_user BYPASSRLS;
```

## Kubernetes

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
            - name: RLS_DB_USER_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: permiso-secrets
                  key: rls-password
            - name: UNRESTRICTED_DB_USER_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: permiso-secrets
                  key: admin-password
---
apiVersion: v1
kind: Service
metadata:
  name: permiso-service
spec:
  selector:
    app: permiso
  ports:
    - port: 80
      targetPort: 5001
  type: LoadBalancer
```

## Production Checklist

- [ ] Set up database users with appropriate permissions
- [ ] Configure connection pooling (default: 20 connections per user)
- [ ] Enable API key authentication (`PERMISO_API_KEY`)
- [ ] Set up monitoring and health checks
- [ ] Configure backup strategy for PostgreSQL
- [ ] Use secrets management for passwords
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting at proxy/load balancer
- [ ] Enable SSL/TLS termination

## Health Check

```bash
curl http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

## Building Docker Image

```bash
# Build locally
./docker-build.sh

# Push to registry
./docker-push.sh latest ghcr.io/codespin-ai

# Test image
./docker-test.sh
```
