'use client';

import type { WorkflowStep, StepResult } from '@/lib/types';

interface WorkflowStatusProps {
  workflowId: string;
  currentStep: WorkflowStep;
  completedSteps: StepResult[];
  error?: string;
}

const STEP_ORDER: WorkflowStep[] = ['parsing', 'searching', 'transforming', 'generating', 'validating'];

const STEP_LABELS: Record<WorkflowStep, string> = {
  pending: 'Pending',
  parsing: 'Parsing Task',
  searching: 'Searching',
  transforming: 'Transforming Data',
  generating: 'Generating Report',
  validating: 'Validating',
  complete: 'Complete',
  failed: 'Failed',
};

type StepStatus = 'completed' | 'current' | 'pending' | 'error';

function getStepStatus(step: WorkflowStep, currentStep: WorkflowStep, completedSteps: StepResult[]): StepStatus {
  const stepResult = completedSteps.find((s) => s.step === step);
  if (stepResult?.error) return 'error';
  if (stepResult && !stepResult.error) return 'completed';
  if (step === currentStep) return 'current';
  return 'pending';
}

function StepIndicator({ status }: { status: StepStatus }) {
  const base: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  };

  const configs: Record<StepStatus, { style: React.CSSProperties; content: string }> = {
    completed: { style: { ...base, background: 'var(--success)', color: 'white' }, content: '✓' },
    current: { style: { ...base, background: 'var(--primary)', color: 'white', animation: 'pulse 1.5s ease-in-out infinite' }, content: '●' },
    error: { style: { ...base, background: 'var(--error)', color: 'white' }, content: '✕' },
    pending: { style: { ...base, background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)' }, content: '○' },
  };

  const { style, content } = configs[status];
  return (
    <div style={style}>
      {status === 'current' && <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>}
      {content}
    </div>
  );
}

const STATUS_COLORS: Record<StepStatus, string> = {
  current: 'var(--primary)',
  completed: 'var(--success)',
  error: 'var(--error)',
  pending: 'var(--muted)',
};

export function WorkflowStatus({ workflowId, currentStep, completedSteps, error }: WorkflowStatusProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Workflow Progress</h3>
        <code style={styles.workflowId}>{workflowId}</code>
      </div>

      <div style={styles.steps}>
        {STEP_ORDER.map((step, index) => {
          const status = getStepStatus(step, currentStep, completedSteps);
          const stepResult = completedSteps.find((s) => s.step === step);

          return (
            <div key={step} style={styles.step}>
              <div style={styles.stepIndicatorWrapper}>
                <StepIndicator status={status} />
                {index < STEP_ORDER.length - 1 && (
                  <div style={{ ...styles.connector, background: status === 'completed' ? 'var(--success)' : 'var(--border)' }} />
                )}
              </div>
              <div style={styles.stepContent}>
                <span style={{ ...styles.stepLabel, color: STATUS_COLORS[status], fontWeight: status === 'current' ? 600 : 400 }}>
                  {STEP_LABELS[step]}
                </span>
                {stepResult?.durationMs && <span style={styles.duration}>{stepResult.durationMs}ms</span>}
                {stepResult?.error && <span style={styles.stepError}>{stepResult.error}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {currentStep === 'complete' && (
        <div style={styles.statusBadge}>
          <span style={{ ...styles.badge, background: 'var(--success)' }}>Complete</span>
        </div>
      )}

      {currentStep === 'failed' && error && (
        <div style={styles.errorBox}><strong>Error:</strong> {error}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' },
  title: { fontSize: '16px', fontWeight: 600, margin: 0 },
  workflowId: { fontSize: '12px', color: 'var(--muted)', background: 'var(--background)', padding: '4px 8px', borderRadius: '4px' },
  steps: { display: 'flex', flexDirection: 'column', gap: '0' },
  step: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  stepIndicatorWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  connector: { width: '2px', height: '24px', marginTop: '4px', marginBottom: '4px' },
  stepContent: { display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '16px' },
  stepLabel: { fontSize: '14px' },
  duration: { fontSize: '12px', color: 'var(--muted)' },
  stepError: { fontSize: '12px', color: 'var(--error)' },
  statusBadge: { marginTop: '16px' },
  badge: { display: 'inline-block', padding: '6px 12px', borderRadius: '16px', color: 'white', fontSize: '14px', fontWeight: 600 },
  errorBox: { marginTop: '16px', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', color: 'var(--error)', fontSize: '14px' },
};
