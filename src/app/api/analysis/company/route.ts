import { NextRequest, NextResponse } from 'next/server';
import n8nClient from '@/lib/n8n/client';
import { insertKnowledgeSource } from '@/lib/supabase/server';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

interface CompanyAnalysisRequest {
  companyName: string;
  analysisType: string[];
  outputFormat: 'json' | 'markdown';
}

interface CompanyAnalysisResponse {
  success: boolean;
  company: string;
  generatedAt: string;
  sections: Array<{
    type: string;
    title: string;
    content: string;
    sources?: string[];
  }>;
  metadata: {
    processingTime: number;
    dataPoints: number;
    outputFormat: string;
    analysisTypes: string[];
  };
  sourceId?: string; // If saved to knowledge base
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
      message: 'Company analysis request received'
    }));

    // Parse request body
    let requestBody: CompanyAnalysisRequest;
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

    const { companyName, analysisType, outputFormat = 'json' } = requestBody;

    // Validate company name
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Company name is required and must be a non-empty string',
        400,
        request
      );
    }

    if (companyName.length > 100) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Company name must be 100 characters or less',
        400,
        request
      );
    }

    // Validate analysis type
    const validAnalysisTypes = ['overview', 'financials', 'competition', 'news', 'products', 'leadership'];
    if (!Array.isArray(analysisType) || analysisType.length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Analysis type must be a non-empty array. Valid types: ${validAnalysisTypes.join(', ')}`,
        400,
        request
      );
    }

    const invalidTypes = analysisType.filter(type => !validAnalysisTypes.includes(type));
    if (invalidTypes.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid analysis types: ${invalidTypes.join(', ')}. Valid types: ${validAnalysisTypes.join(', ')}`,
        400,
        request
      );
    }

    // Validate output format
    if (!['json', 'markdown'].includes(outputFormat)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Output format must be either "json" or "markdown"',
        400,
        request
      );
    }

    // Prepare payload for n8n
    const n8nPayload = {
      companyName: companyName.trim(),
      analysisType,
      outputFormat,
      requestId: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    try {
      // Send to n8n company analysis workflow
      const n8nResponse = await n8nClient.sendWebhook('company-analysis', n8nPayload, {
        timeout: 120000, // 2 minutes for complex analysis
        retries: 1 // Only retry once for long-running operations
      });

      const processingTime = Date.now() - startTime;

      // Prepare response
      const response: CompanyAnalysisResponse = {
        success: true,
        company: companyName.trim(),
        generatedAt: new Date().toISOString(),
        sections: n8nResponse.sections || [],
        metadata: {
          processingTime,
          dataPoints: n8nResponse.dataPoints || 0,
          outputFormat,
          analysisTypes: analysisType
        }
      };

      // Optionally save analysis results to knowledge base
      try {
        const sourceId = await insertKnowledgeSource({
          source_type: 'company_analysis',
          title: `${companyName} Company Analysis`,
          competitor: companyName,
          verticals: [], // Could be inferred from analysis
          verified: false,
          risk_level: 'low',
          metadata: {
            analysisTypes: analysisType,
            outputFormat,
            generatedAt: response.generatedAt,
            dataPoints: response.metadata.dataPoints
          }
        });

        response.sourceId = sourceId;

        console.log(JSON.stringify({
          level: 'info',
          timestamp: new Date().toISOString(),
          message: 'Company analysis saved to knowledge base',
          sourceId,
          company: companyName
        }));

      } catch (saveError) {
        // Don't fail the request if saving fails
        console.log(JSON.stringify({
          level: 'warn',
          timestamp: new Date().toISOString(),
          message: 'Failed to save company analysis to knowledge base',
          error: (saveError as Error).message,
          company: companyName
        }));
      }

      // Log successful processing
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        route: request.url,
        method: request.method,
        message: 'Company analysis completed successfully',
        data: {
          company: companyName,
          analysisTypes: analysisType,
          sectionsGenerated: response.sections.length,
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
      } else if (n8nErrorTyped.message.includes('429')) {
        errorCode = 'RATE_LIMIT_ERROR';
        status = 429;
      } else if (n8nErrorTyped.message.includes('404')) {
        errorCode = 'RESOURCE_NOT_FOUND';
        status = 404;
      }

      return createErrorResponse(
        errorCode,
        `Company analysis failed: ${n8nErrorTyped.message}`,
        status,
        request,
        {
          company: companyName,
          analysisTypes: analysisType,
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

// GET endpoint for retrieving cached analyses and health check
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const company = url.searchParams.get('company');

    if (action === 'health') {
      return NextResponse.json({
        status: 'ok',
        service: 'company-analysis',
        timestamp: new Date().toISOString(),
        supportedAnalysisTypes: [
          'overview',
          'financials', 
          'competition',
          'news',
          'products',
          'leadership'
        ],
        outputFormats: ['json', 'markdown']
      });
    }

    if (action === 'cached' && company) {
      // This would retrieve cached analysis from knowledge base
      // For now, return a placeholder response
      return NextResponse.json({
        message: 'Cached analysis retrieval not yet implemented',
        company,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'templates') {
      // Return available analysis templates
      return NextResponse.json({
        templates: {
          'competitive-brief': {
            name: 'Competitive Brief',
            analysisTypes: ['overview', 'competition', 'products'],
            description: 'Quick competitive overview'
          },
          'full-analysis': {
            name: 'Full Company Analysis',
            analysisTypes: ['overview', 'financials', 'competition', 'news', 'products', 'leadership'],
            description: 'Comprehensive company analysis'
          },
          'financial-focus': {
            name: 'Financial Analysis',
            analysisTypes: ['overview', 'financials', 'news'],
            description: 'Focus on financial performance'
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Invalid action parameter. Use ?action=health, ?action=cached&company=X, or ?action=templates'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
