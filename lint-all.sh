#!/usr/bin/env bash
# -------------------------------------------------------------------
# lint-all.sh – Run ESLint across all packages
# -------------------------------------------------------------------
set -euo pipefail

# Check for --fix flag
FIX_FLAG=""
LINT_COMMAND="lint"
if [[ "${1:-}" == "--fix" ]]; then
  FIX_FLAG="--fix"
  LINT_COMMAND="lint:fix"
  echo "Running linting with auto-fix across all packages..."
else
  echo "Running linting across all packages..."
fi
echo

# Track overall status
ALL_PASSED=true

# Function to run lint in a package
lint_package() {
  local pkg_path=$1
  local pkg_name=$(basename "$pkg_path")
  
  if [[ -f "$pkg_path/package.json" ]] && [[ -d "$pkg_path/src" ]]; then
    echo "Linting @codespin/$pkg_name..."
    
    # Try lint:fix first if --fix flag is set, otherwise use lint
    if [[ -n "$FIX_FLAG" ]]; then
      # Check if lint:fix script exists
      if node -e "process.exit(require('./$pkg_path/package.json').scripts?.['lint:fix'] ? 0 : 1)"; then
        if (cd "$pkg_path" && npm run lint:fix 2>&1); then
          echo "✓ @codespin/$pkg_name lint fixed"
        else
          echo "✗ @codespin/$pkg_name lint:fix failed"
          ALL_PASSED=false
        fi
      else
        # Fall back to lint with --fix flag
        if (cd "$pkg_path" && npm run lint -- --fix 2>&1); then
          echo "✓ @codespin/$pkg_name lint fixed"
        else
          echo "✗ @codespin/$pkg_name lint --fix failed"
          ALL_PASSED=false
        fi
      fi
    else
      if (cd "$pkg_path" && npm run lint 2>&1); then
        echo "✓ @codespin/$pkg_name lint passed"
      else
        echo "✗ @codespin/$pkg_name lint failed"
        ALL_PASSED=false
      fi
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
  if [[ -n "$FIX_FLAG" ]]; then
    echo "✓ All packages fixed successfully!"
  else
    echo "✓ All packages and tests passed linting!"
  fi
  exit 0
else
  if [[ -n "$FIX_FLAG" ]]; then
    echo "✗ Some packages failed to fix"
  else
    echo "✗ Some packages or tests failed linting"
  fi
  exit 1
fi