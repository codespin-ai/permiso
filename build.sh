#!/usr/bin/env bash
# -------------------------------------------------------------------
# build.sh – monorepo-aware build helper for Permiso
#
# Flags:
#   --install   Force npm install in every package even if node_modules exists
#   --migrate   Run DB migrations after build (delegates to root npm script)
#   --seed      Run DB seeders after build (delegates to root npm script)
# -------------------------------------------------------------------
set -euo pipefail

echo "=== Building Permiso ==="

# Define the build order
PACKAGES=(
  "permiso-core"
  "permiso-logger"
  "permiso-db"
  "permiso-rbac"
)

# 1 ▸ clean first
./clean.sh

# 2 ▸ install root deps (once)
if [[ ! -d node_modules || "$*" == *--install* ]]; then
  echo "Installing root dependencies…"
  npm install
fi

# 3 ▸ loop through every package in build order
for pkg_name in "${PACKAGES[@]}"; do
  pkg="node/packages/$pkg_name"
  if [[ ! -d "$pkg" ]]; then
    echo "Package $pkg not found, skipping."
    continue
  fi
  if [[ ! -d "$pkg/node_modules" || "$*" == *--install* ]]; then
    echo "Installing deps in $pkg…"
    (cd "$pkg" && npm install)
  fi
done

# 4 ▸ build each package that defines a build script, in order
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

# 5 ▸ optional migrations / seeds via root scripts
if [[ "$*" == *--migrate* ]]; then
  echo "Running database migrations…"
  npm run migrate:latest
fi

if [[ "$*" == *--seed* ]]; then
  echo "Running database seeds…"
  npm run seed:run
fi

echo "=== Build completed successfully ==="
echo "To start the application, run: ./start.sh"