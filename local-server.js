import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import messageFetcher from './api/message-fetcher.js';
import { getAllProjects, addProject, addReaction, addReply } from './api/projects-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Load data from file system
let projects = getAllProjects();
console.log(`📊 Loaded ${projects.length} projects from file system`);

// Load reactions and replies from file system
let reactions = [];
let replies = [];

// Load from files if they exist
try {
    const reactionsFile = path.join(__dirname, 'data', 'reactions.json');
    if (fs.existsSync(reactionsFile)) {
        reactions = JSON.parse(fs.readFileSync(reactionsFile, 'utf8'));
    }
    
    const repliesFile = path.join(__dirname, 'data', 'replies.json');
    if (fs.existsSync(repliesFile)) {
        replies = JSON.parse(fs.readFileSync(repliesFile, 'utf8'));
    }
    
    console.log(`📊 Loaded ${reactions.length} reactions and ${replies.length} replies from file system`);
} catch (error) {
    console.log('⚠️ Using empty reactions and replies arrays:', error.message);
}

// Parse the structured message format
function parseProjectMessage(message) {
    const lines = message.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    let name = '';
    let description = '';
    let url = '';
    let currentField = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.toLowerCase().startsWith('name:')) {
            currentField = 'name';
            name = line.substring(5).trim();
        } else if (line.toLowerCase().startsWith('description:')) {
            currentField = 'description';
            description = line.substring(12).trim();
        } else if (line.toLowerCase().startsWith('url:')) {
            currentField = 'url';
            url = line.substring(4).trim();
        } else {
            if (currentField === 'name' && !name) {
                name = line;
            } else if (currentField === 'description') {
                if (description) {
                    description += ' ' + line;
                } else {
                    description = line;
                }
            } else if (currentField === 'url' && !url) {
                url = line;
            }
        }
    }
    
    name = name.trim();
    description = description.trim();
    url = url.trim();
    
    if (name && description && url && isValidUrl(url)) {
        return { name, description, url };
    }
    
    return null;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        try {
            new URL('https://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// API Routes
app.post('/api/webhook', (req, res) => {
    const { body } = req;
    const TARGET_GROUP = "HackTillDawn Final Participants";
    
    try {
        // Handle different types of WhatsApp events
        if (body.type === 'message' && 
            body.chat_id.includes('@g.us') && 
            body.chat_name === TARGET_GROUP) {
            
            const message = body.text?.body || '';
            
            // Check if it's a reply to a project message
            if (body.context?.quoted_message) {
                const replyData = {
                    messageId: body.message_id,
                    quotedMessageId: body.context.quoted_message.id,
                    text: body.text?.body || '',
                    sender: body.from_name || body.sender || 'Unknown',
                    timestamp: new Date().toISOString(),
                    chatId: body.chat_id
                };
                
                replies.push(replyData);
                console.log('💬 Reply received:', replyData);
            } else {
                // Parse message in format: Name:\nDescription:\nURL:
                const project = parseProjectMessage(message);
                
                if (project) {
                    project.timestamp = new Date().toISOString();
                    project.sender = body.from_name || body.sender || 'Unknown';
                    project.groupName = body.chat_name;
                    project.messageId = body.message_id || `msg_${Date.now()}`;
                    project.reactions = [];
                    project.replies = [];
                    
                    projects.push(project);
                    console.log('✅ New project added from', TARGET_GROUP, ':', project.name);
                } else {
                    console.log('❌ Message from', TARGET_GROUP, 'did not match project format:', message.substring(0, 100));
                }
            }
        } 
        // Handle reactions to project messages
        else if (body.type === 'reaction' && 
                 body.chat_id.includes('@g.us') && 
                 body.chat_name === TARGET_GROUP) {
            
            const reactionData = {
                messageId: body.message_id,
                emoji: body.reaction?.emoji || '',
                sender: body.from_name || body.sender || 'Unknown',
                timestamp: new Date().toISOString(),
                chatId: body.chat_id
            };
            
            reactions.push(reactionData);
            console.log('😀 Reaction received:', reactionData);
        }
        else if (body.type === 'message' && body.chat_id.includes('@g.us')) {
            console.log('ℹ️ Message from other group:', body.chat_name, '- ignoring');
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/projects', (req, res) => {
    try {
        const sortedProjects = projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Enhance projects with reactions and replies data
        const enhancedProjects = sortedProjects.map(project => {
            const projectReactions = reactions.filter(r => r.messageId === project.messageId);
            const projectReplies = replies.filter(r => r.quotedMessageId === project.messageId);
            
            // Count reactions by emoji
            const reactionCounts = projectReactions.reduce((acc, reaction) => {
                const emoji = reaction.emoji;
                acc[emoji] = (acc[emoji] || 0) + 1;
                return acc;
            }, {});
            
            return {
                ...project,
                reactions: projectReactions,
                replies: projectReplies,
                reactionCounts: reactionCounts,
                totalReactions: projectReactions.length,
                totalReplies: projectReplies.length
            };
        });
        
        res.json({
            projects: enhancedProjects,
            totalCount: projects.length,
            lastUpdated: projects.length > 0 ? projects[0].timestamp : null,
            metadata: {
                dataSource: 'real',
                lastFetched: new Date().toISOString(),
                updateFrequency: 'real-time via webhook, 60s via message fetcher'
            },
            isSampleData: false,
            dataSource: 'real'
        });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        projectsCount: projects.length,
        message: 'Local HackTillDawn API is running'
    });
});

// Message fetcher status endpoint
app.get('/api/fetcher-status', (req, res) => {
    res.json(messageFetcher.getStatus());
});

app.post('/api/test-project', (req, res) => {
    const { name, description, url } = req.body;
    
    if (name && description && url) {
        const project = {
            name,
            description,
            url,
            timestamp: new Date().toISOString(),
            sender: 'Test User',
            groupName: 'HackTillDawn Final Participants'
        };
        
        projects.push(project);
        res.json({ success: true, project });
    } else {
        res.status(400).json({ error: 'Missing required fields: name, description, url' });
    }
});

// Serve static files from dist directory
app.use(express.static('dist'));

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Start the server
const server = createServer(app);

server.listen(PORT, async () => {
    console.log('🚀 Local Development Server Started!');
    console.log(`📡 API Server: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📊 Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`🔗 Webhook: http://localhost:${PORT}/api/webhook`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
    console.log(`🔄 Fetcher Status: http://localhost:${PORT}/api/fetcher-status`);
    
    // Start the message fetcher
    console.log('\n🔄 Starting Message Fetcher...');
    try {
        await messageFetcher.start();
        console.log('✅ Message fetcher started successfully');
    } catch (error) {
        console.log('⚠️ Message fetcher failed to start:', error.message);
        console.log('💡 You can still use the webhook for real-time updates');
    }
    
    console.log('\n📝 Test the webhook with:');
    console.log(`curl -X POST http://localhost:${PORT}/api/webhook \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"type":"message","chat_id":"test@g.us","chat_name":"HackTillDawn Final Participants","from_name":"Test User","text":{"body":"Name: Test Project\\nDescription: Test description\\nURL: https://example.com"}}'`);
    console.log('\n🛑 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    // Stop the message fetcher
    messageFetcher.stop();
    
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
