import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript types for our tables
export interface KbSource {
  id: string
  source_type: string
  title: string
  competitor: string
  verticals: string[]
  url?: string
  verified: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface KbChunk {
  id: number
  source_id: string
  content: string
  embedding?: number[]
  metadata: Record<string, any>
  created_at: string
}

// Database types for better type safety
export type Database = {
  public: {
    Tables: {
      kb_sources: {
        Row: KbSource
        Insert: Omit<KbSource, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<KbSource, 'id' | 'created_at' | 'updated_at'>>
      }
      kb_chunks: {
        Row: KbChunk
        Insert: Omit<KbChunk, 'id' | 'created_at'>
        Update: Partial<Omit<KbChunk, 'id' | 'created_at'>>
      }
    }
  }
}

// Typed Supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
