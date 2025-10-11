#!/usr/bin/env bash
# -------------------------------------------------------------------
# build.sh – monorepo-aware build helper for Permiso
#
# Flags:
#   --install    Force npm install in every package even if node_modules exists
#   --migrate    Run DB migrations after build for all databases
#   --seed       Run DB seeders after build for all databases
#   --no-format  Skip prettier formatting (reduces output for debugging)
# -------------------------------------------------------------------
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "=== Building Permiso ==="

# Define the build order
PACKAGES=(
  "permiso-core"
  "permiso-logger"
  "permiso-db"
  "permiso-test-utils"
  "permiso-server"
  "permiso-client"
  "permiso-integration-tests"
)

# 1 ▸ clean first
./scripts/clean.sh

# 2 ▸ install dependencies
if [[ "$*" == *--install* ]]; then
  ./scripts/install-deps.sh --force
else
  ./scripts/install-deps.sh
fi

# 3 ▸ build each package that defines a build script, in order
for pkg_name in "${PACKAGES[@]}"; do
  pkg="node/packages/$pkg_name"
  if [[ ! -f "$pkg/package.json" ]]; then
    continue
  fi
  # Use node to check for build script instead of jq
  if node -e "process.exit(require('./$pkg/package.json').scripts?.build ? 0 : 1)"; then
    echo "Building $pkg…"
    (cd "$pkg" && npm run build)
  else
    echo "Skipping build for $pkg (no build script)"
  fi
done

# 4 ▸ optional migrations / seeds via root scripts
if [[ "$*" == *--migrate* ]]; then
  echo "Running database migrations for all databases…"
  npm run migrate:all
fi

if [[ "$*" == *--seed* ]]; then
  echo "Running database seeds for all databases…"
  npm run seed:all
fi

# Skip formatting if --no-format flag is provided
if [[ "$*" != *--no-format* ]]; then
  ./scripts/format-all.sh
else
  echo "Skipping formatting (--no-format flag provided)"
fi

echo "=== Build completed successfully ==="
echo "To start the application, run: ./scripts/start.sh"
