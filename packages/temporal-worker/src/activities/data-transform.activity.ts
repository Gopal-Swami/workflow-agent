/**
 * Data Transform Activity - Processes search results into structured insights.
 * In production, replace with NLP/LLM-based extraction.
 */

import { ApplicationFailure } from '@temporalio/common';
import type {
  DataTransformInput,
  DataTransformOutput,
  TransformedData,
  SearchResult,
} from '../shared/types.js';

const PROCESSING_DELAY_MS = 300;

function extractInsights(results: SearchResult[]): string[] {
  return results.slice(0, 5).map((result, i) => {
    const insight = result.snippet.split('.')[0];
    return `Insight ${i + 1}: ${insight}.`;
  });
}

function categorizeResults(results: SearchResult[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    'High Relevance': [],
    'Medium Relevance': [],
    'Supporting Information': [],
  };

  for (const result of results) {
    const category =
      result.relevanceScore >= 0.8
        ? 'High Relevance'
        : result.relevanceScore >= 0.5
        ? 'Medium Relevance'
        : 'Supporting Information';
    categories[category].push(result.title);
  }

  return categories;
}

function generateSummary(results: SearchResult[]): string {
  if (results.length === 0) return 'No results available for summarization.';
  const snippets = results.slice(0, 3).map((r) => r.snippet);
  return `Based on ${results.length} sources: ${snippets.join(' ')}`;
}

function extractSources(results: SearchResult[]): string[] {
  return results.map((r) => r.url);
}

export async function dataTransform(input: DataTransformInput): Promise<DataTransformOutput> {
  const { searchResults, transformationType } = input;

  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    throw ApplicationFailure.create({
      message: 'searchResults must be a non-empty array',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));

  const sources = extractSources(searchResults);
  const summary = generateSummary(searchResults);

  let transformedData: TransformedData;
  switch (transformationType) {
    case 'summarize':
      transformedData = { insights: [summary], categories: {}, summary, sources };
      break;
    case 'extract_facts':
      transformedData = { insights: extractInsights(searchResults), categories: {}, summary, sources };
      break;
    case 'categorize':
    default:
      transformedData = {
        insights: extractInsights(searchResults),
        categories: categorizeResults(searchResults),
        summary,
        sources,
      };
  }

  return {
    data: transformedData,
    metadata: { itemsProcessed: searchResults.length, transformationType },
  };
}
