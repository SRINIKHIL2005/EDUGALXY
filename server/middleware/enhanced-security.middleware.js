import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';
import compression from 'compression';

// Enhanced security middleware collection
export const enhancedSecurityMiddleware = {
  // Comprehensive rate limiting
  rateLimiting: {
    // Strict rate limiting for authentication endpoints
    authLimiter: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15 * 60 * 1000
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${req.ip}-${req.body?.email || 'unknown'}`
    }),

    // API rate limiting
    apiLimiter: rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute per IP
      message: {
        error: 'API rate limit exceeded',
        message: 'Too many API requests. Please slow down.'
      },
      standardHeaders: true,
      legacyHeaders: false
    }),

    // Strict rate limiting for sensitive operations
    sensitiveOperationsLimiter: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 sensitive operations per hour
      message: {
        error: 'Sensitive operation limit exceeded',
        message: 'Too many sensitive operations. Please try again later.'
      }
    }),

    // Upload rate limiting
    uploadLimiter: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 uploads per 15 minutes
      message: {
        error: 'Upload limit exceeded',
        message: 'Too many uploads. Please wait before uploading again.'
      }
    })
  },

  // Enhanced security headers
  securityHeaders: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
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
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }),

  // Advanced CORS configuration
  corsOptions: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 hours
  },
  // Data sanitization
  dataSanitization: [
    mongoSanitize({
      allowDots: true,
      replaceWith: '_'
    }),
    // Custom XSS sanitization middleware
    (req, res, next) => {
      const sanitizeObject = (obj) => {
        if (obj && typeof obj === 'object') {
          for (const key in obj) {
            if (typeof obj[key] === 'string') {
              obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object') {
              sanitizeObject(obj[key]);
            }
          }
        }
      };

      // Sanitize request body
      if (req.body) {
        sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        sanitizeObject(req.query);
      }

      // Sanitize URL parameters
      if (req.params) {
        sanitizeObject(req.params);
      }

      next();
    },
    hpp({
      whitelist: ['sort', 'fields', 'page', 'limit', 'filter']
    })
  ],

  // Request compression
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }),

  // Request size limiting
  requestSizeLimiting: (req, res, next) => {
    const maxSize = {
      json: '10mb',
      urlencoded: '10mb',
      text: '1mb',
      raw: '50mb' // For file uploads
    };

    // Apply different limits based on content type
    const contentType = req.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      if (req.get('Content-Length') && parseInt(req.get('Content-Length')) > 10 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Request too large',
          message: 'JSON payload exceeds 10MB limit'
        });
      }
    }
    next();
  },

  // IP whitelisting/blacklisting
  ipFiltering: (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Blacklisted IPs (could be loaded from database)
    const blacklistedIPs = process.env.BLACKLISTED_IPS ? 
      process.env.BLACKLISTED_IPS.split(',') : [];
    
    if (blacklistedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address has been blocked'
      });
    }

    // Rate limiting per IP for suspicious activities
    if (req.suspiciousActivity) {
      return res.status(429).json({
        error: 'Suspicious activity detected',
        message: 'Please try again later'
      });
    }

    next();
  },

  // Security headers validation
  requestValidation: (req, res, next) => {
    // Validate required security headers
    const requiredHeaders = ['user-agent'];
    const missingHeaders = requiredHeaders.filter(header => !req.get(header));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: 'Missing required headers',
        message: 'Request must include required security headers'
      });
    }

    // Detect potential bot traffic
    const userAgent = req.get('User-Agent');
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    if (isSuspicious && !req.get('X-API-Key')) {
      // Mark as suspicious but don't block (could be legitimate)
      req.suspiciousActivity = true;
    }

    next();
  },

  // Enhanced logging middleware
  securityLogging: (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log security-relevant requests
      const securityEvents = [
        'login', 'logout', 'register', 'password-reset',
        'violation', 'admin', 'security', 'profile'
      ];

      const isSecurityEvent = securityEvents.some(event => 
        req.originalUrl.toLowerCase().includes(event)
      );

      if (isSecurityEvent || res.statusCode >= 400) {
        console.log(`🔒 Security Log: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms - IP: ${req.ip} - UA: ${req.get('User-Agent')?.substring(0, 100)}`);
      }

      return originalSend.call(this, data);
    };

    next();
  }
};

export default enhancedSecurityMiddleware;
