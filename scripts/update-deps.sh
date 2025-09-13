#!/usr/bin/env bash
# -------------------------------------------------------------------
# update-deps.sh – Update all dependencies to absolute latest versions
# -------------------------------------------------------------------
set -euo pipefail

update_package_deps() {
    local package_path="$1"
    local package_name=$(basename "$package_path")
    local original_dir=$(pwd)

    if [[ ! -f "$package_path/package.json" ]]; then
        return
    fi

    echo "Updating $package_name to latest versions..."

    # Use subshell to avoid changing directory context
    (
        cd "$package_path"

        # Get list of production dependencies (excluding local/workspace packages)
        local deps=$(node -e "
            const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
            const deps = Object.keys(pkg.dependencies || {}).filter(dep => {
                const version = pkg.dependencies[dep];
                // Skip local dependencies (file:, link:, workspace:, @codespin/ packages)
                return !version.startsWith('file:') &&
                       !version.startsWith('link:') &&
                       !version.startsWith('workspace:') &&
                       !dep.startsWith('@codespin/') &&
                       !dep.includes('permiso-');
            });
            if (deps.length > 0) console.log(deps.join(' '));
        ")

        # Get list of dev dependencies (excluding local/workspace packages)
        local devdeps=$(node -e "
            const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
            const deps = Object.keys(pkg.devDependencies || {}).filter(dep => {
                const version = pkg.devDependencies[dep];
                // Skip local dependencies (file:, link:, workspace:, @codespin/ packages)
                return !version.startsWith('file:') &&
                       !version.startsWith('link:') &&
                       !version.startsWith('workspace:') &&
                       !dep.startsWith('@codespin/') &&
                       !dep.includes('permiso-');
            });
            if (deps.length > 0) console.log(deps.join(' '));
        ")

        # Update production dependencies to latest
        if [[ -n "$deps" ]]; then
            echo "  - Updating production dependencies..."
            npm install --save --save-exact $deps@latest
        fi

        # Update dev dependencies to latest
        if [[ -n "$devdeps" ]]; then
            echo "  - Updating dev dependencies..."
            npm install --save-dev --save-exact $devdeps@latest
        fi
    )

    echo "  ✓ $package_name updated"
}

echo "=== Updating all dependencies to absolute latest versions ==="
echo "This will update ALL packages to their newest available versions with exact versions."
echo ""

# Update root package
echo "Updating root package..."
update_package_deps "."

# Update each package in node/packages/
for pkg in node/packages/*; do
    if [[ -d "$pkg" ]]; then
        echo ""
        update_package_deps "$pkg"
    fi
done

echo ""
echo "=== All dependencies updated to latest exact versions ==="
echo "⚠️  IMPORTANT: Run tests to ensure compatibility: npm test"
echo "⚠️  Review changes carefully before committing"