// Violation Tracker Model for tracking user violations and policy breaches
import mongoose from 'mongoose';

const violationTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  violationType: {
    type: String,
    required: true,
    enum: [
      'UNAUTHORIZED_ACCESS',
      'DATA_MANIPULATION',
      'POLICY_VIOLATION',
      'SPAM_ACTIVITY',
      'HARASSMENT',
      'INAPPROPRIATE_CONTENT',
      'MULTIPLE_ACCOUNTS',
      'CREDENTIAL_SHARING',
      'SUSPICIOUS_LOGIN_PATTERN',
      'RATE_LIMIT_ABUSE',
      'SYSTEM_ABUSE',
      'PRIVACY_VIOLATION',
      'ACADEMIC_DISHONESTY',
      'MALICIOUS_ACTIVITY',
      'TERMS_VIOLATION',
      'SECURITY_BREACH_ATTEMPT',
      'FRAUDULENT_ACTIVITY'
    ]
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    default: 'LOW'
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  evidence: {
    screenshots: [String],
    logs: [String],
    ipAddresses: [String],
    userAgents: [String],
    additionalData: mongoose.Schema.Types.Mixed
  },
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    system: {
      type: Boolean,
      default: false
    },
    automated: {
      type: Boolean,
      default: false
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolution: {
    action: {
      type: String,
      enum: [
        'WARNING_ISSUED',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_BANNED',
        'PRIVILEGES_REVOKED',
        'EDUCATION_PROVIDED',
        'NO_ACTION',
        'FALSE_POSITIVE',
        'ESCALATED'
      ]
    },
    notes: String,
    duration: Number // in days for suspensions
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  escalatedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  category: {
    type: String,
    enum: [
      'SECURITY',
      'PRIVACY',
      'CONDUCT',
      'ACADEMIC',
      'TECHNICAL',
      'LEGAL'
    ],
    required: true
  },
  impactAssessment: {
    usersAffected: {
      type: Number,
      default: 1
    },
    dataCompromised: {
      type: Boolean,
      default: false
    },
    systemImpact: {
      type: String,
      enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'NONE'
    }
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  relatedViolations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ViolationTracker'
  }],
  communicationLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['EMAIL', 'IN_APP', 'PHONE', 'MEETING']
    },
    message: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

// Indexes for efficient querying
violationTrackerSchema.index({ userId: 1, timestamp: -1 });
violationTrackerSchema.index({ violationType: 1, timestamp: -1 });
violationTrackerSchema.index({ severity: 1, resolved: 1 });
violationTrackerSchema.index({ resolved: 1, priority: 1 });
violationTrackerSchema.index({ escalated: 1, timestamp: -1 });

// Virtual for calculating violation score
violationTrackerSchema.virtual('violationScore').get(function() {
  const severityScores = { LOW: 1, MEDIUM: 3, HIGH: 5, CRITICAL: 10 };
  return severityScores[this.severity] || 1;
});

// Static method to calculate user's total violation score
violationTrackerSchema.statics.calculateUserViolationScore = async function(userId, days = 30) {
  const violations = await this.find({
    userId,
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    resolved: false
  });

  const severityScores = { LOW: 1, MEDIUM: 3, HIGH: 5, CRITICAL: 10 };
  return violations.reduce((sum, violation) => sum + severityScores[violation.severity], 0);
};

// Static method to get user's violation history
violationTrackerSchema.statics.getUserViolationHistory = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('reportedBy.userId', 'name email')
    .populate('resolvedBy', 'name email')
    .populate('escalatedTo', 'name email');
};

// Method to check if violation requires immediate action
violationTrackerSchema.methods.requiresImmediateAction = function() {
  return this.severity === 'CRITICAL' || 
         this.violationType === 'SECURITY_BREACH_ATTEMPT' ||
         this.violationType === 'MALICIOUS_ACTIVITY' ||
         this.violationType === 'FRAUDULENT_ACTIVITY';
};

// Pre-save middleware to set priority based on severity and type
violationTrackerSchema.pre('save', function(next) {
  if (this.isNew) {
    if (this.severity === 'CRITICAL') {
      this.priority = 'URGENT';
    } else if (this.severity === 'HIGH') {
      this.priority = 'HIGH';
    } else if (this.severity === 'MEDIUM') {
      this.priority = 'MEDIUM';
    } else {
      this.priority = 'LOW';
    }

    // Auto-escalate critical violations
    if (this.requiresImmediateAction()) {
      this.escalated = true;
      this.escalatedAt = new Date();
    }
  }
  next();
});

const ViolationTracker = mongoose.model('ViolationTracker', violationTrackerSchema);
export default ViolationTracker;
