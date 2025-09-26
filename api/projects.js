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
        // Check if Supabase is available
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
            // Try Supabase
            try {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseKey);
                
                // Simple query to get projects
                supabase
                    .from('projects')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Supabase error:', error);
                            return fallbackResponse(res);
                        }
                        
                        const projects = (data || []).map(project => ({
                            ...project,
                            reactions: [],
                            replies: [],
                            reactionCounts: {},
                            totalReactions: 0,
                            totalReplies: 0
                        }));
                        
                        res.json({
                            projects,
                            totalCount: projects.length,
                            lastUpdated: projects.length > 0 ? projects[0].timestamp : null,
                            metadata: {
                                dataSource: 'supabase',
                                lastFetched: new Date().toISOString(),
                                updateFrequency: 'real-time via webhook'
                            },
                            isSampleData: false,
                            dataSource: 'supabase'
                        });
                    })
                    .catch(error => {
                        console.error('Supabase connection error:', error);
                        fallbackResponse(res);
                    });
                return;
            } catch (error) {
                console.error('Supabase setup error:', error);
                fallbackResponse(res);
                return;
            }
        } else {
            // No Supabase credentials, use fallback
            fallbackResponse(res);
        }
    } catch (error) {
        console.error('Error retrieving projects:', error);
        fallbackResponse(res);
    }
}

function fallbackResponse(res) {
    // Return test data as fallback
    const testProjects = [
        {
            name: "HackTillDawn Project Gallery",
            description: "View and vote on all projects built at HackTillDawn.",
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
        }
    ];
    
    res.json({
        projects: testProjects,
        totalCount: 1,
        lastUpdated: new Date().toISOString(),
        metadata: {
            dataSource: 'fallback',
            lastFetched: new Date().toISOString(),
            updateFrequency: 'fallback mode'
        },
        isSampleData: true,
        dataSource: 'fallback'
    });
}// Force rebuild
