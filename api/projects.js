import { getAllProjectsWithFallback, getProjectsCountWithFallback, getLastUpdatedWithFallback } from './projects-fallback.js';

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
        // Get real data from database (with file fallback)
        const projects = await getAllProjectsWithFallback();
        const totalCount = await getProjectsCountWithFallback();
        const lastUpdated = await getLastUpdatedWithFallback();
        
        res.json({
            projects: projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            totalCount,
            lastUpdated,
            metadata: {
                dataSource: 'database',
                lastFetched: new Date().toISOString(),
                updateFrequency: 'real-time via webhook'
            },
            isSampleData: false,
            dataSource: 'database'
        });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}