#!/usr/bin/env node

/**
 * Test script for real data integration
 * Tests the webhook and API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const WEBHOOK_URL = `${BASE_URL}/api/webhook`;
const PROJECTS_URL = `${BASE_URL}/api/projects`;

console.log('🧪 Testing real data integration...\n');

// Test 1: Health check
async function testHealth() {
    console.log('1. Testing health endpoint...');
    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();
        console.log(`   ✅ Health check: ${data.status}`);
    } catch (error) {
        console.log(`   ❌ Health check failed: ${error.message}`);
    }
}

// Test 2: Projects API (should show sample data initially)
async function testProjectsAPI() {
    console.log('\n2. Testing projects API...');
    try {
        const response = await fetch(PROJECTS_URL);
        const data = await response.json();
        
        console.log(`   ✅ Projects API: ${data.totalCount} projects`);
        console.log(`   📊 Data source: ${data.dataSource || data.metadata?.dataSource || 'unknown'}`);
        console.log(`   🔄 Is sample data: ${data.isSampleData || false}`);
        
        if (data.projects.length > 0) {
            console.log(`   📝 Latest project: ${data.projects[0].name}`);
        }
    } catch (error) {
        console.log(`   ❌ Projects API failed: ${error.message}`);
    }
}

// Test 3: Force sample data
async function testSampleData() {
    console.log('\n3. Testing sample data endpoint...');
    try {
        const response = await fetch(`${PROJECTS_URL}?sample=true`);
        const data = await response.json();
        
        console.log(`   ✅ Sample data: ${data.totalCount} projects`);
        console.log(`   📊 Data source: ${data.dataSource || data.metadata?.dataSource || 'unknown'}`);
    } catch (error) {
        console.log(`   ❌ Sample data test failed: ${error.message}`);
    }
}

// Test 4: Webhook endpoint (simulate WhatsApp message)
async function testWebhook() {
    console.log('\n4. Testing webhook endpoint...');
    
    const testMessage = {
        type: 'message',
        chat_id: '120363123456789012@g.us',
        chat_name: 'HackTillDawn Final Participants',
        sender: 'Test User',
        body: `Project Name: Test Integration Project
Description: This is a test project to verify the webhook integration is working properly. It includes all the required fields and should be processed correctly.
URL: https://github.com/test/integration-project
Team Name: Test Integration Team
Team Members: Test User, Integration Tester`,
        timestamp: Date.now()
    };
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': 'df8a7e013c5e90fefee7762f4f161c93fe07181d38325999ac845bbc0e90ea37'
            },
            body: JSON.stringify(testMessage)
        });
        
        if (response.ok) {
            console.log('   ✅ Webhook test: Message processed successfully');
        } else {
            const error = await response.text();
            console.log(`   ❌ Webhook test failed: ${response.status} - ${error}`);
        }
    } catch (error) {
        console.log(`   ❌ Webhook test failed: ${error.message}`);
    }
}

// Test 5: Check if real data was added
async function checkRealData() {
    console.log('\n5. Checking for real data...');
    try {
        const response = await fetch(PROJECTS_URL);
        const data = await response.json();
        
        const dataSource = data.dataSource || data.metadata?.dataSource;
        if (dataSource === 'real' && data.totalCount > 0) {
            console.log(`   ✅ Real data detected: ${data.totalCount} projects`);
            console.log(`   📝 Latest real project: ${data.projects[0].name}`);
        } else {
            console.log('   ℹ️  Still using sample data (this is normal if no real messages received)');
        }
    } catch (error) {
        console.log(`   ❌ Real data check failed: ${error.message}`);
    }
}

// Run all tests
async function runTests() {
    await testHealth();
    await testProjectsAPI();
    await testSampleData();
    await testWebhook();
    
    // Wait a moment for webhook processing
    console.log('\n⏳ Waiting for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await checkRealData();
    
    console.log('\n🎉 Testing complete!');
    console.log('\n📋 Summary:');
    console.log('   - Health endpoint should be working');
    console.log('   - Projects API should return data (sample or real)');
    console.log('   - Webhook should process test messages');
    console.log('   - Real data will appear when WhatsApp messages are received');
}

runTests().catch(console.error);
