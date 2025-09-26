import fs from 'fs';
import path from 'path';

// For Vercel serverless environment, use process.cwd() instead of __dirname
const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

// Ensure data directory exists (only in development)
if (process.env.NODE_ENV !== 'production') {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load projects from JSON file
function loadProjects() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } else {
            console.log('Projects data file not found, using empty array');
        }
    } catch (error) {
        console.error('Error loading projects from file:', error);
    }
    return [];
}

// Save projects to JSON file
function saveProjects(projects) {
    try {
        // Only save in development or if data directory exists
        if (process.env.NODE_ENV !== 'production' || fs.existsSync(path.dirname(DATA_FILE))) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
            console.log(`Projects saved to ${DATA_FILE}`);
        } else {
            console.log('Skipping file save in production (data directory not available)');
        }
    } catch (error) {
        console.error('Error saving projects to file:', error);
    }
}

// Initialize projects array
let projects = loadProjects();
let reactions = [];
let replies = [];

// Load reactions and replies from JSON files
function loadReactions() {
    const reactionsFile = path.join(process.cwd(), 'data', 'reactions.json');
    try {
        if (fs.existsSync(reactionsFile)) {
            const data = fs.readFileSync(reactionsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading reactions from file:', error);
    }
    return [];
}

function loadReplies() {
    const repliesFile = path.join(process.cwd(), 'data', 'replies.json');
    try {
        if (fs.existsSync(repliesFile)) {
            const data = fs.readFileSync(repliesFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading replies from file:', error);
    }
    return [];
}

// Save reactions and replies to JSON files
function saveReactions() {
    const reactionsFile = path.join(process.cwd(), 'data', 'reactions.json');
    try {
        if (process.env.NODE_ENV !== 'production' || fs.existsSync(path.dirname(reactionsFile))) {
            fs.writeFileSync(reactionsFile, JSON.stringify(reactions, null, 2));
        }
    } catch (error) {
        console.error('Error saving reactions to file:', error);
    }
}

function saveReplies() {
    const repliesFile = path.join(process.cwd(), 'data', 'replies.json');
    try {
        if (process.env.NODE_ENV !== 'production' || fs.existsSync(path.dirname(repliesFile))) {
            fs.writeFileSync(repliesFile, JSON.stringify(replies, null, 2));
        }
    } catch (error) {
        console.error('Error saving replies to file:', error);
    }
}

// Initialize reactions and replies
reactions = loadReactions();
replies = loadReplies();

// Export functions for managing projects
function getAllProjects() {
    return projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addProject(project) {
    // Add timestamp if not present
    if (!project.timestamp) {
        project.timestamp = new Date().toISOString();
    }
    
    // Check for duplicates before adding
    const existingProject = projects.find(existing => 
        existing.messageId === project.messageId || 
        (existing.name === project.name && existing.url === project.url)
    );
    
    if (existingProject) {
        console.log(`🔄 Duplicate project found, merging: ${project.name} (${project.messageId})`);
        
        // Merge the duplicate project data
        // Keep the most recent timestamp
        if (new Date(project.timestamp) > new Date(existingProject.timestamp)) {
            existingProject.timestamp = project.timestamp;
            existingProject.sender = project.sender; // Update sender to latest
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
        
        // Track additional message IDs for this project
        if (!existingProject.relatedMessageIds) {
            existingProject.relatedMessageIds = [existingProject.messageId];
        }
        if (project.messageId && !existingProject.relatedMessageIds.includes(project.messageId)) {
            existingProject.relatedMessageIds.push(project.messageId);
        }
        
        // Save the updated project
        saveProjects(projects);
        console.log(`✅ Project merged successfully: ${existingProject.name}`);
        return existingProject;
    }
    
    // Initialize reactions and replies arrays
    project.reactions = [];
    project.replies = [];
    project.relatedMessageIds = [project.messageId]; // Track message IDs for this project
    
    projects.push(project);
    saveProjects(projects);
    console.log(`✅ New project added: ${project.name} (${project.messageId})`);
    return project;
}

function addReaction(reactionData) {
    reactions.push(reactionData);
    saveReactions();
    
    // Find the project by messageId (exact match first)
    let project = projects.find(p => p.messageId === reactionData.messageId);
    
    // If no exact match, try to find by related message IDs (for merged projects)
    if (!project) {
        project = projects.find(p => 
            p.relatedMessageIds && p.relatedMessageIds.includes(reactionData.messageId)
        );
    }
    
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

function addReply(replyData) {
    replies.push(replyData);
    saveReplies();
    
    // Find the project by quotedMessageId (exact match first)
    let project = projects.find(p => p.messageId === replyData.quotedMessageId);
    
    // If no exact match, try to find by related message IDs (for merged projects)
    if (!project) {
        project = projects.find(p => 
            p.relatedMessageIds && p.relatedMessageIds.includes(replyData.quotedMessageId)
        );
    }
    
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

function getProjectsCount() {
    return projects.length;
}

function getLastUpdated() {
    return projects.length > 0 ? projects[0].timestamp : null;
}

function getProjectReactions(projectId) {
    return reactions.filter(r => r.messageId === projectId);
}

function getProjectReplies(projectId) {
    return replies.filter(r => r.quotedMessageId === projectId);
}

export {
    getAllProjects,
    addProject,
    addReaction,
    addReply,
    getProjectsCount,
    getLastUpdated,
    getProjectReactions,
    getProjectReplies,
    projects
};
