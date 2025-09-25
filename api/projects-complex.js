// CommonJS version for better Vercel compatibility
const sampleProjects = [
  {
    name: "EcoTrack - Carbon Footprint Tracker",
    description: "A comprehensive mobile app that helps users track their daily carbon footprint through AI-powered analysis of their activities, purchases, and transportation choices. Features include real-time emissions calculation, personalized eco-friendly recommendations, and gamification elements to encourage sustainable living.",
    url: "https://github.com/ecotrack-team/carbon-footprint-app",
    teamName: "EcoTrack Team",
    teamMembers: "Sarah Chen, Alex Rodriguez, Maria Santos",
    sender: "Sarah Chen",
    groupName: "HackTillDawn Final Participants",
    timestamp: "2025-09-25T10:30:00.000Z",
    messageId: "sample-1",
    reactions: [
      { emoji: "🔥", sender: "Alex Rodriguez", timestamp: "2025-09-25T10:35:00.000Z" },
      { emoji: "💚", sender: "Maria Santos", timestamp: "2025-09-25T10:40:00.000Z" },
      { emoji: "🚀", sender: "John Doe", timestamp: "2025-09-25T11:00:00.000Z" }
    ],
    replies: [
      { 
        message: "This looks amazing! The AI integration is really impressive.", 
        sender: "Tech Reviewer", 
        timestamp: "2025-09-25T10:45:00.000Z" 
      }
    ]
  },
  {
    name: "MediConnect - Healthcare Bridge",
    description: "An innovative platform that connects patients with healthcare providers in underserved areas using telemedicine technology. The app includes AI-powered symptom analysis, appointment scheduling, prescription management, and real-time video consultations with certified doctors.",
    url: "https://github.com/mediconnect/healthcare-platform",
    teamName: "MediConnect Team",
    teamMembers: "Dr. Michael Rodriguez, Dr. Lisa Wang, James Chen",
    sender: "Dr. Michael Rodriguez",
    groupName: "HackTillDawn Final Participants",
    timestamp: "2025-09-25T11:15:00.000Z",
    messageId: "sample-2",
    reactions: [
      { emoji: "❤️", sender: "Dr. Lisa Wang", timestamp: "2025-09-25T11:20:00.000Z" },
      { emoji: "👏", sender: "James Chen", timestamp: "2025-09-25T11:25:00.000Z" }
    ],
    replies: []
  }
];

const hackathonMetadata = {
  name: "HackTillDawn 2025",
  theme: "Innovation for Tomorrow",
  totalParticipants: 150,
  submissionDeadline: "2025-09-25T23:59:59.000Z",
  judgingCriteria: [
    "Innovation and Creativity",
    "Technical Implementation", 
    "User Experience",
    "Social Impact",
    "Scalability"
  ],
  prizes: [
    { place: 1, amount: "$10,000", title: "Grand Prize" },
    { place: 2, amount: "$5,000", title: "Second Place" },
    { place: 3, amount: "$2,500", title: "Third Place" },
    { place: "Best AI", amount: "$1,000", title: "Best AI Implementation" },
    { place: "Best Mobile", amount: "$1,000", title: "Best Mobile App" },
    { place: "Best Web", amount: "$1,000", title: "Best Web Application" }
  ],
  sponsors: [
    "TechCorp Inc.",
    "Innovation Labs",
    "Future Ventures",
    "Digital Solutions Ltd."
  ]
};

// In-memory data storage for Vercel serverless functions
let projects = [
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
    "replies": []
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
    "replies": []
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
    "replies": []
  }
];

let reactions = [];
let replies = [];

// Helper functions
function getAllProjects() {
    return projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getProjectReactions(messageId) {
    return reactions.filter(r => r.messageId === messageId);
}

function getProjectReplies(messageId) {
    return replies.filter(r => r.quotedMessageId === messageId);
}

function handler(req, res) {
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
        const realProjects = getAllProjects();
        const useSampleData = req.query.sample === 'true' || (realProjects.length === 0 && process.env.NODE_ENV === 'development');
        
        let projectsToReturn;
        let metadata = {};
        
        if (useSampleData) {
            // Use sample data with proper structure
            projectsToReturn = sampleProjects.map(project => {
                const reactions = project.reactions || [];
                const replies = project.replies || [];
                
                // Count reactions by emoji
                const reactionCounts = reactions.reduce((acc, reaction) => {
                    const emoji = reaction.emoji;
                    acc[emoji] = (acc[emoji] || 0) + 1;
                    return acc;
                }, {});
                
                return {
                    ...project,
                    reactionCounts: reactionCounts,
                    totalReactions: reactions.length,
                    totalReplies: replies.length
                };
            });
            metadata = hackathonMetadata;
        } else {
            // Use real data
            projectsToReturn = realProjects.map(project => {
                const reactions = getProjectReactions(project.messageId);
                const replies = getProjectReplies(project.messageId);
                
                // Count reactions by emoji
                const reactionCounts = reactions.reduce((acc, reaction) => {
                    const emoji = reaction.emoji;
                    acc[emoji] = (acc[emoji] || 0) + 1;
                    return acc;
                }, {});
                
                return {
                    ...project,
                    reactions: reactions,
                    replies: replies,
                    reactionCounts: reactionCounts,
                    totalReactions: reactions.length,
                    totalReplies: replies.length
                };
            });
        }
        
        res.json({
            projects: projectsToReturn.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            totalCount: projectsToReturn.length,
            lastUpdated: projectsToReturn.length > 0 ? projectsToReturn[0].timestamp : null,
            metadata: metadata,
            isSampleData: useSampleData,
            dataSource: useSampleData ? 'sample' : 'real'
        });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = handler;
