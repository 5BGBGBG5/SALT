import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🚀 Starting competitors API request');
    
    // Check environment variables
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    });
    
    // Create Supabase client instance
    console.log('🔧 Creating Supabase client...');
    const supabase = createServerSupabaseClient();
    console.log('✅ Supabase client created successfully');

    // Query to select competitor column from kb_sources table
    console.log('📊 Executing Supabase query on kb_sources table...');
    const { data, error } = await supabase
      .from('kb_sources')
      .select('competitor')
      .not('competitor', 'is', null)
      .neq('competitor', '')
      .order('competitor', { ascending: true });

    console.log('📋 Query completed. Data length:', data?.length || 0);
    console.log('🔍 Raw data sample:', data?.slice(0, 3));

    // Handle potential errors from the Supabase query
    if (error) {
      console.error('❌ Supabase query error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    // Process the data to create an array of unique competitor names
    console.log('🔄 Processing data to create unique competitors list...');
    const uniqueCompetitors = Array.from(
      new Set(data?.map(item => item.competitor).filter(Boolean))
    );

    console.log('✅ Successfully processed competitors:', {
      totalRecords: data?.length || 0,
      uniqueCompetitors: uniqueCompetitors.length,
      competitors: uniqueCompetitors
    });

    // Return successful JSON response
    return NextResponse.json({
      competitors: uniqueCompetitors
    });

  } catch (error) {
    console.error('💥 Error fetching competitors:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch competitor data. Check server logs for details.' },
      { status: 500 }
    );
  }
}
