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
        // Check environment variables
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
            WHAPI_TOKEN: process.env.WHAPI_TOKEN ? 'Set' : 'Not set',
            WHAPI_WEBHOOK_SECRET: process.env.WHAPI_WEBHOOK_SECRET ? 'Set' : 'Not set',
        };
        
        // Test Supabase connection
        let supabaseStatus = 'Not tested';
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            supabaseStatus = 'Client created successfully';
        } catch (error) {
            supabaseStatus = `Error: ${error.message}`;
        }
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: envCheck,
            supabase: supabaseStatus,
            message: 'Debug endpoint working'
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        });
    }
}
