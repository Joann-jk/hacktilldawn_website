#!/usr/bin/env node

import { testConnection, initializeDatabase } from './database/connection.js';
import { migrateData } from './migrate-to-database.js';

console.log('🚀 HackTillDawn Database Setup');
console.log('================================\n');

// Check environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Please set these environment variables:');
    console.log('   DB_HOST=your-database-host');
    console.log('   DB_USER=your-database-username');
    console.log('   DB_PASSWORD=your-database-password');
    console.log('   DB_NAME=your-database-name');
    console.log('\n💡 For PlanetScale:');
    console.log('   1. Go to https://planetscale.com');
    console.log('   2. Create a new database');
    console.log('   3. Get connection details from the dashboard');
    console.log('   4. Set the environment variables above');
    process.exit(1);
}

async function setup() {
    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Cannot connect to database. Please check your credentials.');
            process.exit(1);
        }
        
        // Initialize database tables
        console.log('🏗️  Initializing database tables...');
        await initializeDatabase();
        
        // Migrate existing data
        console.log('📦 Migrating existing data...');
        await migrateData();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('✅ Your HackTillDawn app is now ready for production!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
