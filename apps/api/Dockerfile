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

# Generate Prisma Client
RUN pnpm --filter @fittrack/database db:generate

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Use non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with tsx
CMD ["pnpm", "--filter", "@fittrack/api", "start:prod"]
