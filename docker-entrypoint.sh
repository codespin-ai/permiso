#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Permiso RBAC Server...${NC}"

# Function to wait for database
wait_for_db() {
    echo -e "${YELLOW}Waiting for database connection...${NC}"
    until cd /app/node/packages/permiso-server && node -e "
        const pg = require('pg');
        const client = new pg.Client({
            host: process.env.PERMISO_DB_HOST || 'localhost',
            port: process.env.PERMISO_DB_PORT || 5432,
            database: process.env.PERMISO_DB_NAME || 'permiso',
            user: process.env.PERMISO_DB_USER || 'postgres',
            password: process.env.PERMISO_DB_PASSWORD || 'postgres'
        });
        client.connect()
            .then(() => { client.end(); process.exit(0); })
            .catch(() => process.exit(1));
    " 2>/dev/null; do
        echo -e "${YELLOW}Database not ready, retrying in 2 seconds...${NC}"
        sleep 2
    done
    echo -e "${GREEN}Database connection established!${NC}"
}

# Function to check if migrations are needed
check_migrations() {
    cd /app/node/packages/permiso-server
    
    # Check if knex_migrations table exists
    node -e "
        const knex = require('knex');
        const db = knex({
            client: 'pg',
            connection: {
                host: process.env.PERMISO_DB_HOST || 'localhost',
                port: process.env.PERMISO_DB_PORT || 5432,
                database: process.env.PERMISO_DB_NAME || 'permiso',
                user: process.env.PERMISO_DB_USER || 'postgres',
                password: process.env.PERMISO_DB_PASSWORD || 'postgres'
            }
        });
        
        db.schema.hasTable('knex_migrations')
            .then(exists => {
                process.exit(exists ? 0 : 1);
            })
            .finally(() => db.destroy());
    " 2>/dev/null
    
    return $?
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    cd /app/node/packages/permiso-server
    
    if npm run migrate:latest; then
        echo -e "${GREEN}Migrations completed successfully!${NC}"
        return 0
    else
        echo -e "${RED}Migration failed!${NC}"
        return 1
    fi
}

# Main logic
cd /app

# Wait for database to be available
wait_for_db

# Check if auto-migration is enabled
if [ "${PERMISO_AUTO_MIGRATE}" = "true" ]; then
    echo -e "${YELLOW}Auto-migration is enabled${NC}"
    
    # Check if migrations are needed
    if ! check_migrations; then
        echo -e "${YELLOW}Database needs initialization${NC}"
        if ! run_migrations; then
            echo -e "${RED}Failed to run migrations. Exiting.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}Database already initialized${NC}"
        
        # Check for pending migrations
        cd /app/node/packages/permiso-server
        PENDING=$(npm run migrate:status 2>&1 | grep -c "pending" || true)
        if [ "$PENDING" -gt 0 ]; then
            echo -e "${YELLOW}Found pending migrations${NC}"
            if ! run_migrations; then
                echo -e "${RED}Failed to run pending migrations. Exiting.${NC}"
                exit 1
            fi
        else
            echo -e "${GREEN}No pending migrations${NC}"
        fi
    fi
else
    echo -e "${YELLOW}Auto-migration is disabled. Set PERMISO_AUTO_MIGRATE=true to enable.${NC}"
    
    # Just check if database is initialized
    if ! check_migrations; then
        echo -e "${RED}WARNING: Database is not initialized!${NC}"
        echo -e "${RED}Run migrations manually or set PERMISO_AUTO_MIGRATE=true${NC}"
    fi
fi

# Start the application
echo -e "${GREEN}Starting Permiso server on port ${PERMISO_SERVER_PORT:-5001}...${NC}"
cd /app
exec ./start.sh