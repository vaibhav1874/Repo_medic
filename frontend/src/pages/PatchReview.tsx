import React, { useState } from 'react';
import { SessionDetail } from '../lib/types';
import { DiffViewer } from '../components/DiffViewer';
import { approvePatch } from '../lib/api';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PatchReviewProps {
  session: SessionDetail;
  onPatchApproved: () => void;
  onNavigateToVerification: () => void;
}

export const PatchReview: React.FC<PatchReviewProps> = ({
  session,
  onPatchApproved,
  onNavigateToVerification,
}) => {
  const [approving, setApproving] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = session.patchProposal;

  if (!patch) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>No patch proposal generated for this session.</p>
      </div>
    );
  }

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      await approvePatch(session.id);
      setShowApprovalModal(false);
      onPatchApproved();
    } catch (err: any) {
      setError(err.message || 'Failed to approve patch.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Approval Status Banner */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: session.patchApproved ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
        border: `1px solid ${session.patchApproved ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {session.patchApproved ? (
            <CheckCircle2 size={18} color="var(--color-success)" />
          ) : (
            <ShieldCheck size={18} color="var(--color-warning)" />
          )}
          <div>
            <span style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: session.patchApproved ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
              {session.patchApproved
                ? 'Patch Approved by Human Reviewer'
                : 'Human Review & Approval Required'}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
              {session.patchApproved
                ? 'This patch is authorized to be applied in an isolated workspace for deterministic verification.'
                : 'RepoMedic will not modify any workspace files without deliberate human confirmation.'}
            </div>
          </div>
        </div>

        <div>
          {session.patchApproved ? (
            <button className="btn-primary" onClick={onNavigateToVerification} style={{ fontSize: '0.8125rem' }}>
              <span>Run Verification</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn-success" onClick={() => setShowApprovalModal(true)} style={{ fontSize: '0.8125rem' }}>
              <ShieldCheck size={14} />
              <span>Approve Patch</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-failure-bg)',
          border: '1px solid var(--color-failure-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-failure)',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Unified Diff Viewer */}
      <DiffViewer patch={patch} />

      {/* Regression test section */}
      {patch.regressionTest && (
        <div className="card" style={{ marginTop: '1.25rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Targeted Regression Test
            </h4>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {patch.regressionTest.file}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            {patch.regressionTest.description}
          </p>

          <pre style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--color-text-primary)',
            overflowX: 'auto',
          }}>
            <code>{patch.regressionTest.testCode}</code>
          </pre>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-action)', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Confirm Patch Approval</h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              You are authorizing RepoMedic AI to apply this patch to a <strong>separate isolated temporary workspace</strong>.
            </p>

            <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>The original uploaded repository is NEVER modified.</li>
              <li>Verification will run the existing test suite in an isolated sandbox.</li>
              <li>You can download or export the full diff and audit report at any time.</li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowApprovalModal(false)} disabled={approving}>
                Cancel
              </button>
              <button className="btn-success" onClick={handleApprove} disabled={approving}>
                {approving ? 'Approving...' : 'Confirm Approval & Authorize Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
