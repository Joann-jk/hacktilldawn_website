#!/usr/bin/env node

/**
 * Test script to demonstrate project merging functionality
 */

import { addProject, addReaction, addReply, getAllProjects } from './api/projects-data.js';

console.log('🧪 Testing Project Merging Functionality...\n');

// Clear existing projects first
console.log('1️⃣ Clearing existing projects...');
const existingProjects = getAllProjects();
console.log(`   Found ${existingProjects.length} existing projects`);

// Test 1: Add the same project twice (simulating duplicate WhatsApp posts)
console.log('\n2️⃣ Adding same project twice (simulating duplicate posts)...');

const project1 = {
    name: "EcoTracker Pro",
    description: "A sustainable hardware solution for monitoring environmental parameters in rural communities.",
    url: "https://github.com/example/ecotracker-pro",
    teamName: "GreenTech Team",
    teamMembers: "Alice Johnson, Bob Smith",
    sender: "Alice Johnson",
    groupName: "HackTillDawn Final Participants",
    messageId: "msg_eco_001",
    timestamp: "2025-09-25T20:00:00.000Z"
};

const project2 = {
    name: "EcoTracker Pro",
    description: "An advanced sustainable hardware solution for monitoring environmental parameters in rural communities with real-time alerts and mobile app integration.",
    url: "https://github.com/example/ecotracker-pro",
    teamName: "Eco Warriors",
    teamMembers: "Carol Davis, David Wilson",
    sender: "Carol Davis",
    groupName: "HackTillDawn Final Participants",
    messageId: "msg_eco_002",
    timestamp: "2025-09-25T21:00:00.000Z"
};

// Add first project
console.log('   Adding first project...');
addProject(project1);

// Add second project (should merge)
console.log('   Adding second project (should merge)...');
addProject(project2);

// Test 2: Add reactions to both message IDs
console.log('\n3️⃣ Adding reactions to both message IDs...');

const reaction1 = {
    messageId: "msg_eco_001",
    emoji: "🌱",
    sender: "Eve Wilson",
    timestamp: "2025-09-25T20:15:00.000Z",
    chatId: "test@g.us"
};

const reaction2 = {
    messageId: "msg_eco_002",
    emoji: "🚀",
    sender: "Frank Miller",
    timestamp: "2025-09-25T21:15:00.000Z",
    chatId: "test@g.us"
};

const reaction3 = {
    messageId: "msg_eco_001",
    emoji: "💡",
    sender: "Grace Lee",
    timestamp: "2025-09-25T20:30:00.000Z",
    chatId: "test@g.us"
};

addReaction(reaction1);
addReaction(reaction2);
addReaction(reaction3);

// Test 3: Add replies to both message IDs
console.log('\n4️⃣ Adding replies to both message IDs...');

const reply1 = {
    messageId: "reply_001",
    quotedMessageId: "msg_eco_001",
    text: "This looks amazing! How do you handle power consumption?",
    sender: "Henry Davis",
    timestamp: "2025-09-25T20:20:00.000Z",
    chatId: "test@g.us"
};

const reply2 = {
    messageId: "reply_002",
    quotedMessageId: "msg_eco_002",
    text: "Great work! Have you tested this in real conditions?",
    sender: "Ivy Chen",
    timestamp: "2025-09-25T21:20:00.000Z",
    chatId: "test@g.us"
};

addReply(reply1);
addReply(reply2);

// Test 4: Check final results
console.log('\n5️⃣ Final Results:');
const finalProjects = getAllProjects();
console.log(`   Total projects: ${finalProjects.length}`);

finalProjects.forEach((project, index) => {
    console.log(`\n   Project ${index + 1}: ${project.name}`);
    console.log(`   Team: ${project.teamName}`);
    console.log(`   Members: ${project.teamMembers}`);
    console.log(`   Sender: ${project.sender}`);
    console.log(`   Message IDs: ${project.relatedMessageIds?.join(', ') || project.messageId}`);
    console.log(`   Reactions: ${project.reactions?.length || 0}`);
    console.log(`   Replies: ${project.replies?.length || 0}`);
    
    if (project.reactions && project.reactions.length > 0) {
        console.log(`   Reaction details:`);
        project.reactions.forEach((reaction, i) => {
            console.log(`     ${i + 1}. ${reaction.emoji} from ${reaction.sender} (${reaction.messageId})`);
        });
    }
    
    if (project.replies && project.replies.length > 0) {
        console.log(`   Reply details:`);
        project.replies.forEach((reply, i) => {
            console.log(`     ${i + 1}. "${reply.text}" from ${reply.sender} (quoted: ${reply.quotedMessageId})`);
        });
    }
});

console.log('\n✅ Test completed!');
console.log('\n📋 Summary:');
console.log('   - Same project posted twice should merge into one card');
console.log('   - Reactions from both posts should be combined');
console.log('   - Replies to both posts should be combined');
console.log('   - Team information should be merged');
console.log('   - Most recent timestamp should be kept');
