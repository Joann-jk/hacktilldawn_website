#!/bin/bash

echo "🚀 Deploying HackTillDawn API to Cloudflare Workers"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set environment variables in Cloudflare dashboard:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - WHAPI_TOKEN"
    echo "   - WHAPI_WEBHOOK_SECRET"
    echo ""
    echo "2. Test the API:"
    echo "   curl https://api.hacktilldawn.workers.dev/api/projects"
    echo ""
    echo "3. View logs:"
    echo "   wrangler tail"
else
    echo "❌ Deployment failed!"
    exit 1
fi
