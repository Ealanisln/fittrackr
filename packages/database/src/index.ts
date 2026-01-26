import { PrismaClient } from '@prisma/client';

// CUSTOM_DATABASE_URL takes precedence over DATABASE_URL
// This is needed for Coolify deployments where DATABASE_URL hostname conflicts
if (process.env.CUSTOM_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.CUSTOM_DATABASE_URL;
}

// Add connection pool parameters to DATABASE_URL if not already present
// These prevent connection exhaustion and improve timeout handling
function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) return baseUrl;

  const url = new URL(baseUrl);
  const params = url.searchParams;

  // Set default connection pool parameters if not already specified
  if (!params.has('connection_limit')) {
    params.set('connection_limit', '10');
  }
  if (!params.has('connect_timeout')) {
    params.set('connect_timeout', '10');
  }
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', '10');
  }

  return url.toString();
}

// Apply optimized URL
const optimizedUrl = getOptimizedDatabaseUrl();
if (optimizedUrl) {
  process.env.DATABASE_URL = optimizedUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
