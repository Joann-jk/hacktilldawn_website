#!/usr/bin/env node

/**
 * Enhanced script to fetch projects, reactions, replies with better WhatsApp API handling
 */

import axios from 'axios';
import { addProject, addReaction, addReply, getAllProjects } from './api/projects-data.js';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN || 'FDGDimYWgfPCrzNJoFNB84r9IUyggia6';
const WHAPI_BASE_URL = 'https://gate.whapi.cloud';
const TARGET_GROUP = "HackTillDawn Final Participants";

class EnhancedDataFetcher {
    constructor() {
        this.groupId = null;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Enhanced Data Fetcher...');
            
            await this.getGroupId();
            
            if (!this.groupId) {
                throw new Error('Target group not found');
            }
            
            console.log(`✅ Target group found: ${TARGET_GROUP} (${this.groupId})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize:', error.message);
            return false;
        }
    }

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

    async fetchAllMessages(limit = 100) {
        try {
            console.log(`📨 Fetching latest ${limit} messages...`);
            
            const response = await axios.get(`${WHAPI_BASE_URL}/messages/list/${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Accept': 'application/json'
                },
                params: {
                    limit: limit,
                    sort: 'desc'
                }
            });

            if (!response.data.messages || response.data.messages.length === 0) {
                console.log('📭 No messages found');
                return [];
            }

