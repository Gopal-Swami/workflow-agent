import { NextRequest, NextResponse } from 'next/server';
import { WorkflowNotFoundError } from '@temporalio/client';
import { getTemporalClient } from '@/lib/temporal-client';
import type { WorkflowStatusResponse, ErrorResponse, WorkflowStatus, TaskResult } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<WorkflowStatusResponse | ErrorResponse>> {
  try {
    const { id: workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'workflowId is required' },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    let description;
    try {
      description = await handle.describe();
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        return NextResponse.json(
          { error: 'Workflow not found', details: `No workflow with ID ${workflowId}` },
          { status: 404 }
        );
      }
      throw error;
    }

    let status: WorkflowStatus;
    try {
      status = await handle.query<WorkflowStatus>('getStatus');
    } catch {
      const isRunning = description.status.name === 'RUNNING';
      status = {
        currentStep: isRunning ? 'pending' : 'failed',
        completedSteps: [],
        startedAt: description.startTime.getTime(),
        completedAt: description.closeTime?.getTime(),
        error: isRunning ? undefined : 'Query failed',
      };
    }

    let result: TaskResult | undefined;
    if (description.status.name === 'COMPLETED') {
      try {
        result = await handle.result();
      } catch {
        // Result not available
      }
    }

    return NextResponse.json({ workflowId, ...status, result });
  } catch (error) {
    console.error('Failed to get workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
