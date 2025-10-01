import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for the discovery-bot-db database
export interface HSEngagement {
  hubspot_engagement_id: string;
  engagement_type: string;
  engagement_started_at: string;
  hubspot_owner_id: string;
  contact_id: string;
  company_id: string;
  call_transcript: string | null;
  call_recording_url: string | null;
  call_length: number | null;
  call_duration_ms: number | null;
  talk_time_ratio: number | null;
  objections_identified: string[] | null;
  discovery_question_count: number | null;
  outcome: string | null;
  analyzed_at: string | null;
}

export interface HSOwner {
  hubspot_owner_id: string;
  owner_name: string;
}

export function createDiscoveryBotClient(): SupabaseClient {
  // For now, we'll use the same Supabase instance but with different table access
  // In production, you would use different environment variables for the discovery-bot-db
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }

  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export function createDiscoveryBotServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Utility functions for data fetching
export async function fetchHSEngagements(
  filters: {
    ownerId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<HSEngagement[]> {
  const supabase = createDiscoveryBotClient();
  
  let query = supabase
    .from('hs_engagements')
    .select('*')
    .order('engagement_started_at', { ascending: false });

  // Apply filters
  if (filters.ownerId) {
    query = query.eq('hubspot_owner_id', filters.ownerId);
  }

  if (filters.startDate) {
    query = query.gte('engagement_started_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('engagement_started_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching HS engagements:', error);
    throw new Error(`Failed to fetch engagements: ${error.message}`);
  }

  return data || [];
}

export async function fetchHSOwners(): Promise<HSOwner[]> {
  const supabase = createDiscoveryBotClient();
  
  // Get unique owner IDs from engagements and create owner objects
  // In a real scenario, you might have a separate owners table
  const { data, error } = await supabase
    .from('hs_engagements')
    .select('hubspot_owner_id')
    .not('hubspot_owner_id', 'is', null);

  if (error) {
    console.error('Error fetching HS owners:', error);
    throw new Error(`Failed to fetch owners: ${error.message}`);
  }

  // Create unique owners list
  const uniqueOwnerIds = Array.from(new Set(data?.map(item => item.hubspot_owner_id).filter(Boolean)));
  
  return uniqueOwnerIds.map(id => ({
    hubspot_owner_id: id,
    owner_name: `Owner ${id}` // In production, you'd fetch actual names
  }));
}

// Outcome color mapping
export const OUTCOME_COLORS = {
  voicemail: 'bg-gray-500',
  follow_up_scheduled: 'bg-green-500',
  not_interested: 'bg-red-500',
  gatekeeper: 'bg-yellow-500',
  wrong_contact: 'bg-orange-500',
  no_answer: 'bg-gray-700',
} as const;

export const OUTCOME_LABELS = {
  voicemail: 'Voicemail',
  follow_up_scheduled: 'Meeting Booked',
  not_interested: 'Not Interested',
  gatekeeper: 'Gatekeeper',
  wrong_contact: 'Wrong Contact',
  no_answer: 'No Answer',
} as const;
