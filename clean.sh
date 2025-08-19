#!/usr/bin/env bash
# -------------------------------------------------------------------
# clean.sh – remove build artifacts and node_modules across the monorepo
# -------------------------------------------------------------------
set -euo pipefail

echo "=== Cleaning Permiso ==="

# remove dist folders in every workspace that has any
for pkg in node/packages/*; do
  [[ -d "$pkg" ]] || continue
  if [[ -d "$pkg/dist" ]]; then
    echo "Cleaning $pkg/dist…"
    rm -rf "$pkg/dist"
  fi
done

# remove root node_modules
if [[ -d "node_modules" ]]; then
  echo "Cleaning root node_modules…"
  rm -rf node_modules
fi

# remove node_modules from all packages
for pkg in node/packages/*; do
  [[ -d "$pkg" ]] || continue
  if [[ -d "$pkg/node_modules" ]]; then
    echo "Cleaning $pkg/node_modules…"
    rm -rf "$pkg/node_modules"
  fi
done

echo "=== Clean completed successfully ==="