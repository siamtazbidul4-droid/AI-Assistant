import { Request, Response, NextFunction } from 'express';

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Name is required.',
      code: 'VALIDATION_ERROR',
      field: 'name',
    });
    return;
  }

  if (name.trim().length > 60) {
    res.status(400).json({
      success: false,
      message: 'Name cannot exceed 60 characters.',
      code: 'VALIDATION_ERROR',
      field: 'name',
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'A valid email address is required.',
      code: 'VALIDATION_ERROR',
      field: 'email',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
      code: 'VALIDATION_ERROR',
      field: 'password',
    });
    return;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({
      success: false,
      message: 'Passwords do not match.',
      code: 'VALIDATION_ERROR',
      field: 'confirmPassword',
    });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({
      success: false,
      message: 'Email is required.',
      code: 'VALIDATION_ERROR',
      field: 'email',
    });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Password is required.',
      code: 'VALIDATION_ERROR',
      field: 'password',
    });
    return;
  }

  next();
}
