import { Violation, AccountStatus, SecurityLog } from '../models/security.model.js';
import rateLimit from 'express-rate-limit';

// Violation tracking and enforcement middleware
export class ViolationEnforcer {
  // Track a violation
  static async trackViolation(userId, type, description, evidence = {}, severity = 'medium') {
    try {
      const violation = new Violation({
        userId,
        type,
        severity,
        description,
        evidence: {
          ...evidence,
          timestamp: new Date()
        }
      });

      await violation.save();

      // Update account status
      await this.updateAccountStatus(userId, violation);

      // Log security event
      await SecurityLog.create({
        userId,
        action: `violation_tracked_${type}`,
        level: severity === 'critical' ? 'critical' : 'warning',
        details: {
          violationType: type,
          severity,
          description,
          ...evidence
        }
      });

      return violation;
    } catch (error) {
      console.error('Error tracking violation:', error);
      throw error;
    }
  }

  // Update account status based on violations
  static async updateAccountStatus(userId, violation) {
    try {
      let accountStatus = await AccountStatus.findOne({ userId });
      
      if (!accountStatus) {
        accountStatus = new AccountStatus({ userId });
      }

      // Add violation to the account
      accountStatus.violations.push(violation._id);

      // Determine action based on violation type and severity
      const action = await this.determineAction(userId, violation);
      
      if (action.type !== 'none') {
        await this.enforceAction(userId, action, violation);
      }

      await accountStatus.save();
      return accountStatus;
    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }

  // Determine action based on violation history
  static async determineAction(userId, violation) {
    const userViolations = await Violation.find({ 
      userId, 
      status: { $in: ['pending', 'reviewed'] } 
    }).sort({ createdAt: -1 });

    const recentViolations = userViolations.filter(v => 
      new Date() - v.createdAt < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    // Critical violations get immediate action
    if (violation.severity === 'critical') {
      return {
        type: 'permanent_ban',
        reason: 'Critical security violation',
        duration: null
      };
    }

    // High severity violations
    if (violation.severity === 'high') {
      if (recentViolations.length >= 2) {
        return {
          type: 'permanent_ban',
          reason: 'Multiple high-severity violations',
          duration: null
        };
      }
      return {
        type: 'temporary_suspension',
        reason: 'High severity violation',
        duration: 168 // 7 days
      };
    }

    // Medium severity violations
    if (violation.severity === 'medium') {
      const mediumViolations = recentViolations.filter(v => v.severity === 'medium');
      if (mediumViolations.length >= 3) {
        return {
          type: 'temporary_suspension',
          reason: 'Multiple violations',
          duration: 72 // 3 days
        };
      }
      if (mediumViolations.length >= 2) {
        return {
          type: 'warning',
          reason: 'Repeated violations',
          duration: null
        };
      }
    }

    // Low severity violations
    if (violation.severity === 'low') {
      const lowViolations = recentViolations.filter(v => v.severity === 'low');
      if (lowViolations.length >= 5) {
        return {
          type: 'warning',
          reason: 'Multiple minor violations',
          duration: null
        };
      }
    }

    return { type: 'none', reason: 'No action required', duration: null };
  }

  // Enforce the determined action
  static async enforceAction(userId, action, violation) {
    try {
      let accountStatus = await AccountStatus.findOne({ userId });
      
      if (!accountStatus) {
        accountStatus = new AccountStatus({ userId });
      }

      switch (action.type) {
        case 'warning':
          accountStatus.warnings += 1;
          break;
          
        case 'temporary_suspension':
          accountStatus.status = 'suspended';
          accountStatus.suspensionEnd = new Date(Date.now() + action.duration * 60 * 60 * 1000);
          break;
          
        case 'permanent_ban':
          accountStatus.status = 'banned';
          accountStatus.suspensionEnd = null;
          break;
          
        case 'account_review':
          accountStatus.status = 'under_review';
          break;
      }

      // Update violation with action taken
      violation.action = action.type;
      violation.actionDetails = {
        duration: action.duration,
        reason: action.reason,
        reviewedAt: new Date()
      };
      violation.status = 'reviewed';

      await violation.save();
      await accountStatus.save();

      // Log the enforcement action
      await SecurityLog.create({
        userId,
        action: `enforcement_${action.type}`,
        level: action.type === 'permanent_ban' ? 'critical' : 'warning',
        details: {
          actionType: action.type,
          reason: action.reason,
          duration: action.duration,
          violationId: violation._id
        }
      });

      return { accountStatus, action };
    } catch (error) {
      console.error('Error enforcing action:', error);
      throw error;
    }
  }

  // Check if user account is in good standing
  static async checkAccountStatus(userId) {
    try {
      const accountStatus = await AccountStatus.findOne({ userId });
      
      if (!accountStatus) {
        return { status: 'active', canAccess: true };
      }

      // Check if suspension has expired
      if (accountStatus.status === 'suspended' && accountStatus.suspensionEnd) {
        if (new Date() > accountStatus.suspensionEnd) {
          accountStatus.status = 'active';
          accountStatus.suspensionEnd = null;
          await accountStatus.save();
        }
      }

      const canAccess = accountStatus.status === 'active';
      
      return {
        status: accountStatus.status,
        canAccess,
        suspensionEnd: accountStatus.suspensionEnd,
        warnings: accountStatus.warnings,
        violations: accountStatus.violations.length
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      return { status: 'active', canAccess: true };
    }
  }

  // Middleware to check account status on protected routes
  static accountStatusMiddleware = async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return next();
      }

      const userId = req.user.uid;
      const accountCheck = await ViolationEnforcer.checkAccountStatus(userId);

      if (!accountCheck.canAccess) {
        const message = accountCheck.status === 'banned' 
          ? 'Your account has been permanently banned due to violations of our terms of service.'
          : accountCheck.status === 'suspended'
          ? `Your account is temporarily suspended until ${accountCheck.suspensionEnd}. Please contact support if you believe this is an error.`
          : 'Your account is under review. Please contact support for more information.';

        return res.status(403).json({
          error: 'Account Access Denied',
          message,
          accountStatus: accountCheck.status,
          suspensionEnd: accountCheck.suspensionEnd
        });
      }

      // Add account info to request for logging
      req.accountStatus = accountCheck;
      next();
    } catch (error) {
      console.error('Account status middleware error:', error);
      next(); // Continue on error to avoid breaking the app
    }
  };

