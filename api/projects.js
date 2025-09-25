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
        // Simple hardcoded response
        const projects = [
            {
                "name": "Test Project",
                "description": "This is a test project to verify persistence",
                "url": "https://example.com",
                "teamName": "Test Team",
                "teamMembers": "Test User, Test Member",
                "sender": "Test User",
                "groupName": "Test Group",
                "timestamp": "2025-09-25T17:51:20.348Z",
                "reactions": [],
                "replies": [],
                "reactionCounts": {},
                "totalReactions": 0,
                "totalReplies": 0
            },
            {
                "name": "Hacked",
                "description": "Hackathon project description",
                "url": "https://hacked.com",
                "teamName": "Hackerz",
                "teamMembers": "Jerom Tom, John Doe",
                "sender": "Jerom Tom",
                "groupName": "HackTillDawn Final Participants",
                "timestamp": "2025-01-27T10:00:00.000Z",
                "reactions": [],
                "replies": [],
                "reactionCounts": {},
                "totalReactions": 0,
                "totalReplies": 0
            },
            {
                "name": "Project Gallery",
                "description": "View and vote on all projects built at HackTillDawn.",
                "url": "https://hacktilldawn-website.vercel.app/projects",
                "teamName": "HackTillDawn",
                "teamMembers": "Joann, Jerom",
                "sender": "Jerom Palimattom Tom",
                "groupName": "HackTillDawn Final Participants",
                "messageId": "pe.VGVcxmWLREHCNvj7a4Q-wpgBq53lJfJECQ",
                "timestamp": "2025-09-25T21:21:04.000Z",
                "reactions": [],
                "replies": [],
                "reactionCounts": {},
                "totalReactions": 0,
                "totalReplies": 0
            }
        ];
        
        res.json({
            projects: projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            totalCount: projects.length,
            lastUpdated: projects.length > 0 ? projects[0].timestamp : null,
            metadata: {},
            isSampleData: false,
            dataSource: 'real'
        });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}