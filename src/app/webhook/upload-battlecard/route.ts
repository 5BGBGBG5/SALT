import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('Processing battlecard upload...');
    
    const formData = await request.formData();
    
    // Extract form fields
    const competitorSelect = formData.get('competitorSelect') as string;
    const newCompetitorName = formData.get('newCompetitorName') as string;
    const verticalsString = formData.get('verticals') as string;
    const sourceType = formData.get('sourceType') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File;

    // Parse verticals
    let verticals: string[] = [];
    try {
      verticals = verticalsString ? JSON.parse(verticalsString) : [];
    } catch (error) {
      console.warn('Failed to parse verticals, using empty array:', error);
    }

    // Validate required fields
    const errors: string[] = [];
    
    if (!competitorSelect) {
      errors.push('Competitor selection is required');
    }
    
    if (competitorSelect === '__new__' && !newCompetitorName?.trim()) {
      errors.push('New competitor name is required');
    }
    
    if (!content?.trim() && !file) {
      errors.push('Either content or file is required');
    }
    
    if (!sourceType) {
      errors.push('Source type is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Determine final competitor name
    const finalCompetitorName = competitorSelect === '__new__' 
      ? newCompetitorName.trim() 
      : competitorSelect;

    // File validation
    if (file) {
      const maxSize = 3 * 1024 * 1024; // 3MB limit for Vercel
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'File size must be less than 3MB' },
          { status: 413 }
        );
      }

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'File type not supported. Please use PDF, DOCX, DOC, or TXT files.' },
          { status: 400 }
        );
      }
    }

    console.log('Battlecard data prepared:', {
      competitor: finalCompetitorName,
      verticals: verticals.length,
      sourceType,
      contentLength: content?.length || 0,
      hasFile: !!file,
      fileSize: file?.size || 0
    });

    // TODO: Process the battlecard data
    // Options:
    // 1. Save directly to database (Supabase)
    // 2. Forward to existing n8n webhook
    // 3. Process with AI/embeddings
    
    // Example: Forward to existing n8n endpoint
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    if (N8N_WEBHOOK_URL) {
      console.log('Forwarding to n8n webhook...');
      
      // Create FormData for n8n
      const n8nFormData = new FormData();
      n8nFormData.append('competitor', finalCompetitorName);
      n8nFormData.append('verticals', JSON.stringify(verticals));
      n8nFormData.append('sourceType', sourceType);
      n8nFormData.append('content', content || '');
      
      if (file) {
        n8nFormData.append('file', file);
      }

      const n8nResponse = await fetch(`${N8N_WEBHOOK_URL}/upload-battlecard`, {
        method: 'POST',
        body: n8nFormData,
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n processing failed: ${n8nResponse.status}`);
      }

      const n8nResult = await n8nResponse.json();
      console.log('n8n processing completed:', n8nResult);
    }

    // Example: Save to Supabase
    // const { supabase } = await import('@/lib/supabase');
    // const { data, error } = await supabase
    //   .from('kb_sources')
    //   .insert({
    //     source_type: sourceType,
    //     title: `${finalCompetitorName} - ${sourceType}`,
    //     competitor: finalCompetitorName,
    //     verticals: verticals,
    //     metadata: {
    //       uploadedAt: new Date().toISOString(),
    //       hasFile: !!file,
    //       fileName: file?.name,
    //       fileSize: file?.size
    //     }
    //   });

    console.log('Battlecard upload completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Battlecard uploaded successfully',
      data: {
        competitor: finalCompetitorName,
        verticals,
        sourceType,
        contentLength: content?.length || 0,
        hasFile: !!file
      }
    });

  } catch (error) {
    console.error('Battlecard upload error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload battlecard' 
      },
      { status: 500 }
    );
  }
}
