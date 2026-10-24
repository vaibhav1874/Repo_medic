import React from 'react';
import { Hypothesis } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { CheckSquare, AlertTriangle, HelpCircle } from 'lucide-react';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({ hypotheses }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {hypotheses.map((h, idx) => (
        <div key={h.id || idx} className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
                padding: '0.15rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}>
                HYPOTHESIS #{idx + 1}
              </span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {h.title}
              </h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Confidence:</span>
              <StatusBadge status={h.confidence} variant="confidence" />
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
            {h.explanation}
          </p>

          <div style={{
            fontSize: '0.8125rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            marginBottom: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Confidence Rationale: </strong>
            {h.confidenceRationale}
          </div>

          {/* Distinguishing test / check */}
          <div style={{
            padding: '0.625rem 0.875rem',
            backgroundColor: 'var(--color-info-bg)',
            border: '1px solid var(--color-info-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}>
            <HelpCircle size={15} color="var(--color-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-info)' }}>Distinguishing Inspection / Test:</strong>
              <div style={{ color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
                {h.distinguishingCheck}
              </div>
            </div>
          </div>

          {/* Evidence links */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-success)' }}>
              <CheckSquare size={13} />
              <span>Supporting: {h.supportingEvidenceIds.length > 0 ? h.supportingEvidenceIds.join(', ') : 'Direct observation'}</span>
            </div>
            {h.contradictingEvidenceIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-warning)' }}>
                <AlertTriangle size={13} />
                <span>Contradicting: {h.contradictingEvidenceIds.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
