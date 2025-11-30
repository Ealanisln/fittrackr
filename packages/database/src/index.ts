import { PrismaClient } from '@prisma/client';

// CUSTOM_DATABASE_URL takes precedence over DATABASE_URL
// This is needed for Coolify deployments where DATABASE_URL hostname conflicts
if (process.env.CUSTOM_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.CUSTOM_DATABASE_URL;
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
