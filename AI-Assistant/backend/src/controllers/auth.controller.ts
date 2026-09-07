import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { StorageService } from '../services/storage.service.js';
import { generateToken } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      const existingUser = await StorageService.findUserByEmail(cleanEmail);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await StorageService.createUser({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
      });

      const token = generateToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });

      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token, // Bearer token also provided for iframe resilience
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('[Auth Register Error]:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create account.',
        code: 'REGISTRATION_FAILED',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      const user = await StorageService.findUserByEmail(cleanEmail);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const token = generateToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });

      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('[Auth Login Error]:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Authentication failed.',
        code: 'LOGIN_FAILED',
      });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated.',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const user = await StorageService.findUserById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User account not found.',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch session profile.',
        code: 'ME_FAILED',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  }

  static async refresh(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No active session to refresh.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    });

    setAuthCookie(res, token);
    res.status(200).json({
      success: true,
      token,
      user: req.user,
    });
  }
}
