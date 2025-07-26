const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UTMUser',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  budget: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    spent: {
      type: Number,
      default: 0,
    },
  },
  platform: {
    type: String,
    enum: ['google', 'facebook', 'instagram', 'pinterest', 'linkedin', 'twitter', 'email', 'other'],
    required: true,
  },
  type: {
    type: String,
    enum: ['awareness', 'consideration', 'conversion', 'retention'],
    default: 'conversion',
  },
  utmDefaults: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_content: String,
    utm_term: String,
  },
  links: [{
    shortId: {
      type: String,
      unique: true,
      sparse: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    finalUrl: String,
    qrCode: String,
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    metadata: {
      product: String,
      variant: String,
      placement: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  performance: {
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    roi: {
      type: Number,
      default: 0,
    },
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

campaignSchema.methods.calculateROI = function() {
  if (this.performance.cost === 0) return 0;
  this.performance.roi = ((this.performance.revenue - this.performance.cost) / this.performance.cost) * 100;
  return this.performance.roi;
};

campaignSchema.methods.updatePerformance = function(metrics) {
  Object.keys(metrics).forEach(key => {
    if (this.performance[key] !== undefined) {
      this.performance[key] += metrics[key];
    }
  });
  this.calculateROI();
};

module.exports = mongoose.model('Campaign', campaignSchema);