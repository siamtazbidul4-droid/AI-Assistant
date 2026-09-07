import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthRequest } from '../types/index.js';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to continue.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authentication session.',
      code: 'INVALID_TOKEN',
    });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    }
  } catch {
    // Silently proceed for optional auth
  }
  next();
}
