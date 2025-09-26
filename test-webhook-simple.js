// Simple test to debug webhook processing
const testWebhook = async () => {
  const webhookUrl = 'https://hacktilldawn-api.dev-jeromtom.workers.dev/api/webhook';
  
  console.log('🧪 Testing webhook with exact participant format...\n');
  
  const testData = {
    type: "message",
    chat_id: "120363123456789@g.us",
    chat_name: "HackTillDawn Final Participants",
    from_name: "Test Participant",
    sender: "1234567901",
    message_id: "participant_test_001",
    text: {
      body: "Project Name: Your Amazing App\nDescription: This app solves the problem of X by doing Y\nURL: https://your-app.com\nTeam Name: Team Awesome\nTeam Members: John Doe, Jane Smith"
    }
  };
  
  console.log('📤 Sending webhook request...');
  console.log('Message body:', testData.text.body);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Whapi-Signature': 'test-signature'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('✅ Response status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    
    // Wait a moment and check if project was added
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Checking if project was added...');
    const projectsResponse = await fetch('https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects');
    const projectsData = await projectsResponse.json();
    
    console.log('📊 Current projects count:', projectsData.totalCount);
    const projectExists = projectsData.projects.some(p => p.messageId === 'participant_test_001');
    console.log('🎯 Project added:', projectExists ? 'YES' : 'NO');
    
    if (projectExists) {
      const project = projectsData.projects.find(p => p.messageId === 'participant_test_001');
      console.log('✅ Project details:', {
        name: project.name,
        description: project.description,
        url: project.url,
        teamName: project.teamName,
        teamMembers: project.teamMembers
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

testWebhook().catch(console.error);
