import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  query: string;
  sessionId: string;
  context?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

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
  console.error(JSON.stringify({
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
      message: 'Company deep dive chat request received'
    }));

    // Check if n8n webhook URL is configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return createErrorResponse(
        'CONFIGURATION_ERROR',
        'N8N_WEBHOOK_URL environment variable is not configured',
        500,
        request
      );
    }

    // Parse request body
    let requestBody: ChatRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid JSON in request body',
        400,
        request,
        { parseError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }

    const { query, sessionId, context } = requestBody;

    // Validate required fields
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Query is required and must be a non-empty string',
        400,
        request
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Session ID is required and must be a string',
        400,
        request
      );
    }

    // Prepare payload for n8n webhook
    const n8nPayload = {
      query: query.trim(),
      sessionId,
      context: context || {},
      timestamp: new Date().toISOString()
    };

    // Send to n8n webhook
    try {
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Sending request to n8n webhook',
        webhookUrl: n8nWebhookUrl,
        sessionId,
        queryLength: query.length
      }));

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        throw new Error(`n8n webhook returned status ${n8nResponse.status}: ${errorText}`);
      }

      const n8nData = await n8nResponse.json();
      const processingTime = Date.now() - startTime;

      // Log successful processing
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        route: request.url,
        method: request.method,
        message: 'Company deep dive chat completed successfully',
        data: {
          sessionId,
          queryLength: query.length,
          processingTime
        }
      }));

      // Return response - handle different possible response formats from n8n
      return NextResponse.json({
        success: true,
        response: n8nData.response || n8nData.message || n8nData.reply || n8nData.text || JSON.stringify(n8nData),
        data: n8nData,
        processingTime
      });

    } catch (n8nError) {
      const n8nErrorTyped = n8nError as Error;
      
      // Determine error type based on error message
      let errorCode = 'WEBHOOK_ERROR';
      let status = 502;

      if (n8nErrorTyped.message.includes('timeout') || n8nErrorTyped.message.includes('AbortError')) {
        errorCode = 'TIMEOUT_ERROR';
        status = 504;
      } else if (n8nErrorTyped.message.includes('400')) {
        errorCode = 'VALIDATION_ERROR';
        status = 400;
      } else if (n8nErrorTyped.message.includes('404')) {
        errorCode = 'NOT_FOUND';
        status = 404;
      }

      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        route: request.url,
        method: request.method,
        error: {
          code: errorCode,
          message: n8nErrorTyped.message,
          stack: n8nErrorTyped.stack
        },
        processingTime: Date.now() - startTime
      }));

      return createErrorResponse(
        errorCode,
        `Failed to get response from n8n webhook: ${n8nErrorTyped.message}`,
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
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  
  return NextResponse.json({
    status: n8nWebhookUrl ? 'ok' : 'error',
    n8nWebhookConfigured: !!n8nWebhookUrl,
    timestamp: new Date().toISOString()
  }, { 
    status: n8nWebhookUrl ? 200 : 503 
  });
}

