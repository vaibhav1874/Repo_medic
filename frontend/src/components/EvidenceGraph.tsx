import React from 'react';
import { EvidenceItem } from '../lib/types';
import { FileCheck, Sparkles, AlertCircle } from 'lucide-react';

interface EvidenceGraphProps {
  evidence: EvidenceItem[];
  onSelectEvidence?: (file: string, startLine: number, endLine: number) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ evidence, onSelectEvidence }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {evidence.map((item, idx) => {
        let typeBadge = (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <FileCheck size={11} /> Observed Fact
          </span>
        );

        if (item.type === 'model_hypothesis') {
          typeBadge = (
            <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={11} /> Model Hypothesis
            </span>
          );
        } else if (item.type === 'static_analysis_finding') {
          typeBadge = (
            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={11} /> Static Finding
            </span>
          );
        }

        return (
          <div
            key={item.id || idx}
            className="card"
            style={{
              padding: '1rem',
              borderLeft: '3px solid var(--color-action)',
              cursor: onSelectEvidence ? 'pointer' : 'default',
            }}
            onClick={() => onSelectEvidence && onSelectEvidence(item.file, item.startLine, item.endLine)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                  #{item.id}
                </span>
                {typeBadge}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-action)' }}>
                {item.file}:{item.startLine}-{item.endLine}
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              {item.description}
            </p>

            <pre style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              overflowX: 'auto',
              color: 'var(--color-text-primary)'
            }}>
              <code>{item.snippet}</code>
            </pre>
          </div>
        );
      })}
    </div>
  );
};
