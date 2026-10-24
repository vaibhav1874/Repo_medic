import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Finding } from '../lib/types';
import { ExternalLink } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onSelect: (filePath: string, line: number) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onSelect }) => {
  return (
    <div
      className="card"
      style={{
        padding: '0.875rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
      }}
      onClick={() => onSelect(finding.file, finding.line)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge status={finding.severity} variant="severity" />
          <span style={{
            fontSize: '0.6875rem',
            padding: '0.15rem 0.4rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
          }}>
            {finding.category.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-action)', fontFamily: 'var(--font-mono)' }}>
          <span>{finding.file}:{finding.line}</span>
          <ExternalLink size={11} />
        </div>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: finding.snippet ? '0.5rem' : 0 }}>
        {finding.message}
      </p>

      {finding.snippet && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.375rem 0.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
        }}>
          {finding.snippet}
        </div>
      )}
    </div>
  );
};
