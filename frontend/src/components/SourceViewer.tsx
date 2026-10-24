import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SourceViewerProps {
  filePath: string;
  content: string;
  language: string;
  highlightRange?: { startLine: number; endLine: number };
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  filePath,
  content,
  language,
  highlightRange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

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
      {/* Header */}
      <div style={{
        padding: '0.5rem 0.875rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{filePath}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({language})</span>
        </div>
        <button
          className="btn-secondary"
          onClick={handleCopy}
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
        >
          {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8125rem',
        lineHeight: '1.6',
        backgroundColor: '#FFFFFF',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted =
                highlightRange &&
                lineNum >= highlightRange.startLine &&
                lineNum <= highlightRange.endLine;

              return (
                <tr
                  key={lineNum}
                  style={{
                    backgroundColor: isHighlighted ? 'var(--color-warning-bg)' : 'transparent',
                    borderLeft: isHighlighted ? '3px solid var(--color-warning)' : '3px solid transparent',
                  }}
                >
                  <td style={{
                    width: '45px',
                    textAlign: 'right',
                    paddingRight: '0.75rem',
                    paddingLeft: '0.5rem',
                    userSelect: 'none',
                    color: isHighlighted ? 'var(--color-warning)' : 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    borderRight: '1px solid var(--color-border-subtle)',
                    verticalAlign: 'top',
                  }}>
                    {lineNum}
                  </td>
                  <td style={{
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    whiteSpace: 'pre',
                    color: 'var(--color-text-primary)',
                    verticalAlign: 'top',
                  }}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
