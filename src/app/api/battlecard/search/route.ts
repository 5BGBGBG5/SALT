import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { query, competitor, limit = 5 } = await request.json()

    // For now, do a simple text search
    // Later, you can add embedding-based search
    let searchQuery = supabase
      .from('kb_chunks')
      .select(`
        id,
        content,
        metadata,
        source:kb_sources!inner(
          id,
          title,
          competitor,
          verticals
        )
      `)
      .textSearch('content', query)
      .limit(limit)

    if (competitor) {
      searchQuery = searchQuery.eq('source.competitor', competitor)
    }

    const { data, error } = await searchQuery

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      results: data 
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}
