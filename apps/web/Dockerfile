# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Accept build argument for API URL
ARG VITE_API_URL=https://api.fittrackr.me

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app with the provided API URL
RUN echo "Building with VITE_API_URL=${VITE_API_URL}" && \
    VITE_API_URL=${VITE_API_URL} pnpm --filter @fittrack/web build && \
    echo "Build completed. Checking dist folder:" && \
    ls -la /app/apps/web/dist || echo "No dist folder found!"

# Production stage - using nginx to serve static files
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Verify files were copied
RUN echo "Files in nginx html directory:" && \
    ls -la /usr/share/nginx/html

# Add healthcheck - check if index.html is accessible
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/index.html || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
