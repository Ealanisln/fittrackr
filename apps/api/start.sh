#!/bin/sh
set -e

echo "Generating Prisma Client with runtime DATABASE_URL..."
cd /app/packages/database
pnpm prisma generate

echo "Starting API server..."
cd /app/apps/api
pnpm start:prod
