const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);
const { authMiddleware } = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// UTM Builder - Generate UTM links
router.post('/build', authMiddleware, [
  body('url').isURL(),
  body('utm_source').trim().notEmpty(),
  body('utm_medium').trim().notEmpty(),
  body('utm_campaign').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      campaignId,
      generateShortLink = true,
      metadata = {},
    } = req.body;

    // Build UTM URL
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', utm_source);
    urlObj.searchParams.set('utm_medium', utm_medium);
    urlObj.searchParams.set('utm_campaign', utm_campaign);
    
    if (utm_content) urlObj.searchParams.set('utm_content', utm_content);
    if (utm_term) urlObj.searchParams.set('utm_term', utm_term);

    const finalUrl = urlObj.toString();
    
    let shortId = null;
    let shortUrl = null;

    if (generateShortLink) {
      shortId = nanoid();
      shortUrl = `${req.protocol}://${req.get('host')}/r/${shortId}`;
    }

    // If associated with a campaign, add link to campaign
    if (campaignId) {
      const campaign = await Campaign.findOne({
        _id: campaignId,
        userId: req.user._id,
      });

      if (campaign) {
        campaign.links.push({
          shortId,
          originalUrl: url,
          finalUrl,
          metadata,
        });
        await campaign.save();
      }
    }

    // Save to Redis for quick lookup (if Redis is available)
    if (shortId && req.app.locals.redis) {
      try {
        await req.app.locals.redis.setex(
          `shortlink:${shortId}`,
          86400 * 30, // 30 days
          JSON.stringify({
            finalUrl,
            userId: req.user._id.toString(),
            campaignId,
            createdAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error('Redis save error:', error.message);
        // Continue without Redis - link will still work via MongoDB
      }
    }

    res.json({
      originalUrl: url,
      finalUrl,
      shortUrl,
      shortId,
      utm: {
        source: utm_source,
        medium: utm_medium,
        campaign: utm_campaign,
        content: utm_content,
        term: utm_term,
      },
    });
  } catch (error) {
    console.error('UTM build error:', error);
    res.status(500).json({ error: 'Failed to generate UTM link' });
  }
});

// Get UTM templates
router.get('/templates', authMiddleware, (req, res) => {
  const templates = {
    platforms: {
      google: {
        name: 'Google Ads',
        utm_source: 'google',
        utm_medium: 'cpc',
        fields: ['campaign', 'content', 'term'],
      },
      facebook: {
        name: 'Facebook',
        utm_source: 'facebook',
        utm_medium: 'social',
        fields: ['campaign', 'content'],
      },
      instagram: {
        name: 'Instagram',
        utm_source: 'instagram',
        utm_medium: 'social',
        fields: ['campaign', 'content'],
      },
      pinterest: {
        name: 'Pinterest',
        utm_source: 'pinterest',
        utm_medium: 'social',
        fields: ['campaign', 'content'],
      },
      linkedin: {
        name: 'LinkedIn',
        utm_source: 'linkedin',
        utm_medium: 'social',
        fields: ['campaign', 'content'],
      },
      email: {
        name: 'Email',
        utm_source: 'newsletter',
        utm_medium: 'email',
        fields: ['campaign', 'content'],
      },
    },
    campaignTypes: {
      product_launch: {
        name: 'Product Launch',
        utm_campaign: 'product-launch-{product-name}',
        utm_content: '{variant}',
      },
      seasonal_sale: {
        name: 'Seasonal Sale',
        utm_campaign: '{season}-sale-{year}',
        utm_content: '{offer-type}',
      },
      brand_awareness: {
        name: 'Brand Awareness',
        utm_campaign: 'brand-awareness-{month}-{year}',
        utm_content: '{creative-variant}',
      },
      retargeting: {
        name: 'Retargeting',
        utm_campaign: 'retargeting-{audience}',
        utm_content: '{message-variant}',
      },
    },
  };

  res.json(templates);
});

// Bulk UTM creation
router.post('/bulk', authMiddleware, [
  body('links').isArray().isLength({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { links, campaignId } = req.body;
    const results = [];

    for (const link of links) {
      const {
        url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        metadata = {},
      } = link;

      if (!url || !utm_source || !utm_medium || !utm_campaign) {
        results.push({
          error: 'Missing required fields',
          original: link,
        });
        continue;
      }

      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('utm_source', utm_source);
        urlObj.searchParams.set('utm_medium', utm_medium);
        urlObj.searchParams.set('utm_campaign', utm_campaign);
        
        if (utm_content) urlObj.searchParams.set('utm_content', utm_content);
        if (utm_term) urlObj.searchParams.set('utm_term', utm_term);

        const finalUrl = urlObj.toString();
        const shortId = nanoid();
        const shortUrl = `${req.protocol}://${req.get('host')}/r/${shortId}`;

        // Save to Redis (if available)
        if (req.app.locals.redis) {
          try {
            await req.app.locals.redis.setex(
              `shortlink:${shortId}`,
              86400 * 30,
              JSON.stringify({
                finalUrl,
                userId: req.user._id.toString(),
                campaignId,
                metadata,
                createdAt: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.error('Redis save error:', error.message);
          }
        }

        results.push({
          originalUrl: url,
          finalUrl,
          shortUrl,
          shortId,
          utm: {
            source: utm_source,
            medium: utm_medium,
            campaign: utm_campaign,
            content: utm_content,
            term: utm_term,
          },
        });
      } catch (error) {
        results.push({
          error: error.message,
          original: link,
        });
      }
    }

    // If associated with a campaign, add all links
    if (campaignId) {
      const campaign = await Campaign.findOne({
        _id: campaignId,
        userId: req.user._id,
      });

      if (campaign) {
        const validLinks = results.filter(r => !r.error);
        for (const link of validLinks) {
          campaign.links.push({
            shortId: link.shortId,
            originalUrl: link.originalUrl,
            finalUrl: link.finalUrl,
            metadata: link.metadata || {},
          });
        }
        await campaign.save();
      }
    }

    res.json({
      total: links.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    });
  } catch (error) {
    console.error('Bulk UTM error:', error);
    res.status(500).json({ error: 'Failed to process bulk UTM links' });
  }
});

// Get UTM link history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Get campaigns with links
    const campaigns = await Campaign.find({ userId: req.user._id })
      .select('name links createdAt')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const links = [];
    campaigns.forEach(campaign => {
      campaign.links.forEach(link => {
        links.push({
          ...link.toObject(),
          campaignName: campaign.name,
          campaignId: campaign._id,
        });
      });
    });

    // Sort by creation date
    links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      links: links.slice(0, limit),
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: links.length > limit,
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch link history' });
  }
});

module.exports = router;