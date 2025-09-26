// Cloudflare Worker for HackTillDawn API - Enhanced with Real-time Webhook Processing
// This will handle all API requests and WhatsApp webhook processing

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Whapi-Signature',
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
        // Fetch projects with reactions and replies in parallel
        const [projectsResponse, reactionsResponse, repliesResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/projects?select=*&order=timestamp.desc`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${supabaseUrl}/rest/v1/reactions?select=*&order=timestamp.desc`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${supabaseUrl}/rest/v1/replies?select=*&order=timestamp.desc`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          })
        ])
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          const reactionsData = reactionsResponse.ok ? await reactionsResponse.json() : []
          const repliesData = repliesResponse.ok ? await repliesResponse.json() : []
          
          // Process and aggregate data
          const projects = projectsData.map(project => {
            // Filter reactions for this project
            const projectReactions = reactionsData.filter(r => r.message_id === project.message_id)
            
            // Filter replies for this project
            const projectReplies = repliesData.filter(r => r.quoted_message_id === project.message_id)
            
            // Count reactions by emoji
            const reactionCounts = {}
            projectReactions.forEach(reaction => {
              reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1
            })
            
            return {
              // Convert snake_case to camelCase for frontend
              messageId: project.message_id,
              name: project.name,
              description: project.description,
              url: project.url,
              teamName: project.team_name,
              teamMembers: project.team_members,
              sender: project.sender,
              groupName: project.group_name,
              timestamp: project.timestamp,
              reactions: projectReactions.map(r => ({
                emoji: r.emoji,
                sender: r.sender,
                timestamp: r.timestamp
              })),
              replies: projectReplies.map(r => ({
                text: r.text,
                sender: r.sender,
                timestamp: r.timestamp
              })),
              reactionCounts,
              totalReactions: projectReactions.length,
              totalReplies: projectReplies.length
            }
          })
          
          return new Response(JSON.stringify({
            projects,
            totalCount: projects.length,
            lastUpdated: projects.length > 0 ? projects[0].timestamp : null,
            metadata: {
              dataSource: 'supabase',
              lastFetched: new Date().toISOString(),
              updateFrequency: 'real-time via webhook',
              reactionsCount: reactionsData.length,
              repliesCount: repliesData.length
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
      reactions: [
        { emoji: "👍", sender: "Test User 1", timestamp: "2025-09-26T08:00:00.000Z" },
        { emoji: "🔥", sender: "Test User 2", timestamp: "2025-09-26T08:01:00.000Z" },
        { emoji: "👍", sender: "Test User 3", timestamp: "2025-09-26T08:02:00.000Z" }
      ],
      replies: [
        { text: "This looks amazing! Great work on the UI.", sender: "Test User 1", timestamp: "2025-09-26T08:05:00.000Z" },
        { text: "Love the real-time updates feature!", sender: "Test User 2", timestamp: "2025-09-26T08:06:00.000Z" }
      ],
      reactionCounts: { "👍": 2, "🔥": 1 },
      totalReactions: 3,
      totalReplies: 2
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
      reactions: [
        { emoji: "❤️", sender: "Test User 1", timestamp: new Date().toISOString() }
      ],
      replies: [],
      reactionCounts: { "❤️": 1 },
      totalReactions: 1,
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
      updateFrequency: 'fallback mode - ready for real data',
      reactionsCount: 4,
      repliesCount: 2
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
    
    // Webhook validation
    const signature = request.headers.get('X-Whapi-Signature')
    const webhookSecret = WHAPI_WEBHOOK_SECRET
    
    if (!signature && webhookSecret && webhookSecret !== 'default-secret') {
      console.warn('Missing webhook signature')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    
    console.log('✅ Webhook received:', body.type, 'from', body.chat_name || 'unknown')
    
    // Target group name
    const TARGET_GROUP = "HackTillDawn Final Participants"
    const supabaseUrl = SUPABASE_URL
    const supabaseKey = SUPABASE_ANON_KEY
    
    // Only process if Supabase is available
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, skipping webhook processing')
      return new Response(JSON.stringify({ 
        status: 'skipped', 
        message: 'Database not configured',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Handle different types of WhatsApp events
    if (body.type === 'message' && 
        body.chat_id && body.chat_id.includes('@g.us') && 
        body.chat_name === TARGET_GROUP) {
      
      const message = body.text?.body || ''
      
      // Check if it's a reply to a project
      if (body.context && body.context.quoted_message) {
        // This is a reply - store it
        const replyData = {
          message_id: body.message_id,
          quoted_message_id: body.context.quoted_message.id,
          text: message,
          sender: body.from_name || body.sender || 'Unknown',
          timestamp: new Date().toISOString(),
          chat_id: body.chat_id
        }
        
        await addReplyToSupabase(replyData, supabaseUrl, supabaseKey)
        console.log('✅ REAL-TIME: Reply added from', replyData.sender, ':', message.substring(0, 50) + '...')
        
      } else {
        // Check if it's a project submission
        const project = parseProjectMessage(message)
        
        if (project) {
          // Add sender info and store project
          project.sender = body.from_name || body.sender || 'Unknown'
          project.group_name = body.chat_name
          project.message_id = body.message_id
          project.timestamp = new Date().toISOString()
          
          await addProjectToSupabase(project, supabaseUrl, supabaseKey)
          console.log('✅ REAL-TIME: New project added:', project.name)
        } else {
          console.log('📝 Message from', TARGET_GROUP, 'did not match project format')
        }
      }
    } 
    // Handle reactions to project messages
    else if (body.type === 'reaction' && 
             body.chat_id && body.chat_id.includes('@g.us') && 
             body.chat_name === TARGET_GROUP) {
      
      const reactionData = {
        message_id: body.message_id,
        emoji: body.reaction?.emoji || '',
        sender: body.from_name || body.sender || 'Unknown',
        timestamp: new Date().toISOString(),
        chat_id: body.chat_id
      }
      
      await addReactionToSupabase(reactionData, supabaseUrl, supabaseKey)
      console.log('✅ REAL-TIME: Reaction added:', reactionData.emoji, 'from', reactionData.sender)
    }
    else if (body.type === 'message' && body.chat_id && body.chat_id.includes('@g.us')) {
      // Log messages from other groups (for debugging)
      console.log('📨 Message from other group:', body.chat_name, '- ignoring')
    }
    
    return new Response(JSON.stringify({ 
      status: 'success', 
      message: 'Webhook processed',
      timestamp: new Date().toISOString(),
      type: body.type,
      group: body.chat_name
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

// Helper function to parse project messages
function parseProjectMessage(message) {
  const lines = message.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  let name = ''
  let description = ''
  let url = ''
  let team_name = ''
  let team_members = ''
  let currentField = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check for field headers (case insensitive)
    if (line.toLowerCase().startsWith('project name:') || line.toLowerCase().startsWith('name:')) {
      currentField = 'name'
      name = line.substring(line.indexOf(':') + 1).trim()
    } else if (line.toLowerCase().startsWith('description:')) {
      currentField = 'description'
      description = line.substring(12).trim()
    } else if (line.toLowerCase().startsWith('url:')) {
      currentField = 'url'
      url = line.substring(4).trim()
    } else if (line.toLowerCase().startsWith('team name:')) {
      currentField = 'team_name'
      team_name = line.substring(10).trim()
    } else if (line.toLowerCase().startsWith('team members:')) {
      currentField = 'team_members'
      team_members = line.substring(13).trim()
    } else {
      // Continue reading content for the current field
      if (currentField === 'name' && !name) {
        name = line
      } else if (currentField === 'description') {
        if (description) {
          description += ' ' + line
        } else {
          description = line
        }
      } else if (currentField === 'url' && !url) {
        url = line
      } else if (currentField === 'team_name' && !team_name) {
        team_name = line
      } else if (currentField === 'team_members') {
        if (team_members) {
          team_members += ', ' + line
        } else {
          team_members = line
        }
      }
    }
  }
  
  // Clean up fields
  name = name.trim()
  description = description.trim()
  url = url.trim()
  team_name = team_name.trim()
  team_members = team_members.trim()
  
  // Validate required fields and URL format
  if (name && description && url && team_name && team_members && isValidUrl(url)) {
    return { name, description, url, team_name, team_members }
  }
  
  return null
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    try {
      new URL('https://' + string)
      return true
    } catch (_) {
      return false
    }
  }
}

// Helper function to add project to Supabase
async function addProjectToSupabase(project, supabaseUrl, supabaseKey) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(project)
    })
    
    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.status}`)
    }
    
    console.log('✅ Project stored in Supabase:', project.name)
  } catch (error) {
    console.error('Error adding project to Supabase:', error)
  }
}

