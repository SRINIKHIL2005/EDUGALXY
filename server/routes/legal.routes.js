import express from 'express';
import { LegalConsent, SecurityLog } from '../models/security.model.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get current terms and privacy policy versions
router.get('/versions', async (req, res) => {
  try {
    res.json({
      success: true,
      versions: {
        terms: '1.0.0',
        privacy: '1.0.0',
        lastUpdated: {
          terms: '2024-12-07',
          privacy: '2024-12-07'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching legal versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legal document versions'
    });
  }
});

// Record legal consent
router.post('/consent', [
  body('termsVersion').notEmpty().withMessage('Terms version is required'),
  body('privacyVersion').notEmpty().withMessage('Privacy version is required'),
  body('dataProcessingConsent').isBoolean().withMessage('Data processing consent must be a boolean'),
  body('marketingConsent').optional().isBoolean().withMessage('Marketing consent must be a boolean'),
  authenticateJWT
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
      termsVersion,
      privacyVersion,
      dataProcessingConsent,
      marketingConsent = false
    } = req.body;

    const userId = req.user.uid;

    // Check if data processing consent is true (required)
    if (!dataProcessingConsent) {
      return res.status(400).json({
        success: false,
        message: 'Data processing consent is required to use our services'
      });
    }

    // Deactivate previous consent records
    await LegalConsent.updateMany(
      { userId, isActive: true },
      { isActive: false, withdrawalDate: new Date() }
    );

    // Create new consent record
    const consent = new LegalConsent({
      userId,
      termsVersion,
      privacyVersion,
      dataProcessingConsent,
      marketingConsent,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      consentTimestamp: new Date(),
      isActive: true
    });

    await consent.save();

    // Log consent action
    await SecurityLog.create({
      userId,
      action: 'legal_consent_granted',
      level: 'info',
      details: {
        termsVersion,
        privacyVersion,
        dataProcessingConsent,
        marketingConsent,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Legal consent recorded successfully',
      consentId: consent._id
    });

  } catch (error) {
    console.error('Error recording legal consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record legal consent'
    });
  }
});

// Get user's current consent status
router.get('/consent/status', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const currentConsent = await LegalConsent.findOne({
      userId,
      isActive: true
    }).sort({ consentTimestamp: -1 });

    if (!currentConsent) {
      return res.json({
        success: true,
        hasValidConsent: false,
        message: 'No valid consent found. Please accept the terms and privacy policy.'
      });
    }

    // Check if consent is for current versions
    const currentVersions = {
      terms: '1.0.0',
      privacy: '1.0.0'
    };

    const needsUpdate = 
      currentConsent.termsVersion !== currentVersions.terms ||
      currentConsent.privacyVersion !== currentVersions.privacy;

    res.json({
      success: true,
      hasValidConsent: !needsUpdate,
      consent: {
        termsVersion: currentConsent.termsVersion,
        privacyVersion: currentConsent.privacyVersion,
        dataProcessingConsent: currentConsent.dataProcessingConsent,
        marketingConsent: currentConsent.marketingConsent,
        consentTimestamp: currentConsent.consentTimestamp
      },
      currentVersions,
      needsUpdate,
      message: needsUpdate ? 'Please review and accept the updated terms and privacy policy.' : 'Consent is up to date.'
    });

  } catch (error) {
    console.error('Error fetching consent status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent status'
    });
  }
});

// Withdraw consent (GDPR compliance)
router.post('/consent/withdraw', [
  body('reason').optional().isString().withMessage('Reason must be a string'),
  authenticateJWT
], async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reason } = req.body;

    // Deactivate all active consent records
    const result = await LegalConsent.updateMany(
      { userId, isActive: true },
      { 
        isActive: false, 
        withdrawalDate: new Date()
      }
    );

    // Log consent withdrawal
    await SecurityLog.create({
      userId,
      action: 'legal_consent_withdrawn',
      level: 'info',
      details: {
        reason: reason || 'No reason provided',
        withdrawnRecords: result.modifiedCount,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Consent withdrawn successfully. Your account may have limited functionality.',
      withdrawnRecords: result.modifiedCount
    });

  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw consent'
    });
  }
});

// Update marketing consent only
router.patch('/consent/marketing', [
  body('marketingConsent').isBoolean().withMessage('Marketing consent must be a boolean'),
  authenticateJWT
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

    const userId = req.user.uid;
    const { marketingConsent } = req.body;

    // Update the current active consent record
    const result = await LegalConsent.updateOne(
      { userId, isActive: true },
      { 
        marketingConsent,
        updatedAt: new Date()
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active consent record found. Please accept the terms and privacy policy first.'
      });
    }

    // Log marketing consent change
    await SecurityLog.create({
      userId,
      action: 'marketing_consent_updated',
      level: 'info',
      details: {
        marketingConsent,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: `Marketing consent ${marketingConsent ? 'granted' : 'withdrawn'} successfully`
    });

  } catch (error) {
    console.error('Error updating marketing consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update marketing consent'
    });
  }
});

// Middleware to check legal consent before protected operations
export const requireLegalConsent = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.uid;
    
    const currentConsent = await LegalConsent.findOne({
      userId,
      isActive: true
    }).sort({ consentTimestamp: -1 });

    if (!currentConsent) {
      return res.status(403).json({
        success: false,
        message: 'Legal consent required. Please accept the terms and privacy policy.',
        requiresConsent: true
      });
    }

    if (!currentConsent.dataProcessingConsent) {
      return res.status(403).json({
        success: false,
        message: 'Data processing consent is required for this operation.',
        requiresConsent: true
      });
    }

    // Check if consent is for current versions
    const currentVersions = {
      terms: '1.0.0',
      privacy: '1.0.0'
    };

    const needsUpdate = 
      currentConsent.termsVersion !== currentVersions.terms ||
      currentConsent.privacyVersion !== currentVersions.privacy;

    if (needsUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Please review and accept the updated terms and privacy policy.',
        requiresConsent: true,
        needsUpdate: true
      });
    }

    // Add consent info to request
    req.legalConsent = currentConsent;
    next();

  } catch (error) {
    console.error('Legal consent middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify legal consent'
    });
  }
};

export default router;
