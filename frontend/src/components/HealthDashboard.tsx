import React from 'react';
import { Files, ShieldAlert, CheckCircle, Code } from 'lucide-react';

interface HealthDashboardProps {
  metrics: {
    totalFiles: number;
    languages: Record<string, number>;
    findingsBySeverity: Record<string, number>;
    hasTests: boolean;
    secretsDetectedCount: number;
  };
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ metrics }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1.25rem',
    }}>
      {/* Total files */}
      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-action)',
        }}>
          <Files size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Source Files
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {metrics.totalFiles}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-action)',
        }}>
          <Code size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Primary Stack
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {Object.keys(metrics.languages).slice(0, 2).join(', ') || 'Mixed'}
          </div>
        </div>
      </div>

      {/* Static findings */}
      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: (metrics.findingsBySeverity['high'] || 0) > 0 ? 'var(--color-failure-bg)' : 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: (metrics.findingsBySeverity['high'] || 0) > 0 ? 'var(--color-failure)' : 'var(--color-action)',
        }}>
          <ShieldAlert size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Static Findings
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (metrics.findingsBySeverity['high'] || 0) > 0 ? 'var(--color-failure)' : 'var(--color-text-primary)' }}>
            {Object.values(metrics.findingsBySeverity).reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>

      {/* Tests detected */}
      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: metrics.hasTests ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: metrics.hasTests ? 'var(--color-success)' : 'var(--color-warning)',
        }}>
          <CheckCircle size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Test Suite
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: metrics.hasTests ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {metrics.hasTests ? 'Detected' : 'No tests found'}
          </div>
        </div>
      </div>
    </div>
  );
};
