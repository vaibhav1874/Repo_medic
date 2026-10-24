import React, { useState } from 'react';
import { Github, Upload, Sparkles, ArrowRight, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';
import { analyzeRepository } from '../lib/api';

interface LandingProps {
  onSessionStarted: (sessionId: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onSessionStarted }) => {
  const [sourceType, setSourceType] = useState<'sample_project' | 'github_url' | 'zip_upload'>('sample_project');
  const [githubUrl, setGithubUrl] = useState('');
  const [issueDescription, setIssueDescription] = useState(
    'The sum function calculates wrong totals on arrays and the divide function crashes on zero.'
  );
  const [zipBase64, setZipBase64] = useState<string | null>(null);
  const [zipFileName, setZipFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please select a valid .zip archive.');
      return;
    }

    setZipFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setZipBase64(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStartAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      let payload: any = {
        sourceType,
        issueDescription,
      };

      if (sourceType === 'github_url') {
        if (!githubUrl.trim()) {
          throw new Error('Please enter a public GitHub repository URL.');
        }
        payload.target = githubUrl.trim();
      } else if (sourceType === 'zip_upload') {
        if (!zipBase64) {
          throw new Error('Please upload a ZIP archive first.');
        }
        payload.zipBase64 = zipBase64;
        payload.target = zipFileName || 'uploaded-project.zip';
      }

      const res = await analyzeRepository(payload);
      onSessionStarted(res.sessionId);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
        }}>
          <ShieldCheck size={13} color="var(--color-action)" />
          NVIDIA Open Models × Nebius Token Factory
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--color-text-primary)',
          marginBottom: '0.75rem',
          lineHeight: 1.25,
        }}>
          Evidence-Driven Code Repair
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '620px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          "Understand the bug. Trace the evidence. Propose a minimal fix. Prove what actually passed."
        </p>
      </div>

      {/* Main card */}
      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-failure-bg)',
            border: '1px solid var(--color-failure-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-failure)',
            fontSize: '0.8125rem',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        {/* Source selection buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            1. Select Repository Source
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <button
              type="button"
              className={sourceType === 'sample_project' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('sample_project')}
              style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Sparkles size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Try Sample Project</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>(Judge Demo)</span>
            </button>

            <button
              type="button"
              className={sourceType === 'github_url' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('github_url')}
              style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Github size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>GitHub URL</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>(Public Repo)</span>
            </button>

            <button
              type="button"
              className={sourceType === 'zip_upload' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('zip_upload')}
              style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Upload size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Upload ZIP</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>(Local Archive)</span>
            </button>
          </div>
        </div>

        {/* Specific source input */}
        <div style={{ marginBottom: '1.5rem' }}>
          {sourceType === 'sample_project' && (
            <div style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}>
              <strong>Bundled Sample:</strong> <code style={{ color: 'var(--color-text-primary)' }}>repo-medic/sample-calculator</code>
              <p style={{ marginTop: '0.25rem' }}>
                Contains real, intentional bugs (off-by-one loop indexing, unhandled division by zero) with Vitest unit tests that demonstrably FAIL before the patch and PASS after.
              </p>
            </div>
          )}

          {sourceType === 'github_url' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/owner/repository"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Only public repositories with up to 500 files and 50MB total size are supported.
              </span>
            </div>
          )}

          {sourceType === 'zip_upload' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                ZIP Archive (.zip)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                style={{ fontSize: '0.8125rem' }}
              />
              {zipFileName && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                  Loaded: {zipFileName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bug / Issue description */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>
            2. Bug Description / Reported Symptom
          </label>
          <textarea
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the failure, unexpected return value, or paste error log / stack trace..."
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
            RepoMedic uses deterministic search and keyword proximity to bound context tokens before querying the model.
          </span>
        </div>

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleStartAnalysis}
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
        >
          {loading ? (
            <span>Ingesting & Diagnosing Repository...</span>
          ) : (
            <>
              <span>Begin Evidence-Driven Diagnosis</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Safety and transparency guarantees */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="var(--color-action)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Isolated Sandbox</strong>
            <p>Code runs in dedicated temp directories with CPU/RAM limits; host credentials stripped.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <Terminal size={16} color="var(--color-action)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Deterministic Proof</strong>
            <p>PASS/FAIL status is verified by actual test execution, never by AI claims.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <CheckCircle2 size={16} color="var(--color-action)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Approval Gate</strong>
            <p>Every patch requires human review and confirmation before workspace application.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
