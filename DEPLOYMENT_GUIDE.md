# HackTillDawn Deployment Guide

## 🏗️ Architecture Overview

The HackTillDawn project uses a **hybrid deployment architecture** combining multiple platforms for optimal performance and reliability:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │  Cloudflare      │    │   Supabase      │
│   (Frontend)    │◄──►│  Workers (API)   │◄──►│   (Database)    │
│                 │    │                  │    │                 │
│ • React App     │    │ • API Endpoints  │    │ • PostgreSQL    │
│ • Static Files  │    │ • Global Edge    │    │ • Real-time     │
│ • CDN           │    │ • 99.9% Uptime   │    │ • Auth          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Environment    │    │   Monitoring    │
│   Integration   │    │   Variables      │    │   & Logs        │
│                 │    │                  │    │                 │
│ • Webhook API   │    │ • Supabase Keys  │    │ • Wrangler Logs │
│ • Project Sub.  │    │ • WHAPI Token    │    │ • Vercel Logs   │
│ • Real-time     │    │ • Secrets Mgmt   │    │ • Error Tracking│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Deployment Structure

### 1. **Frontend (Vercel)**
- **Platform**: Vercel
- **URL**: `https://hacktilldawn-website.vercel.app/`
- **Technology**: React + Vite + Tailwind CSS
- **Purpose**: User interface and project gallery

### 2. **API (Cloudflare Workers)**
- **Platform**: Cloudflare Workers
- **URL**: `https://hacktilldawn-api.dev-jeromtom.workers.dev/`
- **Technology**: JavaScript (ES6+)
- **Purpose**: Backend API and webhook handling

### 3. **Database (Supabase)**
- **Platform**: Supabase
- **URL**: `https://rihaidrbvwpxxlpzlezi.supabase.co`
- **Technology**: PostgreSQL
- **Purpose**: Data storage and real-time updates

## 📋 Prerequisites

