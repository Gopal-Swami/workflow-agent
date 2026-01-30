/**
 * Shared types for the Workflow Agent system.
 * Used across workflows, activities, and the frontend.
 */

// Workflow Input/Output
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

// Workflow Steps
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

// Web Search Activity
export interface WebSearchInput {
  query: string;
  maxResults: number;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  relevanceScore: number;
}

export interface WebSearchOutput {
  results: SearchResult[];
  metadata: {
    source: string;
    timestamp: string;
    totalResults: number;
  };
}

// Data Transform Activity
export interface DataTransformInput {
  searchResults: SearchResult[];
  transformationType: 'summarize' | 'extract_facts' | 'categorize';
}

export interface TransformedData {
  insights: string[];
  categories: Record<string, string[]>;
  summary: string;
  sources: string[];
}

export interface DataTransformOutput {
  data: TransformedData;
  metadata: {
    itemsProcessed: number;
    transformationType: string;
  };
}

// Generate Report Activity
export interface GenerateReportInput {
  transformedData: TransformedData;
  query: string;
  includeDetailedAnalysis: boolean;
}

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

// Validate Result Activity
export interface ValidateResultInput {
  transformedData: TransformedData;
  report: ReportOutput;
}

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

// Internal Workflow Type
export interface ExecutionPlan {
  searchQuery: string;
  maxResults: number;
  transformationType: 'summarize' | 'extract_facts' | 'categorize';
  includeDetailedAnalysis: boolean;
}
