#!/usr/bin/env bash
# -------------------------------------------------------------------
# clean.sh – remove build artifacts across the monorepo
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

echo "=== Clean completed successfully ==="