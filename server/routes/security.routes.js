import express from 'express';
import { Violation, AccountStatus, SecurityLog } from '../models/security.model.js';
import ViolationEnforcer from '../middleware/violations.middleware.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

// Report a violation
router.post('/violations/report', [
  body('targetUserId').notEmpty().withMessage('Target user ID is required'),
  body('type').isIn([
    'spam', 'harassment', 'inappropriate_content', 'fake_account', 
    'terms_violation', 'privacy_violation', 'security_breach',
    'academic_dishonesty', 'impersonation', 'platform_abuse', 'other'
  ]).withMessage('Invalid violation type'),  body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority level'),
  body('evidence').optional().isString().withMessage('Evidence must be a string'),
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
    }    const { targetUserId, type, description, priority = 'medium', evidence = '' } = req.body;
    const reporterId = req.user.uid;

    // Prevent self-reporting
    if (targetUserId === reporterId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    // Determine severity based on violation type and priority
    let severity = 'medium';
    if (type === 'security_breach' || priority === 'critical') {
      severity = 'critical';
    } else if (type === 'academic_dishonesty' || type === 'harassment' || priority === 'high') {
      severity = 'high';
    } else if (priority === 'low') {
      severity = 'low';
    }    // Create violation record using ViolationEnforcer
    const violation = await ViolationEnforcer.trackViolation(
      targetUserId,
      type,
      description,
      {
        reportedBy: reporterId,
        priority,
        evidence,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      },
      severity
    );

    // Log the report
    await SecurityLog.create({
      userId: reporterId,
      action: 'violation_reported',
      level: 'info',
      details: {
        targetUserId,
        violationType: type,
        violationId: violation._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Violation reported successfully. Our team will review it shortly.',
      reportId: violation._id
    });

  } catch (error) {
    console.error('Error reporting violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report violation'
    });
  }
});

// Get user's own account status
router.get('/account/status', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.uid;
    const accountCheck = await ViolationEnforcer.checkAccountStatus(userId);

    // Get recent violations (last 30 days)
    const recentViolations = await Violation.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      accountStatus: {
        status: accountCheck.status,
        canAccess: accountCheck.canAccess,
        suspensionEnd: accountCheck.suspensionEnd,
        warnings: accountCheck.warnings,
        totalViolations: accountCheck.violations,
        recentViolations: recentViolations.map(v => ({
          id: v._id,
          type: v.type,
          severity: v.severity,
          description: v.description,
          status: v.status,
          action: v.action,
          createdAt: v.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching account status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account status'
    });
  }
});

// Admin routes for violation management (requires admin role)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Get all violations (admin only)
router.get('/admin/violations', [
  query('status').optional().isIn(['pending', 'reviewed', 'resolved', 'dismissed']),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('type').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  authenticateJWT,
  requireAdmin
], async (req, res) => {
  try {
    const { status, severity, type, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const violations = await Violation.find(filter)
      .populate('userId', 'name email')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Violation.countDocuments(filter);

    res.json({
      success: true,
      violations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations'
    });
  }
});

// Review violation (admin only)
router.patch('/admin/violations/:violationId/review', [
  body('action').isIn(['none', 'warning', 'temporary_suspension', 'permanent_ban', 'account_review']).withMessage('Invalid action'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('status').isIn(['reviewed', 'resolved', 'dismissed']).withMessage('Invalid status'),
  authenticateJWT,
  requireAdmin
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

    const { violationId } = req.params;
    const { action, duration, reason, status } = req.body;
    const reviewerId = req.user.uid;

    const violation = await Violation.findById(violationId);
    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    // Update violation
    violation.action = action;
    violation.status = status;
    violation.actionDetails = {
      duration: duration || null,
      reason: reason || '',
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    };

    await violation.save();

    // Enforce action if needed
    if (action !== 'none') {
      await ViolationEnforcer.enforceAction(violation.userId, {
        type: action,
        duration,
        reason
      }, violation);
    }

    // Log admin action
    await SecurityLog.create({
      userId: reviewerId,
      action: 'violation_reviewed',
      level: 'info',
      details: {
        violationId,
        targetUserId: violation.userId,
        action,
        duration,
        reason,
        status,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Violation reviewed successfully',
      violation
    });

  } catch (error) {
    console.error('Error reviewing violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review violation'
    });
  }
});

// Get security logs (admin only)
router.get('/admin/security-logs', [
  query('level').optional().isIn(['info', 'warning', 'error', 'critical']),
  query('action').optional().isString(),
  query('userId').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  authenticateJWT,
  requireAdmin
], async (req, res) => {
  try {
    const { level, action, userId, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (level) filter.level = level;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (userId) filter.userId = userId;

    const logs = await SecurityLog.find(filter)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await SecurityLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security logs'
    });
  }
});

// Get account statuses (admin only)
router.get('/admin/account-statuses', [
  query('status').optional().isIn(['active', 'suspended', 'banned', 'under_review']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  authenticateJWT,
  requireAdmin
], async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const accountStatuses = await AccountStatus.find(filter)
      .populate('userId', 'name email')
      .populate('violations')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AccountStatus.countDocuments(filter);

    res.json({
      success: true,
      accountStatuses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching account statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account statuses'
    });
  }
});

// Manually update account status (admin only)
router.patch('/admin/account-status/:userId', [
  body('status').isIn(['active', 'suspended', 'banned', 'under_review']).withMessage('Invalid status'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  authenticateJWT,
  requireAdmin
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

    const { userId } = req.params;
    const { status, reason, duration } = req.body;
    const adminId = req.user.uid;

    let accountStatus = await AccountStatus.findOne({ userId });
    if (!accountStatus) {
      accountStatus = new AccountStatus({ userId });
    }

    const previousStatus = accountStatus.status;
    accountStatus.status = status;

    if (status === 'suspended' && duration) {
      accountStatus.suspensionEnd = new Date(Date.now() + duration * 60 * 60 * 1000);
    } else if (status === 'active') {
      accountStatus.suspensionEnd = null;
      accountStatus.accountLocked = false;
      accountStatus.lockReason = null;
    }

    await accountStatus.save();

    // Log admin action
    await SecurityLog.create({
      userId: adminId,
      action: 'account_status_updated',
      level: 'warning',
      details: {
        targetUserId: userId,
        previousStatus,
        newStatus: status,
        reason,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Account status updated successfully',
      accountStatus
    });

  } catch (error) {
    console.error('Error updating account status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account status'
    });
  }
});

export default router;
