import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// XSS Protection - Remove potentially dangerous characters
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// SQL Injection Protection - Check for suspicious patterns
export const hasSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
    /(--|\/\*|\*\/|;|xp_|sp_)/i,
    /(\b(or|and)\b\s+\d+\s*[=<>])/i,
    /(\b(union|select)\b\s+.*\bfrom\b)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Generic input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for SQL injection in all string inputs
      const body = req.body;
      const hasInjection = Object.values(body).some(value => 
        typeof value === 'string' && hasSqlInjection(value)
      );
      
      if (hasInjection) {
        return res.status(400).json({ 
          message: 'Invalid input detected',
          error: 'SQL_INJECTION_ATTEMPT'
        });
      }
      
      // Validate and sanitize input
      const validatedData = schema.parse(body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({ message: 'Validation error' });
    }
  };
};

// Generic sanitization middleware for all requests
export const sanitizeAllInputs = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string);
      }
    });
  }
  
  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  
  next();
};

// Common validation schemas
export const schemas = {
  email: z.string().email().max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  objectId: z.string().regex(/^[a-f0-9]{24}$/),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
};

