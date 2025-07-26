const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UTMUser',
    required: true,
  },
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  domain: {
    type: String,
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
  pageViews: {
    type: Number,
    default: 0,
  },
  events: {
    type: Number,
    default: 0,
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
    content: String,
    term: String,
  },
  entryPage: {
    url: String,
    title: String,
  },
  exitPage: {
    url: String,
    title: String,
  },
  referrer: {
    url: String,
    source: String,
    type: String,
  },
  device: {
    type: String,
    os: String,
    osVersion: String,
    browser: String,
    browserVersion: String,
    screenResolution: String,
    viewport: String,
  },
  location: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    timezone: String,
    language: String,
  },
  network: {
    ip: String,
    isp: String,
    connectionType: String,
  },
  conversions: [{
    type: {
      type: String,
      enum: ['purchase', 'signup', 'download', 'custom'],
    },
    value: Number,
    currency: String,
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed,
  }],
  bounced: {
    type: Boolean,
    default: false,
  },
  quality: {
    score: {
      type: Number,
      default: 0,
    },
    signals: {
      timeOnSite: Number,
      pagesPerSession: Number,
      scrollDepth: Number,
      interactions: Number,
    },
  },
});

sessionSchema.methods.calculateQualityScore = function() {
  let score = 0;
  
  if (this.duration > 30) score += 25;
  if (this.pageViews > 2) score += 25;
  if (this.quality.signals.scrollDepth > 50) score += 25;
  if (this.quality.signals.interactions > 0) score += 25;
  
  this.quality.score = score;
  return score;
};

sessionSchema.methods.markConversion = function(type, value, currency = 'USD', metadata = {}) {
  this.conversions.push({
    type,
    value,
    currency,
    timestamp: new Date(),
    metadata,
  });
};

sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ domain: 1, startTime: -1 });
sessionSchema.index({ 'utm.source': 1, 'utm.medium': 1, 'utm.campaign': 1 });

module.exports = mongoose.model('Session', sessionSchema);