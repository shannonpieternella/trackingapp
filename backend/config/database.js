const mongoose = require('mongoose');
const Redis = require('ioredis');

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const connectRedis = () => {
  try {
    const redis = new Redis({
      host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
      port: process.env.REDIS_URL?.split(':')[2] || 6379,
      retryStrategy: (times) => {
        // Stop retrying after 5 attempts
        if (times > 5) {
          console.log('Redis connection failed after 5 attempts. Running without Redis (some features may be limited).');
          return null;
        }
        const delay = Math.min(times * 1000, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      // Silence repeated error messages
      if (error.code !== 'ECONNREFUSED') {
        console.error('Redis error:', error.message);
      }
    });

    return redis;
  } catch (error) {
    console.log('Redis initialization failed. Running without Redis.');
    return null;
  }
};

module.exports = {
  connectMongoDB,
  connectRedis,
};