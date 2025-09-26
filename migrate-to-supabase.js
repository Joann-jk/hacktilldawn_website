import fs from 'fs';
import path from 'path';
import { addProject, addReaction, addReply } from './database/supabase-projects.js';
import { testSupabaseConnection } from './database/supabase-connection.js';

// Load existing data from JSON files
function loadExistingData() {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Load projects
    const projectsFile = path.join(dataDir, 'projects.json');
    let projects = [];
    if (fs.existsSync(projectsFile)) {
        try {
            projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
            console.log(`📁 Loaded ${projects.length} projects from JSON`);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }
    
    // Load reactions
    const reactionsFile = path.join(dataDir, 'reactions.json');
    let reactions = [];
    if (fs.existsSync(reactionsFile)) {
        try {
            reactions = JSON.parse(fs.readFileSync(reactionsFile, 'utf8'));
            console.log(`📁 Loaded ${reactions.length} reactions from JSON`);
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }
    
    // Load replies
    const repliesFile = path.join(dataDir, 'replies.json');
    let replies = [];
    if (fs.existsSync(repliesFile)) {
        try {
            replies = JSON.parse(fs.readFileSync(repliesFile, 'utf8'));
            console.log(`📁 Loaded ${replies.length} replies from JSON`);
        } catch (error) {
            console.error('Error loading replies:', error);
        }
    }
    
    return { projects, reactions, replies };
}

// Migrate data to Supabase
async function migrateDataToSupabase() {
    console.log('🚀 Starting Supabase migration...');
    
    // Test Supabase connection
    const connected = await testSupabaseConnection();
    if (!connected) {
        throw new Error('Cannot connect to Supabase. Please check your configuration.');
    }
    
    // Load existing data
    const { projects, reactions, replies } = loadExistingData();
    
    console.log('\n📊 Migrating projects...');
    let migratedProjects = 0;
    let skippedProjects = 0;
    
    for (const project of projects) {
        try {
            // Convert project format to match Supabase schema
            const dbProject = {
                name: project.name,
                description: project.description,
                url: project.url,
                teamName: project.teamName,
                teamMembers: project.teamMembers,
                sender: project.sender,
                groupName: project.groupName,
                messageId: project.messageId,
                timestamp: project.timestamp
            };
            
            await addProject(dbProject);
            migratedProjects++;
            console.log(`✅ Migrated project: ${project.name}`);
        } catch (error) {
            console.error(`❌ Failed to migrate project ${project.name}:`, error.message);
            skippedProjects++;
        }
    }
    
    console.log('\n👍 Migrating reactions...');
    let migratedReactions = 0;
    let skippedReactions = 0;
    
    for (const reaction of reactions) {
        try {
            await addReaction(reaction);
            migratedReactions++;
        } catch (error) {
            console.error(`❌ Failed to migrate reaction:`, error.message);
            skippedReactions++;
        }
    }
    
    console.log('\n💬 Migrating replies...');
    let migratedReplies = 0;
    let skippedReplies = 0;
    
    for (const reply of replies) {
        try {
            await addReply(reply);
            migratedReplies++;
        } catch (error) {
            console.error(`❌ Failed to migrate reply:`, error.message);
            skippedReplies++;
        }
    }
    
    // Summary
    console.log('\n🎉 Supabase migration completed!');
    console.log(`📊 Projects: ${migratedProjects} migrated, ${skippedProjects} skipped`);
    console.log(`👍 Reactions: ${migratedReactions} migrated, ${skippedReactions} skipped`);
    console.log(`💬 Replies: ${migratedReplies} migrated, ${skippedReplies} skipped`);
    
    // Test the migration
    console.log('\n🧪 Testing migration...');
    try {
        const { getAllProjects } = await import('./database/supabase-projects.js');
        const allProjects = await getAllProjects();
        console.log(`✅ Supabase now contains ${allProjects.length} projects`);
        
        if (allProjects.length > 0) {
            const sampleProject = allProjects[0];
            console.log(`📝 Sample project: ${sampleProject.name}`);
            console.log(`   - Reactions: ${sampleProject.totalReactions}`);
            console.log(`   - Replies: ${sampleProject.totalReplies}`);
        }
    } catch (error) {
        console.error('❌ Error testing migration:', error);
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateDataToSupabase().catch(console.error);
}

export { migrateDataToSupabase };
