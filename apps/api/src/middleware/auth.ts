import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get the session token from cookies
    const token = req.headers.cookie
      ?.split('; ')
      .find(row => row.startsWith('better-auth.session_token='))
      ?.split('=')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify the session using Better Auth
    const session = await auth.api.getSession({
      headers: req.headers as any
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    // Attach user to request
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}
