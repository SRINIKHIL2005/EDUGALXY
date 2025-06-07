// server/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

const User = mongoose.model('User', userSchema);
export default User;
