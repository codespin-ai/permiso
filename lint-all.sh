#!/usr/bin/env bash
# -------------------------------------------------------------------
# lint-all.sh – Run ESLint across all packages
# -------------------------------------------------------------------
set -euo pipefail

echo "Running linting across all packages..."
echo

# Track overall status
ALL_PASSED=true

# Function to run lint in a package
lint_package() {
  local pkg_path=$1
  local pkg_name=$(basename "$pkg_path")
  
  if [[ -f "$pkg_path/package.json" ]] && [[ -d "$pkg_path/src" ]]; then
    echo "Linting @codespin/$pkg_name..."
    
    if (cd "$pkg_path" && npm run lint 2>&1); then
      echo "✓ @codespin/$pkg_name lint passed"
    else
      echo "✗ @codespin/$pkg_name lint failed"
      ALL_PASSED=false
    fi
    echo
  fi
}

# Lint all packages
for pkg in node/packages/*; do
  if [[ -d "$pkg" ]]; then
    lint_package "$pkg"
  fi
done

# Summary
echo "================================"
if [[ "$ALL_PASSED" == "true" ]]; then
  echo "✓ All packages passed linting!"
  exit 0
else
  echo "✗ Some packages failed linting"
  exit 1
fi