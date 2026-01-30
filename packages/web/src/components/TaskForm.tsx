'use client';

import { useState } from 'react';
import type { TaskOptions } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (query: string, options: TaskOptions) => Promise<void>;
  isLoading: boolean;
}

export function TaskForm({ onSubmit, isLoading }: TaskFormProps) {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const canSubmit = query.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit(query, { maxSearchResults: maxResults, includeDetailedAnalysis });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <label htmlFor="query" style={styles.label}>Research Query</label>
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your research query, e.g., 'Latest trends in AI'"
          disabled={isLoading}
          style={styles.textarea}
          rows={3}
        />
      </div>

      <button type="button" onClick={() => setShowOptions(!showOptions)} style={styles.optionsToggle}>
        {showOptions ? 'Hide Options' : 'Show Options'}
      </button>

      {showOptions && (
        <div style={styles.optionsPanel}>
          <div style={styles.inputGroup}>
            <label htmlFor="maxResults" style={styles.label}>Max Search Results: {maxResults}</label>
            <input
              type="range"
              id="maxResults"
              min="1"
              max="10"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={isLoading}
              style={styles.range}
            />
          </div>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="detailedAnalysis"
              checked={includeDetailedAnalysis}
              onChange={(e) => setIncludeDetailedAnalysis(e.target.checked)}
              disabled={isLoading}
              style={styles.checkbox}
            />
            <label htmlFor="detailedAnalysis" style={styles.checkboxLabel}>Include Detailed Analysis</label>
          </div>
        </div>
      )}

      <button type="submit" disabled={!canSubmit} style={{ ...styles.submitButton, opacity: canSubmit ? 1 : 0.6 }}>
        {isLoading ? 'Starting...' : 'Start Research'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '16px',
    resize: 'vertical',
    minHeight: '80px',
  },
  optionsToggle: {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    background: 'transparent',
    color: 'var(--primary)',
    fontSize: '14px',
    fontWeight: 500,
  },
  optionsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    background: 'var(--card-bg)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  range: { width: '100%', accentColor: 'var(--primary)' },
  checkboxGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  checkbox: { width: '18px', height: '18px', accentColor: 'var(--primary)' },
  checkboxLabel: { fontSize: '14px', color: 'var(--foreground)' },
  submitButton: {
    padding: '14px 24px',
    background: 'var(--primary)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
};
