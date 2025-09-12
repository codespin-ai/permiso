#!/usr/bin/env bash
# -------------------------------------------------------------------
# format-all.sh – run prettier across all files
# -------------------------------------------------------------------
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/.."

# Check for --check flag
CHECK_FLAG=""
if [[ "${1:-}" == "--check" ]]; then
  CHECK_FLAG="--check"
  echo "Checking formatting across all files..."
else
  echo "Formatting all files with prettier..."
fi

# Run prettier
if [[ -n "$CHECK_FLAG" ]]; then
  npx prettier --check "**/*.{js,ts,tsx,json,md,yml,yaml}" --ignore-path .prettierignore
else
  npx prettier --write "**/*.{js,ts,tsx,json,md,yml,yaml}" --ignore-path .prettierignore
fi

if [ $? -eq 0 ]; then
  if [[ -n "$CHECK_FLAG" ]]; then
    echo "✓ All files are properly formatted!"
  else
    echo "✓ All files formatted successfully!"
  fi
  exit 0
else
  if [[ -n "$CHECK_FLAG" ]]; then
    echo "✗ Some files need formatting"
  else
    echo "✗ Formatting failed"
  fi
  exit 1
fi