/**
 * Validate Result Activity - Quality validation for generated reports.
 * Checks completeness, consistency, and assigns a quality score.
 */

import { ApplicationFailure } from '@temporalio/common';
import type {
  ValidateResultInput,
  ValidationOutput,
  ValidationIssue,
  TransformedData,
  ReportOutput,
} from '../shared/types.js';

const THRESHOLDS = {
  minInsights: 1,
  minSources: 1,
  minSections: 2,
  minSummaryLength: 50,
};

const SEVERITY_PENALTIES = { error: 20, warning: 10, info: 2 };

function validateTransformedData(data: TransformedData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (data.insights.length < THRESHOLDS.minInsights) {
    issues.push({
      severity: 'warning',
      message: `Only ${data.insights.length} insights extracted, expected at least ${THRESHOLDS.minInsights}`,
      location: 'transformedData.insights',
    });
  }

  if (data.sources.length < THRESHOLDS.minSources) {
    issues.push({
      severity: 'error',
      message: 'No sources provided for the analysis',
      location: 'transformedData.sources',
    });
  }

  if (data.summary.length < THRESHOLDS.minSummaryLength) {
    issues.push({
      severity: 'warning',
      message: `Summary is too short (${data.summary.length} chars), may lack detail`,
      location: 'transformedData.summary',
    });
  }

  const emptyInsights = data.insights.filter((i) => !i?.trim()).length;
  if (emptyInsights > 0) {
    issues.push({
      severity: 'warning',
      message: `${emptyInsights} empty insights detected`,
      location: 'transformedData.insights',
    });
  }

  return issues;
}

function validateReport(report: ReportOutput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!report.title?.trim()) {
    issues.push({ severity: 'error', message: 'Report title is missing', location: 'report.title' });
  }

  if (!report.executiveSummary || report.executiveSummary.length < THRESHOLDS.minSummaryLength) {
    issues.push({
      severity: 'warning',
      message: 'Executive summary is missing or too short',
      location: 'report.executiveSummary',
    });
  }

  if (report.sections.length < THRESHOLDS.minSections) {
    issues.push({
      severity: 'warning',
      message: `Report has only ${report.sections.length} sections, expected at least ${THRESHOLDS.minSections}`,
      location: 'report.sections',
    });
  }

  report.sections.forEach((section, i) => {
    if (!section.heading?.trim()) {
      issues.push({
        severity: 'warning',
        message: `Section ${i + 1} has no heading`,
        location: `report.sections[${i}].heading`,
      });
    }
    if (!section.content?.trim()) {
      issues.push({
        severity: 'warning',
        message: `Section "${section.heading}" has no content`,
        location: `report.sections[${i}].content`,
      });
    }
  });

  if (!report.conclusion?.trim()) {
    issues.push({ severity: 'info', message: 'Report has no conclusion', location: 'report.conclusion' });
  }

  if (!report.generatedAt) {
    issues.push({
      severity: 'info',
      message: 'Report generation timestamp is missing',
      location: 'report.generatedAt',
    });
  }

  return issues;
}

function calculateScore(issues: ValidationIssue[]): number {
  const penalty = issues.reduce((sum, issue) => sum + SEVERITY_PENALTIES[issue.severity], 0);
  return Math.max(0, 100 - penalty);
}

export async function validateResult(input: ValidateResultInput): Promise<ValidationOutput> {
  const { transformedData, report } = input;

  if (!transformedData) {
    throw ApplicationFailure.create({
      message: 'transformedData is required for validation',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  if (!report) {
    throw ApplicationFailure.create({
      message: 'report is required for validation',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  const issues = [...validateTransformedData(transformedData), ...validateReport(report)];
  const score = calculateScore(issues);
  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    isValid: !hasErrors && score >= 50,
    score,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
