#!/usr/bin/env bash
# -------------------------------------------------------------------
# db-all.sh – Run database commands for all configured databases
#
# Usage: ./scripts/db-all.sh <command>
# Example: ./scripts/db-all.sh migrate:latest
# -------------------------------------------------------------------
set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <command>"
    echo "Example: $0 migrate:latest"
    exit 1
fi

COMMAND=$1
DATABASE_DIR="database"

# Find all directories that have a knexfile.js
echo "=== Running $COMMAND for all databases ==="

for db_dir in "$DATABASE_DIR"/*; do
    if [ -d "$db_dir" ] && [ -f "$db_dir/knexfile.js" ]; then
        db_name=$(basename "$db_dir")
        echo ""
        echo ">>> Database: $db_name"
        echo "-----------------------------------"
        
        # Run the knex command with the specific knexfile
        if npx knex "$COMMAND" --knexfile "$db_dir/knexfile.js"; then
            echo "✓ $db_name: $COMMAND completed successfully"
        else
            echo "✗ $db_name: $COMMAND failed"
            # Continue with other databases even if one fails
        fi
    fi
done

echo ""
echo "=== All database operations completed ==="