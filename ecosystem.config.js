module.exports = {
  apps: [{
    name: "utm-tracking",
    script: "./backend/app.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      MONGODB_URI: "mongodb+srv://tradingviewsentinel:QrkpjJvX0PBnX0j2@sentinel.6czw8.mongodb.net/utm_tracking_platform?retryWrites=true&w=majority&appName=SENTINEL",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production",
      SESSION_SECRET: "your-session-secret-change-this-in-production",
      ALLOWED_DOMAINS: "*",
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX_REQUESTS: "100"
    }
  }]
};