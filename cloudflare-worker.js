// Cloudflare Worker for HackTillDawn API
// This will handle all API requests

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Route requests
  if (url.pathname === '/api/projects') {
    return handleProjects(request, corsHeaders)
  } else if (url.pathname === '/api/webhook') {
    return handleWebhook(request, corsHeaders)
  } else if (url.pathname === '/api/debug') {
    return handleDebug(request, corsHeaders)
  } else {
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}

async function handleProjects(request, corsHeaders) {
  try {
    // Check if Supabase is available
    const supabaseUrl = SUPABASE_URL
    const supabaseKey = SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      try {
        // Try Supabase first
        const response = await fetch(`${supabaseUrl}/rest/v1/projects?select=*&order=timestamp.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const projects = data.map(project => ({
            ...project,
            reactions: [],
            replies: [],
            reactionCounts: {},
            totalReactions: 0,
            totalReplies: 0
          }))
          
          return new Response(JSON.stringify({
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
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (error) {
        console.error('Supabase error:', error)
      }
    }
    
    // Fallback to static data
    return fallbackProjectsResponse(corsHeaders)
    
  } catch (error) {
    console.error('Error in projects API:', error)
    return fallbackProjectsResponse(corsHeaders)
  }
}

function fallbackProjectsResponse(corsHeaders) {
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
  ]
  
  return new Response(JSON.stringify({
    projects: testProjects,
    totalCount: testProjects.length,
    lastUpdated: new Date().toISOString(),
    metadata: {
      dataSource: 'fallback',
      lastFetched: new Date().toISOString(),
      updateFrequency: 'fallback mode - ready for real data'
    },
    isSampleData: true,
    dataSource: 'fallback'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleWebhook(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }
  
  try {
    const body = await request.json()
    
    // Basic webhook validation
    const signature = request.headers.get('X-Whapi-Signature')
    if (!signature) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    
    // Process webhook data (simplified for now)
    console.log('Webhook received:', JSON.stringify(body, null, 2))
    
    return new Response(JSON.stringify({ 
      status: 'success', 
      message: 'Webhook processed',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleDebug(request, corsHeaders) {
  try {
    const envCheck = {
      NODE_ENV: 'cloudflare-worker',
      SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Not set',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      WHAPI_TOKEN: WHAPI_TOKEN ? 'Set' : 'Not set',
      WHAPI_WEBHOOK_SECRET: WHAPI_WEBHOOK_SECRET ? 'Set' : 'Not set',
    }
    
    return new Response(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      platform: 'Cloudflare Workers',
      message: 'Debug endpoint working'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString(),
      platform: 'Cloudflare Workers'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
