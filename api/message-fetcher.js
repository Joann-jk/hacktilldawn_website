import axios from 'axios';
import { addProject, addReaction, addReply, getAllProjects } from './projects-data.js';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN || 'FDGDimYWgfPCrzNJoFNB84r9IUyggia6';
const WHAPI_BASE_URL = 'https://gate.whapi.cloud';
const TARGET_GROUP = "HackTillDawn Final Participants";

class MessageFetcher {
    constructor() {
        this.isRunning = false;
        this.lastMessageId = null;
        this.processedMessageIds = new Set();
        this.groupId = null;
        this.intervalId = null;
    }

    // Initialize the fetcher
    async initialize() {
        try {
            console.log('🚀 Initializing Message Fetcher...');
            
            // Get the target group ID
            await this.getGroupId();
            
            if (!this.groupId) {
                throw new Error('Target group not found');
            }
            
            console.log(`✅ Target group found: ${TARGET_GROUP} (${this.groupId})`);
            
            // Get the latest message ID to start from
            await this.getLatestMessageId();
            
            console.log('✅ Message fetcher initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize message fetcher:', error.message);
            return false;
        }
    }

    // Get the target group ID
    async getGroupId() {
        try {
            const response = await axios.get(`${WHAPI_BASE_URL}/groups`, {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            const targetGroup = response.data.groups.find(group => 
                group.name && group.name.includes('HackTillDawn')
            );

            if (targetGroup) {
                this.groupId = targetGroup.id;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error getting group ID:', error.message);
            return false;
        }
    }

    // Get the latest message ID to start from
    async getLatestMessageId() {
        try {
            const response = await axios.get(`${WHAPI_BASE_URL}/messages/list/${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Accept': 'application/json'
                },
                params: {
                    limit: 1,
                    sort: 'desc'
                }
            });

            if (response.data.messages && response.data.messages.length > 0) {
                this.lastMessageId = response.data.messages[0].id;
                console.log(`📌 Starting from message ID: ${this.lastMessageId}`);
            }
        } catch (error) {
            console.error('Error getting latest message ID:', error.message);
        }
    }

    // Fetch new messages since last check
    async fetchNewMessages() {
        if (!this.groupId) {
            console.log('⚠️ Group ID not available, skipping fetch');
            return;
        }

        try {
            const response = await axios.get(`${WHAPI_BASE_URL}/messages/list/${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Accept': 'application/json'
                },
                params: {
                    limit: 50, // Fetch more messages to catch up
                    sort: 'desc'
                }
            });

            if (!response.data.messages || response.data.messages.length === 0) {
                console.log('📭 No new messages found');
                return;
            }

            // Filter out already processed messages
            const newMessages = response.data.messages.filter(msg => 
                !this.processedMessageIds.has(msg.id)
            );

            if (newMessages.length === 0) {
                console.log('📭 No new unprocessed messages');
                return;
            }

            console.log(`📨 Found ${newMessages.length} new messages to process`);

            // Process messages in chronological order (oldest first)
            const sortedMessages = newMessages.sort((a, b) => a.timestamp - b.timestamp);
            
            for (const message of sortedMessages) {
                await this.processMessage(message);
                this.processedMessageIds.add(message.id);
            }

            // Update last message ID
            if (response.data.messages.length > 0) {
                this.lastMessageId = response.data.messages[0].id;
            }

        } catch (error) {
            console.error('Error fetching messages:', error.message);
        }
    }

    // Process individual message
    async processMessage(message) {
        try {
            console.log(`🔄 Processing message: ${message.id} (${message.type})`);

            // Handle different message types
            switch (message.type) {
                case 'text':
                    await this.processTextMessage(message);
                    break;
                case 'reaction':
                    await this.processReactionMessage(message);
                    break;
                case 'system':
                    // Handle system messages (like message deletions)
                    if (message.subtype === 'revoke') {
                        console.log(`🗑️ Message deleted: ${message.id}`);
                    }
                    break;
                case 'action':
                    // Handle action messages (like message deletions)
                    if (message.action?.type === 'delete') {
                        console.log(`🗑️ Message deleted by action: ${message.action.target}`);
                    }
                    break;
                default:
                    console.log(`ℹ️ Unhandled message type: ${message.type}`);
            }
        } catch (error) {
            console.error(`Error processing message ${message.id}:`, error.message);
        }
    }

    // Process text messages (potential project submissions)
    async processTextMessage(message) {
        const messageText = message.text?.body || '';
        
        // Check if this looks like a project submission
        if (this.isProjectSubmission(messageText)) {
            const project = this.parseProjectMessage(messageText, message);
            
            if (project) {
                // Check for duplicates before adding
                const existingProject = this.findDuplicateProject(project);
                
                if (existingProject) {
                    console.log(`⚠️ Duplicate project found, skipping: ${project.name}`);
                    return;
                }

                addProject(project);
                console.log(`✅ New project added: ${project.name}`);
            } else {
                console.log(`⚠️ Message looks like project but parsing failed: ${messageText.substring(0, 50)}...`);
            }
        } else {
            // Check if this is a reply to a project message
            if (message.context?.quoted_message) {
                await this.processReplyMessage(message);
            }
        }
    }

    // Process reaction messages
    async processReactionMessage(message) {
        const reactionData = {
            messageId: message.message_id || message.id,
            emoji: message.reaction?.emoji || '',
            sender: message.from_name || message.sender || 'Unknown',
            timestamp: new Date().toISOString(),
            chatId: message.chat_id
        };

        addReaction(reactionData);
        console.log(`👍 Reaction added: ${reactionData.emoji} from ${reactionData.sender}`);
    }

    // Process reply messages
    async processReplyMessage(message) {
        const replyData = {
            messageId: message.id,
            quotedMessageId: message.context.quoted_message.id,
            text: message.text?.body || '',
            sender: message.from_name || message.sender || 'Unknown',
            timestamp: new Date().toISOString(),
            chatId: message.chat_id
        };

        addReply(replyData);
        console.log(`💬 Reply added from ${replyData.sender}`);
    }

    // Check if message looks like a project submission
    isProjectSubmission(text) {
        const projectKeywords = [
            'project name:', 'name:', 'description:', 'url:', 
            'team name:', 'team members:', 'github:', 'demo:'
        ];
        
        const lowerText = text.toLowerCase();
        return projectKeywords.some(keyword => lowerText.includes(keyword));
    }

    // Parse project message
    parseProjectMessage(message, messageData) {
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
                    description += (description ? ' ' : '') + line;
                } else if (currentField === 'url' && !url) {
                    url = line;
                } else if (currentField === 'teamName' && !teamName) {
                    teamName = line;
                } else if (currentField === 'teamMembers') {
                    teamMembers += (teamMembers ? ', ' : '') + line;
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
        if (name && description && url && teamName && teamMembers && this.isValidUrl(url)) {
            return {
                name,
                description,
                url,
                teamName,
                teamMembers,
                sender: messageData.from_name || messageData.sender || 'Unknown',
                groupName: TARGET_GROUP,
                messageId: messageData.id,
                timestamp: new Date(messageData.timestamp * 1000).toISOString()
            };
        }
        
        return null;
    }

    // Check for duplicate projects
    findDuplicateProject(newProject) {
        const existingProjects = getAllProjects();
        
        return existingProjects.find(existing => 
            existing.name.toLowerCase() === newProject.name.toLowerCase() ||
            existing.url === newProject.url ||
            (existing.messageId === newProject.messageId)
        );
    }

    // Validate URL format
    isValidUrl(string) {
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

    // Start the fetcher
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Message fetcher is already running');
            return;
        }

        const initialized = await this.initialize();
        if (!initialized) {
            console.log('❌ Failed to initialize message fetcher');
            return;
        }

        this.isRunning = true;
        console.log('🔄 Starting message fetcher (every 60 seconds as backup sync)...');

        // Run immediately
        await this.fetchNewMessages();

        // Then run every 60 seconds as backup sync method
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                try {
                    console.log('🔄 Running scheduled message fetch (backup sync)...');
                    await this.fetchNewMessages();
                } catch (error) {
                    console.error('❌ Error in scheduled message fetch:', error.message);
                }
            }
        }, 60000); // 60 seconds - backup sync frequency
    }

    // Stop the fetcher
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏹️ Message fetcher stopped');
    }

    // Get status
    getStatus() {
        return {
            isRunning: this.isRunning,
            groupId: this.groupId,
            lastMessageId: this.lastMessageId,
            processedCount: this.processedMessageIds.size
        };
    }
}

// Create singleton instance
const messageFetcher = new MessageFetcher();

export default messageFetcher;
