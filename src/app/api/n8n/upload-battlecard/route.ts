import { NextRequest, NextResponse } from 'next/server';
import { validateFile, validateFileContent } from '@/lib/validators/fileValidator';
import n8nClient from '@/lib/n8n/client';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}


function createErrorResponse(
  code: string,
  message: string,
  status: number,
  request: NextRequest,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString(),
    path: request.url
  };

  // Log error
  console.log(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    route: request.url,
    method: request.method,
    error: errorResponse.error,
    status
  }));

  return NextResponse.json(errorResponse, { status });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Log incoming request
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      route: request.url,
      method: request.method,
      message: 'Battlecard upload request received'
    }));

    // Check if n8n webhook URL is configured
    if (!process.env.N8N_WEBHOOK_URL) {
      return createErrorResponse(
        'CONFIGURATION_ERROR',
        'n8n webhook URL is not configured',
        500,
        request
      );
    }

    const formData = await request.formData();
    
    // Extract and validate form fields
    const competitor = formData.get('competitor') as string;
    const verticalsStr = formData.get('verticals') as string;
    const sourceType = (formData.get('sourceType') as string) || 'battlecard';
    const content = formData.get('content') as string;
    const file = formData.get('file') as File;

    // Validation: competitor name is required
    if (!competitor?.trim()) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Competitor name is required',
        400,
        request
      );
    }

    // Validation: either content or file is required
    if (!content?.trim() && !file) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Either content text or file is required',
        400,
        request
      );
    }

    // Parse verticals
    let verticals: string[] = [];
    if (verticalsStr) {
      try {
        verticals = verticalsStr.split(',').map(v => v.trim()).filter(Boolean);
      } catch {
        verticals = [];
      }
    }

    // File validation if file is provided
    if (file) {
      // Basic validation
      const basicValidation = validateFile(file);
      if (!basicValidation.isValid) {
        return createErrorResponse(
          basicValidation.error?.includes('size') ? 'FILE_TOO_LARGE' : 'UNSUPPORTED_FILE_TYPE',
          basicValidation.error || 'File validation failed',
          400,
          request,
          basicValidation.details
        );
      }

      // Content validation
      try {
        const contentValidation = await validateFileContent(file);
        if (!contentValidation.isValid) {
          return createErrorResponse(
            'FILE_VALIDATION_ERROR',
            contentValidation.error || 'File content validation failed',
            400,
            request,
            contentValidation.details
          );
        }
      } catch (_error) {
        return createErrorResponse(
          'FILE_VALIDATION_ERROR',
          'Unable to validate file content',
          400,
          request
        );
      }
    }

    // Prepare payload for n8n
    const n8nFormData = new FormData();
    n8nFormData.append('competitor', competitor.trim());
    n8nFormData.append('verticals', JSON.stringify(verticals));
    n8nFormData.append('sourceType', sourceType);
    
    if (file) {
      n8nFormData.append('file', file);
      n8nFormData.append('mode', 'file');
      n8nFormData.append('fileName', file.name);
      n8nFormData.append('fileSize', file.size.toString());
      n8nFormData.append('fileType', file.type || 'application/octet-stream');
    } else {
      n8nFormData.append('content', content.trim());
      n8nFormData.append('mode', 'text');
    }

    // Send to n8n webhook
    try {
      const n8nResponse = await n8nClient.sendWithFile('upload-battlecard', n8nFormData, {
        timeout: 60000, // 60 seconds for file uploads
        retries: 1 // Only retry once for file uploads
      });

      const processingTime = Date.now() - startTime;

      // Log successful processing
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        route: request.url,
        method: request.method,
        message: 'Battlecard upload completed successfully',
        data: {
          competitor,
          verticalsCount: verticals.length,
          mode: file ? 'file' : 'text',
          fileSize: file?.size,
          processingTime
        }
      }));

      return NextResponse.json({
        success: true,
        message: 'Battlecard uploaded successfully',
        data: {
          sourceId: n8nResponse.sourceId,
          chunksCreated: n8nResponse.chunksCreated,
          competitor,
          verticals,
          processingTime
        }
      });

    } catch (n8nError) {
      const n8nErrorTyped = n8nError as Error;
      
      // Determine error type based on error message
      let errorCode = 'WEBHOOK_ERROR';
      let status = 502;

      if (n8nErrorTyped.message.includes('timeout') || n8nErrorTyped.message.includes('AbortError')) {
        errorCode = 'TIMEOUT_ERROR';
        status = 504;
      } else if (n8nErrorTyped.message.includes('413')) {
        errorCode = 'FILE_TOO_LARGE';
        status = 413;
      } else if (n8nErrorTyped.message.includes('400')) {
        errorCode = 'VALIDATION_ERROR';
        status = 400;
      }

      return createErrorResponse(
        errorCode,
        `Failed to process battlecard upload: ${n8nErrorTyped.message}`,
        status,
        request,
        {
          n8nError: n8nErrorTyped.message,
          processingTime: Date.now() - startTime
        }
      );
    }

  } catch (error) {
    const err = error as Error;
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error occurred',
      500,
      request,
      {
        error: err.message,
        processingTime: Date.now() - startTime
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isHealthy = await n8nClient.healthCheck();
    
    return NextResponse.json({
      status: 'ok',
      n8nConnectivity: isHealthy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      n8nConnectivity: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}