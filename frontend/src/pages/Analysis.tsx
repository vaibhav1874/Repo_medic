import React, { useState, useEffect } from 'react';
import { SessionDetail } from '../lib/types';
import { FileExplorer } from '../components/FileExplorer';
import { FindingCard } from '../components/FindingCard';
import { SourceViewer } from '../components/SourceViewer';
import { HealthDashboard } from '../components/HealthDashboard';
import { getFileContent } from '../lib/api';

interface AnalysisProps {
  session: SessionDetail;
  onNavigateToInvestigation: () => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ session, onNavigateToInvestigation }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    session.files[0]?.path || ''
  );
  const [fileContent, setFileContent] = useState<string>('');
  const [highlightRange, setHighlightRange] = useState<{ startLine: number; endLine: number } | undefined>();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    if (selectedFilePath) {
      setLoadingFile(true);
      getFileContent(session.id, selectedFilePath)
        .then((res) => {
          setFileContent(res.content);
        })
        .catch(() => {
          setFileContent('// Failed to load file content.');
        })
        .finally(() => setLoadingFile(false));
    }
  }, [session.id, selectedFilePath]);

  const handleSelectFinding = (filePath: string, line: number) => {
    setSelectedFilePath(filePath);
    setHighlightRange({ startLine: line, endLine: line });
  };

  const filteredFindings = (session.staticFindings || []).filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Health metrics */}
      {session.healthMetrics && <HealthDashboard metrics={session.healthMetrics} />}

      {/* Workspace 3-pane layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 380px 1fr',
        gap: '1rem',
        height: 'calc(100vh - 240px)',
        minHeight: '600px',
      }}>
        {/* Left pane: File Explorer */}
        <FileExplorer
          files={session.files}
          selectedPath={selectedFilePath}
          onSelectFile={(path) => {
            setSelectedFilePath(path);
            setHighlightRange(undefined);
          }}
        />

        {/* Center pane: Findings list */}
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.625rem 0.875rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Static Findings ({filteredFindings.length})
            </span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filteredFindings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                No static findings match this filter.
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  onSelect={handleSelectFinding}
                />
              ))
            )}
          </div>
        </div>

        {/* Right pane: Source Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <SourceViewer
              filePath={selectedFilePath}
              content={loadingFile ? 'Loading file...' : fileContent}
              language={session.files.find((f) => f.path === selectedFilePath)?.language || 'plaintext'}
              highlightRange={highlightRange}
            />
          </div>

          {/* Quick jump to investigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Next step: Review causal evidence graph and competing hypotheses.
            </div>
            <button className="btn-primary" onClick={onNavigateToInvestigation} style={{ fontSize: '0.8125rem' }}>
              Proceed to Investigation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
