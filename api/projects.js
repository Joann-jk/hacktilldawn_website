import { getAllProjects, getProjectsCount, getLastUpdated } from './projects-data.js';

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
        // Get real data from storage
        const projects = getAllProjects();
        
        // Calculate reaction counts and totals for each project
        const projectsWithCounts = projects.map(project => {
            const reactionCounts = {};
            let totalReactions = 0;
            
            // Count reactions by emoji
            if (project.reactions && project.reactions.length > 0) {
                project.reactions.forEach(reaction => {
                    if (reaction.emoji) {
                        reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
                        totalReactions++;
                    }
                });
            }
            
            return {
                ...project,
                reactionCounts,
                totalReactions,
                totalReplies: project.replies ? project.replies.length : 0
            };
        });
        
        res.json({
            projects: projectsWithCounts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            totalCount: getProjectsCount(),
            lastUpdated: getLastUpdated(),
            metadata: {
                dataSource: 'real',
                lastFetched: new Date().toISOString(),
                updateFrequency: 'real-time via webhook, 60s via message fetcher'
            },
            isSampleData: false,
            dataSource: 'real'
        });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}