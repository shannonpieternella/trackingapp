const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { authMiddleware } = require('../middleware/auth');

// Get conversion paths - which pages lead to conversions
router.get('/conversion-paths', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const query = {
      userId: req.user._id,
      conversions: { $exists: true, $ne: [] }
    };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Get sessions with conversions
    const convertedSessions = await Session.find(query)
      .select('utm entryPage exitPage pageViews conversions')
      .sort('-startTime')
      .limit(100);

    // Analyze paths
    const pathAnalysis = {
      // Which UTM sources convert best
      sourceConversions: {},
      // Which entry pages convert best
      entryPageConversions: {},
      // Common conversion paths
      paths: [],
      // Total conversions
      totalConversions: 0,
      // Conversion value by source
      revenueBySource: {}
    };

    convertedSessions.forEach(session => {
      // Count by UTM source
      const source = session.utm?.source || 'direct';
      if (!pathAnalysis.sourceConversions[source]) {
        pathAnalysis.sourceConversions[source] = {
          count: 0,
          revenue: 0,
          avgPageViews: 0
        };
      }
      pathAnalysis.sourceConversions[source].count += session.conversions.length;
      pathAnalysis.sourceConversions[source].revenue += session.conversions.reduce((sum, c) => sum + (c.value || 0), 0);
      pathAnalysis.sourceConversions[source].avgPageViews += session.pageViews;

      // Count by entry page
      const entryPage = session.entryPage?.url || 'unknown';
      if (!pathAnalysis.entryPageConversions[entryPage]) {
        pathAnalysis.entryPageConversions[entryPage] = 0;
      }
      pathAnalysis.entryPageConversions[entryPage]++;

      // Add to paths
      pathAnalysis.paths.push({
        source: `${session.utm?.source || 'direct'}/${session.utm?.medium || 'none'}`,
        entryPage: session.entryPage?.url,
        exitPage: session.exitPage?.url,
        pageViews: session.pageViews,
        conversions: session.conversions.length,
        revenue: session.conversions.reduce((sum, c) => sum + (c.value || 0), 0)
      });

      pathAnalysis.totalConversions += session.conversions.length;
    });

    // Calculate averages
    Object.keys(pathAnalysis.sourceConversions).forEach(source => {
      const data = pathAnalysis.sourceConversions[source];
      data.avgPageViews = data.count > 0 ? (data.avgPageViews / data.count).toFixed(1) : 0;
    });

    res.json(pathAnalysis);
  } catch (error) {
    console.error('Journey analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze conversion paths' });
  }
});

// Get user flow - how users navigate through the site
router.get('/user-flow', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Get all sessions
    const sessions = await Session.find(query)
      .select('utm entryPage exitPage pageViews bounced duration conversions')
      .limit(1000);

    // Analyze user flow
    const flowAnalysis = {
      // Page statistics
      pageStats: {},
      // Traffic source quality
      sourceQuality: {},
      // Conversion rate by page views
      conversionByPageViews: {
        '1': { sessions: 0, conversions: 0 },
        '2-3': { sessions: 0, conversions: 0 },
        '4-6': { sessions: 0, conversions: 0 },
        '7+': { sessions: 0, conversions: 0 }
      }
    };

    sessions.forEach(session => {
      const source = session.utm?.source || 'direct';
      
      // Source quality metrics
      if (!flowAnalysis.sourceQuality[source]) {
        flowAnalysis.sourceQuality[source] = {
          sessions: 0,
          avgDuration: 0,
          avgPageViews: 0,
          bounceRate: 0,
          conversions: 0,
          bounced: 0
        };
      }
      
      const sq = flowAnalysis.sourceQuality[source];
      sq.sessions++;
      sq.avgDuration += session.duration || 0;
      sq.avgPageViews += session.pageViews || 0;
      sq.conversions += session.conversions?.length || 0;
      if (session.bounced) sq.bounced++;

      // Conversion by page views
      if (session.pageViews === 1) {
        flowAnalysis.conversionByPageViews['1'].sessions++;
        if (session.conversions?.length > 0) {
          flowAnalysis.conversionByPageViews['1'].conversions++;
        }
      } else if (session.pageViews <= 3) {
        flowAnalysis.conversionByPageViews['2-3'].sessions++;
        if (session.conversions?.length > 0) {
          flowAnalysis.conversionByPageViews['2-3'].conversions++;
        }
      } else if (session.pageViews <= 6) {
        flowAnalysis.conversionByPageViews['4-6'].sessions++;
        if (session.conversions?.length > 0) {
          flowAnalysis.conversionByPageViews['4-6'].conversions++;
        }
      } else {
        flowAnalysis.conversionByPageViews['7+'].sessions++;
        if (session.conversions?.length > 0) {
          flowAnalysis.conversionByPageViews['7+'].conversions++;
        }
      }
    });

    // Calculate averages and rates
    Object.keys(flowAnalysis.sourceQuality).forEach(source => {
      const sq = flowAnalysis.sourceQuality[source];
      sq.avgDuration = sq.sessions > 0 ? (sq.avgDuration / sq.sessions).toFixed(0) : 0;
      sq.avgPageViews = sq.sessions > 0 ? (sq.avgPageViews / sq.sessions).toFixed(1) : 0;
      sq.bounceRate = sq.sessions > 0 ? ((sq.bounced / sq.sessions) * 100).toFixed(1) : 0;
      sq.conversionRate = sq.sessions > 0 ? ((sq.conversions / sq.sessions) * 100).toFixed(1) : 0;
    });

    // Calculate conversion rates
    Object.keys(flowAnalysis.conversionByPageViews).forEach(key => {
      const data = flowAnalysis.conversionByPageViews[key];
      data.rate = data.sessions > 0 ? ((data.conversions / data.sessions) * 100).toFixed(1) : 0;
    });

    res.json(flowAnalysis);
  } catch (error) {
    console.error('User flow error:', error);
    res.status(500).json({ error: 'Failed to analyze user flow' });
  }
});

module.exports = router;