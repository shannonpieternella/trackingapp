const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// Get all campaigns
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (platform) query.platform = platform;

    const campaigns = await Campaign.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/', authMiddleware, [
  body('name').trim().isLength({ min: 1 }),
  body('platform').isIn(['google', 'facebook', 'instagram', 'pinterest', 'linkedin', 'twitter', 'email', 'other']),
  body('startDate').isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaignData = {
      userId: req.user._id,
      ...req.body,
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'status', 'endDate', 'budget', 'tags'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    campaign.updatedAt = new Date();
    await campaign.save();

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Campaign.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Get campaign performance
router.get('/:id/performance', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate additional metrics
    const performance = {
      ...campaign.performance,
      ctr: campaign.performance.impressions > 0 
        ? (campaign.performance.clicks / campaign.performance.impressions * 100).toFixed(2)
        : 0,
      conversionRate: campaign.performance.clicks > 0
        ? (campaign.performance.conversions / campaign.performance.clicks * 100).toFixed(2)
        : 0,
      cpa: campaign.performance.conversions > 0
        ? (campaign.performance.cost / campaign.performance.conversions).toFixed(2)
        : 0,
      roas: campaign.performance.cost > 0
        ? (campaign.performance.revenue / campaign.performance.cost).toFixed(2)
        : 0,
    };

    // Get link performance
    const linkPerformance = campaign.links.map(link => ({
      shortId: link.shortId,
      url: link.originalUrl,
      clicks: link.clicks,
      conversions: link.conversions,
      revenue: link.revenue,
      conversionRate: link.clicks > 0 
        ? (link.conversions / link.clicks * 100).toFixed(2)
        : 0,
    }));

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
      },
      performance,
      linkPerformance,
      lastUpdated: campaign.updatedAt,
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

module.exports = router;