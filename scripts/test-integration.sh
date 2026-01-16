#!/usr/bin/env bash
# -------------------------------------------------------------------
# test-integration.sh – Run integration tests for Permiso
#
# Usage:
#   ./scripts/test-integration.sh local        # Run tests with local SQLite
#   ./scripts/test-integration.sh local --pg   # Run tests with local PostgreSQL
#   ./scripts/test-integration.sh compose      # Run tests with Docker Compose SQLite
#   ./scripts/test-integration.sh compose --pg # Run tests with Docker Compose PostgreSQL
# -------------------------------------------------------------------
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() { echo -e "${BLUE}$1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}! $1${NC}"; }

# Show usage
usage() {
    echo "Usage: $0 <mode> [--pg]"
    echo ""
    echo "Modes:"
    echo "  local    - Run tests with local database"
    echo "  compose  - Run tests with Docker Compose"
    echo ""
    echo "Options:"
    echo "  --pg     - Use PostgreSQL instead of SQLite (default: SQLite)"
    echo ""
    echo "Examples:"
    echo "  $0 local        # Local SQLite tests"
    echo "  $0 local --pg   # Local PostgreSQL tests"
    echo "  $0 compose      # Docker Compose SQLite tests"
    echo "  $0 compose --pg # Docker Compose PostgreSQL tests"
    exit 1
}

# Parse arguments
if [ $# -lt 1 ]; then
    usage
fi

MODE=$1
USE_POSTGRES=false

if [ $# -ge 2 ] && [ "$2" = "--pg" ]; then
    USE_POSTGRES=true
fi

# Database type
if [ "$USE_POSTGRES" = true ]; then
    DB_TYPE="postgres"
    print_info "Database: PostgreSQL"
else
    DB_TYPE="sqlite"
    print_info "Database: SQLite"
fi

print_info "Mode: $MODE"
echo ""

# Setup environment based on mode and database type
setup_env() {
    if [ "$DB_TYPE" = "sqlite" ]; then
        export PERMISO_DB_TYPE=sqlite
        export PERMISO_SQLITE_PATH="./data/test-permiso.db"

        # Create data directory if needed
        mkdir -p ./data

        # Remove existing test database
        rm -f "$PERMISO_SQLITE_PATH"

        print_info "Running SQLite migrations..."
        npm run migrate:permiso:sqlite:latest
    else
        export PERMISO_DB_TYPE=postgres
        export PERMISO_DB_HOST="${PERMISO_DB_HOST:-localhost}"
        export PERMISO_DB_PORT="${PERMISO_DB_PORT:-5432}"
        export PERMISO_DB_NAME="${PERMISO_DB_NAME:-permiso_test}"
        export PERMISO_DB_USER="${PERMISO_DB_USER:-postgres}"
        export PERMISO_DB_PASSWORD="${PERMISO_DB_PASSWORD:-postgres}"

        print_info "Running PostgreSQL migrations..."
        npm run migrate:permiso:latest
    fi

    export PERMISO_SERVER_HOST=localhost
    export PERMISO_SERVER_PORT=5099
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."

    if [ "$MODE" = "compose" ]; then
        docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
    fi

    if [ "$DB_TYPE" = "sqlite" ] && [ -f "./data/test-permiso.db" ]; then
        rm -f "./data/test-permiso.db"
    fi
}

trap cleanup EXIT

# Run tests based on mode
case "$MODE" in
    local)
        print_info "=== Running Local Integration Tests ==="
        echo ""

        setup_env

        # Run tests
        print_info "Running tests..."
        npm test

        print_success "Local tests completed!"
        ;;

    compose)
        print_info "=== Running Docker Compose Integration Tests ==="
        echo ""

        # Check if docker compose file exists
        if [ ! -f "docker-compose.test.yml" ]; then
            print_warning "docker-compose.test.yml not found, using default configuration"

            # Create a temporary docker-compose file
            if [ "$DB_TYPE" = "sqlite" ]; then
                cat > docker-compose.test.yml << 'EOF'
services:
  permiso:
    build: .
    ports:
      - "5099:5001"
    environment:
      - PERMISO_DB_TYPE=sqlite
      - PERMISO_SQLITE_PATH=/data/permiso.db
      - PERMISO_SERVER_HOST=0.0.0.0
      - PERMISO_SERVER_PORT=5001
      - PERMISO_AUTO_MIGRATE=true
    volumes:
      - permiso-data:/data
volumes:
  permiso-data:
EOF
            else
                cat > docker-compose.test.yml << 'EOF'
services:
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=permiso_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  permiso:
    build: .
    ports:
      - "5099:5001"
    environment:
      - PERMISO_DB_TYPE=postgres
      - PERMISO_DB_HOST=postgres
      - PERMISO_DB_PORT=5432
      - PERMISO_DB_NAME=permiso_test
      - PERMISO_DB_USER=postgres
      - PERMISO_DB_PASSWORD=postgres
      - PERMISO_SERVER_HOST=0.0.0.0
      - PERMISO_SERVER_PORT=5001
      - PERMISO_AUTO_MIGRATE=true
    depends_on:
      postgres:
        condition: service_healthy
EOF
            fi

            CLEANUP_COMPOSE_FILE=true
        fi

        # Start services
        print_info "Starting Docker Compose services..."
        docker compose -f docker-compose.test.yml up -d --build

        # Wait for service to be ready
        print_info "Waiting for Permiso service to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:5099/health | grep -q "healthy"; then
                print_success "Permiso service is ready"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "Service failed to start"
                docker compose -f docker-compose.test.yml logs
                exit 1
            fi
            echo -n "."
            sleep 2
        done
        echo ""

        # Run tests against the docker compose service
        export PERMISO_TEST_URL="http://localhost:5099"
        npm test

        # Cleanup temporary compose file
        if [ "${CLEANUP_COMPOSE_FILE:-false}" = true ]; then
            rm -f docker-compose.test.yml
        fi

        print_success "Docker Compose tests completed!"
        ;;

    *)
        print_error "Unknown mode: $MODE"
        usage
        ;;
esac

echo ""
print_success "All tests completed successfully!"
