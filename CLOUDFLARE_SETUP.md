# Cloudflare Workers API Setup

This guide will help you deploy the HackTillDawn API to Cloudflare Workers for better reliability and performance.

## 🚀 Why Cloudflare Workers?

- **Better Reliability**: More stable than Vercel Functions
- **Global Edge Network**: Faster response times worldwide
- **Simpler Deployment**: Less configuration issues
- **Free Tier**: 100,000 requests/day free
- **Better Debugging**: Clearer error messages

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install the Cloudflare Workers CLI

## 🛠️ Installation

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Install Dependencies

```bash
# Copy the worker package.json
cp package-worker.json package.json

# Install dependencies
npm install
```

## 🚀 Deployment

### 1. Deploy the Worker

```bash
wrangler deploy
```

### 2. Set Environment Variables

After deployment, set your environment variables in the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **hacktilldawn-api**
3. Go to **Settings** → **Variables**
4. Add the following variables:

```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
WHAPI_TOKEN = your-whapi-token
WHAPI_WEBHOOK_SECRET = your-webhook-secret
```

### 3. Update Custom Domain (Optional)

You can set up a custom domain:

1. Go to **Workers & Pages** → **hacktilldawn-api**
2. Go to **Settings** → **Triggers**
3. Add a custom domain like `api.hacktilldawn.com`

## 🧪 Testing

### Test the API

```bash
# Test projects endpoint
curl https://api.hacktilldawn.workers.dev/api/projects

# Test debug endpoint
curl https://api.hacktilldawn.workers.dev/api/debug
```

### Test from Frontend

The frontend is already configured to use the Cloudflare Worker API in production.

## 📊 Monitoring

### View Logs

```bash
wrangler tail
```

### View Analytics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **hacktilldawn-api**
3. Go to **Analytics** tab

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `WHAPI_TOKEN` | WhatsApp API token | Yes |
| `WHAPI_WEBHOOK_SECRET` | Webhook secret for security | Yes |

### Custom Domain Setup

1. **Add Domain**: In Cloudflare dashboard, add your domain
2. **DNS Setup**: Point your domain to the worker
3. **SSL**: Cloudflare automatically provides SSL

## 🚀 Benefits

### Performance
- **Global Edge**: API runs close to users worldwide
- **Fast Response**: Sub-100ms response times
- **Caching**: Built-in caching capabilities

### Reliability
- **99.9% Uptime**: Cloudflare's global network
- **Auto-scaling**: Handles traffic spikes automatically
- **DDoS Protection**: Built-in security

### Cost
- **Free Tier**: 100,000 requests/day
- **Pay-per-use**: Only pay for what you use
- **No Cold Starts**: Always warm

## 🔄 Migration from Vercel

The frontend is already updated to use the Cloudflare Worker API. No additional changes needed.

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | Get all projects |
| `POST /api/webhook` | WhatsApp webhook |
| `GET /api/debug` | Debug information |

## 🆘 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Cloudflare dashboard
   - Redeploy after setting variables

2. **CORS Issues**
   - CORS headers are already configured
   - Check browser console for errors

3. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status

### Debug Commands

```bash
# View logs
wrangler tail

# Test locally
wrangler dev

# Check deployment status
wrangler deployments list
```

## 📈 Scaling

### Free Tier Limits
- **Requests**: 100,000/day
- **CPU Time**: 10ms per request
- **Memory**: 128MB

### Pro Plan Benefits
- **Unlimited Requests**: No daily limit
- **More CPU Time**: 50ms per request
- **More Memory**: 512MB
- **Custom Domains**: Included

## 🎉 Success!

Your API is now running on Cloudflare Workers with:
- ✅ Global edge network
- ✅ Better reliability
- ✅ Faster response times
- ✅ Easy monitoring
- ✅ Cost-effective scaling

The hackathon website will now use the Cloudflare Worker API for all backend operations!
