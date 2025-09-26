# 🗄️ Database Setup Guide

## 🚀 Quick Setup (Recommended: PlanetScale)

### Step 1: Create PlanetScale Database

1. **Sign up at [PlanetScale](https://planetscale.com)**
   - Free tier includes 1 database, 1 billion reads/month
   - Perfect for your hackathon project!

2. **Create a new database**
   - Click "Create database"
   - Name it `hacktilldawn` (or any name you prefer)
   - Choose the region closest to your users

3. **Get connection details**
   - Go to your database dashboard
   - Click "Connect" → "Connect with: Node.js"
   - Copy the connection string

### Step 2: Set Environment Variables

Create a `.env` file in your project root:

```bash
# Database Configuration
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=your-database-name
DB_PORT=3306

# Existing WhatsApp API Configuration
WHAPI_TOKEN=your_whapi_token_here
WHAPI_WEBHOOK_SECRET=your_webhook_secret_here

# Application Configuration
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Step 3: Run Database Setup

```bash
# Install dependencies (if not already done)
npm install

# Set up database and migrate existing data
npm run setup:database
```

This will:
- ✅ Test database connection
- ✅ Create all required tables
- ✅ Migrate your existing JSON data to the database
- ✅ Verify everything is working

### Step 4: Deploy to Vercel

1. **Add environment variables to Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all the variables from your `.env` file

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🔧 Alternative Database Options

### Option 1: Railway + PostgreSQL

1. **Create Railway account** at [railway.app](https://railway.app)
2. **Create new project** → Add PostgreSQL
3. **Get connection details** from Railway dashboard
4. **Update environment variables:**
   ```bash
   DB_HOST=your-railway-host
   DB_USER=postgres
   DB_PASSWORD=your-railway-password
   DB_NAME=railway
   DB_PORT=5432
   ```

### Option 2: Supabase + PostgreSQL

1. **Create Supabase account** at [supabase.com](https://supabase.com)
2. **Create new project**
3. **Get connection details** from Supabase dashboard
4. **Update environment variables:**
   ```bash
   DB_HOST=your-supabase-host
   DB_USER=postgres
   DB_PASSWORD=your-supabase-password
   DB_NAME=postgres
   DB_PORT=5432
   ```

## 🧪 Testing Your Setup

### Test Database Connection
```bash
npm run setup:database
```

### Test API Endpoints
```bash
# Test projects API
curl https://yourdomain.com/api/projects

# Test health endpoint
curl https://yourdomain.com/api/health
```

### Test Webhook (Production)
```bash
npm run test:webhook
```

## 📊 Database Schema

Your database will have these tables:

- **`projects`** - Main project submissions
- **`reactions`** - Emoji reactions on projects
- **`replies`** - Comments/feedback on projects

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Check your environment variables
   - Verify database credentials
   - Ensure database is running

2. **"Table doesn't exist"**
   - Run `npm run setup:database` to create tables
   - Check database permissions

3. **"Migration failed"**
   - Check if JSON files exist in `data/` folder
   - Verify database connection
   - Check console for specific error messages

### Debug Commands

```bash
# Test database connection only
node -e "import('./database/connection.js').then(db => db.testConnection())"

# Check existing data
ls -la data/

# View database logs (if using local MySQL)
mysql -u root -p -e "SHOW DATABASES;"
```

## 🚀 Production Checklist

- [ ] Database created and accessible
- [ ] Environment variables set in Vercel
- [ ] Database setup completed successfully
- [ ] API endpoints returning data
- [ ] Webhook integration working
- [ ] Frontend displaying projects correctly

## 💡 Benefits of Database vs File Storage

✅ **Reliability**: No file system issues in serverless environments
✅ **Performance**: Faster queries and better caching
✅ **Scalability**: Handles more concurrent users
✅ **Backup**: Automatic backups and point-in-time recovery
✅ **Security**: Better access control and encryption
✅ **Monitoring**: Built-in query performance monitoring

---

**Your HackTillDawn project is now production-ready with a proper database! 🎉**
