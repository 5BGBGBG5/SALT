import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🚀 Starting verticals API request');
    
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

    // Query to select verticals column from kb_sources table
    console.log('📊 Executing Supabase query on kb_sources table...');
    const { data, error } = await supabase
      .from('kb_sources')
      .select('verticals')
      .not('verticals', 'is', null);

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

    // Process the data to create a flat array of unique verticals
    console.log('🔄 Processing data to create unique verticals list...');
    const allVerticals: string[] = [];
    
    // Flatten all verticals arrays into a single array
    data?.forEach(item => {
      if (item.verticals && Array.isArray(item.verticals)) {
        allVerticals.push(...item.verticals);
      }
    });

    // Create unique, alphabetically sorted array
    const uniqueVerticals = Array.from(new Set(allVerticals))
      .filter(vertical => vertical && typeof vertical === 'string' && vertical.trim().length > 0)
      .sort();

    console.log('✅ Successfully processed verticals:', {
      totalRecords: data?.length || 0,
      totalVerticalInstances: allVerticals.length,
      uniqueVerticals: uniqueVerticals.length,
      verticals: uniqueVerticals
    });

    // Return successful JSON response
    return NextResponse.json({
      verticals: uniqueVerticals
    });

  } catch (error) {
    console.error('💥 Error fetching verticals:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch verticals data. Check server logs for details.' },
      { status: 500 }
    );
  }
}



