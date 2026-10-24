import React, { useState } from 'react';
import { FileCode, File, Search } from 'lucide-react';
import { RepoFileSummary } from '../lib/types';

interface FileExplorerProps {
  files: RepoFileSummary[];
  selectedPath?: string;
  onSelectFile: (path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedPath,
  onSelectFile,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = files.filter((f) =>
    f.path.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.625rem 0.875rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem 0.5rem',
        }}>
          <Search size={13} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: 'none',
              padding: 0,
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.375rem 0' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            No matching files
          </div>
        ) : (
          filtered.map((f) => {
            const isSelected = f.path === selectedPath;
            return (
              <div
                key={f.path}
                onClick={() => onSelectFile(f.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--color-info-bg)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--color-action)' : '3px solid transparent',
                  color: isSelected ? 'var(--color-action)' : 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.language === 'typescript' || f.language === 'javascript' ? (
                    <FileCode size={13} color="var(--color-action)" />
                  ) : (
                    <File size={13} color="var(--color-text-muted)" />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.path}
                  </span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '0.5rem' }}>
                  {(f.size / 1024).toFixed(1)}k
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
