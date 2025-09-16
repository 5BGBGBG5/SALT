import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create Supabase client instance
    const supabase = createServerSupabaseClient();

    // Query to select competitor column from kb_sources table
    const { data, error } = await supabase
      .from('kb_sources')
      .select('competitor')
      .not('competitor', 'is', null)
      .neq('competitor', '')
      .order('competitor', { ascending: true });

    // Handle potential errors from the Supabase query
    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch competitors from database' },
        { status: 500 }
      );
    }

    // Process the data to create an array of unique competitor names
    const uniqueCompetitors = Array.from(
      new Set(data?.map(item => item.competitor).filter(Boolean))
    );

    // Return successful JSON response
    return NextResponse.json({
      competitors: uniqueCompetitors
    });

  } catch (error) {
    console.error('Unexpected error in competitors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
