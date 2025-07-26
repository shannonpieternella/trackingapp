require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectMongoDB, connectRedis } = require('./config/database');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow all domains to track
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  optionsSuccessStatus: 200
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Static files
app.use(express.static('frontend/public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/analytics', require('./api/analytics'));
app.use('/api/tracking', require('./api/tracking'));
app.use('/api/reports', require('./api/reports'));
app.use('/api/journey', require('./api/journey'));

// Tracking pixel endpoint
app.get('/t.gif', require('./controllers/tracking').trackPixel);

// Frontend routes
const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/simple-dashboard.html'));
});

app.get('/journey', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/simple-journey.html'));
});

app.get('/setup-generator', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/setup-generator.html'));
});

app.get('/utm-builder', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/utm-builder.html'));
});
app.get('/campaigns', (req, res) => res.redirect('/dashboard'));
app.get('/events', (req, res) => res.redirect('/dashboard'));
app.get('/tracking-setup', (req, res) => res.redirect('/setup-generator'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize databases and start server
const startServer = async () => {
  try {
    await connectMongoDB();
    const redis = connectRedis();
    app.locals.redis = redis;
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

module.exports = app;

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
