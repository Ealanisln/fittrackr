import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../auth';

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from '../../lib/auth';

describe('requireAuth middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('cookie parsing', () => {
    it('should extract non-secure session token from cookies', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=test-token-123',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
        session: { id: 'session-1' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
      });
    });

    it('should extract secure session token (__Secure- prefix) from cookies', async () => {
      mockReq.headers = {
        cookie: '__Secure-better-auth.session_token=secure-token-456',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-2', name: 'Secure User', email: 'secure@test.com' },
        session: { id: 'session-2' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user?.id).toBe('user-2');
    });

    it('should handle tokens containing equals signs', async () => {
      // Tokens may contain base64 data with '=' padding
      mockReq.headers = {
        cookie: 'better-auth.session_token=token=with=equals==',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-3', name: 'User', email: 'user@test.com' },
        session: { id: 'session-3' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should prefer secure cookie when both are present', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=non-secure; __Secure-better-auth.session_token=secure-token',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-4', name: 'User', email: 'user@test.com' },
        session: { id: 'session-4' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple cookies correctly', async () => {
      mockReq.headers = {
        cookie: 'other-cookie=value; better-auth.session_token=test-token; another=data',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-5', name: 'User', email: 'user@test.com' },
        session: { id: 'session-5' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authentication errors', () => {
    it('should return 401 when no cookie header exists', async () => {
      mockReq.headers = {};

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when cookie header is empty', async () => {
      mockReq.headers = {
        cookie: '',
      };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session token is not found in cookies', async () => {
      mockReq.headers = {
        cookie: 'other-cookie=value; another-cookie=data',
      };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return 401 when session is invalid (null)', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=invalid-token',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired session',
      });
    });

    it('should return 401 when session has no user', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=test-token',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        session: { id: 'session-1' },
        user: null,
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired session',
      });
    });

    it('should return 401 when getSession throws an error', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=test-token',
      };

      vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session error'));

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
      });
    });
  });

  describe('user attachment', () => {
    it('should attach user object to request with correct properties', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=test-token',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          extraProperty: 'should not be included',
        },
        session: { id: 'session-1' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect((mockReq.user as any).extraProperty).toBeUndefined();
    });

    it('should call next() after successful authentication', async () => {
      mockReq.headers = {
        cookie: 'better-auth.session_token=test-token',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
        session: { id: 'session-1' },
      } as any);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
