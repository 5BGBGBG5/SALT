import { NextRequest, NextResponse } from 'next/server';
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

interface HubSpotQueryRequest {
  action: 'search_deals' | 'search_contacts' | 'search_companies' | 'get_record';
  params: {
    query?: string;
    filters?: Record<string, unknown>;
    properties?: string[];
    limit?: number;
    objectType?: string;
    objectId?: string;
  };
}

interface HubSpotResponse {
  success: boolean;
  data?: unknown;
  total?: number;
  error?: string;
  metadata?: {
    action: string;
    processingTime: number;
    recordCount?: number;
  };
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
      message: 'HubSpot query request received'
    }));

    // Parse request body
    let requestBody: HubSpotQueryRequest;
    try {
      requestBody = await request.json();
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid JSON in request body',
        400,
        request
      );
    }

    const { action, params } = requestBody;

    // Validate action
    const validActions = ['search_deals', 'search_contacts', 'search_companies', 'get_record'];
    if (!action || !validActions.includes(action)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        400,
        request
      );
    }

    // Validate params based on action
    if (!params || typeof params !== 'object') {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Params object is required',
        400,
        request
      );
    }

    // Action-specific validation
    if (action === 'get_record') {
      if (!params.objectType || !params.objectId) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'objectType and objectId are required for get_record action',
          400,
          request
        );
      }
    }

    if (action.startsWith('search_') && params.limit && (params.limit < 1 || params.limit > 100)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Limit must be between 1 and 100',
        400,
        request
      );
    }

    // Prepare payload for n8n
    const n8nPayload = {
      action,
      params: {
        ...params,
        limit: params.limit || 20 // Default limit
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Send to n8n HubSpot workflow
      const n8nResponse = await n8nClient.sendWebhook('hubspot-query', n8nPayload, {
        timeout: 30000, // 30 seconds
        retries: 2
      });

      const processingTime = Date.now() - startTime;

      // Transform n8n response to consistent format
      const response: HubSpotResponse = {
        success: true,
        data: n8nResponse.data,
        total: n8nResponse.total,
        metadata: {
          action,
          processingTime,
          recordCount: Array.isArray(n8nResponse.data) ? n8nResponse.data.length : (n8nResponse.data ? 1 : 0)
        }
      };

      // Log successful processing
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        route: request.url,
        method: request.method,
        message: 'HubSpot query completed successfully',
        data: {
          action,
          recordCount: response.metadata?.recordCount,
          processingTime
        }
      }));

      return NextResponse.json(response);

    } catch (n8nError) {
      const n8nErrorTyped = n8nError as Error;
      
      // Determine error type based on error message
      let errorCode = 'EXTERNAL_API_ERROR';
      let status = 502;

      if (n8nErrorTyped.message.includes('timeout') || n8nErrorTyped.message.includes('AbortError')) {
        errorCode = 'TIMEOUT_ERROR';
        status = 504;
      } else if (n8nErrorTyped.message.includes('401') || n8nErrorTyped.message.includes('unauthorized')) {
        errorCode = 'AUTHENTICATION_ERROR';
        status = 401;
      } else if (n8nErrorTyped.message.includes('403') || n8nErrorTyped.message.includes('forbidden')) {
        errorCode = 'AUTHORIZATION_ERROR';
        status = 403;
      } else if (n8nErrorTyped.message.includes('404')) {
        errorCode = 'RESOURCE_NOT_FOUND';
        status = 404;
      } else if (n8nErrorTyped.message.includes('429')) {
        errorCode = 'RATE_LIMIT_ERROR';
        status = 429;
      }

      return createErrorResponse(
        errorCode,
        `HubSpot query failed: ${n8nErrorTyped.message}`,
        status,
        request,
        {
          action,
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

// GET endpoint for specific record retrieval and health check
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const objectType = url.searchParams.get('objectType');
    const objectId = url.searchParams.get('objectId');

    if (action === 'health') {
      return NextResponse.json({
        status: 'ok',
        service: 'hubspot-integration',
        timestamp: new Date().toISOString(),
        supportedActions: [
          'search_deals',
          'search_contacts', 
          'search_companies',
          'get_record'
        ]
      });
    }

    if (action === 'get_record' && objectType && objectId) {
      // Handle GET request for specific record
      const startTime = Date.now();

      try {
        const n8nResponse = await n8nClient.sendWebhook('hubspot-query', {
          action: 'get_record',
          params: {
            objectType,
            objectId
          }
        });

        const processingTime = Date.now() - startTime;

        console.log(JSON.stringify({
          level: 'info',
          timestamp: new Date().toISOString(),
          route: request.url,
          method: request.method,
          message: 'HubSpot record retrieval completed',
          data: { objectType, objectId, processingTime }
        }));

        return NextResponse.json({
          success: true,
          data: n8nResponse.data,
          metadata: {
            action: 'get_record',
            objectType,
            objectId,
            processingTime
          }
        });

      } catch (error) {
        return NextResponse.json({
          success: false,
          error: (error as Error).message,
          metadata: {
            action: 'get_record',
            objectType,
            objectId,
            processingTime: Date.now() - startTime
          }
        }, { status: 500 });
      }
    }

    // Invalid GET request
    return NextResponse.json({
      error: 'Invalid GET request. Use ?action=health or ?action=get_record&objectType=X&objectId=Y'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
