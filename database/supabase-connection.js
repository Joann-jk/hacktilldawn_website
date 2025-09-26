import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found. Using fallback mode.');
}

// Create Supabase client
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Test Supabase connection
export async function testSupabaseConnection() {
    if (!supabase) {
        console.log('❌ Supabase not configured');
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error.message);
        return false;
    }
}

// Get Supabase client
export function getSupabaseClient() {
    return supabase;
}

// Execute query with error handling
export async function executeSupabaseQuery(query, params = []) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { data, error } = await query;
        if (error) {
            throw new Error(error.message);
        }
        return { success: true, data };
    } catch (error) {
        console.error('Supabase query error:', error);
        return { success: false, error: error.message };
    }
}

export default supabase;
