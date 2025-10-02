import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createDiscoveryBotSupabaseClient, createDiscoveryBotServerClient as createDiscoveryBotServerSupabaseClient } from '../supabase-discoverybot';

// Types for the discovery-bot-db database (matching actual schema)
export interface HSEngagement {
  hubspot_engagement_id: number;
  engagement_type: string;
  engagement_started_at: string;
  hubspot_owner_id: number;
  contact_id: number;
  company_id: number;
  call_transcript: string | null;
  call_recording_url: string | null;
  call_disposition: string | null; // This is the actual field name in your DB
  call_length: number | null;
  call_duration_ms: number | null;
  talk_time_ratio: number | null;
  objections_identified: string[] | null;
  discovery_question_count: number | null;
  created_at: string;
  last_synced_at: string | null;
  // Add computed field for compatibility
  outcome?: string | null;
}

export interface HSOwner {
  hubspot_owner_id: number;
  owner_name: string;
}

// Use the dedicated discovery-bot client functions
export function createDiscoveryBotClient(): SupabaseClient {
  return createDiscoveryBotSupabaseClient();
}

export function createDiscoveryBotServerClient(): SupabaseClient {
  return createDiscoveryBotServerSupabaseClient();
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

// Outcome color mapping (updated for common HubSpot call dispositions)
export const OUTCOME_COLORS = {
  // Common HubSpot dispositions
  'f240bbac-87c9-4f6e-bf80-2142a9a54a6c': 'bg-green-500', // Connected
  'a4c4c377-d246-4b32-a13b-75a56a4cd0ff': 'bg-red-500',   // Not interested
  '73a0d17f-1163-4015-bdd5-ec830791da20': 'bg-gray-500',  // Left voicemail
  'b2cf5968-551e-4856-9783-52b3da59a7d0': 'bg-gray-700',  // No answer
  '9688e8c9-9ac4-4f4f-9e31-30d3ba78b8b6': 'bg-yellow-500', // Busy
  // Fallback text-based dispositions
  connected: 'bg-green-500',
  voicemail: 'bg-gray-500',
  follow_up_scheduled: 'bg-green-500',
  not_interested: 'bg-red-500',
  gatekeeper: 'bg-yellow-500',
  wrong_contact: 'bg-orange-500',
  no_answer: 'bg-gray-700',
  busy: 'bg-yellow-500',
} as const;

export const OUTCOME_LABELS = {
  // Common HubSpot dispositions
  'f240bbac-87c9-4f6e-bf80-2142a9a54a6c': 'Connected',
  'a4c4c377-d246-4b32-a13b-75a56a4cd0ff': 'Not Interested',
  '73a0d17f-1163-4015-bdd5-ec830791da20': 'Left Voicemail',
  'b2cf5968-551e-4856-9783-52b3da59a7d0': 'No Answer',
  '9688e8c9-9ac4-4f4f-9e31-30d3ba78b8b6': 'Busy',
  // Fallback text-based dispositions
  connected: 'Connected',
  voicemail: 'Voicemail',
  follow_up_scheduled: 'Meeting Booked',
  not_interested: 'Not Interested',
  gatekeeper: 'Gatekeeper',
  wrong_contact: 'Wrong Contact',
  no_answer: 'No Answer',
  busy: 'Busy',
} as const;
