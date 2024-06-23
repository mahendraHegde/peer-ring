#!/bin/bash
rm -rf node_modules
rm -rf registry-k3d
# Find and delete all node_modules directories
find . -type d -name "node_modules" -prune -exec rm -rf {} \;

# Find and delete all dist directories
find . -type d -name "dist" -prune -exec rm -rf {} \;

echo "All node_modules and dist directories have been deleted."
