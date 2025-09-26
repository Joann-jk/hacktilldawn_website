#!/usr/bin/env node

import dotenv from 'dotenv';
import { testSupabaseConnection } from './database/supabase-connection.js';
import { initializeSupabaseDatabase } from './database/supabase-projects.js';
import { migrateDataToSupabase } from './migrate-to-supabase.js';

// Load environment variables
dotenv.config();

console.log('🚀 HackTillDawn Supabase Setup');
console.log('================================\n');

// Check environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Missing required Supabase environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Please set these environment variables:');
    console.log('   SUPABASE_URL=your-supabase-project-url');
    console.log('   SUPABASE_ANON_KEY=your-supabase-anon-key');
    console.log('\n💡 To get these values:');
    console.log('   1. Go to https://supabase.com');
    console.log('   2. Create a new project');
    console.log('   3. Go to Settings → API');
    console.log('   4. Copy the Project URL and anon public key');
    console.log('   5. Run the SQL schema in the SQL Editor');
    process.exit(1);
}

async function setup() {
    try {
        // Test Supabase connection
        console.log('🔌 Testing Supabase connection...');
        const connected = await testSupabaseConnection();
        if (!connected) {
            console.error('❌ Cannot connect to Supabase. Please check your credentials.');
            console.log('\n🔧 Make sure you have:');
            console.log('   1. Created a Supabase project');
            console.log('   2. Run the SQL schema in the SQL Editor');
            console.log('   3. Set the correct environment variables');
            process.exit(1);
        }
        
        // Initialize database
        console.log('🏗️  Initializing Supabase database...');
        await initializeSupabaseDatabase();
        
        // Migrate existing data
        console.log('📦 Migrating existing data to Supabase...');
        await migrateDataToSupabase();
        
        console.log('\n🎉 Supabase setup completed successfully!');
        console.log('✅ Your HackTillDawn app is now ready for production!');
        console.log('\n📊 Next steps:');
        console.log('   1. Deploy to Vercel with environment variables');
        console.log('   2. Test the production deployment');
        console.log('   3. Monitor the Supabase dashboard for usage');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check your Supabase project is active');
        console.log('   2. Verify the SQL schema was run successfully');
        console.log('   3. Ensure environment variables are correct');
        process.exit(1);
    }
}

setup();
