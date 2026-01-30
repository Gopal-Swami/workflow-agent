/**
 * Web Search Activity - Simulates external search API calls.
 * In production, replace with real search API (Google, Bing, etc.)
 */

import { ApplicationFailure } from '@temporalio/common';
import type { WebSearchInput, WebSearchOutput, SearchResult } from '../shared/types.js';

const MOCK_FAILURE_RATE = 0.1;
const DELAY_RANGE = { min: 200, max: 800 };

const TOPICS = [
  'latest developments',
  'comprehensive guide',
  'expert analysis',
  'industry trends',
  'research findings',
  'case studies',
  'best practices',
  'future outlook',
];

const SOURCES = [
  'techcrunch.com',
  'wired.com',
  'nature.com',
  'arxiv.org',
  'medium.com',
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockResults(query: string, maxResults: number): SearchResult[] {
  const count = Math.min(maxResults, TOPICS.length);
  return Array.from({ length: count }, (_, i) => ({
    title: `${query}: ${TOPICS[i].charAt(0).toUpperCase() + TOPICS[i].slice(1)}`,
    snippet: `Discover the ${TOPICS[i]} in ${query}. This comprehensive resource covers key aspects and provides actionable insights for practitioners and researchers alike.`,
    url: `https://${SOURCES[i % SOURCES.length]}/article/${query.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
    relevanceScore: 0.95 - i * 0.08,
  }));
}

export async function webSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  const { query, maxResults } = input;

  if (!query?.trim()) {
    throw ApplicationFailure.create({
      message: 'Search query cannot be empty',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  if (maxResults < 1 || maxResults > 100) {
    throw ApplicationFailure.create({
      message: 'maxResults must be between 1 and 100',
      type: 'ValidationError',
      nonRetryable: true,
    });
  }

  await delay(DELAY_RANGE.min + Math.random() * (DELAY_RANGE.max - DELAY_RANGE.min));

  if (Math.random() < MOCK_FAILURE_RATE) {
    throw ApplicationFailure.create({
      message: 'Search service temporarily unavailable',
      type: 'ServiceUnavailableError',
      nonRetryable: false,
    });
  }

  const results = generateMockResults(query, maxResults);

  return {
    results,
    metadata: {
      source: 'mock-search-api',
      timestamp: new Date().toISOString(),
      totalResults: results.length,
    },
  };
}
