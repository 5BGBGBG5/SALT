import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('kb_sources')
      .select('*')
      .eq('source_type', 'battlecard')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      battlecards: data 
    })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list battlecards' },
      { status: 500 }
    )
  }
}