### Required Accounts
1. **Vercel Account** - [vercel.com](https://vercel.com)
2. **Cloudflare Account** - [cloudflare.com](https://cloudflare.com)
3. **Supabase Account** - [supabase.com](https://supabase.com)
4. **WhatsApp API Account** - [whapi.com](https://whapi.com)

### Required Tools
```bash
# Node.js (v18+)
node --version

# npm
npm --version

# Wrangler CLI
npm install -g wrangler

# Git
git --version
```

## 🛠️ Step-by-Step Deployment

### Phase 1: Database Setup (Supabase)

#### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Set database password
5. Wait for project to be created

#### 1.2 Configure Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Run the schema from `database/supabase-schema.sql`:

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(2048),
    team_name VARCHAR(255),
    team_members TEXT,
    sender VARCHAR(255),
    group_name VARCHAR(255),
    message_id VARCHAR(255) UNIQUE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    related_message_ids JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL REFERENCES projects(message_id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    sender VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    chat_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies table
CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    quoted_message_id VARCHAR(255) NOT NULL REFERENCES projects(message_id) ON DELETE CASCADE,
    text TEXT,
    sender VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    chat_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to replies" ON replies FOR SELECT USING (true);
```

#### 1.3 Get API Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL** and **anon public key**
3. Save these for environment variables

### Phase 2: API Deployment (Cloudflare Workers)

#### 2.1 Install Wrangler CLI
```bash
npm install -g wrangler
```

#### 2.2 Login to Cloudflare
```bash
wrangler login
```

#### 2.3 Deploy the Worker
```bash
# Navigate to project directory
cd /path/to/hacktilldawn_website

# Deploy the worker
wrangler deploy
```

#### 2.4 Set Environment Variables
```bash
# Set Supabase credentials
echo "https://your-project-id.supabase.co" | wrangler secret put SUPABASE_URL
echo "your-anon-key-here" | wrangler secret put SUPABASE_ANON_KEY

# Set WhatsApp API credentials
echo "your-whapi-token" | wrangler secret put WHAPI_TOKEN
echo "your-webhook-secret" | wrangler secret put WHAPI_WEBHOOK_SECRET
```

#### 2.5 Test API Endpoints
```bash
# Test projects endpoint
curl https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects

# Test debug endpoint
curl https://hacktilldawn-api.dev-jeromtom.workers.dev/api/debug

# Test webhook endpoint
curl -X POST https://hacktilldawn-api.dev-jeromtom.workers.dev/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Whapi-Signature: test-signature" \
  -d '{"test": "data"}'
```

### Phase 3: Frontend Deployment (Vercel)

#### 3.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub repository
4. Select the `hacktilldawn_website` repository

#### 3.2 Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3.3 Set Environment Variables (Optional)
Since we're using Cloudflare Workers for the API, Vercel environment variables are not required for the API, but you can set them for local development:

```bash
# In Vercel dashboard, go to Settings → Environment Variables
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
WHAPI_TOKEN=your-whapi-token
WHAPI_WEBHOOK_SECRET=your-webhook-secret
```

#### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your site will be available at `https://hacktilldawn-website.vercel.app`

### Phase 4: WhatsApp Integration

#### 4.1 Configure Webhook URL
1. Go to your WhatsApp API dashboard
2. Set webhook URL to: `https://hacktilldawn-api.dev-jeromtom.workers.dev/api/webhook`
3. Set webhook secret (same as `WHAPI_WEBHOOK_SECRET`)

#### 4.2 Test Webhook
```bash
# Send a test message to your WhatsApp group
# Check Cloudflare Worker logs
wrangler tail
```

## 🔧 Configuration Files

### 1. **Cloudflare Worker** (`cloudflare-worker.js`)
```javascript
// Main worker file with all API endpoints
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Route handling logic
}
```

### 2. **Wrangler Config** (`wrangler.toml`)
```toml
name = "hacktilldawn-api"
main = "cloudflare-worker.js"
compatibility_date = "2024-09-26"

[env.production]
name = "hacktilldawn-api"
```

### 3. **Vercel Config** (`vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4. **Frontend API Configuration** (`src/components/AllProjects.jsx`)
```javascript
const apiUrl = import.meta.env.DEV 
  ? 'http://localhost:3001/api/projects' 
  : 'https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects';
```

## 📊 Monitoring and Maintenance

### 1. **Cloudflare Worker Logs**
```bash
# View real-time logs
wrangler tail

# View specific deployment logs
wrangler deployments list
```

### 2. **Vercel Analytics**
- Go to Vercel dashboard
- Click on your project
- View **Analytics** tab for performance metrics

### 3. **Supabase Dashboard**
- Go to Supabase dashboard
- View **Table Editor** for data
- Check **Logs** for database queries

## 🚨 Troubleshooting

### Common Issues

#### 1. **API Not Working**
```bash
# Check if worker is deployed
wrangler deployments list

# Check logs for errors
wrangler tail

# Test individual endpoints
curl https://hacktilldawn-api.dev-jeromtom.workers.dev/api/debug
```

#### 2. **Database Connection Issues**
- Verify Supabase credentials in Cloudflare secrets
- Check Supabase project status
- Verify RLS policies are correct

#### 3. **Frontend Not Loading Projects**
- Check browser console for CORS errors
- Verify API URL in frontend code
- Test API endpoints directly

#### 4. **Webhook Not Receiving Data**
- Verify webhook URL in WhatsApp API settings
- Check webhook secret matches
- Test webhook endpoint manually

### Debug Commands

```bash
# Test API locally
wrangler dev

# Check environment variables
wrangler secret list

# View worker analytics
wrangler analytics

# Test database connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT_ID.supabase.co/rest/v1/projects"
```

## 🔄 Updates and Maintenance

### 1. **Updating API Code**
```bash
# Make changes to cloudflare-worker.js
# Deploy changes
wrangler deploy
```

### 2. **Updating Frontend**
```bash
# Make changes to React components
# Push to GitHub
git add .
git commit -m "Update frontend"
git push origin main

# Vercel will auto-deploy
```

### 3. **Database Migrations**
```sql
-- Run in Supabase SQL Editor
-- Add new columns, tables, etc.
ALTER TABLE projects ADD COLUMN new_field VARCHAR(255);
```

## 📈 Performance Optimization

### 1. **Cloudflare Workers**
- Global edge network (200+ cities)
- Sub-100ms response times
- Automatic scaling

### 2. **Vercel Frontend**
- Global CDN
- Automatic HTTPS
- Image optimization

### 3. **Supabase Database**
- Connection pooling
- Query optimization
- Real-time subscriptions

## 🔒 Security Considerations

### 1. **API Security**
- CORS headers configured
- Webhook signature validation
- Environment variables as secrets

### 2. **Database Security**
- Row Level Security (RLS) enabled
- Public read access only
- No direct write access from frontend

### 3. **Environment Variables**
- All secrets stored in Cloudflare
- No hardcoded credentials
- Separate dev/prod environments

## 🎯 Success Metrics

### 1. **API Performance**
- Response time: < 100ms
- Uptime: 99.9%
- Error rate: < 0.1%

### 2. **Frontend Performance**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### 3. **Database Performance**
- Query response time: < 50ms
- Connection pool utilization: < 80%
- Storage usage: Monitor growth

## 📞 Support and Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

### Community
- [Cloudflare Community](https://community.cloudflare.com/)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Discord](https://discord.supabase.com/)

---

## 🎉 Deployment Complete!

Your HackTillDawn project is now deployed with:
- ✅ **Frontend**: Vercel (React + Vite)
- ✅ **API**: Cloudflare Workers (Global edge)
- ✅ **Database**: Supabase (PostgreSQL)
- ✅ **Integration**: WhatsApp webhook
- ✅ **Monitoring**: Real-time logs and analytics

**The 500 error is completely resolved, and your hackathon website is production-ready! 🚀**
