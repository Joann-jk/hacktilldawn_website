# HackTillDawn Website

A React-based website for the HackTillDawn hackathon with integrated WhatsApp webhook functionality for collecting project submissions.

## 🚀 Features

- **Modern React Frontend**: Built with Vite, Tailwind CSS, and Framer Motion
- **WhatsApp Integration**: Webhook handler for collecting project submissions
- **Real-time Project Collection**: Automatically parses and stores project data
- **Responsive Design**: Mobile-first approach with beautiful animations

## 📁 Project Structure

```
hacktilldawn_website/
├── api/                    # Vercel serverless functions
│   ├── webhook.js         # WhatsApp webhook handler
│   ├── projects.js        # Projects API endpoint
│   └── health.js          # Health check endpoint
├── src/                   # React frontend
│   ├── components/        # React components
│   └── assets/           # Static assets
├── public/               # Public assets
├── dist/                 # Built frontend (generated)
└── vercel.json          # Vercel configuration
```

## 🛠️ Development

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start local development server** (includes both frontend and API):
   ```bash
   npm run dev:local
   ```
   This will build the frontend and start the server on `http://localhost:3001`

3. **Test the webhook**:
   ```bash
   npm run test:local
   ```

### Frontend Only Development

For frontend-only development:
```bash
npm run dev
```

## 🔗 API Endpoints

- **Webhook**: `/api/webhook` - Receives WhatsApp messages
- **Projects**: `/api/projects` - Returns collected projects
- **Health**: `/api/health` - Health check endpoint

## 📱 WhatsApp Integration

The webhook automatically processes messages from the "HackTillDawn Final Participants" group with the format:

```
Name: Project Name
Description: Project description
URL: https://project-url.com
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Configure WhatsApp webhook**:
   - Set webhook URL to: `https://your-domain.vercel.app/api/webhook`
   - Configure in your Whapi.cloud dashboard

### Manual Testing

Test the webhook locally:
```bash
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "chat_id": "test@g.us",
    "chat_name": "HackTillDawn Final Participants",
    "from_name": "Test User",
    "text": {
      "body": "Name: My Project\nDescription: Test project\nURL: https://github.com/test/project"
    }
  }'
```

## 📊 Project Data

Each collected project contains:
- `name`: Project name
- `description`: Project description
- `url`: Project URL
- `timestamp`: ISO timestamp when added
- `sender`: WhatsApp sender name
- `groupName`: WhatsApp group name

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express (Vercel serverless functions)
- **WhatsApp API**: Whapi.cloud
- **Deployment**: Vercel

## 📝 Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:local` - Start integrated local server (frontend + API)
- `npm run build` - Build for production
- `npm run test:local` - Test local webhook functionality
- `npm run test:webhook` - Test production webhook

## 🔧 Configuration

- **Port**: 3001 (local development)
- **Target Group**: "HackTillDawn Final Participants"
- **Message Format**: Name/Description/URL structure
- **CORS**: Enabled for all origins

## 📚 Documentation

- [Local Testing Guide](./LOCAL_TESTING.md) - Detailed local testing instructions
- [API Documentation](./api/) - API endpoint documentation# Updated Fri Sep 26 04:08:50 IST 2025
