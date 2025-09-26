#!/usr/bin/env node

/**
 * Script to manually fetch the latest messages from WhatsApp group
 * and attempt to parse them as projects
 */

import axios from 'axios';

const WHAPI_TOKEN = process.env.WHAPI_TOKEN || 'FDGDimYWgfPCrzNJoFNB84r9IUyggia6';
const WHAPI_BASE_URL = 'https://gate.whapi.cloud';
const TARGET_GROUP = "HackTillDawn Final Participants";

class MessageFetcher {
    constructor() {
        this.groupId = null;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Message Fetcher...');
            
            // Get the target group ID
            await this.getGroupId();
            
            if (!this.groupId) {
                throw new Error('Target group not found');
            }
            
            console.log(`✅ Target group found: ${TARGET_GROUP} (${this.groupId})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize message fetcher:', error.message);
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

    async fetchLatestMessages(limit = 20) {
        if (!this.groupId) {
            console.log('⚠️ Group ID not available');
            return;
        }

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

    parseProjectMessage(message) {
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
            return { name, description, url, teamName, teamMembers };
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

    isProjectSubmission(text) {
        const projectKeywords = [
            'project name:', 'name:', 'description:', 'url:', 
            'team name:', 'team members:', 'github:', 'demo:'
        ];
        
        const lowerText = text.toLowerCase();
        return projectKeywords.some(keyword => lowerText.includes(keyword));
    }
}

async function main() {
    const fetcher = new MessageFetcher();
    
    const initialized = await fetcher.initialize();
    if (!initialized) {
        console.log('❌ Failed to initialize');
        return;
    }

    const messages = await fetcher.fetchLatestMessages(20);
    
    console.log('\n📋 Latest Messages Analysis:');
    console.log('=' .repeat(50));
    
    let projectCount = 0;
    let validProjects = [];
    
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const messageText = message.text?.body || '';
        
        console.log(`\n${i + 1}. Message ${message.id} (${message.type})`);
        console.log(`   From: ${message.from_name || 'Unknown'}`);
        console.log(`   Time: ${new Date(message.timestamp * 1000).toLocaleString()}`);
        console.log(`   Text: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);
        
        if (message.type === 'text' && fetcher.isProjectSubmission(messageText)) {
            console.log('   🔍 Looks like a project submission');
            
            const project = fetcher.parseProjectMessage(messageText);
            if (project) {
                console.log('   ✅ Successfully parsed as project:');
                console.log(`      Name: ${project.name}`);
                console.log(`      Team: ${project.teamName}`);
                console.log(`      URL: ${project.url}`);
                validProjects.push({
                    ...project,
                    messageId: message.id,
                    sender: message.from_name || 'Unknown',
                    timestamp: new Date(message.timestamp * 1000).toISOString()
                });
                projectCount++;
            } else {
                console.log('   ❌ Failed to parse as valid project');
            }
        } else if (message.type === 'text') {
            console.log('   ℹ️  Regular message (not a project)');
        } else {
            console.log(`   ℹ️  ${message.type} message (not text)`);
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Valid projects found: ${projectCount}`);
    
    if (validProjects.length > 0) {
        console.log('\n🎉 Valid Projects Found:');
        validProjects.forEach((project, index) => {
            console.log(`\n${index + 1}. ${project.name}`);
            console.log(`   Team: ${project.teamName}`);
            console.log(`   Members: ${project.teamMembers}`);
            console.log(`   URL: ${project.url}`);
            console.log(`   Description: ${project.description}`);
            console.log(`   Sender: ${project.sender}`);
            console.log(`   Time: ${project.timestamp}`);
        });
    } else {
        console.log('\n❌ No valid projects found in recent messages');
        console.log('💡 Make sure messages follow this format:');
        console.log('   Project Name: [Name]');
        console.log('   Description: [Description]');
        console.log('   URL: [URL]');
        console.log('   Team Name: [Team Name]');
        console.log('   Team Members: [Members]');
    }
}

main().catch(console.error);
