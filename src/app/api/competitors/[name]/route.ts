import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    console.log('🚀 Starting single competitor API request');
    
    // Get and decode the competitor name from URL params
    const resolvedParams = await params;
    const competitorName = decodeURIComponent(resolvedParams.name);
    console.log('🎯 Fetching data for competitor:', competitorName);
    
    // Check environment variables
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
    });
    
    // Create Supabase client instance
    console.log('🔧 Creating Supabase client...');
    const supabase = createServerSupabaseClient();
    console.log('✅ Supabase client created successfully');

    // Query to select all columns from kb_sources table for the specific competitor
    console.log('📊 Executing Supabase query for competitor:', competitorName);
    const { data, error } = await supabase
      .from('kb_sources')
      .select('*')
      .eq('competitor', competitorName)
      .order('created_at', { ascending: false });

    console.log('📋 Query completed. Records found:', data?.length || 0);

    // Handle potential errors from the Supabase query
    if (error) {
      console.error('❌ Supabase query error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        competitorName: competitorName
      });
      return NextResponse.json(
        { error: 'Failed to fetch competitor data from database' },
        { status: 500 }
      );
    }

    // Log successful result details
    console.log('✅ Successfully fetched competitor data:', {
      competitor: competitorName,
      recordCount: data?.length || 0,
      recordTypes: data?.map(record => record.source_type).filter(Boolean)
    });

    // Return successful JSON response (empty array if no records found)
    return NextResponse.json({
      sources: data || []
    });

  } catch (error) {
    console.error('💥 Error fetching competitor details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch competitor details. Check server logs for details.' },
      { status: 500 }
    );
  }
}
