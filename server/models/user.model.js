// server/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; // Using bcrypt, not bcryptjs

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'hod'],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  // Profile fields
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  // Academic/Professional fields
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  specialization: [String],
  // Student specific fields
  studentId: {
    type: String,
    default: null
  },
  enrollmentYear: {
    type: String,
    default: null
  },
  program: {
    type: String,
    default: null
  },
  certificates: [{
    name: String,
    url: String, // base64 or file path or cloud URL
    uploadedAt: { type: Date, default: Date.now }
  }],
  resumes: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Enhanced security fields
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'warned', 'pending_verification'],
    default: 'active'
  },
  suspendedUntil: {
    type: Date,
    default: null
  },
  lastWarning: {
    type: Date,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: {
      type: String,
      default: null
    },
    backupCodes: [String],
    lastUsed: {
      type: Date,
      default: null
    }
  },
  loginHistory: [{
    ip: String,
    userAgent: String,
    location: {
      country: String,
      city: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    successful: {
      type: Boolean,
      default: true
    }
  }],
  deviceFingerprints: [{
    fingerprint: String,
    trusted: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    name: String // User-friendly device name
  }],
  securityQuestions: [{
    question: String,
    answerHash: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'department', 'private'],
      default: 'department'
    },
    allowDataCollection: {
      type: Boolean,
      default: true
    },
    allowNotifications: {
      type: Boolean,
      default: true
    },
    allowAnalytics: {
      type: Boolean,
      default: true
    }
  },
  legalAgreements: {
    termsAccepted: {
      type: Boolean,
      default: false
    },
    termsAcceptedAt: {
      type: Date,
      default: null
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false
    },
    privacyPolicyAcceptedAt: {
      type: Date,
      default: null
    },
    cookiePolicyAccepted: {
      type: Boolean,
      default: false
    },
    cookiePolicyAcceptedAt: {
      type: Date,
      default: null
    },
    currentTermsVersion: {
      type: String,
      default: '1.0'
    },
    currentPrivacyVersion: {
      type: String,
      default: '1.0'
    }
  },
  authMethod: {
    type: String,
    enum: ['local', 'google', 'microsoft', 'apple'],
    default: 'local'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  // Learning companion stats
  learningStats: {
    studyStreak: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0 // in minutes
    },
    personalityType: {
      type: String,
      default: 'Visual',
      enum: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing']
    },
    lastStudyDate: {
      type: Date,
      default: null
    },
    weeklyStudyGoal: {
      type: Number,
      default: 300 // minutes per week
    },
    completedLearningPaths: [{
      pathId: String,
      completedAt: Date,
      progress: Number
    }],
    learningInsights: [{
      type: String,
      title: String,
      description: String,
      icon: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  // Quiz arena stats
  quizStats: {
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    coins: {
      type: Number,
      default: 100
    },
    totalQuizzes: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    achievements: [{
      achievementId: String,
      unlockedAt: Date,
      progress: Number,
      maxProgress: Number
    }],
    gameHistory: [{
      gameMode: String,
      category: String,
      score: Number,
      questionsAnswered: Number,
      correctAnswers: Number,
      playedAt: { type: Date, default: Date.now }
    }]
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Security-related methods
userSchema.methods.recordFailedLogin = async function(ip, userAgent) {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();
  
  // Add to login history
  this.loginHistory.push({
    ip,
    userAgent,
    timestamp: new Date(),
    successful: false
  });
  
  // Keep only last 50 login attempts
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountStatus = 'suspended';
    this.suspendedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  await this.save();
};

userSchema.methods.recordSuccessfulLogin = async function(ip, userAgent, location = {}) {
  this.failedLoginAttempts = 0;
  this.lastLogin = new Date();
  
  // Add to login history
  this.loginHistory.push({
    ip,
    userAgent,
    location,
    timestamp: new Date(),
    successful: true
  });
  
  // Keep only last 50 login attempts
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  await this.save();
};

userSchema.methods.isAccountLocked = function() {
  if (this.accountStatus === 'suspended' && this.suspendedUntil) {
    return this.suspendedUntil > new Date();
  }
  return this.accountStatus === 'banned';
};

userSchema.methods.generateTwoFactorBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  this.twoFactorAuth.backupCodes = codes;
  return codes;
};

userSchema.methods.acceptLegalAgreements = function(version = '1.0') {
  const now = new Date();
  this.legalAgreements.termsAccepted = true;
  this.legalAgreements.termsAcceptedAt = now;
  this.legalAgreements.privacyPolicyAccepted = true;
  this.legalAgreements.privacyPolicyAcceptedAt = now;
  this.legalAgreements.cookiePolicyAccepted = true;
  this.legalAgreements.cookiePolicyAcceptedAt = now;
  this.legalAgreements.currentTermsVersion = version;
  this.legalAgreements.currentPrivacyVersion = version;
};

userSchema.methods.needsToAcceptUpdatedTerms = function(currentVersion = '1.0') {
  return !this.legalAgreements.termsAccepted || 
         this.legalAgreements.currentTermsVersion !== currentVersion ||
         !this.legalAgreements.privacyPolicyAccepted ||
         this.legalAgreements.currentPrivacyVersion !== currentVersion;
};

userSchema.methods.addTrustedDevice = function(fingerprint, name, userAgent) {
  const existingDevice = this.deviceFingerprints.find(d => d.fingerprint === fingerprint);
  if (existingDevice) {
    existingDevice.lastSeen = new Date();
    existingDevice.trusted = true;
  } else {
    this.deviceFingerprints.push({
      fingerprint,
      name: name || 'Unknown Device',
      trusted: true,
      lastSeen: new Date()
    });
  }
  
  // Keep only last 10 devices
  if (this.deviceFingerprints.length > 10) {
    this.deviceFingerprints = this.deviceFingerprints
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 10);
  }
};

userSchema.methods.isDeviceTrusted = function(fingerprint) {
  const device = this.deviceFingerprints.find(d => d.fingerprint === fingerprint);
  return device && device.trusted;
};

const User = mongoose.model('User', userSchema);
export default User;
