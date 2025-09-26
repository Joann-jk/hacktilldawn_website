#!/usr/bin/env node

/**
 * Script to manually add the latest valid project from WhatsApp to the system
 */

import { addProject } from './api/projects-data.js';

// The latest valid project from WhatsApp
const latestProject = {
    name: "Project Gallery",
    description: "View and vote on all projects built at HackTillDawn.",
    url: "https://hacktilldawn-website.vercel.app/projects",
    teamName: "HackTillDawn",
    teamMembers: "Joann, Jerom",
    sender: "Jerom Palimattom Tom",
    groupName: "HackTillDawn Final Participants",
    messageId: "pe.VGVcxmWLREHCNvj7a4Q-wpgBq53lJfJECQ",
    timestamp: "2025-09-25T23:00:37.000Z"
};

console.log('🚀 Adding latest project from WhatsApp...');
console.log(`📝 Project: ${latestProject.name}`);
console.log(`👥 Team: ${latestProject.teamName}`);
console.log(`🔗 URL: ${latestProject.url}`);

try {
    const addedProject = addProject(latestProject);
    console.log('✅ Project added successfully!');
    console.log('📊 Project details:', {
        name: addedProject.name,
        team: addedProject.teamName,
        url: addedProject.url,
        messageId: addedProject.messageId,
        timestamp: addedProject.timestamp
    });
} catch (error) {
    console.error('❌ Error adding project:', error.message);
}

console.log('\n🔍 Checking current projects in system...');
import { getAllProjects } from './api/projects-data.js';

const allProjects = getAllProjects();
console.log(`📊 Total projects: ${allProjects.length}`);
allProjects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} by ${project.sender} (${project.messageId})`);
});
