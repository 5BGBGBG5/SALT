import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://inecta.app.n8n.cloud/webhook';

export async function POST(request: NextRequest) {
  try {
    // Parse FormData from request
    const formData = await request.formData();
    
    // Extract all form fields
    const competitor = formData.get('competitor') as string;
    const verticals = formData.get('verticals') as string;
    const sourceType = formData.get('sourceType') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File | null;
    const fileContent = formData.get('fileContent') as string;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    
    // Validate required fields
    if (!competitor) {
      return NextResponse.json(
        { success: false, error: 'Competitor name is required' },
        { status: 400 }
      );
    }
    
    // Prepare JSON payload for n8n webhook
    const payload = {
      competitor,
      verticals: JSON.parse(verticals || '[]'),
      sourceType: sourceType || 'battlecard',
      content: content || '',
      file: file ? {
        name: fileName,
        content: fileContent, // Base64 encoded
        size: file.size,
        type: fileType
      } : null
    };

    console.log('Sending to n8n:', {
      competitor: payload.competitor,
      verticals: payload.verticals,
      hasFile: !!payload.file,
      fileName: payload.file?.name
    });

    // Send to n8n webhook as JSON
    const response = await fetch(`${N8N_WEBHOOK_URL}/upload-battlecard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', errorText);
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Battlecard uploaded successfully',
      sourceId: result.sourceId,
      chunks: result.chunks
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

// Configure route segment to allow larger payloads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for large files
