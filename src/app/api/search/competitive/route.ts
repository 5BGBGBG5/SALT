import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/openai/embeddings';
import { searchKnowledgeBase, SearchResult } from '@/lib/supabase/server';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

interface CompetitiveSearchRequest {
  query: string;
  competitor?: string;
  verticals?: string[];
  limit?: number;
  threshold?: number;
}

interface CompetitiveSearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  metadata: {
    totalResults: number;
    processingTime: number;
    threshold: number;
    filters?: {
      competitor?: string;
      verticals?: string[];
    };
  };
}

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  request: NextRequest,
  details?: any
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
      message: 'Competitive search request received'
    }));

    // Parse request body
    let requestBody: CompetitiveSearchRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid JSON in request body',
        400,
        request
      );
    }

    const {
      query,
      competitor,
      verticals,
      limit = 10,
      threshold = 0.7
    } = requestBody;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Query is required and must be a non-empty string',
        400,
        request
      );
    }

    if (query.length > 500) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Query must be 500 characters or less',
        400,
        request
      );
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Limit must be between 1 and 100',
        400,
        request
      );
    }

    // Validate threshold
    if (threshold < 0 || threshold > 1) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Threshold must be between 0 and 1',
        400,
        request
      );
    }

    let embedding: number[];
    let results: SearchResult[] = [];

    try {
      // Generate embedding for the query
      embedding = await generateEmbedding(query.trim());
      
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Generated embedding for search query',
        queryLength: query.length
      }));

    } catch (embeddingError) {
      const error = embeddingError as Error;
      
      // Try to provide cached results if available (placeholder for future implementation)
      console.log(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message: 'Failed to generate embedding, attempting fallback',
        error: error.message
      }));

      return createErrorResponse(
        'EXTERNAL_API_ERROR',
        'Failed to generate embedding for search query',
        503,
        request,
        { embeddingError: error.message }
      );
    }

    try {
      // Search knowledge base
      results = await searchKnowledgeBase(embedding, {
        threshold,
        limit,
        competitor,
        verticals
      });

      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Knowledge base search completed',
        resultsFound: results.length,
        filters: { competitor, verticals }
      }));

    } catch (searchError) {
      const error = searchError as Error;
      
      return createErrorResponse(
        'DATABASE_ERROR',
        'Failed to search knowledge base',
        500,
        request,
        { searchError: error.message }
      );
    }

    const processingTime = Date.now() - startTime;

    // Format response
    const response: CompetitiveSearchResponse = {
      success: true,
      results,
      query: query.trim(),
      metadata: {
        totalResults: results.length,
        processingTime,
        threshold,
        ...(competitor || verticals ? {
          filters: {
            ...(competitor && { competitor }),
            ...(verticals && { verticals })
          }
        } : {})
      }
    };

    // Log successful search
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      route: request.url,
      method: request.method,
      message: 'Competitive search completed successfully',
      data: {
        query: query.trim(),
        resultsCount: results.length,
        processingTime,
        filters: { competitor, verticals }
      }
    }));

    return NextResponse.json(response);

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

// GET endpoint for health check and stats
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        status: 'ok',
        service: 'competitive-search',
        timestamp: new Date().toISOString(),
        capabilities: [
          'text-embedding',
          'semantic-search',
          'competitor-filtering',
          'vertical-filtering'
        ]
      });
    }

    if (action === 'stats') {
      // This could return search statistics, popular queries, etc.
      // For now, just return basic info
      return NextResponse.json({
        service: 'competitive-search',
        version: '1.0.0',
        features: {
          embeddingModel: 'text-embedding-3-small',
          maxQueryLength: 500,
          maxResults: 100,
          defaultThreshold: 0.7
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Invalid action parameter. Use ?action=health or ?action=stats'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
