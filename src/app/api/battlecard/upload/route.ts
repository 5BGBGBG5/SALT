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
    
    // Prepare payload for n8n webhook
    interface N8nPayload {
      competitor: string;
      verticals: string[];
      sourceType: string;
      content: string;
      file?: {
        name: string;
        content: string;
        size: number;
        type: string;
      } | null;
    }
    
    let payload: N8nPayload;
    
    if (fileContent) {
      // New approach with base64 content (from SearchInput)
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
      
      payload = {
        competitor,
        verticals: parsedVerticals,
        sourceType: sourceType || 'battlecard',
        content: content || '',
        file: file ? {
          name: fileName,
          content: fileContent, // Base64 encoded
          size: file.size,
          type: fileType
        } : null
      };
    } else {
      // Simple approach (from CommandPalette) - forward FormData to n8n
      console.log('Using FormData approach for n8n');
      const n8nFormData = new FormData();
      n8nFormData.append('competitor', competitor);
      n8nFormData.append('verticals', verticals || '[]');
      n8nFormData.append('sourceType', sourceType || 'battlecard');
      
      if (file) {
        n8nFormData.append('file', file);
      } else if (content) {
        n8nFormData.append('content', content);
      }

      // Send FormData directly to n8n
      const response = await fetch(`${N8N_WEBHOOK_URL}/upload-battlecard`, {
        method: 'POST',
        body: n8nFormData,
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
    }

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
