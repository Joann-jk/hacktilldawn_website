// Test script for Cloudflare Worker
// Run with: node test-cloudflare.js

const testAPI = async () => {
  const baseUrl = 'https://api.hacktilldawn.workers.dev';
  
  console.log('🧪 Testing Cloudflare Worker API');
  console.log('================================');
  
  try {
    // Test projects endpoint
    console.log('\n📊 Testing /api/projects...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    const projectsData = await projectsResponse.json();
    
    if (projectsResponse.ok) {
      console.log('✅ Projects API working!');
      console.log(`   Found ${projectsData.totalCount} projects`);
      console.log(`   Data source: ${projectsData.dataSource}`);
    } else {
      console.log('❌ Projects API failed:', projectsData);
    }
    
    // Test debug endpoint
    console.log('\n🔍 Testing /api/debug...');
    const debugResponse = await fetch(`${baseUrl}/api/debug`);
    const debugData = await debugResponse.json();
    
    if (debugResponse.ok) {
      console.log('✅ Debug API working!');
      console.log(`   Platform: ${debugData.platform}`);
      console.log(`   Supabase URL: ${debugData.environment.SUPABASE_URL}`);
    } else {
      console.log('❌ Debug API failed:', debugData);
    }
    
    // Test webhook endpoint
    console.log('\n📡 Testing /api/webhook...');
    const webhookResponse = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Whapi-Signature': 'test-signature'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook API working!');
    } else {
      console.log('❌ Webhook API failed:', await webhookResponse.text());
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAPI();
