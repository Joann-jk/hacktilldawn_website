import { executeQuery, getConnection } from './connection.js';

// Get all projects with reactions and replies
export async function getAllProjects() {
    const query = `
        SELECT 
            p.*,
            COUNT(DISTINCT r.id) as total_reactions,
            COUNT(DISTINCT rep.id) as total_replies
        FROM projects p
        LEFT JOIN reactions r ON p.message_id = r.message_id
        LEFT JOIN replies rep ON p.message_id = rep.quoted_message_id
        GROUP BY p.id
        ORDER BY p.timestamp DESC
    `;
    
    const result = await executeQuery(query);
    if (!result.success) {
        throw new Error(`Failed to fetch projects: ${result.error}`);
    }
    
    // Get reactions for each project
    const projectsWithReactions = await Promise.all(
        result.data.map(async (project) => {
            const reactions = await getProjectReactions(project.message_id);
            const replies = await getProjectReplies(project.message_id);
            
            // Calculate reaction counts
            const reactionCounts = {};
            reactions.forEach(reaction => {
                reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
            });
            
            return {
                ...project,
                reactions,
                replies,
                reactionCounts,
                totalReactions: parseInt(project.total_reactions) || 0,
                totalReplies: parseInt(project.total_replies) || 0
            };
        })
    );
    
    return projectsWithReactions;
}

// Add a new project
export async function addProject(project) {
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
    
    // Check if project already exists
    const existingProject = await getProjectByMessageId(messageId);
    if (existingProject) {
        console.log(`🔄 Duplicate project found, updating: ${name} (${messageId})`);
        return await updateProject(existingProject.id, project);
    }
    
    const query = `
        INSERT INTO projects (name, description, url, team_name, team_members, sender, group_name, message_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [name, description, url, teamName, teamMembers, sender, groupName, messageId, timestamp];
    const result = await executeQuery(query, params);
    
    if (!result.success) {
        throw new Error(`Failed to add project: ${result.error}`);
    }
    
    console.log(`✅ New project added: ${name} (${messageId})`);
    return { id: result.data.insertId, ...project };
}

// Get project by message ID
export async function getProjectByMessageId(messageId) {
    const query = 'SELECT * FROM projects WHERE message_id = ?';
    const result = await executeQuery(query, [messageId]);
    
    if (!result.success) {
        throw new Error(`Failed to fetch project: ${result.error}`);
    }
    
    return result.data[0] || null;
}

// Update existing project
export async function updateProject(projectId, project) {
    const {
        name,
        description,
        url,
        teamName,
        teamMembers,
        sender,
        timestamp
    } = project;
    
    const query = `
        UPDATE projects 
        SET name = ?, description = ?, url = ?, team_name = ?, team_members = ?, sender = ?, timestamp = ?
        WHERE id = ?
    `;
    
    const params = [name, description, url, teamName, teamMembers, sender, timestamp, projectId];
    const result = await executeQuery(query, params);
    
    if (!result.success) {
        throw new Error(`Failed to update project: ${result.error}`);
    }
    
    console.log(`✅ Project updated: ${name}`);
    return { id: projectId, ...project };
}

// Add reaction to project
export async function addReaction(reactionData) {
    const { messageId, emoji, sender, timestamp, chatId } = reactionData;
    
    // Check if project exists
    const project = await getProjectByMessageId(messageId);
    if (!project) {
        console.log(`⚠️ No project found for reaction messageId: ${messageId}`);
        return null;
    }
    
    const query = `
        INSERT INTO reactions (message_id, emoji, sender, timestamp, chat_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const params = [messageId, emoji, sender, timestamp, chatId];
    const result = await executeQuery(query, params);
    
    if (!result.success) {
        throw new Error(`Failed to add reaction: ${result.error}`);
    }
    
    console.log(`👍 Reaction added to project: ${project.name} (${emoji})`);
    return { id: result.data.insertId, ...reactionData };
}

// Add reply to project
export async function addReply(replyData) {
    const { messageId, quotedMessageId, text, sender, timestamp, chatId } = replyData;
    
    // Check if project exists
    const project = await getProjectByMessageId(quotedMessageId);
    if (!project) {
        console.log(`⚠️ No project found for reply quotedMessageId: ${quotedMessageId}`);
        return null;
    }
    
    const query = `
        INSERT INTO replies (message_id, quoted_message_id, text, sender, timestamp, chat_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [messageId, quotedMessageId, text, sender, timestamp, chatId];
    const result = await executeQuery(query, params);
    
    if (!result.success) {
        throw new Error(`Failed to add reply: ${result.error}`);
    }
    
    console.log(`💬 Reply added to project: ${project.name}`);
    return { id: result.data.insertId, ...replyData };
}

// Get reactions for a project
export async function getProjectReactions(messageId) {
    const query = 'SELECT * FROM reactions WHERE message_id = ? ORDER BY timestamp ASC';
    const result = await executeQuery(query, [messageId]);
    
    if (!result.success) {
        throw new Error(`Failed to fetch reactions: ${result.error}`);
    }
    
    return result.data;
}

// Get replies for a project
export async function getProjectReplies(messageId) {
    const query = 'SELECT * FROM replies WHERE quoted_message_id = ? ORDER BY timestamp ASC';
    const result = await executeQuery(query, [messageId]);
    
    if (!result.success) {
        throw new Error(`Failed to fetch replies: ${result.error}`);
    }
    
    return result.data;
}

// Get projects count
export async function getProjectsCount() {
    const query = 'SELECT COUNT(*) as count FROM projects';
    const result = await executeQuery(query);
    
    if (!result.success) {
        throw new Error(`Failed to get projects count: ${result.error}`);
    }
    
    return result.data[0].count;
}

// Get last updated timestamp
export async function getLastUpdated() {
    const query = 'SELECT timestamp FROM projects ORDER BY timestamp DESC LIMIT 1';
    const result = await executeQuery(query);
    
    if (!result.success) {
        throw new Error(`Failed to get last updated: ${result.error}`);
    }
    
    return result.data[0]?.timestamp || null;
}

// Initialize database tables
export async function initializeDatabase() {
    const schema = `
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            url VARCHAR(500) NOT NULL,
            team_name VARCHAR(255) NOT NULL,
            team_members TEXT NOT NULL,
            sender VARCHAR(255) NOT NULL,
            group_name VARCHAR(255) NOT NULL,
            message_id VARCHAR(255) UNIQUE NOT NULL,
            timestamp DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_message_id (message_id),
            INDEX idx_timestamp (timestamp),
            INDEX idx_team_name (team_name)
        );
        
        CREATE TABLE IF NOT EXISTS reactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id VARCHAR(255) NOT NULL,
            emoji VARCHAR(10) NOT NULL,
            sender VARCHAR(255) NOT NULL,
            timestamp DATETIME NOT NULL,
            chat_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_message_id (message_id),
            INDEX idx_timestamp (timestamp)
        );
        
        CREATE TABLE IF NOT EXISTS replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id VARCHAR(255) NOT NULL,
            quoted_message_id VARCHAR(255) NOT NULL,
            text TEXT NOT NULL,
            sender VARCHAR(255) NOT NULL,
            timestamp DATETIME NOT NULL,
            chat_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_message_id (message_id),
            INDEX idx_quoted_message_id (quoted_message_id),
            INDEX idx_timestamp (timestamp)
        );
    `;
    
    const result = await executeQuery(schema);
    if (!result.success) {
        throw new Error(`Failed to initialize database: ${result.error}`);
    }
    
    console.log('✅ Database tables initialized successfully');
    return true;
}
