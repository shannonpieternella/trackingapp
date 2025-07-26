const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User'); // UTMUser in database
const { authMiddleware } = require('../middleware/auth');

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, organization } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      organization,
    });

    // Generate API key
    user.generateApiKey();

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        apiKey: user.apiKey,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      organization: req.user.organization,
      role: req.user.role,
      apiKey: req.user.apiKey,
      domains: req.user.domains,
      subscription: req.user.subscription,
      settings: req.user.settings,
    },
  });
});

// Update user settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { timezone, emailNotifications, weeklyReports } = req.body;

    req.user.settings = {
      ...req.user.settings,
      ...(timezone && { timezone }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(weeklyReports !== undefined && { weeklyReports }),
    };

    await req.user.save();

    res.json({ message: 'Settings updated', settings: req.user.settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Add domain
router.post('/domains', authMiddleware, [
  body('domain').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { domain } = req.body;
    
    // Check if domain already exists
    if (req.user.domains.some(d => d.domain === domain)) {
      return res.status(400).json({ error: 'Domain already added' });
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    req.user.domains.push({
      domain,
      verificationToken,
    });

    await req.user.save();

    res.json({
      message: 'Domain added',
      domain: {
        domain,
        verified: false,
        verificationToken,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add domain' });
  }
});

// Regenerate API key
router.post('/regenerate-api-key', authMiddleware, async (req, res) => {
  try {
    req.user.generateApiKey();
    await req.user.save();

    res.json({
      message: 'API key regenerated',
      apiKey: req.user.apiKey,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

module.exports = router;