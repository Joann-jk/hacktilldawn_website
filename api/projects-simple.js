export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        // Return simple test data
        const testProjects = [
            {
                name: "Test Project",
                description: "This is a test project to verify the API is working",
                url: "https://example.com",
                teamName: "Test Team",
                teamMembers: "Test User",
                sender: "Test Sender",
                groupName: "HackTillDawn Final Participants",
                messageId: "test_001",
                timestamp: new Date().toISOString(),
                reactions: [],
                replies: [],
                reactionCounts: {},
                totalReactions: 0,
                totalReplies: 0
            }
        ];
        
        res.json({
            projects: testProjects,
            totalCount: 1,
            lastUpdated: new Date().toISOString(),
            metadata: {
                dataSource: 'test',
                lastFetched: new Date().toISOString(),
                updateFrequency: 'test mode'
            },
            isSampleData: true,
            dataSource: 'test'
        });
    } catch (error) {
        console.error('Error in simple projects API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
