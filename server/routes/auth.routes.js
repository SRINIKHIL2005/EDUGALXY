// routes/auth.routes.js using ES modules
import express from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import User from '../models/user.model.js'; // Ensure your User model is exported as default
import { LegalConsent, SecurityLog } from '../models/security.model.js';
import ViolationEnforcer from '../middleware/violations.middleware.js';
import { body, validationResult } from 'express-validator';
import { loginLimiter, apiLimiter } from '../middleware/security.middleware.js';

const router = express.Router();

// Check email availability
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
});

// Register a new user with security and legal compliance
router.post('/register', [
  apiLimiter,
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('role').isIn(['student', 'teacher', 'hod', 'admin']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department is required'),
  body('termsVersion').notEmpty().withMessage('Terms version is required'),
  body('privacyVersion').notEmpty().withMessage('Privacy version is required'),
  body('termsOfServiceVersion').notEmpty().withMessage('Terms of Service version is required'),
  body('dataProcessingConsent').equals('true').withMessage('Data processing consent is required'),
  body('marketingConsent').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      department,
      termsVersion,
      privacyVersion,
      termsOfServiceVersion,
      dataProcessingConsent,
      marketingConsent = false
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await SecurityLog.create({
        action: 'registration_attempt_existing_email',
        level: 'warning',
        details: {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      department,
    });
    
    await user.save();

    // Record legal consent
    const consent = new LegalConsent({
      userId: user._id,
      termsVersion,
      privacyVersion,
      termsOfServiceVersion,
      dataProcessingConsent: dataProcessingConsent === 'true',
      marketingConsent: marketingConsent === 'true',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      consentTimestamp: new Date(),
      isActive: true
    });

    await consent.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, uid: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    // Log successful registration
    await SecurityLog.create({
      userId: user._id,
      action: 'user_registered',
      level: 'info',
      details: {
        email,
        role,
        department,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    await SecurityLog.create({
      action: 'registration_error',
      level: 'error',
      details: {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// Login user with security checks
router.post('/login', [
  loginLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Track failed login attempt
      await ViolationEnforcer.trackFailedLogin(email, req.ip, req.get('User-Agent'));
      
      console.error('Login error: User not found');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check account status
    const accountCheck = await ViolationEnforcer.checkAccountStatus(user._id);
    if (!accountCheck.canAccess) {
      const message = accountCheck.status === 'banned' 
        ? 'Your account has been permanently banned due to violations of our terms of service.'
        : accountCheck.status === 'suspended'
        ? `Your account is temporarily suspended until ${accountCheck.suspensionEnd}. Please contact support if you believe this is an error.`
        : 'Your account is under review. Please contact support for more information.';

      await SecurityLog.create({
        userId: user._id,
        action: 'login_attempt_blocked',
        level: 'warning',
        details: {
          email,
          accountStatus: accountCheck.status,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(403).json({
        success: false,
        message,
        accountStatus: accountCheck.status,
        suspensionEnd: accountCheck.suspensionEnd
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Track failed login attempt
      await ViolationEnforcer.trackFailedLogin(email, req.ip, req.get('User-Agent'));
      
      console.error('Login error: Password mismatch');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Reset failed login attempts on successful login
    await ViolationEnforcer.resetFailedLoginAttempts(user._id);

    // Check for valid legal consent
    const currentConsent = await LegalConsent.findOne({
      userId: user._id,
      isActive: true
    }).sort({ consentTimestamp: -1 });

    const requiresConsent = !currentConsent || !currentConsent.dataProcessingConsent;

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, uid: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await SecurityLog.create({
      userId: user._id,
      action: 'user_login',
      level: 'info',
      details: {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requiresConsent
      }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin
      },
      requiresConsent,
      message: requiresConsent 
        ? 'Please review and accept our updated terms and privacy policy.' 
        : 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    await SecurityLog.create({
      action: 'login_error',
      level: 'error',
      details: {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Firebase Google Sign-In endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log('Received Firebase idToken:', idToken);

    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Firebase token:', decodedToken);
    
    // Extract user information from decoded token
    const { uid, email, name } = decodedToken;
    
    // Check for an existing user using the email
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user with default settings for Google sign-in
      user = new User({
        name: name || 'No Name',
        email,
        role: 'student',
        department: 'Computer Science',
        authMethod: 'google',
      });
      await user.save();
    }
    
    // Generate JWT token for your app’s session management
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' } // Changed from '1d' to '30d'
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      token
    });
  } catch (error) {
    console.error('Firebase Google authentication error:', error);
    res.status(401).json({ message: 'Firebase Google authentication failed' });
  }
});

export default router;