  // Rate limit violation tracker
  static rateLimitViolationTracker = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode === 429) { // Too Many Requests
        // Track rate limiting violation
        const userId = req.user?.uid;
        if (userId) {
          ViolationEnforcer.trackViolation(
            userId,
            'rate_limit_exceeded',
            'User exceeded API rate limits',
            {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              endpoint: req.originalUrl,
              method: req.method
            },
            'medium'
          ).catch(err => console.error('Error tracking rate limit violation:', err));
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };

  // Failed login attempt tracker
  static async trackFailedLogin(identifier, ip, userAgent) {
    try {
      // Try to find user by email or other identifier
      const User = mongoose.model('User');
      const user = await User.findOne({ 
        $or: [
          { email: identifier },
          { uid: identifier }
        ]
      });

      if (user) {
        let accountStatus = await AccountStatus.findOne({ userId: user._id });
        
        if (!accountStatus) {
          accountStatus = new AccountStatus({ userId: user._id });
        }

        accountStatus.failedLoginAttempts += 1;
        accountStatus.lastFailedLogin = new Date();

        // Lock account after 5 failed attempts
        if (accountStatus.failedLoginAttempts >= 5) {
          accountStatus.accountLocked = true;
          accountStatus.lockReason = 'Too many failed login attempts';
          
          // Track violation for excessive failed logins
          await this.trackViolation(
            user._id,
            'repeated_failed_login',
            `Account locked due to ${accountStatus.failedLoginAttempts} failed login attempts`,
            { ip, userAgent },
            'medium'
          );
        }

        await accountStatus.save();
      }

      // Log security event regardless of whether user exists
      await SecurityLog.create({
        userId: user?._id,
        action: 'failed_login_attempt',
        level: 'warning',
        details: {
          identifier,
          ip,
          userAgent,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Error tracking failed login:', error);
    }
  }

  // Reset failed login attempts on successful login
  static async resetFailedLoginAttempts(userId) {
    try {
      await AccountStatus.updateOne(
        { userId },
        { 
          $set: { 
            failedLoginAttempts: 0,
            accountLocked: false,
            lockReason: null,
            lastLoginAttempt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Error resetting failed login attempts:', error);
    }
  }
}

export default ViolationEnforcer;