// Helper function to add reaction to Supabase
async function addReactionToSupabase(reaction, supabaseUrl, supabaseKey) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/reactions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(reaction)
    })
    
    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.status}`)
    }
    
    console.log('✅ Reaction stored in Supabase:', reaction.emoji)
  } catch (error) {
    console.error('Error adding reaction to Supabase:', error)
  }
}

// Helper function to add reply to Supabase
async function addReplyToSupabase(reply, supabaseUrl, supabaseKey) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/replies`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(reply)
    })
    
    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.status}`)
    }
    
    console.log('✅ Reply stored in Supabase:', reply.text.substring(0, 30) + '...')
  } catch (error) {
    console.error('Error adding reply to Supabase:', error)
  }
}

async function handleDebug(request, corsHeaders) {
  try {
    const envCheck = {
      NODE_ENV: 'cloudflare-worker',
      SUPABASE_URL: SUPABASE_URL ? 'Set ✅' : 'Not set ❌',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set ✅' : 'Not set ❌',
      WHAPI_TOKEN: WHAPI_TOKEN ? 'Set ✅' : 'Not set ❌',
      WHAPI_WEBHOOK_SECRET: WHAPI_WEBHOOK_SECRET ? 'Set ✅' : 'Not set ❌',
    }
    
    return new Response(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      platform: 'Cloudflare Workers',
      message: 'Debug endpoint working - Real-time webhook processing enabled',
      features: {
        'Project Submissions': '✅ Enabled',
        'Reaction Processing': '✅ Enabled', 
        'Reply Processing': '✅ Enabled',
        'Real-time Database': SUPABASE_URL ? '✅ Connected' : '❌ Not configured'
      }
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