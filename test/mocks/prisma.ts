import { vi } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Reset mock between tests
export function resetPrismaMock() {
  mockReset(prismaMock);
}

// Export type for use in tests
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
