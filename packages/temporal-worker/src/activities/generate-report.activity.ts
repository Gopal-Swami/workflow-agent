/**
 * Generate Report Activity - Creates structured reports from transformed data.
 * In production, replace with actual LLM API call.
 */

import { ApplicationFailure } from '@temporalio/common';
import type {
  GenerateReportInput,
  ReportOutput,
  ReportSection,
  TransformedData,
} from '../shared/types.js';

const MOCK_FAILURE_RATE = 0.05;
const DELAY_RANGE = { min: 500, max: 1500 };

function generateExecutiveSummary(data: TransformedData, query: string): string {
  return `This report provides a comprehensive analysis of "${query}" based on ${data.sources.length} authoritative sources. Key findings include ${data.insights.length} distinct insights that highlight current trends, challenges, and opportunities in this domain. ${data.summary}`;
}

function generateSections(data: TransformedData, includeDetailedAnalysis: boolean): ReportSection[] {
  const sections: ReportSection[] = [];

  if (data.insights.length > 0) {
    sections.push({
      heading: 'Key Insights',
      content: data.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n'),
    });
  }

  if (Object.keys(data.categories).length > 0) {
    const categoryContent = Object.entries(data.categories)
      .filter(([, items]) => items.length > 0)
      .map(([category, items]) => `### ${category}\n${items.map((item) => `- ${item}`).join('\n')}`)
      .join('\n\n');

    if (categoryContent) {
      sections.push({ heading: 'Categorized Findings', content: categoryContent });
    }
  }

  if (includeDetailedAnalysis) {
    sections.push({
      heading: 'Detailed Analysis',
      content: 'A deeper examination of the data reveals several important patterns. The sources span multiple domains, providing a well-rounded perspective on the topic. Cross-referencing the insights shows strong consensus on core findings, with some areas of ongoing debate that merit further investigation.',
    });

    sections.push({
      heading: 'Methodology',
      content: `This analysis was conducted using the following methodology:\n1. Aggregated data from ${data.sources.length} sources\n2. Extracted key insights using semantic analysis\n3. Categorized findings by relevance and topic\n4. Synthesized conclusions based on cross-referenced data`,
    });
  }

  sections.push({
    heading: 'Sources',
    content: data.sources.map((source, i) => `${i + 1}. ${source}`).join('\n'),
  });

  return sections;
}

function generateConclusion(data: TransformedData, query: string): string {
  return `In conclusion, the research on "${query}" reveals a dynamic and evolving landscape. The ${data.insights.length} key insights identified provide actionable guidance for stakeholders. Further monitoring of developments in this space is recommended to stay current with emerging trends.`;
}

export async function generateReport(input: GenerateReportInput): Promise<ReportOutput> {
  const { transformedData, query, includeDetailedAnalysis } = input;

  if (!transformedData) {
    throw ApplicationFailure.create({
      message: 'transformedData is required',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  if (!query?.trim()) {
    throw ApplicationFailure.create({
      message: 'query is required for report generation',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  const delay = DELAY_RANGE.min + Math.random() * (DELAY_RANGE.max - DELAY_RANGE.min);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < MOCK_FAILURE_RATE) {
    throw ApplicationFailure.create({
      message: 'Report generation service temporarily unavailable',
      type: 'ServiceUnavailableError',
      nonRetryable: false,
    });
  }

  return {
    title: `Research Report: ${query}`,
    executiveSummary: generateExecutiveSummary(transformedData, query),
    sections: generateSections(transformedData, includeDetailedAnalysis),
    conclusion: generateConclusion(transformedData, query),
    generatedAt: new Date().toISOString(),
  };
}
