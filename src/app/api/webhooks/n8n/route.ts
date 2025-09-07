import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface N8nNotification {
  workflowId: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

interface JobStatus {
  id: string;
  workflow_id: string;
  status: string;
  progress: number;
  result: unknown;
  error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Simple in-memory store for active jobs (in production, use Redis or database)
const activeJobs = new Map<string, JobStatus>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Log incoming webhook
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      route: request.url,
      method: request.method,
      message: 'n8n webhook notification received'
    }));

    // Parse request body
    let notification: N8nNotification;
    try {
      notification = await request.json();
    } catch (error) {
      console.log(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message: 'Invalid JSON in webhook payload',
        error: (error as Error).message
      }));
      
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON payload'
      }, { status: 400 });
    }

    // Validate notification structure
    const { workflowId, status, progress, result, error, metadata } = notification;

    if (!workflowId || !status) {
      return NextResponse.json({
        success: false,
        error: 'workflowId and status are required'
      }, { status: 400 });
    }

    const validStatuses = ['started', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Update job status
    const now = new Date().toISOString();
    const existingJob = activeJobs.get(workflowId);
    
    const jobStatus: JobStatus = {
      id: workflowId,
      workflow_id: workflowId,
      status,
      progress: progress || 0,
      result: result || null,
      error: error || null,
      metadata: metadata || {},
      created_at: existingJob?.created_at || now,
      updated_at: now
    };

    activeJobs.set(workflowId, jobStatus);

    // Log status update
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message: 'Job status updated',
      data: {
        workflowId,
        status,
        progress,
        hasResult: !!result,
        hasError: !!error
      }
    }));

    // Store in database (optional - for persistence across server restarts)
    try {
      const supabase = createServerSupabaseClient();
      
      // Upsert job status (assuming you have a job_status table)
      await supabase
        .from('job_status')
        .upsert({
          workflow_id: workflowId,
          status,
          progress: progress || 0,
          result: result ? JSON.stringify(result) : null,
          error,
          metadata: metadata ? JSON.stringify(metadata) : '{}',
          updated_at: now
        }, {
          onConflict: 'workflow_id'
        });

    } catch (dbError) {
      // Don't fail the webhook if database update fails
      console.log(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message: 'Failed to update job status in database',
        workflowId,
        error: (dbError as Error).message
      }));
    }

    // Handle different status types
    switch (status) {
      case 'started':
        // Job has started
        console.log(JSON.stringify({
          level: 'info',
          timestamp: new Date().toISOString(),
          message: 'Workflow started',
          workflowId
        }));
        break;

      case 'processing':
        // Job is in progress
        console.log(JSON.stringify({
          level: 'info',
          timestamp: new Date().toISOString(),
          message: 'Workflow processing',
          workflowId,
          progress
        }));
        break;

      case 'completed':
        // Job completed successfully
        console.log(JSON.stringify({
          level: 'info',
          timestamp: new Date().toISOString(),
          message: 'Workflow completed successfully',
          workflowId,
          hasResult: !!result
        }));

        // Trigger any follow-up actions
        await handleWorkflowCompletion(workflowId, result, metadata);
        break;

      case 'failed':
        // Job failed
        console.log(JSON.stringify({
          level: 'error',
          timestamp: new Date().toISOString(),
          message: 'Workflow failed',
          workflowId,
          error
        }));

        // Handle failure (notifications, cleanup, etc.)
        await handleWorkflowFailure(workflowId, error, metadata);
        break;
    }

    // Send real-time update to frontend (placeholder for WebSocket/SSE implementation)
    // In a real implementation, you would send this update to connected clients
    await sendRealtimeUpdate(workflowId, jobStatus);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      workflowId,
      status,
      processingTime
    });

  } catch (error) {
    const err = error as Error;
    
    console.log(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      route: request.url,
      method: request.method,
      message: 'Webhook processing failed',
      error: err.message,
      processingTime: Date.now() - startTime
    }));

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: err.message
    }, { status: 500 });
  }
}

// GET endpoint for retrieving job status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');
    const action = url.searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        status: 'ok',
        service: 'n8n-webhook-handler',
        timestamp: new Date().toISOString(),
        activeJobs: activeJobs.size
      });
    }

    if (workflowId) {
      const jobStatus = activeJobs.get(workflowId);
      
      if (!jobStatus) {
        return NextResponse.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job: jobStatus
      });
    }

    // Return all active jobs
    return NextResponse.json({
      success: true,
      jobs: Array.from(activeJobs.values()),
      totalJobs: activeJobs.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Helper function to handle workflow completion
async function handleWorkflowCompletion(
  workflowId: string, 
  result: unknown, 
  metadata?: Record<string, unknown>
) {
  try {
    // Example: Send notification email, update related records, etc.
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message: 'Handling workflow completion',
      workflowId,
      resultType: typeof result,
      metadata
    }));

    // Cleanup completed job after some time
    setTimeout(() => {
      activeJobs.delete(workflowId);
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Cleaned up completed job',
        workflowId
      }));
    }, 5 * 60 * 1000); // 5 minutes

  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error handling workflow completion',
      workflowId,
      error: (error as Error).message
    }));
  }
}

// Helper function to handle workflow failure
async function handleWorkflowFailure(
  workflowId: string, 
  error?: string, 
  metadata?: Record<string, unknown>
) {
  try {
    // Example: Send error notification, log to monitoring system, etc.
    console.log(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message: 'Handling workflow failure',
      workflowId,
      error,
      metadata
    }));

    // Cleanup failed job after some time
    setTimeout(() => {
      activeJobs.delete(workflowId);
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Cleaned up failed job',
        workflowId
      }));
    }, 10 * 60 * 1000); // 10 minutes (keep longer for debugging)

  } catch (handlerError) {
    console.log(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error handling workflow failure',
      workflowId,
      error: (handlerError as Error).message
    }));
  }
}

// Placeholder for real-time update functionality
async function sendRealtimeUpdate(workflowId: string, jobStatus: JobStatus) {
  // In a real implementation, this would send updates via WebSocket or Server-Sent Events
  // For now, just log the update
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    message: 'Real-time update (placeholder)',
    workflowId,
    status: jobStatus.status,
    progress: jobStatus.progress
  }));
}
