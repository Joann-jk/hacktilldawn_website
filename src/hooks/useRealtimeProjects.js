import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Get Supabase config from environment or fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Custom hook for real-time projects data
export default function useRealtimeProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [metadata, setMetadata] = useState({});
  const supabaseRef = useRef(null);
  const subscriptionRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Initialize Supabase client
  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase client initialized for real-time updates');
    } else {
      console.warn('⚠️ Supabase credentials not found, falling back to API polling');
    }
  }, []);

  // Fetch projects data
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Use different API URL for development vs production
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/projects' 
        : 'https://hacktilldawn-api.dev-jeromtom.workers.dev/api/projects';
      
      let response;
      try {
        response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('API not available');
        }
      } catch (error) {
        console.warn('API not available, using static data:', error.message);
        // Fallback to static data
        const staticResponse = await fetch('/projects.json');
        if (!staticResponse.ok) {
          throw new Error('Failed to fetch static data');
        }
        const data = await staticResponse.json();
        const sortedProjects = (data.projects || [])
          .sort((a, b) => (b.totalReactions || 0) - (a.totalReactions || 0));
        setProjects(sortedProjects);
        setMetadata({ dataSource: 'static', lastFetched: new Date().toISOString() });
        setLastUpdated(new Date().toISOString());
        return;
      }
      
      const data = await response.json();
      
      // Sort projects by total reactions in descending order
      const sortedProjects = (data.projects || [])
        .sort((a, b) => (b.totalReactions || 0) - (a.totalReactions || 0));
      
      setProjects(sortedProjects);
      setMetadata(data.metadata || {});
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setError(null);
      
      console.log('📊 Projects updated:', sortedProjects.length, 'projects loaded');
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!supabaseRef.current) return;

    console.log('🚀 Setting up real-time subscriptions...');

    // Subscribe to projects table changes
    const projectsSubscription = supabaseRef.current
      .channel('projects_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('🔥 REAL-TIME: Project change detected:', payload.eventType);
          // Refresh data when projects change
          fetchProjects();
        }
      );

    // Subscribe to reactions table changes
    const reactionsSubscription = supabaseRef.current
      .channel('reactions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions'
        },
        (payload) => {
          console.log('👍 REAL-TIME: Reaction change detected:', payload.eventType);
          // Refresh data when reactions change
          fetchProjects();
        }
      );

    // Subscribe to replies table changes
    const repliesSubscription = supabaseRef.current
      .channel('replies_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'replies'
        },
        (payload) => {
          console.log('💬 REAL-TIME: Reply change detected:', payload.eventType);
          // Refresh data when replies change
          fetchProjects();
        }
      );

    // Subscribe to all channels
    projectsSubscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Projects real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Projects subscription failed');
      }
    });

    reactionsSubscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Reactions real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Reactions subscription failed');
      }
    });

    repliesSubscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Replies real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Replies subscription failed');
      }
    });

    // Store subscription references for cleanup
    subscriptionRef.current = {
      projects: projectsSubscription,
      reactions: reactionsSubscription,
      replies: repliesSubscription
    };
  };

  // Setup polling fallback
  const setupPollingFallback = () => {
    console.log('⏰ Setting up polling fallback (every 10 seconds for real-time feel)');
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Set up polling every 10 seconds for near real-time updates
    pollingIntervalRef.current = setInterval(fetchProjects, 10000);
  };

  // Initialize data fetching and real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchProjects();

    // Setup real-time subscriptions if Supabase is available
    if (supabaseRef.current) {
      setupRealtimeSubscriptions();
    } else {
      // Fallback to fast polling if no real-time subscriptions
      setupPollingFallback();
    }

    // Cleanup function
    return () => {
      // Unsubscribe from real-time channels
      if (subscriptionRef.current) {
        subscriptionRef.current.projects?.unsubscribe();
        subscriptionRef.current.reactions?.unsubscribe();
        subscriptionRef.current.replies?.unsubscribe();
        console.log('🔌 Real-time subscriptions cleaned up');
      }

      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        console.log('⏰ Polling interval cleared');
      }
    };
  }, []);

  // Manual refresh function
  const refresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchProjects();
  };

  return {
    projects,
    loading,
    error,
    lastUpdated,
    metadata,
    refresh,
    isRealtime: !!supabaseRef.current
  };
}
