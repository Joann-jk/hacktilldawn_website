import { addProjectWithFallback, addReactionWithFallback, addReplyWithFallback } from './webhook-fallback.js';

// Security and rate limiting
const webhookSecret = process.env.WHAPI_WEBHOOK_SECRET || 'default-secret';

// Parse the structured message format
function parseProjectMessage(message) {
    // Clean the message and split into lines
    const lines = message.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    let name = '';
    let description = '';
    let url = '';
    let teamName = '';
    let teamMembers = '';
    let currentField = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for field headers (case insensitive)
        if (line.toLowerCase().startsWith('project name:')) {
            currentField = 'name';
            name = line.substring(13).trim();
        } else if (line.toLowerCase().startsWith('name:')) {
            currentField = 'name';
            name = line.substring(5).trim();
        } else if (line.toLowerCase().startsWith('description:')) {
            currentField = 'description';
            description = line.substring(12).trim();
        } else if (line.toLowerCase().startsWith('url:')) {
            currentField = 'url';
            url = line.substring(4).trim();
        } else if (line.toLowerCase().startsWith('team name:')) {
            currentField = 'teamName';
            teamName = line.substring(10).trim();
        } else if (line.toLowerCase().startsWith('team members:')) {
            currentField = 'teamMembers';
            teamMembers = line.substring(13).trim();
        } else {
            // Continue reading content for the current field
            if (currentField === 'name' && !name) {
                name = line;
            } else if (currentField === 'description') {
                if (description) {
                    description += ' ' + line; // Append to existing description
                } else {
                    description = line;
                }
            } else if (currentField === 'url' && !url) {
                url = line;
            } else if (currentField === 'teamName' && !teamName) {
                teamName = line;
            } else if (currentField === 'teamMembers') {
                if (teamMembers) {
                    teamMembers += ', ' + line; // Append to existing team members
                } else {
                    teamMembers = line;
                }
            }
        }
    }
    
    // Clean up the fields
    name = name.trim();
    description = description.trim();
    url = url.trim();
    teamName = teamName.trim();
    teamMembers = teamMembers.trim();
    
    // Validate that we have all required fields and URL format
    if (name && description && url && teamName && teamMembers && isValidUrl(url)) {
        return { name, description, url, teamName, teamMembers };
    }
    
    return null;
}

// Helper function to validate URL format
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // If it doesn't have protocol, try adding https://
        try {
            new URL('https://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Webhook endpoint to receive WhatsApp messages
export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Whapi-Signature');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Apply rate limiting
    const clientId = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 50;
    const windowStart = now - windowMs;

    // Get or create client data (simplified rate limiting for serverless)
    if (!global.rateLimitMap) {
        global.rateLimitMap = new Map();
    }
    
    let clientData = global.rateLimitMap.get(clientId);
    if (!clientData) {
        clientData = { requests: [], timestamp: now };
        global.rateLimitMap.set(clientId, clientData);
    }

    // Remove old requests from the window
    clientData.requests = clientData.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (clientData.requests.length >= maxRequests) {
        const resetTime = Math.ceil((clientData.requests[0] + windowMs - now) / 1000);
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: resetTime,
            limit: maxRequests,
            remaining: 0
        });
    }

    // Add current request
    clientData.requests.push(now);
    clientData.timestamp = now;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - clientData.requests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    // Validate webhook secret in production
    if (process.env.NODE_ENV === 'production') {
        const webhookSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.WHAPI_WEBHOOK_SECRET;
        
        if (!webhookSecret || !expectedSecret) {
            console.warn('Missing webhook secret in production');
            return res.status(401).json({ error: 'Missing webhook secret' });
        }
        
        if (webhookSecret !== expectedSecret) {
            console.warn('Invalid webhook secret');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('Webhook secret validated successfully');
    }
    
    const body = req.body;
    
    // Target group name
    const TARGET_GROUP = "HackTillDawn Final Participants";
    
    try {
        // Handle different types of WhatsApp events
        if (body.type === 'message' && 
            body.chat_id.includes('@g.us') && 
            body.chat_name === TARGET_GROUP) {
            
            const message = body.text?.body || '';
            
            // Parse message in format: Name:\nDescription:\nURL:
            const project = parseProjectMessage(message);
            
            if (project) {
                // Add sender info
                project.sender = body.from_name || body.sender || 'Unknown';
                project.groupName = body.chat_name;
                project.messageId = body.message_id;
                
                // Store the project with persistent storage (REAL-TIME UPDATE)
                await addProjectWithFallback(project);
                console.log('✅ REAL-TIME: New project added from', TARGET_GROUP, ':', project.name);
                console.log('📊 Project details:', {
                    name: project.name,
                    team: project.teamName,
                    url: project.url,
                    timestamp: project.timestamp
                });
            } else {
                console.log('Message from', TARGET_GROUP, 'did not match project format:', message.substring(0, 100));
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
            
            // Store reaction (REAL-TIME UPDATE)
            await addReactionWithFallback(reactionData);
            console.log('✅ REAL-TIME: Reaction received:', reactionData.emoji, 'from', reactionData.sender);
        }
        // Handle replies to project messages
        else if (body.type === 'message' && 
                 body.chat_id.includes('@g.us') && 
                 body.chat_name === TARGET_GROUP &&
                 body.context?.quoted_message) {
            
            const replyData = {
                messageId: body.message_id,
                quotedMessageId: body.context.quoted_message.id,
                text: body.text?.body || '',
                sender: body.from_name || body.sender || 'Unknown',
                timestamp: new Date().toISOString(),
                chatId: body.chat_id
            };
            
            // Store reply (REAL-TIME UPDATE)
            await addReplyWithFallback(replyData);
            console.log('✅ REAL-TIME: Reply received from', replyData.sender, ':', replyData.text.substring(0, 50) + '...');
        }
        else if (body.type === 'message' && body.chat_id.includes('@g.us')) {
            // Log messages from other groups (for debugging)
            console.log('Message from other group:', body.chat_name, '- ignoring');
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
