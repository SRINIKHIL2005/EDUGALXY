import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Rate limiting configurations
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include user identifier
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  }
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down.'
  }
});

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

// Input validation schemas
export const userValidationRules = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address')
      .isLength({ max: 100 })
      .withMessage('Email too long'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('department')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Department must be between 2 and 50 characters'),
    
    body('role')
      .isIn(['student', 'teacher', 'hod', 'admin'])
      .withMessage('Invalid role specified'),
    
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Invalid phone number format')
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10 and 20 characters')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 128 })
      .withMessage('Password too long')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Invalid phone number format'),
    
    body('department')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Department must be between 2 and 50 characters')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain uppercase, lowercase, number, and special character')
  ]
};

// Validation result checker
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Password security utilities
export const passwordUtils = {
  // Hash password with salt
  hashPassword: async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare password with hash
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  // Generate secure random password
  generateSecurePassword: (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
};

// JWT security utilities
export const tokenUtils = {
  // Generate JWT with enhanced security
  generateToken: (payload, expiresIn = '24h') => {
    return jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: require('crypto').randomUUID() // Unique token ID
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { 
        expiresIn,
        issuer: 'efg-platform',
        audience: 'efg-users'
      }
    );
  },

  // Verify JWT with enhanced validation
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key', {
        issuer: 'efg-platform',
        audience: 'efg-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  // Generate refresh token
  generateRefreshToken: (userId) => {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );
  }
};

// Request sanitization
export const sanitizeInput = (req, res, next) => {
  // Remove potential XSS and injection attempts
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and common XSS patterns
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Security logging
export const securityLogger = {
  logSecurityEvent: (event, details, req = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      userId: req?.user?.id || 'anonymous'
    };
    
    console.log('🔒 Security Event:', JSON.stringify(logEntry));
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to security monitoring service (SIEM)
      // Example: await sendToSecurityService(logEntry);
    }
  },

  logFailedLogin: (email, ip, reason) => {
    securityLogger.logSecurityEvent('FAILED_LOGIN', {
      email,
      reason,
      severity: 'medium'
    }, { ip });
  },

  logSuspiciousActivity: (activity, req) => {
    securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      activity,
      severity: 'high'
    }, req);
  }
};

export default {
  loginLimiter,
  generalLimiter,
  apiLimiter,
  securityHeaders,
  corsOptions,
  userValidationRules,
  checkValidationResult,
  passwordUtils,
  tokenUtils,
  sanitizeInput,
  securityLogger
};
