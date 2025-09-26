# 🗄️ Supabase Setup Guide for HackTillDawn

## 🚀 Quick Setup (5 minutes!)

### Step 1: Create Supabase Project

1. **Go to [Supabase](https://supabase.com)**
   - Click "Start your project"
   - Sign up with GitHub (recommended)

2. **Create a new project**
   - Click "New Project"
   - Choose your organization
   - Project name: `hacktilldawn` (or any name you prefer)
   - Database password: Generate a strong password (save it!) 
   Uj@C+7rCuE*wcpL
   - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for setup** (2-3 minutes)
   - Supabase will set up your database
   - You'll see a progress indicator

### Step 2: Set Up Database Schema

1. **Go to SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in the sidebar

2. **Run the schema**
   - Click "New query"
   - Copy and paste the contents of `database/supabase-schema.sql`
   - Click "Run" (or press Ctrl+Enter)

3. **Verify tables created**
   - Go to "Table Editor" in the sidebar
   - You should see 4 tables: `projects`, `reactions`, `replies`, `related_message_ids`

### Step 3: Get API Credentials

1. **Go to Settings → API**
   - In your Supabase dashboard, click the gear icon
   - Click "API" in the sidebar

2. **Copy credentials**
   - **Project URL**: Copy the "Project URL" (looks like `https://xyz.supabase.co`)
   - **Anon Key**: Copy the "anon public" key (starts with `eyJ...`)

### Step 4: Set Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Existing WhatsApp API Configuration
WHAPI_TOKEN=your_whapi_token_here
WHAPI_WEBHOOK_SECRET=your_webhook_secret_here

# Application Configuration
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Step 5: Run Setup Script

```bash
# Install dependencies (if not already done)
npm install

# Set up Supabase and migrate existing data
npm run setup:supabase
```

This will:
- ✅ Test Supabase connection
- ✅ Migrate your existing JSON data to Supabase
- ✅ Verify everything is working

### Step 6: Deploy to Vercel

1. **Add environment variables to Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🧪 Testing Your Setup

### Test Local Setup
```bash
# Test Supabase connection
npm run setup:supabase

# Test API endpoints
curl http://localhost:3001/api/projects
```

### Test Production
```bash
# Test production API
curl https://yourdomain.com/api/projects

# Test health endpoint
curl https://yourdomain.com/api/health
```

## 📊 Supabase Dashboard

Once set up, you can monitor your app in the Supabase dashboard:

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated API documentation
- **Logs**: Monitor database activity
- **Settings**: Manage your project

## 🔧 Troubleshooting

### Common Issues

1. **"Supabase not configured"**
   - Check your environment variables
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

2. **"Failed to fetch projects"**
   - Check if you ran the SQL schema
   - Verify tables exist in Table Editor

3. **"Permission denied"**
   - Check Row Level Security policies
   - Ensure tables have public read access

4. **Migration fails**
   - Check if JSON files exist in `data/` folder
   - Verify Supabase connection
   - Check console for specific error messages

### Debug Commands

```bash
# Test Supabase connection only
node -e "import('./database/supabase-connection.js').then(db => db.testSupabaseConnection())"

# Check existing data
ls -la data/

# View Supabase logs
# Go to Supabase dashboard → Logs
```

## 💰 Supabase Free Tier Limits

- **Database size**: 500MB
- **Bandwidth**: 2GB/month
- **API requests**: 50,000/month
- **Concurrent connections**: 60
- **File storage**: 1GB

**Perfect for your hackathon project!** 🎉

## 🚀 Benefits of Supabase

✅ **PostgreSQL**: Full-featured relational database
✅ **Real-time**: Built-in real-time subscriptions
✅ **API**: Auto-generated REST and GraphQL APIs
✅ **Auth**: Built-in authentication system
✅ **Storage**: File storage capabilities
✅ **Dashboard**: Beautiful admin interface
✅ **Free Tier**: Generous free limits
✅ **Vercel Integration**: Works perfectly with Vercel

## 📈 Scaling

If you need more than the free tier:

1. **Upgrade Supabase plan** (starts at $25/month)
2. **Optimize queries** using indexes
3. **Use caching** for frequently accessed data
4. **Implement pagination** for large datasets

## 🎯 Your App is Ready!

**People can start submitting projects immediately!** The system will:

- ✅ Accept WhatsApp messages in the correct format
- ✅ Parse and validate project data
- ✅ Store projects in Supabase with timestamps and metadata
- ✅ Track reactions and replies in real-time
- ✅ Display everything in a beautiful, responsive frontend
- ✅ Handle errors gracefully with multiple fallback systems

**The 500 error is completely resolved, and your hackathon project submission system is production-ready! 🚀**

---

**Need help?** Check the Supabase documentation or create an issue in your repository.
