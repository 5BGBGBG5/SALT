import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createServerSupabaseClient(): SupabaseClient {
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

export interface SearchResult {
  chunk_id: number;
  source_id: string;
  content: string;
  competitor: string;
  verticals: string[];
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function searchKnowledgeBase(
  embedding: number[],
  options: {
    threshold?: number;
    limit?: number;
    competitor?: string;
    verticals?: string[];
  } = {}
): Promise<SearchResult[]> {
  const {
    threshold = 0.5,
    limit = 10,
    competitor,
    verticals
  } = options;

  if (!options.competitor) {
    console.warn('searchKnowledgeBase called without a competitor name.');
    return [];
  }

  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase.rpc('match_kb_chunks', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      match_count: limit,
      p_competitor_name: competitor,
      p_verticals: verticals || []
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Knowledge base search error:', error);
    throw error;
  }
}

export async function insertKnowledgeSource(sourceData: {
  source_type: string;
  title: string;
  competitor?: string;
  verticals?: string[];
  url?: string;
  verified?: boolean;
  risk_level?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('kb_sources')
      .insert({
        ...sourceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to insert knowledge source: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Insert knowledge source error:', error);
    throw error;
  }
}

export async function insertKnowledgeChunks(chunks: Array<{
  source_id: string;
  corpus: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}>): Promise<number[]> {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('kb_chunks')
      .insert(chunks.map(chunk => ({
        ...chunk,
        created_at: new Date().toISOString()
      })))
      .select('id');

    if (error) {
      console.error('Supabase chunks insert error:', error);
      throw new Error(`Failed to insert knowledge chunks: ${error.message}`);
    }

    return data.map(row => row.id);
  } catch (error) {
    console.error('Insert knowledge chunks error:', error);
    throw error;
  }
}

export async function getKnowledgeSource(sourceId: string) {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('kb_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error) {
      console.error('Supabase get source error:', error);
      throw new Error(`Failed to get knowledge source: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get knowledge source error:', error);
    throw error;
  }
}

export async function updateKnowledgeSource(
  sourceId: string, 
  updates: Partial<{
    title: string;
    competitor: string;
    verticals: string[];
    verified: boolean;
    risk_level: string;
    metadata: Record<string, unknown>;
  }>
) {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('kb_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update source error:', error);
      throw new Error(`Failed to update knowledge source: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update knowledge source error:', error);
    throw error;
  }
}
