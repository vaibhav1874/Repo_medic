import React, { useState, useEffect } from 'react';
import { SessionDetail } from '../lib/types';
import { listSessions, getReportDownloadUrl } from '../lib/api';
import { Download, FileText, Calendar, GitBranch, CheckCircle, XCircle } from 'lucide-react';

interface HistoryProps {
  currentSession?: SessionDetail;
  onSelectSession: (sessionId: string) => void;
}

export const History: React.FC<HistoryProps> = ({ currentSession, onSelectSession }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Current Session Export Card */}
      {currentSession && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderLeft: '4px solid var(--color-action)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Session Report
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {currentSession.repoIdentifier}
              </h2>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                ID: <code style={{ color: 'var(--color-text-primary)' }}>{currentSession.id}</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={getReportDownloadUrl(currentSession.id, 'md')}
                download
                className="btn-primary"
                style={{ textDecoration: 'none', fontSize: '0.8125rem' }}
              >
                <Download size={14} />
                <span>Download Report (.md)</span>
              </a>
              <a
                href={getReportDownloadUrl(currentSession.id, 'json')}
                download
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: '0.8125rem' }}
              >
                <Download size={14} />
                <span>Export JSON (.json)</span>
              </a>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
          }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Patch Status</span>
              <strong>{currentSession.patchApproved ? 'Approved by Human' : 'Pending Approval'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Verification</span>
              <strong>{currentSession.verification?.outcome || 'Not Run'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Static Findings</span>
              <strong>{currentSession.staticFindings.length} issue(s)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Source Files</span>
              <strong>{currentSession.files.length} inspected</strong>
            </div>
          </div>
        </div>
      )}

      {/* Historical Sessions List */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
          Session History & Past Audits
        </h3>

        {loading ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Loading history...</p>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No previous sessions recorded. Run an analysis to see records here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                      {s.repoIdentifier}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '0.1rem 0.4rem',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {s.sourceType}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {new Date(s.createdAt).toLocaleString()}
                    </span>
                    <span>
                      Outcome: <strong>{s.outcome || (s.hasVerification ? 'Verified' : 'Unverified')}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => onSelectSession(s.id)}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Open Session
                  </button>
                  <a
                    href={getReportDownloadUrl(s.id, 'md')}
                    download
                    className="btn-secondary"
                    style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    <Download size={12} />
                    <span>Report</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
