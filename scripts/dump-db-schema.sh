#!/bin/bash

# Script to dump the Permiso database schema
# This will save the complete schema including tables, indexes, constraints, etc.

# Set script options
set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root directory (parent of scripts)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Output file (relative to project root)
OUTPUT_FILE="$PROJECT_ROOT/docs/permiso-schema.sql"

# Load environment variables from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Database connection parameters
# For development environment, use postgres as password
DB_HOST="${PERMISO_DB_HOST:-localhost}"
DB_PORT="${PERMISO_DB_PORT:-5432}"
DB_NAME="${PERMISO_DB_NAME:-permiso}"
DB_USER="${PERMISO_DB_USER:-postgres}"
# Override password for local development
DB_PASSWORD="postgres"

echo -e "${GREEN}Dumping database schema from $DB_NAME...${NC}"

# Create docs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/docs"

# Set PGPASSWORD to avoid password prompt
export PGPASSWORD="$DB_PASSWORD"

# Dump schema only (no data) with all objects
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data \
    --if-exists \
    --clean \
    --create \
    --encoding=UTF8 \
    --verbose \
    -f "$OUTPUT_FILE" 2>&1 | while read line; do
        echo -e "${GREEN}[pg_dump]${NC} $line"
    done

# Check if dump was successful
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ Schema successfully dumped to $OUTPUT_FILE${NC}"
    echo -e "${GREEN}  File size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')${NC}"
    echo -e "${GREEN}  Tables found: $(grep -c "CREATE TABLE" "$OUTPUT_FILE" || echo 0)${NC}"
    echo -e "${GREEN}  Indexes found: $(grep -c "CREATE.*INDEX" "$OUTPUT_FILE" || echo 0)${NC}"
else
    echo -e "${RED}✗ Failed to dump schema${NC}"
    exit 1
fi

# Unset PGPASSWORD
unset PGPASSWORD