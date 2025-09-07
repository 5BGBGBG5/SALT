import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    if (!N8N_WEBHOOK_URL) {
      console.error('N8N_WEBHOOK_URL environment variable is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    
    // Extract form fields
    const competitor = formData.get('competitor') as string;
    const verticals = formData.get('verticals') as string;
    const sourceType = formData.get('sourceType') as string || 'battlecard';
    const content = formData.get('content') as string;
    const file = formData.get('file') as File;

    // Validation
    if (!competitor?.trim()) {
      return NextResponse.json(
        { error: 'Competitor name is required' },
        { status: 400 }
      );
    }

    if (!content?.trim() && !file) {
      return NextResponse.json(
        { error: 'Either content text or file is required' },
        { status: 400 }
      );
    }

    // Prepare payload for n8n
    const payload = new FormData();
    payload.append('competitor', competitor.trim());
    payload.append('verticals', verticals || '');
    payload.append('sourceType', sourceType);
    
    if (file) {
      // File upload mode
      payload.append('file', file);
      payload.append('mode', 'file');
    } else {
      // Text content mode
      payload.append('content', content.trim());
      payload.append('mode', 'text');
    }

    // Forward to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process battlecard upload' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Battlecard uploaded successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in upload-battlecard API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
