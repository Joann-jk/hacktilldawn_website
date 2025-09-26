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
        // Return test data that will definitely work
        const testProjects = [
            {
                name: "HackTillDawn Project Gallery",
                description: "View and vote on all projects built at HackTillDawn. This is a test project to verify the API is working correctly.",
                url: "https://hacktilldawn-website.vercel.app/projects",
                teamName: "HackTillDawn",
                teamMembers: "Joann, Jerom",
                sender: "Jerom Palimattom Tom",
                groupName: "HackTillDawn Final Participants",
                messageId: "pe.VGVcxmWLREHCNvj7a4Q-wpgBq53lJfJECQ",
                timestamp: "2025-09-25T23:00:37.000Z",
                reactions: [],
                replies: [],
                reactionCounts: {},
                totalReactions: 0,
                totalReplies: 0
            },
            {
                name: "Sample Project",
                description: "This is a sample project to demonstrate the system is working. Participants can submit their projects via WhatsApp!",
                url: "https://example.com",
                teamName: "Sample Team",
                teamMembers: "John Doe, Jane Smith",
                sender: "Sample User",
                groupName: "HackTillDawn Final Participants",
                messageId: "sample_001",
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
            totalCount: testProjects.length,
            lastUpdated: new Date().toISOString(),
            metadata: {
                dataSource: 'test',
                lastFetched: new Date().toISOString(),
                updateFrequency: 'test mode - ready for real data'
            },
            isSampleData: true,
            dataSource: 'test'
        });
    } catch (error) {
        console.error('Error in projects API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}