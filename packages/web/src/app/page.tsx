'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { WorkflowStatus } from '@/components/WorkflowStatus';
import { ResultDisplay } from '@/components/ResultDisplay';
import type { TaskOptions, StartWorkflowResponse, WorkflowStatusResponse, TaskResult } from '@/lib/types';

const POLL_INTERVAL_MS = 2000;

export default function Home() {
  const [isStarting, setIsStarting] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkflowStatusResponse | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workflow/${id}/status`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to get status');
        return false;
      }

      setStatus(data);

      if (data.currentStep === 'complete' || data.currentStep === 'failed') {
        if (data.result) setResult(data.result);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to poll status');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!workflowId) return;

    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;
      const shouldContinue = await pollStatus(workflowId);
      if (shouldContinue && isPolling) setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => { isPolling = false; };
  }, [workflowId, pollStatus]);

  const handleSubmit = async (query: string, options: TaskOptions) => {
    setIsStarting(true);
    setError(null);
    setStatus(null);
    setResult(null);
    setWorkflowId(null);

    try {
      const response = await fetch('/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, options }),
      });

      const data: StartWorkflowResponse = await response.json();
      if (!response.ok) throw new Error((data as unknown as { error: string }).error || 'Failed to start workflow');
      setWorkflowId(data.workflowId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    } finally {
      setIsStarting(false);
    }
  };

  const handleReset = () => {
    setWorkflowId(null);
    setStatus(null);
    setResult(null);
    setError(null);
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Workflow Agent</h1>
          <p style={styles.subtitle}>A Temporal-backed research agent that searches, transforms, and reports</p>
        </header>

        {error && (
          <div style={styles.errorBanner}>
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} style={styles.dismissButton}>Dismiss</button>
          </div>
        )}

        {!workflowId && (
          <section style={styles.section}>
            <TaskForm onSubmit={handleSubmit} isLoading={isStarting} />
          </section>
        )}

        {workflowId && status && (
          <section style={styles.section}>
            <WorkflowStatus workflowId={workflowId} currentStep={status.currentStep} completedSteps={status.completedSteps} error={status.error} />
          </section>
        )}

        {result && (
          <section style={styles.section}>
            <ResultDisplay result={result} />
          </section>
        )}

        {(workflowId || result) && (
          <button onClick={handleReset} style={styles.resetButton}>Start New Research</button>
        )}

        <footer style={styles.footer}>
          <p>Powered by <a href="https://temporal.io" target="_blank" rel="noopener noreferrer" style={styles.link}>Temporal</a></p>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight: '100vh', padding: '40px 20px', background: 'var(--background)' },
  container: { maxWidth: '800px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '40px' },
  title: { fontSize: '36px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' },
  subtitle: { fontSize: '18px', color: 'var(--muted)', margin: 0 },
  section: { marginBottom: '24px' },
  errorBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', color: 'var(--error)', fontSize: '14px', marginBottom: '24px' },
  dismissButton: { padding: '4px 12px', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '4px', fontSize: '12px' },
  resetButton: { display: 'block', width: '100%', padding: '14px 24px', background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', fontSize: '16px', fontWeight: 600, borderRadius: '8px', marginTop: '24px' },
  footer: { textAlign: 'center', marginTop: '60px', paddingTop: '24px', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: '14px' },
  link: { color: 'var(--primary)', textDecoration: 'none' },
};
