#!/bin/bash
# Release script for claude-chat
# Usage: bash scripts/release.sh [--first-release]

set -e

FIRST_RELEASE=false
if [ "$1" = "--first-release" ]; then
  FIRST_RELEASE=true
fi

echo "=========================================="
echo "  Claude Chat Release Script"
echo "=========================================="

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: There are uncommitted changes. Please commit or stash them first."
  git status
  exit 1
fi

# Run the release
if [ "$FIRST_RELEASE" = true ]; then
  echo "Running first release..."
  npm run release -- --first-release
else
  echo "Running standard release..."
  npm run release
fi

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LATEST_TAG" ]; then
  echo ""
  echo "=========================================="
  echo "  Release $LATEST_TAG completed!"
  echo "=========================================="
  echo ""
  echo "Don't forget to push the tag:"
  echo "  git push origin $LATEST_TAG"
fi
