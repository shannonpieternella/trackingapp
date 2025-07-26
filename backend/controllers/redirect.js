const handleRedirect = async (req, res) => {
  try {
    const { shortId } = req.params;
    
    if (!shortId) {
      return res.status(404).send('Link not found');
    }

    // Try to get link data from Redis first (if available)
    let link = null;
    
    if (req.app.locals.redis) {
      try {
        const linkData = await req.app.locals.redis.get(`shortlink:${shortId}`);
        if (linkData) {
          link = JSON.parse(linkData);
        }
      } catch (error) {
        console.error('Redis read error:', error.message);
      }
    }
    
    // If not found in Redis, check MongoDB
    if (!link) {
      const Campaign = require('../models/Campaign');
      const campaign = await Campaign.findOne({ 'links.shortId': shortId });
      
      if (!campaign) {
        return res.status(404).send('Link not found or expired');
      }
      
      const linkData = campaign.links.find(l => l.shortId === shortId);
      link = {
        finalUrl: linkData.finalUrl,
        userId: campaign.userId.toString(),
        campaignId: campaign._id.toString(),
      };
    }
    
    // Track click
    const clickEvent = {
      eventId: require('uuid').v4(),
      shortId,
      userId: link.userId,
      campaignId: link.campaignId,
      eventType: 'link_click',
      timestamp: new Date().toISOString(),
      referrer: req.headers.referer || 'direct',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
    };

    // Push click event to Redis queue (if available)
    if (req.app.locals.redis) {
      try {
        await req.app.locals.redis.lpush('click_events', JSON.stringify(clickEvent));
        await req.app.locals.redis.hincrby(`link_stats:${shortId}`, 'clicks', 1);
      } catch (error) {
        console.error('Redis click tracking error:', error.message);
      }
    }
    
    // Also update clicks in MongoDB
    const Campaign = require('../models/Campaign');
    await Campaign.updateOne(
      { 'links.shortId': shortId },
      { $inc: { 'links.$.clicks': 1 } }
    );

    // Redirect to final URL
    res.redirect(301, link.finalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Error processing redirect');
  }
};

module.exports = {
  handleRedirect,
};