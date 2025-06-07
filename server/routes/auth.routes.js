// routes/auth.routes.js using ES modules
import express from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import User from '../models/user.model.js'; // Ensure your User model is exported as default

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
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
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' } // Changed from '1d' to '30d'
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error('Login error: User not found');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error('Login error: Password mismatch');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' } // Changed from '1d' to '30d'
    );

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during login' });
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
