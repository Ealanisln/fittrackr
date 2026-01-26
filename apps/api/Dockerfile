# Production stage - we'll run with tsx instead of compiling
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages with source code
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies (including dev dependencies for tsx)
RUN pnpm install --frozen-lockfile

# Copy start script
COPY apps/api/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Expose port
EXPOSE 3001

# Health check - use /health/ready for proper readiness verification
# start-period=60s: allows time for Prisma generation + DB connection
# timeout=5s: enough time for DB query under load
# retries=5: tolerate temporary network issues
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3001/health/ready', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start the application with the start script (runs as root to generate Prisma client)
CMD ["/app/start.sh"]
