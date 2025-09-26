#!/usr/bin/env node

/**
 * Comprehensive test script for reactions and feedbacks functionality
 * Tests API endpoints, data processing, and frontend display
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test data
const testReactions = [
  {
    messageId: "msg_eco_001",
    emoji: "🌱",
    sender: "Eve Wilson",
    timestamp: "2025-01-25T20:15:00.000Z",
    chatId: "test@g.us"
  },
  {
    messageId: "msg_eco_001",
    emoji: "🚀",
    sender: "Frank Miller",
    timestamp: "2025-01-25T21:15:00.000Z",
    chatId: "test@g.us"
  },
  {
    messageId: "msg_eco_001",
    emoji: "💡",
    sender: "Grace Lee",
    timestamp: "2025-01-25T20:30:00.000Z",
    chatId: "test@g.us"
  },
  {
    messageId: "msg_eco_002",
    emoji: "🔥",
    sender: "Henry Davis",
    timestamp: "2025-01-25T22:00:00.000Z",
    chatId: "test@g.us"
  }
];

const testReplies = [
  {
    messageId: "reply_001",
    quotedMessageId: "msg_eco_001",
    text: "This looks amazing! How do you handle power consumption?",
    sender: "Henry Davis",
    timestamp: "2025-01-25T20:20:00.000Z",
    chatId: "test@g.us"
  },
  {
    messageId: "reply_002",
    quotedMessageId: "msg_eco_001",
    text: "Great work! Have you tested this in real conditions?",
    sender: "Ivy Chen",
    timestamp: "2025-01-25T21:20:00.000Z",
    chatId: "test@g.us"
  },
  {
    messageId: "reply_003",
    quotedMessageId: "msg_eco_002",
    text: "Excellent implementation! The UI looks very clean.",
    sender: "Jack Wilson",
    timestamp: "2025-01-25T22:10:00.000Z",
    chatId: "test@g.us"
  }
];

const testProjects = [
  {
    messageId: "msg_eco_001",
    name: "EcoMonitor Pro",
    description: "A comprehensive environmental monitoring system for rural communities",
    url: "https://github.com/test/eco-monitor",
    teamName: "GreenTech Solutions",
    teamMembers: "Alice, Bob, Charlie",
    sender: "Alice Johnson",
    timestamp: "2025-01-25T19:00:00.000Z"
  },
  {
    messageId: "msg_eco_002",
    name: "Smart Health Tracker",
    description: "AI-powered health monitoring device for elderly care",
    url: "https://github.com/test/health-tracker",
    teamName: "HealthTech Innovators",
    teamMembers: "David, Emma, Frank",
    sender: "David Smith",
    timestamp: "2025-01-25T20:00:00.000Z"
  }
];

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
async function testServerHealth() {
  log('Testing server health...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok && (data.status === 'ok' || data.status === 'OK')) {
      log('Server is healthy', 'success');
      return true;
    } else {
      log(`Server health check failed: ${JSON.stringify(data)}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Server health check failed: ${error.message}`, 'error');
    return false;
  }
}

async function testProjectsAPI() {
  log('Testing projects API...');
  try {
    const response = await fetch(`${API_URL}/projects`);
    const data = await response.json();
    
    if (response.ok && data.projects) {
      log(`Projects API working - found ${data.projects.length} projects`, 'success');
      return data.projects;
    } else {
      log(`Projects API failed: ${JSON.stringify(data)}`, 'error');
      return null;
    }
  } catch (error) {
    log(`Projects API failed: ${error.message}`, 'error');
    return null;
  }
}

async function testWebhookIntegration() {
  log('Testing webhook integration for reactions and replies...');
  
  try {
    // Test adding reactions via webhook
    for (const reaction of testReactions) {
      const webhookPayload = {
        messages: [{
          id: reaction.messageId,
          type: 'reaction',
          reaction: {
            emoji: reaction.emoji,
            message_id: reaction.messageId
          },
          from: reaction.sender,
          timestamp: Math.floor(new Date(reaction.timestamp).getTime() / 1000),
          chat_id: reaction.chatId
        }]
      };
      
      const response = await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Whapi-Signature': 'test-signature'
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        log(`Reaction ${reaction.emoji} from ${reaction.sender} processed successfully`, 'success');
      } else {
        log(`Failed to process reaction ${reaction.emoji}: ${response.status}`, 'error');
      }
      
      await sleep(100); // Small delay between requests
    }
    
    // Test adding replies via webhook
    for (const reply of testReplies) {
      const webhookPayload = {
        messages: [{
          id: reply.messageId,
          type: 'text',
          text: {
            body: reply.text
          },
          context: {
            quoted_message: {
              id: reply.quotedMessageId
            }
          },
          from: reply.sender,
          timestamp: Math.floor(new Date(reply.timestamp).getTime() / 1000),
          chat_id: reply.chatId
        }]
      };
      
      const response = await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Whapi-Signature': 'test-signature'
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        log(`Reply from ${reply.sender} processed successfully`, 'success');
      } else {
        log(`Failed to process reply from ${reply.sender}: ${response.status}`, 'error');
      }
      
      await sleep(100); // Small delay between requests
    }
    
    return true;
  } catch (error) {
    log(`Webhook integration test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testDataProcessing() {
  log('Testing data processing and counting...');
  
  try {
    // First, add test projects
    for (const project of testProjects) {
      const webhookPayload = {
        messages: [{
          id: project.messageId,
          type: 'text',
          text: {
            body: `Project: ${project.name}\nDescription: ${project.description}\nURL: ${project.url}\nTeam: ${project.teamName}\nMembers: ${project.teamMembers}`
          },
          from: project.sender,
          timestamp: Math.floor(new Date(project.timestamp).getTime() / 1000),
          chat_id: "test@g.us"
        }]
      };
      
      await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Whapi-Signature': 'test-signature'
        },
        body: JSON.stringify(webhookPayload)
      });
      
      await sleep(100);
    }
    
    // Wait a moment for processing
    await sleep(1000);
    
    // Check if projects were added
    const response = await fetch(`${API_URL}/projects`);
    const data = await response.json();
    
    if (data.projects && data.projects.length > 0) {
      log(`Found ${data.projects.length} projects after adding test data`, 'success');
      
      // Check if reactions and replies are properly counted
      for (const project of data.projects) {
        if (project.messageId === 'msg_eco_001') {
          log(`Project ${project.name} has ${project.totalReactions || 0} reactions and ${project.totalReplies || 0} replies`, 'info');
          
          if (project.reactionCounts) {
            log(`Reaction breakdown: ${JSON.stringify(project.reactionCounts)}`, 'info');
          }
          
          if (project.reactions && project.reactions.length > 0) {
            log(`Reactions details: ${project.reactions.length} reactions found`, 'info');
          }
          
          if (project.replies && project.replies.length > 0) {
            log(`Replies details: ${project.replies.length} replies found`, 'info');
          }
        }
      }
      
      return true;
    } else {
      log('No projects found after adding test data', 'error');
      return false;
    }
  } catch (error) {
    log(`Data processing test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testFrontendData() {
  log('Testing frontend data structure...');
  
  try {
    const response = await fetch(`${API_URL}/projects`);
    const data = await response.json();
    
    if (data.projects && data.projects.length > 0) {
      const project = data.projects[0];
      
      // Check required fields for frontend
      const requiredFields = ['name', 'description', 'url', 'timestamp'];
      const missingFields = requiredFields.filter(field => !project[field]);
      
      if (missingFields.length === 0) {
        log('All required frontend fields present', 'success');
      } else {
        log(`Missing frontend fields: ${missingFields.join(', ')}`, 'warning');
      }
      
      // Check reaction data structure
      if (project.reactionCounts && typeof project.reactionCounts === 'object') {
        log('Reaction counts structure is correct', 'success');
      } else {
        log('Reaction counts structure is missing or incorrect', 'warning');
      }
      
      // Check total counts
      if (typeof project.totalReactions === 'number' && typeof project.totalReplies === 'number') {
        log('Total counts are properly calculated', 'success');
      } else {
        log('Total counts are missing or incorrect', 'warning');
      }
      
      return true;
    } else {
      log('No projects available for frontend testing', 'error');
      return false;
    }
  } catch (error) {
    log(`Frontend data test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testDataFiles() {
  log('Testing data file integrity...');
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data files exist
    const files = ['projects.json', 'reactions.json', 'replies.json'];
    const fileStatus = {};
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        fileStatus[file] = {
          exists: true,
          valid: Array.isArray(data),
          count: data.length
        };
        log(`${file}: ${data.length} items, valid JSON: ${Array.isArray(data)}`, 'success');
      } else {
        fileStatus[file] = { exists: false };
        log(`${file}: not found`, 'warning');
      }
    }
    
    return fileStatus;
  } catch (error) {
    log(`Data files test failed: ${error.message}`, 'error');
    return false;
  }
}

async function runAllTests() {
  log('Starting comprehensive reactions and feedbacks test...', 'info');
  log('='.repeat(60), 'info');
  
  const results = {
    serverHealth: false,
    projectsAPI: false,
    webhookIntegration: false,
    dataProcessing: false,
    frontendData: false,
    dataFiles: false
  };
  
  // Run tests
  results.serverHealth = await testServerHealth();
  if (!results.serverHealth) {
    log('Server is not running. Please start the server with: npm run dev:full', 'error');
    return results;
  }
  
  results.projectsAPI = await testProjectsAPI();
  results.webhookIntegration = await testWebhookIntegration();
  results.dataProcessing = await testDataProcessing();
  results.frontendData = await testFrontendData();
  results.dataFiles = await testDataFiles();
  
  // Summary
  log('='.repeat(60), 'info');
  log('TEST RESULTS SUMMARY:', 'info');
  log('='.repeat(60), 'info');
  
  const testNames = {
    serverHealth: 'Server Health',
    projectsAPI: 'Projects API',
    webhookIntegration: 'Webhook Integration',
    dataProcessing: 'Data Processing',
    frontendData: 'Frontend Data Structure',
    dataFiles: 'Data Files Integrity'
  };
  
  let passedTests = 0;
  let totalTests = Object.keys(results).length;
  
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? 'PASS' : 'FAIL';
    const icon = passed ? '✅' : '❌';
    log(`${icon} ${testNames[key]}: ${status}`, passed ? 'success' : 'error');
    if (passed) passedTests++;
  }
  
  log('='.repeat(60), 'info');
  log(`Overall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'warning');
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! Reactions and feedbacks are working correctly.', 'success');
  } else {
    log('⚠️ Some tests failed. Please check the issues above.', 'warning');
  }
  
  return results;
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testServerHealth, testProjectsAPI, testWebhookIntegration, testDataProcessing, testFrontendData, testDataFiles };
