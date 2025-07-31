#!/bin/bash

echo "🚀 Starting UTM Tracking Platform in Production Mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instance
pm2 stop utm-tracking 2>/dev/null || true
pm2 delete utm-tracking 2>/dev/null || true

# Start the application
echo "📦 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup startup script
echo "🔧 Setting up auto-start on system boot..."
pm2 startup systemd -u $USER --hp $HOME

# Show status
echo ""
echo "✅ Application started successfully!"
echo ""
pm2 status
echo ""
echo "📋 View logs with: pm2 logs utm-tracking"
echo "📊 Monitor with: pm2 monit"
echo ""
echo "🌐 Your tracking platform should now be accessible at:"
echo "   https://tracking.upsellbusinessagency.com"