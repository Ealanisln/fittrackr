#!/bin/sh
set -e

# Check if Prisma client needs to be generated
# Only regenerate if the client doesn't exist or schema has changed
PRISMA_CLIENT_DIR="/app/node_modules/.prisma/client"

if [ ! -d "$PRISMA_CLIENT_DIR" ] || [ ! -f "$PRISMA_CLIENT_DIR/index.js" ]; then
  echo "Generating Prisma Client (first run)..."
  cd /app/packages/database
  pnpm prisma generate
else
  echo "Prisma Client already exists, skipping generation..."
fi

echo "Starting API server..."
cd /app/apps/api

# Use exec to replace this shell process with node
# This ensures signals (SIGTERM, SIGINT) are properly forwarded to the node process
exec pnpm start:prod
