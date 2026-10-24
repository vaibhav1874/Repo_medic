import React, { useState } from 'react';
import { VerificationResult, TestRunResult } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { Terminal, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TestResultTableProps {
  verification: VerificationResult;
}

export const TestResultTable: React.FC<TestResultTableProps> = ({ verification }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'baseline_output' | 'patched_output'>('comparison');

  const renderRunSummary = (title: string, run?: TestRunResult, isBaseline?: boolean) => {
    if (!run) {
      return (
        <div className="card" style={{ padding: '1rem', flex: 1 }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Run not executed.</p>
        </div>
      );
    }

    const isSuccess = run.exitCode === 0 && run.counts.failed === 0;

    return (
      <div className="card" style={{ padding: '1rem', flex: 1, borderTop: `3px solid ${isSuccess ? 'var(--color-success)' : 'var(--color-failure)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h4>
          <StatusBadge status={isSuccess ? 'PASS' : 'FAIL'} variant="outcome" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{run.counts.total}</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-success-bg)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', textTransform: 'uppercase' }}>Passed</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>{run.counts.passed}</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-failure-bg)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-failure)', textTransform: 'uppercase' }}>Failed</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-failure)' }}>{run.counts.failed}</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Skipped</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{run.counts.skipped}</div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div><strong>Command:</strong> <code style={{ color: 'var(--color-text-primary)' }}>{run.command}</code></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span><strong>Exit code:</strong> {run.exitCode}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Clock size={11} /> {run.durationMs}ms
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Outcome banner */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: verification.outcome === 'SUCCESS' ? 'var(--color-success-bg)' : 'var(--color-failure-bg)',
        border: `1px solid ${verification.outcome === 'SUCCESS' ? 'var(--color-success-border)' : 'var(--color-failure-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {verification.outcome === 'SUCCESS' ? (
            <CheckCircle2 size={24} color="var(--color-success)" />
          ) : (
            <XCircle size={24} color="var(--color-failure)" />
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: verification.outcome === 'SUCCESS' ? 'var(--color-success)' : 'var(--color-failure)' }}>
              Deterministic Verification: {verification.outcome}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '0.15rem' }}>
              {verification.comparisonSummary}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Pre-existing: </span>
            <strong>{verification.preExistingFailures}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-success)' }}>Fixed: </span>
            <strong style={{ color: 'var(--color-success)' }}>{verification.fixedFailures}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-failure)' }}>Regressions: </span>
            <strong style={{ color: 'var(--color-failure)' }}>{verification.newFailures}</strong>
          </div>
        </div>
      </div>

      {/* Side-by-side run cards */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {renderRunSummary('Baseline Run (Pre-Patch)', verification.baseline, true)}
        {renderRunSummary('Patched Run (Post-Patch)', verification.patched, false)}
      </div>

      {/* Output Tabs */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '0.25rem 0.5rem',
          gap: '0.5rem',
        }}>
          <button
            className={activeTab === 'comparison' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('comparison')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            Output Summary
          </button>
          <button
            className={activeTab === 'baseline_output' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('baseline_output')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <Terminal size={12} /> Baseline Raw Stdout
          </button>
          <button
            className={activeTab === 'patched_output' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('patched_output')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <Terminal size={12} /> Patched Raw Stdout
          </button>
        </div>

        <div style={{ padding: '1rem', backgroundColor: '#1A1D20', color: '#ECEFF1', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', overflowX: 'auto', maxHeight: '350px' }}>
          {activeTab === 'comparison' && (
            <div>
              <div style={{ color: '#81C784', marginBottom: '0.5rem' }}>// Deterministic Execution Log Comparison</div>
              <div style={{ color: '#B0BEC5' }}>Baseline Exit Code: {verification.baseline?.exitCode ?? 'N/A'} (Pre-Patch)</div>
              <div style={{ color: '#B0BEC5' }}>Patched Exit Code:  {verification.patched?.exitCode ?? 'N/A'} (Post-Patch)</div>
              <div style={{ marginTop: '0.75rem', color: '#FFF' }}>
                {verification.patched?.stdout || verification.patched?.stderr || 'No execution stdout.'}
              </div>
            </div>
          )}

          {activeTab === 'baseline_output' && (
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {verification.baseline?.stdout || verification.baseline?.stderr || 'No output recorded for baseline.'}
            </pre>
          )}

          {activeTab === 'patched_output' && (
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {verification.patched?.stdout || verification.patched?.stderr || 'No output recorded for patched run.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
