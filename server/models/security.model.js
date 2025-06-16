import mongoose from 'mongoose';

// Violation schema for tracking user violations
const violationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'spam',
      'harassment', 
      'inappropriate_content',
      'fake_account',
      'terms_violation',
      'privacy_violation',
      'security_breach',
      'repeated_failed_login',
      'rate_limit_exceeded',
      'data_misuse',
      'other'
    ], 
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  description: { 
    type: String, 
    required: true 
  },
  evidence: {
    ip: String,
    userAgent: String,
    endpoint: String,
    requestData: Object,
    timestamp: { type: Date, default: Date.now }
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'temporary_suspension', 'permanent_ban', 'account_review'],
    default: 'none'
  },
  actionDetails: {
    duration: Number, // Duration in hours for temporary actions
    reason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  resolvedAt: Date
}, { timestamps: true });

// User Account Status schema
const accountStatusSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'banned', 'under_review'], 
    default: 'active' 
  },
  suspensionEnd: Date,
  warnings: { 
    type: Number, 
    default: 0 
  },
  violations: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Violation' 
  }],
  securityFlags: [{
    type: String,
    timestamp: { type: Date, default: Date.now },
    description: String
  }],
  lastSecurityCheck: { 
    type: Date, 
    default: Date.now 
  },
  accountLocked: { 
    type: Boolean, 
    default: false 
  },
  lockReason: String,
  passwordLastChanged: Date,
  lastLoginAttempt: Date,
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lastFailedLogin: Date
}, { timestamps: true });

// Legal Consent schema
const legalConsentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  termsVersion: { 
    type: String, 
    required: true 
  },
  privacyVersion: { 
    type: String, 
    required: true 
  },
  termsOfServiceVersion: { 
    type: String, 
    required: true 
  },
  dataProcessingConsent: { 
    type: Boolean, 
    required: true 
  },
  marketingConsent: { 
    type: Boolean, 
    default: false 
  },
  consentTimestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: String,
  userAgent: String,
  withdrawalDate: Date,
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Security Log schema
const securityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  action: { 
    type: String, 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['info', 'warning', 'error', 'critical'], 
    default: 'info' 
  },
  details: {
    ip: String,
    userAgent: String,
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number,
    requestData: Object,
    error: String
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  resolved: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const Violation = mongoose.model('Violation', violationSchema);
const AccountStatus = mongoose.model('AccountStatus', accountStatusSchema);
const LegalConsent = mongoose.model('LegalConsent', legalConsentSchema);
const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

export { Violation, AccountStatus, LegalConsent, SecurityLog };
