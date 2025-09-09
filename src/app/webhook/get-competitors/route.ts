import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock competitor data - replace with actual database query
const MOCK_COMPETITORS = [
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'google', name: 'Google' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'salesforce', name: 'Salesforce' },
  { id: 'oracle', name: 'Oracle' },
  { id: 'sap', name: 'SAP' },
  { id: 'adobe', name: 'Adobe' },
  { id: 'servicenow', name: 'ServiceNow' },
  { id: 'workday', name: 'Workday' },
  { id: 'hubspot', name: 'HubSpot' },
];

export async function GET() {
  try {
    console.log('Fetching competitors list');

    // TODO: Replace with actual database query
    // Example with Supabase:
    // const { supabase } = await import('@/lib/supabase');
    // const { data, error } = await supabase
    //   .from('kb_sources')
    //   .select('competitor')
    //   .not('competitor', 'is', null)
    //   .order('competitor');
    // 
    // if (error) throw error;
    // 
    // const uniqueCompetitors = [...new Set(data.map(row => row.competitor))]
    //   .map((name, index) => ({
    //     id: name.toLowerCase().replace(/\s+/g, '-'),
    //     name
    //   }));

    // For now, return mock data
    const competitors = MOCK_COMPETITORS.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Returning ${competitors.length} competitors`);

    return NextResponse.json({
      success: true,
      competitors: competitors,
      count: competitors.length
    });

  } catch (error) {
    console.error('Get competitors error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch competitors',
        competitors: [] 
      },
      { status: 500 }
    );
  }
}