            console.log(`📨 Found ${response.data.messages.length} messages`);
            return response.data.messages;
        } catch (error) {
            console.error('Error fetching messages:', error.message);
            return [];
        }
    }

    // Enhanced method to get reactions for a specific message
    async getMessageReactions(messageId) {
        try {
            const response = await axios.get(`${WHAPI_BASE_URL}/messages/reactions/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            return response.data.reactions || [];
        } catch (error) {
            console.log(`⚠️ Could not fetch reactions for message ${messageId}:`, error.message);
            return [];
        }
    }

    isProjectSubmission(text) {
        const projectKeywords = [
            'project name:', 'name:', 'description:', 'url:', 
            'team name:', 'team members:', 'github:', 'demo:'
        ];
        
        const lowerText = text.toLowerCase();
        return projectKeywords.some(keyword => lowerText.includes(keyword));
    }

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
        
        name = name.trim();
        description = description.trim();
        url = url.trim();
        teamName = teamName.trim();
        teamMembers = teamMembers.trim();
        
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

    findDuplicateProject(newProject) {
        const existingProjects = getAllProjects();
        
        return existingProjects.find(existing => 
            existing.name.toLowerCase() === newProject.name.toLowerCase() ||
            existing.url === newProject.url ||
            (existing.messageId === newProject.messageId)
        );
    }

    async processAllMessages() {
        const messages = await this.fetchAllMessages(100);
        
        console.log('\n📋 Processing All Messages:');
        console.log('=' .repeat(60));
        
        let projectCount = 0;
        let reactionCount = 0;
        let replyCount = 0;
        let duplicateCount = 0;
        let validProjects = [];
        let allReactions = [];
        let allReplies = [];
        
        // Process messages in chronological order (oldest first)
        const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
        
        for (let i = 0; i < sortedMessages.length; i++) {
            const message = sortedMessages[i];
            const messageText = message.text?.body || '';
            
            console.log(`\n${i + 1}. Message ${message.id} (${message.type})`);
            console.log(`   From: ${message.from_name || 'Unknown'}`);
            console.log(`   Time: ${new Date(message.timestamp * 1000).toLocaleString()}`);
            console.log(`   Text: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);
            
            // Process different message types
            switch (message.type) {
                case 'text':
                    if (this.isProjectSubmission(messageText)) {
                        console.log('   🔍 Looks like a project submission');
                        
                        const project = this.parseProjectMessage(messageText, message);
                        if (project) {
                            const duplicate = this.findDuplicateProject(project);
                            if (duplicate) {
                                console.log(`   ⚠️ Duplicate project found, skipping: ${project.name}`);
                                duplicateCount++;
                            } else {
                                addProject(project);
                                validProjects.push(project);
                                projectCount++;
                                console.log('   ✅ Successfully added project:');
                                console.log(`      Name: ${project.name}`);
                                console.log(`      Team: ${project.teamName}`);
                                console.log(`      URL: ${project.url}`);
                            }
                        } else {
                            console.log('   ❌ Failed to parse as valid project');
                        }
                    } else if (message.context?.quoted_message) {
                        // This is a reply to another message
                        const replyData = {
                            messageId: message.id,
                            quotedMessageId: message.context.quoted_message.id,
                            text: messageText,
                            sender: message.from_name || 'Unknown',
                            timestamp: new Date(message.timestamp * 1000).toISOString(),
                            chatId: message.chat_id
                        };
                        
                        addReply(replyData);
                        allReplies.push(replyData);
                        replyCount++;
                        console.log('   💬 Reply added from', replyData.sender);
                    } else {
                        console.log('   ℹ️  Regular message (not a project or reply)');
                    }
                    break;
                    
                case 'action':
                    // Handle action messages (including reactions)
                    if (message.action?.type === 'reaction') {
                        const reactionData = {
                            messageId: message.action.target || message.id,
                            emoji: message.action.reaction?.emoji || '👍',
                            sender: message.from_name || 'Unknown',
                            timestamp: new Date(message.timestamp * 1000).toISOString(),
                            chatId: message.chat_id
                        };
                        
                        addReaction(reactionData);
                        allReactions.push(reactionData);
                        reactionCount++;
                        console.log(`   👍 Reaction added: ${reactionData.emoji} from ${reactionData.sender}`);
                    } else {
                        console.log(`   🔧 Action message: ${message.action?.type || 'unknown'}`);
                    }
                    break;
                    
                case 'reaction':
                    // Handle direct reaction messages
                    const reactionData = {
                        messageId: message.message_id || message.id,
                        emoji: message.reaction?.emoji || '👍',
                        sender: message.from_name || 'Unknown',
                        timestamp: new Date(message.timestamp * 1000).toISOString(),
                        chatId: message.chat_id
                    };
                    
                    addReaction(reactionData);
                    allReactions.push(reactionData);
                    reactionCount++;
                    console.log(`   👍 Reaction added: ${reactionData.emoji} from ${reactionData.sender}`);
                    break;
                    
                case 'system':
                    console.log(`   ⚙️ System message: ${message.subtype || 'unknown'}`);
                    break;
                    
                default:
                    console.log(`   ℹ️  ${message.type} message (not processed)`);
            }
        }
        
        // Now try to fetch reactions for project messages
        console.log('\n🔍 Fetching reactions for project messages...');
        const projects = getAllProjects();
        
        for (const project of projects) {
            try {
                const reactions = await this.getMessageReactions(project.messageId);
                console.log(`   📊 Found ${reactions.length} reactions for project: ${project.name}`);
                
                for (const reaction of reactions) {
                    const reactionData = {
                        messageId: project.messageId,
                        emoji: reaction.emoji || '👍',
                        sender: reaction.sender || 'Unknown',
                        timestamp: new Date(reaction.timestamp * 1000).toISOString(),
                        chatId: project.messageId
                    };
                    
                    addReaction(reactionData);
                    allReactions.push(reactionData);
                    reactionCount++;
                }
            } catch (error) {
                console.log(`   ⚠️ Could not fetch reactions for ${project.name}: ${error.message}`);
            }
        }
        
        console.log('\n📊 Processing Summary:');
        console.log('=' .repeat(60));
        console.log(`   Total messages processed: ${sortedMessages.length}`);
        console.log(`   Valid projects added: ${projectCount}`);
        console.log(`   Duplicate projects skipped: ${duplicateCount}`);
        console.log(`   Reactions added: ${reactionCount}`);
        console.log(`   Replies added: ${replyCount}`);
        
        if (validProjects.length > 0) {
            console.log('\n🎉 Projects Added:');
            validProjects.forEach((project, index) => {
                console.log(`\n${index + 1}. ${project.name}`);
                console.log(`   Team: ${project.teamName}`);
                console.log(`   Members: ${project.teamMembers}`);
                console.log(`   URL: ${project.url}`);
                console.log(`   Description: ${project.description}`);
                console.log(`   Sender: ${project.sender}`);
                console.log(`   Time: ${project.timestamp}`);
            });
        }
        
        if (allReactions.length > 0) {
            console.log('\n👍 Reactions Added:');
            allReactions.forEach((reaction, index) => {
                console.log(`${index + 1}. ${reaction.emoji} from ${reaction.sender} (${reaction.messageId})`);
            });
        }
        
        if (allReplies.length > 0) {
            console.log('\n💬 Replies Added:');
            allReplies.forEach((reply, index) => {
                console.log(`${index + 1}. "${reply.text.substring(0, 50)}..." from ${reply.sender} (quoted: ${reply.quotedMessageId})`);
            });
        }
        
        // Show final project status
        const finalProjects = getAllProjects();
        console.log('\n📈 Final Project Status:');
        console.log(`   Total projects in database: ${finalProjects.length}`);
        
        finalProjects.forEach((project, index) => {
            console.log(`\n${index + 1}. ${project.name}`);
            console.log(`   Reactions: ${project.reactions?.length || 0}`);
            console.log(`   Replies: ${project.replies?.length || 0}`);
            if (project.reactionCounts) {
                console.log(`   Reaction breakdown: ${JSON.stringify(project.reactionCounts)}`);
            }
        });
    }
}

async function main() {
    const fetcher = new EnhancedDataFetcher();
    
    const initialized = await fetcher.initialize();
    if (!initialized) {
        console.log('❌ Failed to initialize');
        return;
    }

    await fetcher.processAllMessages();
}

main().catch(console.error);
