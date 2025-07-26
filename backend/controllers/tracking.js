const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User'); // UTMUser in database

// Parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  // Simple parsing - in production, use a library like 'useragent'
  const device = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
  
  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';
  
  let browser = 'unknown';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  
  return { device, os, browser };
};

// Track pixel endpoint
const trackPixel = async (req, res) => {
  try {
    // Send 1x1 transparent pixel immediately
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Timing-Allow-Origin': '*'
    });
    res.end(pixel);

    // Process tracking data asynchronously
    const {
      sid, // session ID
      vid, // visitor ID
      d, // domain
      p, // page URL
      t, // page title
      r, // referrer
      e, // event type
      // UTM parameters
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = req.query;

    if (!d || !p) return;

    // Clean domain (remove www. prefix)
    const cleanDomain = d.toLowerCase().replace(/^www\./, '');
    
    // Get user from domain - try both with and without www
    let user = await User.findOne({ 
      $or: [
        { 'domains.domain': cleanDomain },
        { 'domains.domain': 'www.' + cleanDomain },
        { 'domains.domain': d }
      ]
    });
    
    // In development, if no user found with domain, try to find any user and add domain
    if (!user && process.env.NODE_ENV === 'development') {
      user = await User.findOne({});
      if (user) {
        user.domains.push({ domain: cleanDomain, verified: true });
        await user.save();
      }
    }
    
    if (!user) {
      console.log('No user found for domain:', d, 'cleaned:', cleanDomain);
      return;
    }
    
    console.log('Tracking pixel received for domain:', d, 'user:', user.email);

    const sessionId = sid || uuidv4();
    const visitorId = vid || uuidv4();
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    
    // Parse device info
    const deviceInfo = parseUserAgent(userAgent);

    // Get or create session
    let session = await Session.findOne({ sessionId });
    
    if (!session) {
      // Use direct MongoDB insert to bypass Mongoose validation
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      const sessionData = {
        sessionId,
        userId: user._id,
        visitorId,
        domain: d,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        pageViews: 1,
        events: 0,
        bounced: true,
        utm: {
          source: utm_source || 'direct',
          medium: utm_medium || 'none',
          campaign: utm_campaign || '(not set)',
          content: utm_content || null,
          term: utm_term || null,
        },
        entryPage: {
          url: p,
          title: t || 'Untitled',
        },
        exitPage: {
          url: p,
          title: t || 'Untitled',
        },
        pages: [{
          url: p,
          title: t || 'Untitled',
          timestamp: new Date()
        }],
        conversions: [],
        quality: { score: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Direct insert to MongoDB
      await sessionsCollection.insertOne(sessionData);
      
      // Get the created session for updates
      session = await Session.findOne({ sessionId });
    } else {
      // Update existing session
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      // Add page to pages array
      const newPage = {
        url: p,
        title: t || 'Untitled',
        timestamp: new Date()
      };
      
      // Update session directly in MongoDB
      await sessionsCollection.updateOne(
        { sessionId },
        {
          $set: {
            endTime: new Date(),
            duration: (new Date() - session.startTime) / 1000,
            exitPage: { url: p, title: t },
            bounced: false,
            updatedAt: new Date()
          },
          $inc: { pageViews: 1 },
          $push: { pages: newPage }
        }
      );
    }

    // Store page event in Redis for ClickHouse processing
    const pageEvent = {
      eventId: uuidv4(),
      sessionId,
      visitorId,
      userId: user._id.toString(),
      domain: d,
      page: p,
      title: t,
      referrer: r,
      eventType: e || 'pageview',
      timestamp: new Date().toISOString(),
      utm: {
        source: utm_source,
        medium: utm_medium,
        campaign: utm_campaign,
        content: utm_content,
        term: utm_term,
      },
      device: deviceInfo,
      ip,
    };

    // Push to Redis queue for batch processing (if available)
    if (req.app.locals.redis) {
      try {
        await req.app.locals.redis.lpush('page_events', JSON.stringify(pageEvent));
      } catch (error) {
        console.error('Redis page event error:', error.message);
      }
    }

  } catch (error) {
    console.error('Tracking error:', error);
  }
};

// Track events via API
const trackEvent = async (req, res) => {
  try {
    const {
      sessionId,
      visitorId,
      domain,
      eventType,
      eventData,
      page,
      utm,
    } = req.body;

    // Get API key from header or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate API key
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Validate domain (skip for localhost in development)
    if (process.env.NODE_ENV !== 'development' || domain !== 'localhost') {
      if (!user.domains.some(d => d.domain === domain)) {
        // For development, auto-add localhost
        if (process.env.NODE_ENV === 'development' && domain === 'localhost') {
          user.domains.push({ domain: 'localhost', verified: true });
          await user.save();
        } else {
          return res.status(403).json({ error: 'Domain not authorized' });
        }
      }
    }

    // Store event
    const event = {
      eventId: uuidv4(),
      sessionId: sessionId || uuidv4(),
      visitorId: visitorId || uuidv4(),
      userId: user._id.toString(),
      domain,
      eventType,
      eventData,
      page,
      utm,
      timestamp: new Date().toISOString(),
    };

    // Push to Redis queue (if available)
    if (req.app.locals.redis) {
      try {
        await req.app.locals.redis.lpush('page_events', JSON.stringify(event));
      } catch (error) {
        console.error('Redis event tracking error:', error.message);
      }
    }

    // Update session if exists
    if (sessionId) {
      const session = await Session.findOne({ sessionId });
      if (session) {
        session.events += 1;
        session.endTime = new Date();
        session.duration = (session.endTime - session.startTime) / 1000;
        
        // Handle conversion events
        if (eventType === 'conversion' && eventData) {
          session.markConversion(
            eventData.type || 'custom',
            eventData.value || 0,
            eventData.currency || 'USD',
            eventData.metadata || {}
          );
        }
        
        await session.save();
      }
    }

    res.json({ success: true, eventId: event.eventId });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

module.exports = {
  trackPixel,
  trackEvent,
};