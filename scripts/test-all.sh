#!/usr/bin/env bash
# -------------------------------------------------------------------
# test-all.sh – Run tests for all configured test databases
#
# Usage: ./scripts/test-all.sh
# -------------------------------------------------------------------
set -euo pipefail

TESTS_DIR="tests"

# Find all directories that have test files
echo "=== Running tests for all databases ==="

# Track if any test fails
FAILED=0

for db_dir in "$TESTS_DIR"/*; do
    if [ -d "$db_dir" ] && [ -n "$(find "$db_dir" -name '*.test.ts' -type f 2>/dev/null)" ]; then
        db_name=$(basename "$db_dir")
        echo ""
        echo ">>> Testing: $db_name"
        echo "-----------------------------------"
        
        # Run the tests for this database
        if npm run test:$db_name; then
            echo "✓ $db_name: Tests passed"
        else
            echo "✗ $db_name: Tests failed"
            FAILED=1
        fi
    fi
done

echo ""
if [ $FAILED -eq 0 ]; then
    echo "=== All tests passed! ==="
    exit 0
else
    echo "=== Some tests failed ==="
    exit 1
fi