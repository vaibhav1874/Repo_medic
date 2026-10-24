import React, { useState } from 'react';
import { PatchProposal } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface DiffViewerProps {
  patch: PatchProposal;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patch }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffLines = patch.unifiedDiff.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header and metadata */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {patch.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {patch.summary}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Risk Level:</span>
              <StatusBadge status={patch.riskLevel} variant="risk" />
            </div>
            <button className="btn-secondary" onClick={handleCopy} style={{ fontSize: '0.75rem' }}>
              {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
              {copied ? 'Copied Diff' : 'Copy Diff'}
            </button>
          </div>
        </div>

        {/* Hunk annotations */}
        {patch.hunks.map((hunk, idx) => (
          <div
            key={idx}
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Target: {hunk.file}:{hunk.startLine}-{hunk.endLine}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Hunk #{idx + 1}
              </span>
            </div>
            <div style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              <strong>Necessity: </strong> {hunk.reason}
            </div>
            <div style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={12} color="var(--color-warning)" />
              <span><strong>Side effects: </strong> {hunk.potentialSideEffects || 'None'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Diff Box */}
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8125rem',
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          fontWeight: 600,
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Unified Patch Diff
        </div>

        <div style={{ overflowX: 'auto', padding: '0.5rem 0', maxHeight: '450px' }}>
          {diffLines.map((line, idx) => {
            let bg = 'transparent';
            let color = 'var(--color-text-primary)';

            if (line.startsWith('+') && !line.startsWith('+++')) {
              bg = 'rgba(61, 122, 90, 0.12)';
              color = '#256041';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              bg = 'rgba(155, 44, 44, 0.12)';
              color = '#8A2424';
            } else if (line.startsWith('@@')) {
              bg = 'var(--color-bg-secondary)';
              color = 'var(--color-info)';
            } else if (line.startsWith('---') || line.startsWith('+++')) {
              color = 'var(--color-text-secondary)';
              bg = 'var(--color-bg-page)';
            }

            return (
              <div
                key={idx}
                style={{
                  padding: '0.125rem 1rem',
                  backgroundColor: bg,
                  color,
                  whiteSpace: 'pre',
                  lineHeight: '1.5',
                }}
              >
                {line || ' '}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
