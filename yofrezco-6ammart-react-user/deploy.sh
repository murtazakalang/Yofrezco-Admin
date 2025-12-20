#!/bin/bash
# Deploy script for yofrezco React app

echo "🚀 Starting deployment..."

# Stop the server
echo "⏹️  Stopping server..."
pm2 stop 6ammart-react 2>/dev/null || echo "Server was not running"

# Clean build cache to avoid permission issues
echo "🧹 Cleaning build cache..."
rm -rf .next

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

# Restart with pm2
echo "🔄 Restarting server..."
pm2 restart ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js

# Save pm2 configuration
pm2 save

# Show status
echo "✅ Deployment complete!"
pm2 status

# Show logs
echo ""
echo "📋 Recent logs:"
pm2 logs 6ammart-react --lines 10 --nostream
