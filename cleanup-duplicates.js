#!/usr/bin/env node

/**
 * Script to clean up duplicate projects from the data
 */

import { getAllProjects } from './api/projects-data.js';
import fs from 'fs';
import path from 'path';

console.log('🧹 Cleaning up duplicate projects...\n');

// Get all projects
const allProjects = getAllProjects();
console.log(`📊 Total projects before cleanup: ${allProjects.length}`);

// Find and remove duplicates
const seenMessageIds = new Set();
const seenNameUrl = new Set();
const uniqueProjects = [];

let duplicatesRemoved = 0;

for (const project of allProjects) {
    const messageId = project.messageId;
    const nameUrl = `${project.name}|${project.url}`;
    
    // Check for duplicate messageId
    if (messageId && seenMessageIds.has(messageId)) {
        console.log(`❌ Duplicate messageId found: ${project.name} (${messageId})`);
        duplicatesRemoved++;
        continue;
    }
    
    // Check for duplicate name+url combination
    if (seenNameUrl.has(nameUrl)) {
        console.log(`❌ Duplicate name+url found: ${project.name} (${project.url})`);
        duplicatesRemoved++;
        continue;
    }
    
    // Add to unique projects
    if (messageId) seenMessageIds.add(messageId);
    seenNameUrl.add(nameUrl);
    uniqueProjects.push(project);
}

console.log(`\n📊 Cleanup results:`);
console.log(`   - Original projects: ${allProjects.length}`);
console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
console.log(`   - Unique projects: ${uniqueProjects.length}`);

// Save cleaned data
const dataFile = path.join(process.cwd(), 'data', 'projects.json');
try {
    fs.writeFileSync(dataFile, JSON.stringify(uniqueProjects, null, 2));
    console.log(`✅ Cleaned data saved to ${dataFile}`);
} catch (error) {
    console.error(`❌ Error saving cleaned data: ${error.message}`);
}

// Display unique projects
console.log(`\n📋 Unique projects after cleanup:`);
uniqueProjects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} by ${project.sender} (${project.messageId || 'NO_ID'})`);
});

console.log('\n🎉 Cleanup complete!');
