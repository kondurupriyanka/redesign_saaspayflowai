// ============= VALIDATION MIDDLEWARE =============

import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  [key: string]: {
    type: string;
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
  };
}

/**
 * Request validation middleware
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    // Check each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check if required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors[field] = `${field} must be a ${rules.type}`;
        continue;
      }

      // Check min length (for strings)
      if (rules.min && typeof value === 'string' && value.length < rules.min) {
        errors[field] = `${field} must be at least ${rules.min} characters`;
        continue;
      }

      // Check max length (for strings)
      if (rules.max && typeof value === 'string' && value.length > rules.max) {
        errors[field] = `${field} must be at most ${rules.max} characters`;
        continue;
      }

      // Check pattern (regex)
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
        continue;
      }

      // Check enum
      if (rules.enum && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
  URL: /^https?:\/\/.+/,
  ALPHA: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  GST_NUMBER: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN_NUMBER: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
};
