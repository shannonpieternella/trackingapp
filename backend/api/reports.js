const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Session = require('../models/Session');
const Campaign = require('../models/Campaign');

// Generate campaign report
router.get('/campaign/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: req.user._id,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get sessions for this campaign
    const query = {
      userId: req.user._id,
      'utm.campaign': campaign.utmDefaults.utm_campaign,
    };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query);

    // Calculate metrics
    const metrics = {
      totalSessions: sessions.length,
      uniqueVisitors: new Set(sessions.map(s => s.visitorId)).size,
      totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0),
      avgSessionDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length || 0,
      bounceRate: (sessions.filter(s => s.bounced).length / sessions.length * 100) || 0,
      conversions: sessions.reduce((sum, s) => sum + s.conversions.length, 0),
      revenue: sessions.reduce((sum, s) => 
        sum + s.conversions.reduce((cSum, c) => cSum + (c.value || 0), 0), 0
      ),
    };

    // Get daily breakdown
    const dailyBreakdown = {};
    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          sessions: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      dailyBreakdown[date].sessions++;
      dailyBreakdown[date].conversions += session.conversions.length;
      dailyBreakdown[date].revenue += session.conversions.reduce((sum, c) => sum + (c.value || 0), 0);
    });

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
      },
      metrics,
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
        date,
        ...data,
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      reportGeneratedAt: new Date(),
    });
  } catch (error) {
    console.error('Campaign report error:', error);
    res.status(500).json({ error: 'Failed to generate campaign report' });
  }
});

// Generate attribution report
router.get('/attribution', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, domain } = req.query;

    const query = { userId: req.user._id };
    if (domain) query.domain = domain;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    } else {
      query.startTime = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Get attribution data by source/medium/campaign
    const attribution = await Session.aggregate([
      { $match: { ...query, conversions: { $exists: true, $ne: [] } } },
      { $unwind: '$conversions' },
      {
        $group: {
          _id: {
            source: '$utm.source',
            medium: '$utm.medium',
            campaign: '$utm.campaign',
          },
          conversions: { $sum: 1 },
          revenue: { $sum: '$conversions.value' },
          firstTouch: { $min: '$startTime' },
          lastTouch: { $max: '$startTime' },
        },
      },
      {
        $project: {
          attribution: '$_id',
          conversions: 1,
          revenue: 1,
          firstTouch: 1,
          lastTouch: 1,
          avgRevenue: { $divide: ['$revenue', '$conversions'] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      attribution,
      summary: {
        totalConversions: attribution.reduce((sum, a) => sum + a.conversions, 0),
        totalRevenue: attribution.reduce((sum, a) => sum + a.revenue, 0),
        topSource: attribution[0]?.attribution.source || 'N/A',
      },
      reportGeneratedAt: new Date(),
    });
  } catch (error) {
    console.error('Attribution report error:', error);
    res.status(500).json({ error: 'Failed to generate attribution report' });
  }
});

// Export data as CSV
router.get('/export/sessions', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, domain, format = 'csv' } = req.query;

    const query = { userId: req.user._id };
    if (domain) query.domain = domain;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .limit(10000) // Limit to prevent memory issues
      .lean();

    if (format === 'csv') {
      const csv = [
        // Headers
        [
          'Session ID',
          'Visitor ID',
          'Domain',
          'Start Time',
          'Duration (s)',
          'Page Views',
          'Bounced',
          'UTM Source',
          'UTM Medium',
          'UTM Campaign',
          'UTM Content',
          'UTM Term',
          'Entry Page',
          'Exit Page',
          'Device',
          'Country',
          'Conversions',
          'Revenue',
        ].join(','),
        // Data rows
        ...sessions.map(s => [
          s.sessionId,
          s.visitorId,
          s.domain,
          s.startTime.toISOString(),
          s.duration,
          s.pageViews,
          s.bounced,
          s.utm.source || '',
          s.utm.medium || '',
          s.utm.campaign || '',
          s.utm.content || '',
          s.utm.term || '',
          s.entryPage?.url || '',
          s.exitPage?.url || '',
          s.device?.type || '',
          s.location?.country || '',
          s.conversions.length,
          s.conversions.reduce((sum, c) => sum + (c.value || 0), 0),
        ].map(v => `"${v}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sessions-export.csv"');
      res.send(csv);
    } else {
      res.json(sessions);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;