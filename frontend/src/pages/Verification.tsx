import React, { useState } from 'react';
import { SessionDetail } from '../lib/types';
import { TestResultTable } from '../components/TestResultTable';
import { verifyPatch } from '../lib/api';
import { Play, ShieldAlert, ArrowRight, Download, FileText } from 'lucide-react';

interface VerificationProps {
  session: SessionDetail;
  onVerificationComplete: () => void;
  onNavigateToHistory: () => void;
}

export const Verification: React.FC<VerificationProps> = ({
  session,
  onVerificationComplete,
  onNavigateToHistory,
}) => {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunVerification = async () => {
    setRunning(true);
    setError(null);
    try {
      await verifyPatch(session.id);
      onVerificationComplete();
    } catch (err: any) {
      setError(err.message || 'Verification run failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Header controls */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Deterministic Test Verification
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Proves what actually passed by executing real tests before and after the patch in an isolated temporary workspace.
            </p>
          </div>

          <div>
            {!session.patchApproved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
                <ShieldAlert size={16} />
                <span>Requires Patch Approval First</span>
              </div>
            ) : (
              <button
                className="btn-primary"
                onClick={handleRunVerification}
                disabled={running}
                style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
              >
                <Play size={14} />
                <span>{running ? 'Executing Tests...' : session.verification ? 'Re-run Verification' : 'Run Verification Now'}</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-failure-bg)',
            border: '1px solid var(--color-failure-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-failure)',
            fontSize: '0.8125rem',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Verification results display */}
      {session.verification ? (
        <>
          <TestResultTable verification={session.verification} />

          {/* Next steps action bar */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Audit Report Available</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Download comprehensive Markdown or JSON reports with all evidence, diffs, and verification metrics.
              </div>
            </div>
            <button className="btn-primary" onClick={onNavigateToHistory} style={{ fontSize: '0.8125rem' }}>
              <FileText size={14} />
              <span>View Audit Report & History</span>
            </button>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Click <strong>"Run Verification Now"</strong> above to launch the test suite before and after applying the patch.
          </p>
        </div>
      )}
    </div>
  );
};
