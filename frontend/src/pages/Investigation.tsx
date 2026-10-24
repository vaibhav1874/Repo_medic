import React from 'react';
import { SessionDetail } from '../lib/types';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { HypothesisPanel } from '../components/HypothesisPanel';
import { Cpu, ArrowRight } from 'lucide-react';

interface InvestigationProps {
  session: SessionDetail;
  onNavigateToPatch: () => void;
}

export const Investigation: React.FC<InvestigationProps> = ({ session, onNavigateToPatch }) => {
  const diagnosis = session.diagnosis;

  if (!diagnosis) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>No diagnosis generated for this session yet.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Executive Root Cause Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-action)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-action)', marginBottom: '0.5rem' }}>
          <Cpu size={18} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Inference Root Cause Diagnosis
          </span>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          {diagnosis.primaryRootCause}
        </h2>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {diagnosis.summary}
        </p>

        <div style={{
          marginTop: '1rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8125rem',
        }}>
          <strong>Identified Symptom:</strong> {diagnosis.symptomIdentified}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left column: Competing Hypotheses */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Competing Root-Cause Hypotheses ({diagnosis.hypotheses.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Ranked by causal likelihood
            </span>
          </div>

          <HypothesisPanel hypotheses={diagnosis.hypotheses} />
        </div>

        {/* Right column: Evidence Graph */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Concrete Evidence Items ({diagnosis.evidence.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Strict source citations
            </span>
          </div>

          <EvidenceGraph evidence={diagnosis.evidence} />
        </div>
      </div>

      {/* Footer action bar */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Ready to review the proposed repair?</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Examine the unified diff, review potential side effects, and approve the patch.
          </div>
        </div>
        <button className="btn-primary" onClick={onNavigateToPatch}>
          <span>Review Proposed Patch</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
