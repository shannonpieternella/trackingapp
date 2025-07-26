const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  organization: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user',
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  domains: [{
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verifiedAt: Date,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    monthlyPageViews: {
      type: Number,
      default: 10000,
    },
    startDate: Date,
    endDate: Date,
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyReports: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

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

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateApiKey = function() {
  const { nanoid } = require('nanoid');
  this.apiKey = `utm_${nanoid(32)}`;
  return this.apiKey;
};

module.exports = mongoose.model('UTMUser', userSchema);