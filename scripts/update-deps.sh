#!/bin/bash

# Usage: ./update-deps.sh <parent_dir>
# Updates all npm dependencies to latest versions for all packages under parent_dir

set -e

# Check if parent directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <parent_dir>"
    echo "Example: $0 node/packages"
    exit 1
fi

PARENT_DIR="$1"

# Check if parent directory exists
if [ ! -d "$PARENT_DIR" ]; then
    echo "Error: Directory '$PARENT_DIR' does not exist"
    exit 1
fi

echo "Updating dependencies for all packages under $PARENT_DIR..."
echo

# Find all directories containing package.json
find "$PARENT_DIR" -maxdepth 2 -name "package.json" -type f | while read -r package_file; do
    package_dir=$(dirname "$package_file")
    package_name=$(basename "$package_dir")
    
    echo "=================================================="
    echo "Processing: $package_name"
    echo "Path: $package_dir"
    echo "=================================================="
    
    cd "$package_dir"
    
    # Check if package.json has dependencies
    if grep -q '"dependencies"' package.json; then
        echo "Updating production dependencies..."
        
        # Extract dependency names and update them
        deps=$(node -e "
            const pkg = require('./package.json');
            const deps = Object.keys(pkg.dependencies || {})
                .filter(d => !d.startsWith('file:'))  // Skip file: dependencies
                .join(' ');
            console.log(deps);
        ")
        
        if [ -n "$deps" ]; then
            echo "Dependencies to update: $deps"
            npm install --legacy-peer-deps $deps@latest || echo "Warning: Some dependencies failed to update"
        else
            echo "No external dependencies to update"
        fi
    else
        echo "No dependencies section found"
    fi
    
    echo
    
    # Check if package.json has devDependencies
    if grep -q '"devDependencies"' package.json; then
        echo "Updating dev dependencies..."
        
        # Extract dev dependency names and update them
        devDeps=$(node -e "
            const pkg = require('./package.json');
            const deps = Object.keys(pkg.devDependencies || {}).join(' ');
            console.log(deps);
        ")
        
        if [ -n "$devDeps" ]; then
            echo "Dev dependencies to update: $devDeps"
            npm install --legacy-peer-deps -D $devDeps@latest || echo "Warning: Some dev dependencies failed to update"
        else
            echo "No dev dependencies to update"
        fi
    else
        echo "No devDependencies section found"
    fi
    
    echo
    cd - > /dev/null
done

echo "=================================================="
echo "All packages processed!"
echo "=================================================="
echo
echo "Note: Some updates may have failed if:"
echo "  - The package doesn't exist on npm"
echo "  - There are version conflicts"
echo "  - Network issues occurred"
echo
echo "Run 'npm outdated' in each package to verify updates."