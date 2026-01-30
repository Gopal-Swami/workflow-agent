/**
 * Frontend types - mirrors temporal-worker types.
 * In production, consider a shared package.
 */

// Workflow Types
export interface TaskInput {
  query: string;
  options?: TaskOptions;
}

export interface TaskOptions {
  maxSearchResults?: number;
  includeDetailedAnalysis?: boolean;
  timeoutMultiplier?: number;
}

export interface TaskResult {
  report: ReportOutput;
  validation: ValidationOutput;
  steps: StepResult[];
  partial?: boolean;
}

export type WorkflowStep =
  | 'pending'
  | 'parsing'
  | 'searching'
  | 'transforming'
  | 'generating'
  | 'validating'
  | 'complete'
  | 'failed';

export interface StepResult {
  step: WorkflowStep;
  result?: unknown;
  error?: string;
  durationMs?: number;
}

export interface WorkflowStatus {
  currentStep: WorkflowStep;
  completedSteps: StepResult[];
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// Report Types
export interface ReportSection {
  heading: string;
  content: string;
}

export interface ReportOutput {
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
  conclusion: string;
  generatedAt: string;
}

// Validation Types
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
}

export interface ValidationOutput {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  checkedAt: string;
}

// API Response Types
export interface StartWorkflowResponse {
  workflowId: string;
  runId: string;
}

export interface WorkflowStatusResponse extends WorkflowStatus {
  workflowId: string;
  result?: TaskResult;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
