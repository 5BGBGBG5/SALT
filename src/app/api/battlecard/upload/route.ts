import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://inecta.app.n8n.cloud/webhook';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Battlecard Upload API Called ===');
    
    // Parse FormData from request
    const formData = await request.formData();
    console.log('FormData keys:', Array.from(formData.keys()));
    
    // Extract all form fields
    const competitor = formData.get('competitor') as string;
    const verticals = formData.get('verticals') as string;
    const sourceType = formData.get('sourceType') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File | null;
    const fileContent = formData.get('fileContent') as string;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    
    console.log('Extracted fields:', {
      competitor,
      verticals,
      sourceType,
      content: content ? `${content.length} chars` : 'none',
      fileName,
      fileType,
      fileSize: file?.size,
      hasFileContent: !!fileContent
    });

    // Validate required fields
    if (!competitor) {
      console.error('Missing competitor name');
      return NextResponse.json(
        { success: false, error: 'Competitor name is required' },
        { status: 400 }
      );
    }
    
    
    // Always use FormData approach to avoid payload size issues
    console.log('Using direct FormData approach for n8n (no base64 encoding)');
    
    const n8nFormData = new FormData();
    n8nFormData.append('competitor', competitor);
    
    // Handle verticals parsing
    let parsedVerticals: string[] = [];
    if (verticals) {
      try {
        // Try to parse as JSON first (old format)
        parsedVerticals = JSON.parse(verticals);
      } catch {
        // If not JSON, treat as comma-separated string
        parsedVerticals = verticals.split(',').map(v => v.trim()).filter(Boolean);
      }
    }
    n8nFormData.append('verticals', JSON.stringify(parsedVerticals));
    n8nFormData.append('sourceType', sourceType || 'battlecard');
    
    if (file) {
      console.log('Appending file directly to FormData:', file.name, file.size, 'bytes');
      n8nFormData.append('file', file);
    } 
    
    if (content) {
      console.log('Appending content:', content.length, 'characters');
      n8nFormData.append('content', content);
    }

    console.log('Sending FormData directly to n8n webhook');

    // Send FormData directly to n8n
    const response = await fetch(`${N8N_WEBHOOK_URL}/upload-battlecard`, {
      method: 'POST',
      body: n8nFormData,
    });

    console.log('n8n response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('n8n response:', result);
    
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
