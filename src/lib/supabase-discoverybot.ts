import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create Supabase client specifically for the discovery-bot-db project
export function createDiscoveryBotSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_discoverybotdb_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_discoverybotdb_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_discoverybotdb_SUPABASE_URL environment variable is not set');
  }

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_discoverybotdb_SUPABASE_ANON_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server-side client for discovery-bot-db (if needed for API routes)
export function createDiscoveryBotServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_discoverybotdb_SUPABASE_URL;
  // For server-side, we'll use the anon key for now since we don't have a service key for this project
  const supabaseKey = process.env.NEXT_PUBLIC_discoverybotdb_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_discoverybotdb_SUPABASE_URL environment variable is not set');
  }

  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_discoverybotdb_SUPABASE_ANON_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
