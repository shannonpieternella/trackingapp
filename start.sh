#!/bin/bash

echo "🚀 Starting UTM Tracking Platform..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Trying to start it..."
    
    # Try to start MongoDB based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew services start mongodb-community
        else
            echo "❌ Please start MongoDB manually"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongodb
    fi
    
    sleep 3
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Starting server..."
echo ""
echo "📌 Server will run at: http://localhost:3000"
echo "📌 Press Ctrl+C to stop"
echo ""

# Start the server
npm run dev