import fs from 'fs';
import path from 'path';

// Fallback to file-based storage if database is not available
const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');
const REACTIONS_FILE = path.join(process.cwd(), 'data', 'reactions.json');
const REPLIES_FILE = path.join(process.cwd(), 'data', 'replies.json');

// Load data from JSON files
function loadProjects() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading projects from file:', error);
    }
    return [];
}

function loadReactions() {
    try {
        if (fs.existsSync(REACTIONS_FILE)) {
            const data = fs.readFileSync(REACTIONS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading reactions from file:', error);
    }
    return [];
}

function loadReplies() {
    try {
        if (fs.existsSync(REPLIES_FILE)) {
            const data = fs.readFileSync(REPLIES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading replies from file:', error);
    }
    return [];
}

// Save data to JSON files
function saveProjects(projects) {
    try {
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
        console.log(`Projects saved to ${DATA_FILE}`);
    } catch (error) {
        console.error('Error saving projects to file:', error);
    }
}

function saveReactions(reactions) {
    try {
        const dataDir = path.dirname(REACTIONS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2));
    } catch (error) {
        console.error('Error saving reactions to file:', error);
    }
}

function saveReplies(replies) {
    try {
        const dataDir = path.dirname(REPLIES_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(REPLIES_FILE, JSON.stringify(replies, null, 2));
    } catch (error) {
        console.error('Error saving replies to file:', error);
    }
}

// Add project with fallback
export async function addProjectWithFallback(project) {
    try {
        // Try Supabase first
        const { addProject } = await import('../database/supabase-projects.js');
        return await addProject(project);
    } catch (error) {
        console.warn('Supabase unavailable, trying MySQL fallback for project:', error.message);
        
        try {
            // Try MySQL fallback
            const { addProject } = await import('../database/projects-db.js');
            return await addProject(project);
        } catch (mysqlError) {
            console.warn('MySQL also unavailable, falling back to file storage for project:', mysqlError.message);
        }
        
        // Fallback to file storage
        const projects = loadProjects();
        
        // Check for duplicates
        const existingProject = projects.find(existing => 
            existing.messageId === project.messageId || 
            (existing.name === project.name && existing.url === project.url)
        );
        
        if (existingProject) {
            console.log(`🔄 Duplicate project found, merging: ${project.name} (${project.messageId})`);
            
            // Merge the duplicate project data
            if (new Date(project.timestamp) > new Date(existingProject.timestamp)) {
                existingProject.timestamp = project.timestamp;
                existingProject.sender = project.sender;
            }
            
            // Merge team information if different
            if (project.teamName && project.teamName !== existingProject.teamName) {
                existingProject.teamName = `${existingProject.teamName}, ${project.teamName}`;
            }
            if (project.teamMembers && project.teamMembers !== existingProject.teamMembers) {
                existingProject.teamMembers = `${existingProject.teamMembers}, ${project.teamMembers}`;
            }
            
            // Update description if more detailed
            if (project.description && project.description.length > existingProject.description.length) {
                existingProject.description = project.description;
            }
            
            saveProjects(projects);
            console.log(`✅ Project merged successfully: ${existingProject.name}`);
            return existingProject;
        }
        
        // Add new project
        project.reactions = [];
        project.replies = [];
        project.relatedMessageIds = [project.messageId];
        
        projects.push(project);
        saveProjects(projects);
        console.log(`✅ New project added: ${project.name} (${project.messageId})`);
        return project;
    }
}

// Add reaction with fallback
export async function addReactionWithFallback(reactionData) {
    try {
        // Try Supabase first
        const { addReaction } = await import('../database/supabase-projects.js');
        return await addReaction(reactionData);
    } catch (error) {
        console.warn('Supabase unavailable, trying MySQL fallback for reaction:', error.message);
        
        try {
            // Try MySQL fallback
            const { addReaction } = await import('../database/projects-db.js');
            return await addReaction(reactionData);
        } catch (mysqlError) {
            console.warn('MySQL also unavailable, falling back to file storage for reaction:', mysqlError.message);
        }
        
        // Fallback to file storage
        const reactions = loadReactions();
        const projects = loadProjects();
        
        reactions.push(reactionData);
        saveReactions(reactions);
        
        // Find the project and add reaction
        const project = projects.find(p => p.messageId === reactionData.messageId);
        if (project) {
            if (!project.reactions) project.reactions = [];
            project.reactions.push(reactionData);
            saveProjects(projects);
            console.log(`👍 Reaction added to project: ${project.name} (${reactionData.emoji})`);
        } else {
            console.log(`⚠️ No project found for reaction messageId: ${reactionData.messageId}`);
        }
        
        return reactionData;
    }
}

// Add reply with fallback
export async function addReplyWithFallback(replyData) {
    try {
        // Try Supabase first
        const { addReply } = await import('../database/supabase-projects.js');
        return await addReply(replyData);
    } catch (error) {
        console.warn('Supabase unavailable, trying MySQL fallback for reply:', error.message);
        
        try {
            // Try MySQL fallback
            const { addReply } = await import('../database/projects-db.js');
            return await addReply(replyData);
        } catch (mysqlError) {
            console.warn('MySQL also unavailable, falling back to file storage for reply:', mysqlError.message);
        }
        
        // Fallback to file storage
        const replies = loadReplies();
        const projects = loadProjects();
        
        replies.push(replyData);
        saveReplies(replies);
        
        // Find the project and add reply
        const project = projects.find(p => p.messageId === replyData.quotedMessageId);
        if (project) {
            if (!project.replies) project.replies = [];
            project.replies.push(replyData);
            saveProjects(projects);
            console.log(`💬 Reply added to project: ${project.name}`);
        } else {
            console.log(`⚠️ No project found for reply quotedMessageId: ${replyData.quotedMessageId}`);
        }
        
        return replyData;
    }
}
