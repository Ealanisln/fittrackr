/**
 * Mock user data for testing
 */

export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

export const mockUser2 = {
  id: 'user-456',
  name: 'Other User',
  email: 'other@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

export const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  token: 'test-session-token-abc123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Test)',
};

export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
});

export const createMockSession = (overrides: Partial<typeof mockSession> = {}) => ({
  ...mockSession,
  ...overrides,
});
