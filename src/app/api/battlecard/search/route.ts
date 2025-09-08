import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      )
    }

    const { query, competitor, limit = 5 } = await request.json()

    const { supabase } = await import('@/lib/supabase')

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
