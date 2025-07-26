const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Session = require('../models/Session');

// Get user's domains
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }
    
    const user = await User.findById(userId).select('domains');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ domains: user.domains || [] });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Add new domain
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Clean domain (remove protocol, www, trailing slash)
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Check if domain already exists for any user
    const existingUser = await User.findOne({ 'domains.domain': cleanDomain });
    if (existingUser && existingUser._id.toString() !== req.userId) {
      return res.status(400).json({ 
        error: 'This domain is already claimed by another user' 
      });
    }

    // Get current user
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);
    
    // Check if user already has this domain
    const alreadyHas = user.domains.some(d => d.domain === cleanDomain);
    if (alreadyHas) {
      return res.status(400).json({ error: 'You already have this domain' });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // Add domain to user
    user.domains.push({
      domain: cleanDomain,
      verified: false,
      verificationCode,
      addedAt: new Date()
    });

    await user.save();

    res.json({ 
      success: true,
      domain: cleanDomain,
      verificationCode,
      message: 'Domain added successfully. Please verify ownership.'
    });
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(500).json({ error: 'Failed to add domain' });
  }
});

// Verify domain ownership
router.post('/verify/:domain', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.params;
    const userId = req.userId || req.user?._id;
    
    const user = await User.findById(userId);
    const domainEntry = user.domains.find(d => d.domain === domain);
    
    if (!domainEntry) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domainEntry.verified) {
      return res.status(400).json({ error: 'Domain already verified' });
    }

    // Check if tracking data has been received from this domain
    const session = await Session.findOne({ 
      domain: domain,
      userId: userId 
    });

    if (session) {
      // Domain is verified if we received tracking data
      domainEntry.verified = true;
      domainEntry.verifiedAt = new Date();
      await user.save();

      return res.json({ 
        success: true, 
        message: 'Domain verified successfully!' 
      });
    }

    res.status(400).json({ 
      error: 'No tracking data received from this domain yet. Please install the tracking code first.' 
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

// Remove domain
router.delete('/:domain', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.params;
    const userId = req.userId || req.user?._id;
    
    const user = await User.findById(userId);
    user.domains = user.domains.filter(d => d.domain !== domain);
    await user.save();

    res.json({ success: true, message: 'Domain removed successfully' });
  } catch (error) {
    console.error('Error removing domain:', error);
    res.status(500).json({ error: 'Failed to remove domain' });
  }
});

// Get domain stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);
    const domains = user.domains.map(d => d.domain);
    
    // Get session counts per domain
    const stats = await Session.aggregate([
      {
        $match: {
          userId: user._id,
          domain: { $in: domains }
        }
      },
      {
        $group: {
          _id: '$domain',
          totalSessions: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          domain: '$_id',
          totalSessions: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          _id: 0
        }
      }
    ]);

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching domain stats:', error);
    res.status(500).json({ error: 'Failed to fetch domain stats' });
  }
});

module.exports = router;