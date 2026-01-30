/**
 * Agent Workflow - Deterministic orchestrator for the research agent.
 *
 * All side effects are delegated to activities. The workflow maintains state
 * for queries and coordinates the execution of 4 activities in sequence.
 */

import {
  proxyActivities,
  defineQuery,
  setHandler,
  ActivityFailure,
} from '@temporalio/workflow';

import type * as activities from '../activities/index.js';
import type {
  TaskInput,
  TaskResult,
  WorkflowStatus,
  WorkflowStep,
  StepResult,
  ExecutionPlan,
  WebSearchOutput,
  DataTransformOutput,
  ReportOutput,
  ValidationOutput,
} from '../shared/types.js';

// Activity proxies with tailored retry strategies based on failure characteristics
const searchActivities = proxyActivities<Pick<typeof activities, 'webSearch'>>({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '10s',
  },
});

const transformActivities = proxyActivities<Pick<typeof activities, 'dataTransform'>>({
  startToCloseTimeout: '60s',
  retry: {
    maximumAttempts: 2,
    initialInterval: '500ms',
    backoffCoefficient: 1.5,
  },
});

const reportActivities = proxyActivities<Pick<typeof activities, 'generateReport'>>({
  startToCloseTimeout: '120s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '30s',
  },
});

const validateActivities = proxyActivities<Pick<typeof activities, 'validateResult'>>({
  startToCloseTimeout: '10s',
  retry: { maximumAttempts: 1 },
});

// Workflow state - persists across replays, readable via queries
let currentStep: WorkflowStep = 'pending';
let completedSteps: StepResult[] = [];
let workflowStartedAt = 0;
let workflowError: string | undefined;

export const getStatusQuery = defineQuery<WorkflowStatus>('getStatus');

function parseTask(input: TaskInput): ExecutionPlan {
  const { query, options = {} } = input;
  return {
    searchQuery: query.trim(),
    maxResults: options.maxSearchResults ?? 5,
    transformationType: 'categorize',
    includeDetailedAnalysis: options.includeDetailedAnalysis ?? true,
  };
}

function recordStep(step: WorkflowStep, result?: unknown, error?: string, startTime?: number): void {
  completedSteps.push({
    step,
    result,
    error,
    durationMs: startTime ? Date.now() - startTime : undefined,
  });
}

function handleActivityError(step: WorkflowStep, err: unknown, prefix: string): never {
  if (err instanceof ActivityFailure) {
    workflowError = `${prefix}: ${err.message}`;
    recordStep(step, undefined, err.message);
    currentStep = 'failed';
  }
  throw err;
}

export async function agentWorkflow(input: TaskInput): Promise<TaskResult> {
  workflowStartedAt = Date.now();

  setHandler(getStatusQuery, (): WorkflowStatus => ({
    currentStep,
    completedSteps,
    startedAt: workflowStartedAt,
    completedAt: currentStep === 'complete' || currentStep === 'failed' ? Date.now() : undefined,
    error: workflowError,
  }));

  try {
    // Step 1: Parse task (pure function, no activity needed)
    currentStep = 'parsing';
    const plan = parseTask(input);
    recordStep('parsing', { plan });

    // Step 2: Search for information
    currentStep = 'searching';
    let searchResult: WebSearchOutput;
    try {
      searchResult = await searchActivities.webSearch({
        query: plan.searchQuery,
        maxResults: plan.maxResults,
      });
      recordStep('searching', { resultCount: searchResult.results.length });
    } catch (err) {
      handleActivityError('searching', err, 'Search failed');
    }

    // Step 3: Transform data
    currentStep = 'transforming';
    let transformResult: DataTransformOutput;
    try {
      transformResult = await transformActivities.dataTransform({
        searchResults: searchResult.results,
        transformationType: plan.transformationType,
      });
      recordStep('transforming', { insightCount: transformResult.data.insights.length });
    } catch (err) {
      handleActivityError('transforming', err, 'Data transformation failed');
    }

    // Step 4: Generate report
    currentStep = 'generating';
    let report: ReportOutput;
    try {
      report = await reportActivities.generateReport({
        transformedData: transformResult.data,
        query: plan.searchQuery,
        includeDetailedAnalysis: plan.includeDetailedAnalysis,
      });
      recordStep('generating', { sectionCount: report.sections.length });
    } catch (err) {
      handleActivityError('generating', err, 'Report generation failed');
    }

    // Step 5: Validate result (non-critical - returns partial result on failure)
    currentStep = 'validating';
    let validation: ValidationOutput;
    try {
      validation = await validateActivities.validateResult({
        transformedData: transformResult.data,
        report,
      });
      recordStep('validating', { score: validation.score, isValid: validation.isValid });
    } catch (err) {
      if (err instanceof ActivityFailure) {
        workflowError = `Validation failed: ${err.message}`;
        recordStep('validating', undefined, err.message);
        currentStep = 'complete';
        return {
          report,
          validation: {
            isValid: false,
            score: 0,
            issues: [{ severity: 'error', message: 'Validation activity failed' }],
            checkedAt: new Date().toISOString(),
          },
          steps: completedSteps,
          partial: true,
        };
      }
      throw err;
    }

    currentStep = 'complete';
    return { report, validation, steps: completedSteps };
  } catch (err) {
    currentStep = 'failed';
    if (err instanceof Error) {
      workflowError = err.message;
    }
    throw err;
  }
}
