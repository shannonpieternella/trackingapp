const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../middleware/auth');
const { trackEvent } = require('../controllers/tracking');

// Track custom events
router.post('/event', trackEvent);

// Server-side tracking endpoint
router.post('/server', async (req, res) => {
  try {
    const {
      sessionId,
      visitorId,
      domain,
      page,
      title,
      referrer,
      utm,
      userAgent,
      ip
    } = req.body;

    // Import Session model
    const Session = require('../models/Session');

    // Validate required fields
    if (!sessionId || !visitorId || !domain) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find or create session
    let session = await Session.findOne({ sessionId });

    if (!session) {
      session = new Session({
        sessionId,
        visitorId,
        domain,
        utm: utm || {},
        startTime: new Date(),
        entryPage: {
          url: page || '/',
          title: title || ''
        },
        referrer: referrer || '',
        device: parseDevice(userAgent),
        ip: ip,
        pageViews: 0,
        pages: []
      });
    }

    // Add page view
    session.pages.push({
      url: page || '/',
      title: title || '',
      timestamp: new Date()
    });
    session.pageViews = session.pages.length;
    session.lastActivity = new Date();
    session.exitPage = {
      url: page || '/',
      title: title || ''
    };

    // Calculate duration
    if (session.startTime) {
      session.duration = Math.floor((session.lastActivity - session.startTime) / 1000);
    }

    await session.save();

    res.json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    console.error('Server tracking error:', error);
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Helper function to parse device info
function parseDevice(userAgent) {
  const ua = userAgent || '';
  
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
  
  return { type: device, os, browser };
}

// Get tracking script
router.get('/script.js', (req, res) => {
  const { domain } = req.query;
  
  if (!domain) {
    return res.status(400).send('// Domain parameter required');
  }

  const trackingScript = `
(function() {
  'use strict';
  
  // UTM Tracker Configuration
  const config = {
    domain: '${domain}',
    endpoint: '${req.protocol}://${req.get('host')}/t.gif',
    apiEndpoint: '${req.protocol}://${req.get('host')}/api/tracking/event',
    cookiePrefix: 'utm_',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  };
  
  // Get or create visitor ID
  function getVisitorId() {
    let vid = getCookie(config.cookiePrefix + 'vid');
    if (!vid) {
      vid = generateId();
      setCookie(config.cookiePrefix + 'vid', vid, 365);
    }
    return vid;
  }
  
  // Get or create session ID
  function getSessionId() {
    let sid = getCookie(config.cookiePrefix + 'sid');
    if (!sid) {
      sid = generateId();
    }
    setCookie(config.cookiePrefix + 'sid', sid, 0.5); // 30 minutes
    return sid;
  }
  
  // Generate unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Cookie helpers
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/;domain=' + location.hostname;
  }
  
  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  
  // Get UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      if (params.has(param)) {
        utm[param] = params.get(param);
      }
    });
    
    // Store UTM params in session
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(config.cookiePrefix + 'utm', JSON.stringify(utm));
    }
    
    // Return stored UTM params if no new ones
    const storedUTM = sessionStorage.getItem(config.cookiePrefix + 'utm');
    return storedUTM ? JSON.parse(storedUTM) : utm;
  }
  
  // Track page view
  function trackPageView() {
    const utm = getUTMParams();
    const data = {
      sid: getSessionId(),
      vid: getVisitorId(),
      d: config.domain,
      p: window.location.href,
      t: document.title,
      r: document.referrer,
      e: 'pageview',
      ...utm
    };
    
    // Send tracking pixel
    const img = new Image(1, 1);
    img.src = config.endpoint + '?' + new URLSearchParams(data).toString();
  }
  
  // Track custom events
  window.utmTracker = {
    track: function(eventType, eventData) {
      const utm = getUTMParams();
      const data = {
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
        domain: config.domain,
        eventType: eventType,
        eventData: eventData,
        page: window.location.href,
        utm: utm
      };
      
      // Add API key to data
      data.apiKey = window.UTM_API_KEY || '';
      
      // Send via API
      fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': window.UTM_API_KEY || ''
        },
        body: JSON.stringify(data)
      }).catch(err => console.error('Tracking error:', err));
    },
    
    // Track conversions
    conversion: function(type, value, currency, metadata) {
      this.track('conversion', {
        type: type,
        value: value,
        currency: currency || 'USD',
        metadata: metadata || {}
      });
    },
    
    // Track form submissions
    trackForm: function(formId, eventName) {
      const form = document.getElementById(formId);
      if (form) {
        form.addEventListener('submit', function() {
          window.utmTracker.track(eventName || 'form_submit', {
            formId: formId,
            formName: form.name || formId
          });
        });
      }
    }
  };
  
  // Track page view on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
  
  // Track page views on SPA navigation
  let lastPage = window.location.href;
  setInterval(function() {
    if (window.location.href !== lastPage) {
      lastPage = window.location.href;
      trackPageView();
    }
  }, 1000);
  
})();
`;

  res.type('application/javascript');
  res.send(trackingScript);
});

module.exports = router;