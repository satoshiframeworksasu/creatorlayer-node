#!/usr/bin/env bash
set -euo pipefail

# Build and publish to npm
npm ci
npm run build
npm publish

echo "Published creatorlayer SDK to npm."
echo "Version: $(node -p "require('./package.json').version")"
