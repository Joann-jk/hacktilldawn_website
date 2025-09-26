import { getSupabaseClient, executeSupabaseQuery } from './supabase-connection.js';

// Get all projects with reactions and replies
export async function getAllProjects() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        // Get all projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .order('timestamp', { ascending: false });

        if (projectsError) {
            throw new Error(`Failed to fetch projects: ${projectsError.message}`);
        }

        // Get reactions and replies for each project
        const projectsWithData = await Promise.all(
            projects.map(async (project) => {
                // Get reactions for this project
                const { data: reactions } = await supabase
                    .from('reactions')
                    .select('*')
                    .eq('message_id', project.message_id)
                    .order('timestamp', { ascending: true });

                // Get replies for this project
                const { data: replies } = await supabase
                    .from('replies')
                    .select('*')
                    .eq('quoted_message_id', project.message_id)
                    .order('timestamp', { ascending: true });

                // Calculate reaction counts
                const reactionCounts = {};
                let totalReactions = 0;
                
                if (reactions) {
                    reactions.forEach(reaction => {
                        reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
                        totalReactions++;
                    });
                }

                return {
                    ...project,
                    reactions: reactions || [],
                    replies: replies || [],
                    reactionCounts,
                    totalReactions,
                    totalReplies: replies ? replies.length : 0
                };
            })
        );

        return projectsWithData;
    } catch (error) {
        console.error('Error fetching projects from Supabase:', error);
        throw error;
    }
}

// Add a new project
export async function addProject(project) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const {
        name,
        description,
        url,
        teamName,
        teamMembers,
        sender,
        groupName,
        messageId,
        timestamp
    } = project;

    try {
        // Check if project already exists
        const { data: existingProject } = await supabase
            .from('projects')
            .select('*')
            .eq('message_id', messageId)
            .single();

        if (existingProject) {
            console.log(`🔄 Duplicate project found, updating: ${name} (${messageId})`);
            return await updateProject(existingProject.id, project);
        }

        // Insert new project
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                url,
                team_name: teamName,
                team_members: teamMembers,
                sender,
                group_name: groupName,
                message_id: messageId,
                timestamp
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to add project: ${error.message}`);
        }

        console.log(`✅ New project added: ${name} (${messageId})`);
        return { ...data, ...project };
    } catch (error) {
        console.error('Error adding project to Supabase:', error);
        throw error;
    }
}

// Update existing project
export async function updateProject(projectId, project) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const {
        name,
        description,
        url,
        teamName,
        teamMembers,
        sender,
        timestamp
    } = project;

    try {
        const { data, error } = await supabase
            .from('projects')
            .update({
                name,
                description,
                url,
                team_name: teamName,
                team_members: teamMembers,
                sender,
                timestamp
            })
            .eq('id', projectId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update project: ${error.message}`);
        }

        console.log(`✅ Project updated: ${name}`);
        return { ...data, ...project };
    } catch (error) {
        console.error('Error updating project in Supabase:', error);
        throw error;
    }
}

// Add reaction to project
export async function addReaction(reactionData) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { messageId, emoji, sender, timestamp, chatId } = reactionData;

    try {
        // Check if project exists
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('message_id', messageId)
            .single();

        if (!project) {
            console.log(`⚠️ No project found for reaction messageId: ${messageId}`);
            return null;
        }

        // Insert reaction
        const { data, error } = await supabase
            .from('reactions')
            .insert({
                message_id: messageId,
                emoji,
                sender,
                timestamp,
                chat_id: chatId
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to add reaction: ${error.message}`);
        }

        console.log(`👍 Reaction added to project: ${project.name} (${emoji})`);
        return { ...data, ...reactionData };
    } catch (error) {
        console.error('Error adding reaction to Supabase:', error);
        throw error;
    }
}

// Add reply to project
export async function addReply(replyData) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { messageId, quotedMessageId, text, sender, timestamp, chatId } = replyData;

    try {
        // Check if project exists
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('message_id', quotedMessageId)
            .single();

        if (!project) {
            console.log(`⚠️ No project found for reply quotedMessageId: ${quotedMessageId}`);
            return null;
        }

        // Insert reply
        const { data, error } = await supabase
            .from('replies')
            .insert({
                message_id: messageId,
                quoted_message_id: quotedMessageId,
                text,
                sender,
                timestamp,
                chat_id: chatId
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to add reply: ${error.message}`);
        }

        console.log(`💬 Reply added to project: ${project.name}`);
        return { ...data, ...replyData };
    } catch (error) {
        console.error('Error adding reply to Supabase:', error);
        throw error;
    }
}

// Get projects count
export async function getProjectsCount() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });

        if (error) {
            throw new Error(`Failed to get projects count: ${error.message}`);
        }

        return count || 0;
    } catch (error) {
        console.error('Error getting projects count from Supabase:', error);
        throw error;
    }
}

// Get last updated timestamp
export async function getLastUpdated() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('timestamp')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            throw new Error(`Failed to get last updated: ${error.message}`);
        }

        return data?.timestamp || null;
    } catch (error) {
        console.error('Error getting last updated from Supabase:', error);
        throw error;
    }
}

// Initialize Supabase database
export async function initializeSupabaseDatabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        // Test connection by trying to read from projects table
        const { data, error } = await supabase
            .from('projects')
            .select('count', { count: 'exact', head: true });

        if (error) {
            throw new Error(`Database not initialized: ${error.message}`);
        }

        console.log('✅ Supabase database is ready');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase database:', error);
        throw error;
    }
}
