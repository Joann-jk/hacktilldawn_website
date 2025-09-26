// Debug script to test webhook processing with detailed logging
const testWebhook = async () => {
  const webhookUrl = 'https://hacktilldawn-api.dev-jeromtom.workers.dev/api/webhook';
  
  // Test cases that might fail
  const testCases = [
    {
      name: "Missing URL protocol",
      data: {
        type: "message",
        chat_id: "120363123456789@g.us",
        chat_name: "HackTillDawn Final Participants",
        from_name: "Test User 3",
        sender: "1234567892",
        message_id: "test_msg_125",
        text: {
          body: "Project Name: No Protocol URL\nDescription: Testing URL without https\nURL: github.com/test\nTeam Name: Test Team\nTeam Members: User C"
        }
      }
    },
    {
      name: "Missing required field",
      data: {
        type: "message",
        chat_id: "120363123456789@g.us",
        chat_name: "HackTillDawn Final Participants",
        from_name: "Test User 4",
        sender: "1234567893",
        message_id: "test_msg_126",
        text: {
          body: "Project Name: Missing Description\nURL: https://example.com\nTeam Name: Test Team\nTeam Members: User D"
        }
      }
    },
    {
      name: "Wrong group name",
      data: {
        type: "message",
        chat_id: "120363123456789@g.us",
        chat_name: "Wrong Group Name",
        from_name: "Test User 5",
        sender: "1234567894",
        message_id: "test_msg_127",
        text: {
          body: "Project Name: Wrong Group\nDescription: Testing wrong group\nURL: https://example.com\nTeam Name: Test Team\nTeam Members: User E"
        }
      }
    },
    {
      name: "Invalid URL",
      data: {
        type: "message",
        chat_id: "120363123456789@g.us",
        chat_name: "HackTillDawn Final Participants",
        from_name: "Test User 6",
        sender: "1234567895",
        message_id: "test_msg_128",
        text: {
          body: "Project Name: Invalid URL\nDescription: Testing invalid URL\nURL: not-a-url\nTeam Name: Test Team\nTeam Members: User F"
        }
      }
    },
    {
      name: "Different message format",
      data: {
        type: "message",
        chat_id: "120363123456789@g.us",
        chat_name: "HackTillDawn Final Participants",
        from_name: "Test User 7",
        sender: "1234567896",
        message_id: "test_msg_129",
        text: {
          body: "My project is called Cool App\nIt does amazing things\nCheck it out at https://coolapp.com\nWe are Team Awesome\nMembers: Alice, Bob"
        }
      }
    }
  ];

  console.log('🧪 Testing webhook processing with various message formats...\n');

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Message: ${testCase.data.text.body.substring(0, 50)}...`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Whapi-Signature': 'test-signature'
        },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response: ${JSON.stringify(result, null, 2)}`);
      
      // Wait a moment before checking if project was added
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if project was added
      const projectsResponse = await fetch('https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects');
      const projectsData = await projectsResponse.json();
      const projectExists = projectsData.projects.some(p => p.messageId === testCase.data.message_id);
      
      console.log(`🎯 Project added: ${projectExists ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
  
  console.log('\n🔍 Final project count:');
  const finalResponse = await fetch('https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects');
  const finalData = await finalResponse.json();
  console.log(`Total projects: ${finalData.totalCount}`);
  finalData.projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} (${project.messageId})`);
  });
};

testWebhook().catch(console.error);
