import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTemporalClient, AGENT_TASK_QUEUE } from '@/lib/temporal-client';
import type { TaskInput, StartWorkflowResponse, ErrorResponse } from '@/lib/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<StartWorkflowResponse | ErrorResponse>> {
  try {
    const body = await request.json();
    const { query, options } = body as TaskInput;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Invalid input', details: 'query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const taskInput: TaskInput = {
      query: query.trim(),
      options: {
        maxSearchResults: options?.maxSearchResults ?? 5,
        includeDetailedAnalysis: options?.includeDetailedAnalysis ?? true,
        timeoutMultiplier: options?.timeoutMultiplier ?? 1,
      },
    };

    const client = await getTemporalClient();
    const workflowId = `agent-${uuidv4()}`;

    const handle = await client.workflow.start('agentWorkflow', {
      taskQueue: AGENT_TASK_QUEUE,
      workflowId,
      args: [taskInput],
    });

    console.log(`Started workflow ${workflowId} [${handle.firstExecutionRunId}]`);

    return NextResponse.json({
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });
  } catch (error) {
    console.error('Failed to start workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
