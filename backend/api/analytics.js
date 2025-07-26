const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Session = require('../models/Session');
const Campaign = require('../models/Campaign');

// Get analytics overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const { domain, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    if (domain) query.domain = domain;
    
    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      query.startTime = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Get aggregate data
    const [
      totalSessions,
      totalPageViews,
      totalConversions,
      uniqueVisitors,
      avgDuration,
      bounceRate,
    ] = await Promise.all([
      Session.countDocuments(query),
      Session.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$pageViews' } } },
      ]),
      Session.aggregate([
        { $match: query },
        { $unwind: '$conversions' },
        { $count: 'total' },
      ]),
      Session.distinct('visitorId', query),
      Session.aggregate([
        { $match: query },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]),
      Session.aggregate([
        { $match: { ...query, bounced: true } },
        { $count: 'bounced' },
      ]),
    ]);

    const overview = {
      sessions: totalSessions,
      pageViews: totalPageViews[0]?.total || 0,
      conversions: totalConversions[0]?.total || 0,
      uniqueVisitors: uniqueVisitors.length,
      avgSessionDuration: avgDuration[0]?.avg || 0,
      bounceRate: totalSessions > 0 
        ? ((bounceRate[0]?.bounced || 0) / totalSessions * 100).toFixed(2)
        : 0,
    };

    res.json(overview);
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get traffic sources
router.get('/sources', authMiddleware, async (req, res) => {
  try {
    const { domain, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    if (domain) query.domain = domain;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    } else {
      query.startTime = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const sources = await Session.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            source: '$utm.source',
            medium: '$utm.medium',
          },
          sessions: { $sum: 1 },
          pageViews: { $sum: '$pageViews' },
          conversions: { $sum: { $size: '$conversions' } },
          bounced: { $sum: { $cond: ['$bounced', 1, 0] } },
          totalDuration: { $sum: '$duration' },
          revenue: {
            $sum: {
              $reduce: {
                input: '$conversions',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.value'] },
              },
            },
          },
        },
      },
      {
        $project: {
          source: '$_id.source',
          medium: '$_id.medium',
          sessions: 1,
          pageViews: 1,
          conversions: 1,
          bounceRate: {
            $cond: [
              { $eq: ['$sessions', 0] },
              0,
              { $multiply: [{ $divide: ['$bounced', '$sessions'] }, 100] },
            ],
          },
          avgDuration: {
            $cond: [
              { $eq: ['$sessions', 0] },
              0,
              { $divide: ['$totalDuration', '$sessions'] },
            ],
          },
          conversionRate: {
            $cond: [
              { $eq: ['$sessions', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$sessions'] }, 100] },
            ],
          },
          revenue: 1,
        },
      },
      { $sort: { sessions: -1 } },
    ]);

    res.json(sources);
  } catch (error) {
    console.error('Traffic sources error:', error);
    res.status(500).json({ error: 'Failed to fetch traffic sources' });
  }
});

// Get page analytics
router.get('/pages', authMiddleware, async (req, res) => {
  try {
    const { domain, startDate, endDate, limit = 20 } = req.query;
    
    const query = { userId: req.user._id };
    if (domain) query.domain = domain;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    } else {
      query.startTime = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Get top pages by session count
    const topPages = await Session.aggregate([
      { $match: query },
      {
        $facet: {
          entryPages: [
            { $group: { _id: '$entryPage.url', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
          ],
          exitPages: [
            { $group: { _id: '$exitPage.url', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
          ],
        },
      },
    ]);

    res.json({
      entryPages: topPages[0].entryPages,
      exitPages: topPages[0].exitPages,
    });
  } catch (error) {
    console.error('Page analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch page analytics' });
  }
});

// Get conversion funnel
router.get('/funnel', authMiddleware, async (req, res) => {
  try {
    const { domain, funnelSteps } = req.query;
    
    if (!funnelSteps || !Array.isArray(JSON.parse(funnelSteps))) {
      return res.status(400).json({ error: 'Funnel steps required' });
    }

    const steps = JSON.parse(funnelSteps);
    const query = { userId: req.user._id };
    if (domain) query.domain = domain;

    // This is a simplified funnel analysis
    // In production, you'd want to track actual user paths
    const funnelData = [];
    
    for (const step of steps) {
      const count = await Session.countDocuments({
        ...query,
        $or: [
          { 'entryPage.url': { $regex: step.url } },
          { 'exitPage.url': { $regex: step.url } },
        ],
      });

      funnelData.push({
        step: step.name,
        url: step.url,
        visitors: count,
      });
    }

    // Calculate drop-off rates
    const funnelWithDropoff = funnelData.map((step, index) => {
      if (index === 0) {
        return { ...step, dropoffRate: 0 };
      }
      
      const previousVisitors = funnelData[index - 1].visitors;
      const dropoffRate = previousVisitors > 0
        ? ((previousVisitors - step.visitors) / previousVisitors * 100).toFixed(2)
        : 0;
      
      return { ...step, dropoffRate };
    });

    res.json(funnelWithDropoff);
  } catch (error) {
    console.error('Funnel analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze funnel' });
  }
});

// Get real-time analytics
router.get('/realtime', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.query;
    
    const query = {
      userId: req.user._id,
      startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
    };
    if (domain) query.domain = domain;

    const [activeSessions, recentPageViews] = await Promise.all([
      Session.find({
        ...query,
        endTime: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Active in last 5 minutes
      }).select('visitorId utm entryPage device.type location.country'),
      
      Session.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              minute: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M',
                  date: '$startTime',
                },
              },
            },
            pageViews: { $sum: '$pageViews' },
          },
        },
        { $sort: { '_id.minute': -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      activeUsers: activeSessions.length,
      activeSessions: activeSessions.slice(0, 10), // Top 10 active sessions
      pageViewsTimeline: recentPageViews.reverse(),
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time data' });
  }
});

// Get dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { domain, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    if (domain) query.domain = domain;
    
    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Get aggregate data
    const [
      totalSessions,
      uniqueVisitors,
      totalPageViews,
      sessions
    ] = await Promise.all([
      Session.countDocuments(query),
      Session.distinct('visitorId', query).then(v => v.length),
      Session.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$pageViews' } } }
      ]).then(r => r[0]?.total || 0),
      Session.find(query)
        .sort('-startTime')
        .limit(20)
        .select('visitorId utm startTime endTime pageViews duration bounced')
    ]);

    // Calculate average duration
    const avgDuration = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
      : 0;

    // Get traffic sources
    const trafficSources = await Session.aggregate([
      { $match: query },
      {
        $group: {
          _id: { source: '$utm.source', medium: '$utm.medium' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { sessions: -1 } },
      { $limit: 5 }
    ]).then(sources => sources.map(s => ({
      source: s._id.source || 'direct',
      medium: s._id.medium || 'none',
      sessions: s.sessions
    })));

    res.json({
      totalSessions,
      uniqueVisitors,
      pageViews: totalPageViews,
      avgDuration,
      trafficSources,
      recentSessions: sessions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get sessions list
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const { limit = 100, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort('-startTime')
      .limit(parseInt(limit))
      .select('sessionId visitorId utm startTime endTime pageViews duration bounced entryPage exitPage pages');

    res.json({ sessions });
  } catch (error) {
    console.error('Sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;