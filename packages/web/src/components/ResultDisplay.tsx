'use client';

import type { TaskResult, ValidationIssue } from '@/lib/types';

const SEVERITY_COLORS: Record<ValidationIssue['severity'], { bg: string; text: string }> = {
  error: { bg: 'var(--error)', text: 'white' },
  warning: { bg: 'var(--warning)', text: 'black' },
  info: { bg: 'var(--primary)', text: 'white' },
};

function SeverityBadge({ severity }: { severity: ValidationIssue['severity'] }) {
  const { bg, text } = SEVERITY_COLORS[severity];
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color: text, textTransform: 'uppercase' }}>
      {severity}
    </span>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--error)';
}

export function ResultDisplay({ result }: { result: TaskResult }) {
  const { report, validation, partial } = result;

  return (
    <div style={styles.container}>
      {partial && (
        <div style={styles.partialWarning}>This result is partial. Some steps failed during execution.</div>
      )}

      <div style={styles.section}>
        <h2 style={styles.reportTitle}>{report.title}</h2>
        <p style={styles.timestamp}>Generated: {new Date(report.generatedAt).toLocaleString()}</p>

        <div style={styles.summary}>
          <h3 style={styles.sectionHeading}>Executive Summary</h3>
          <p style={styles.summaryText}>{report.executiveSummary}</p>
        </div>

        {report.sections.map((section, index) => (
          <div key={index} style={styles.reportSection}>
            <h3 style={styles.sectionHeading}>{section.heading}</h3>
            <div style={styles.sectionContent}>
              {section.content.split('\n').map((line, i) => (
                <p key={i} style={styles.paragraph}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        <div style={styles.conclusion}>
          <h3 style={styles.sectionHeading}>Conclusion</h3>
          <p style={styles.summaryText}>{report.conclusion}</p>
        </div>
      </div>

      <div style={styles.validationSection}>
        <div style={styles.validationHeader}>
          <h3 style={styles.validationTitle}>Quality Validation</h3>
          <div style={styles.scoreContainer}>
            <span style={{ ...styles.score, color: getScoreColor(validation.score) }}>{validation.score}</span>
            <span style={styles.scoreLabel}>/ 100</span>
          </div>
        </div>

        <div style={styles.validationStatus}>
          <span style={{ ...styles.statusBadge, background: validation.isValid ? 'var(--success)' : 'var(--error)' }}>
            {validation.isValid ? 'Valid' : 'Invalid'}
          </span>
          <span style={styles.checkedAt}>Checked: {new Date(validation.checkedAt).toLocaleString()}</span>
        </div>

        {validation.issues.length > 0 && (
          <div style={styles.issuesList}>
            <h4 style={styles.issuesTitle}>Issues Found ({validation.issues.length})</h4>
            {validation.issues.map((issue, index) => (
              <div key={index} style={styles.issue}>
                <SeverityBadge severity={issue.severity} />
                <span style={styles.issueMessage}>{issue.message}</span>
                {issue.location && <code style={styles.issueLocation}>{issue.location}</code>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  partialWarning: { padding: '12px 16px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', color: 'var(--warning)', fontSize: '14px', fontWeight: 500 },
  section: { padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' },
  reportTitle: { fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--foreground)' },
  timestamp: { fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' },
  summary: { marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' },
  sectionHeading: { fontSize: '18px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--foreground)' },
  summaryText: { fontSize: '15px', lineHeight: 1.6, color: 'var(--foreground)', margin: 0 },
  reportSection: { marginBottom: '20px' },
  sectionContent: { paddingLeft: '16px', borderLeft: '2px solid var(--border)' },
  paragraph: { fontSize: '15px', lineHeight: 1.6, color: 'var(--foreground)', margin: '0 0 8px 0' },
  conclusion: { marginTop: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', borderLeft: '4px solid var(--success)' },
  validationSection: { padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' },
  validationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  validationTitle: { fontSize: '18px', fontWeight: 600, margin: 0 },
  scoreContainer: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  score: { fontSize: '32px', fontWeight: 700 },
  scoreLabel: { fontSize: '16px', color: 'var(--muted)' },
  validationStatus: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  statusBadge: { display: 'inline-block', padding: '6px 12px', borderRadius: '16px', color: 'white', fontSize: '14px', fontWeight: 600 },
  checkedAt: { fontSize: '14px', color: 'var(--muted)' },
  issuesList: { marginTop: '16px' },
  issuesTitle: { fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--foreground)' },
  issue: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--background)', borderRadius: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  issueMessage: { fontSize: '14px', color: 'var(--foreground)', flex: 1 },
  issueLocation: { fontSize: '12px', color: 'var(--muted)', background: 'var(--card-bg)', padding: '2px 6px', borderRadius: '4px' },
};
