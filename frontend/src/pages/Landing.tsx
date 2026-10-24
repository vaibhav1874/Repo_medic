import React, { useState, useRef } from 'react';
import {
  Github,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Cpu,
  Layers,
  FileCode,
  FileText,
  AlertTriangle,
  GitPullRequest,
  Check,
  Activity
} from 'lucide-react';
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

  const consoleRef = useRef<HTMLDivElement>(null);

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

  const scrollToConsole = (type?: 'sample_project' | 'github_url' | 'zip_upload') => {
    if (type) setSourceType(type);
    consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '3.5rem', paddingTop: '1.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.875rem',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '1.25rem',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          <span>NVIDIA Open Models × Nebius Token Factory</span>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--color-text-primary)',
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}>
          Evidence-Driven Code Debugging & Repair
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 2rem',
          lineHeight: 1.6,
        }}>
          "Understand the bug. Trace the evidence. Propose a minimal fix. Prove what actually passed."
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.875rem' }}>
          <button
            className="btn-primary"
            onClick={() => scrollToConsole('sample_project')}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9375rem', fontWeight: 600 }}
          >
            <Sparkles size={16} />
            <span>Launch Hackathon Demo (Buggy Sample)</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => scrollToConsole()}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9375rem' }}
          >
            <Github size={16} />
            <span>Ingest Custom Repository</span>
          </button>
        </div>
      </section>

      {/* Main Interactive Ingestion Console */}
      <div ref={consoleRef} className="card" style={{ padding: '2rem', marginBottom: '3.5rem', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Repository Ingestion Console
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Select a repository source, define the symptom or failure, and launch evidence-backed investigation.
            </p>
          </div>

          <div style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.6rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)',
          }}>
            nvidia/Llama-3.1-Nemotron-70B
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-failure-bg)',
            border: '1px solid var(--color-failure-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-failure)',
            fontSize: '0.8125rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Source selection tabs */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.625rem', color: 'var(--color-text-primary)' }}>
            1. Repository Source
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <button
              type="button"
              className={sourceType === 'sample_project' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('sample_project')}
              style={{ padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Sparkles size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Try Sample Project</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>One-Click Judge Demo</span>
            </button>

            <button
              type="button"
              className={sourceType === 'github_url' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('github_url')}
              style={{ padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Github size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>GitHub Repository</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Public Repositories</span>
            </button>

            <button
              type="button"
              className={sourceType === 'zip_upload' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSourceType('zip_upload')}
              style={{ padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <Upload size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Upload ZIP Archive</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Local Codebase (Safe Extract)</span>
            </button>
          </div>
        </div>

        {/* Source Inputs */}
        <div style={{ marginBottom: '1.5rem' }}>
          {sourceType === 'sample_project' && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <FileCode size={14} color="var(--color-action)" />
                <strong style={{ color: 'var(--color-text-primary)' }}>Bundled Buggy Calculator: </strong>
                <code style={{ color: 'var(--color-info)' }}>repo-medic/sample-calculator</code>
              </div>
              <p style={{ lineHeight: 1.5 }}>
                Contains real, reproducible bugs (off-by-one loop indexing in <code>sum()</code>, unhandled zero divisor in <code>divide()</code>) with an automated Vitest test suite that demonstrably <strong>FAILS before the fix (2 failed)</strong> and <strong>PASSES after (5 passed)</strong>.
              </p>
            </div>
          )}

          {sourceType === 'github_url' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/vaibhav1874/Repo_medic"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Fetched via safe GitHub Contents API. Maximum 500 files, 50MB total.
              </span>
            </div>
          )}

          {sourceType === 'zip_upload' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>
                ZIP Archive (.zip)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                style={{ fontSize: '0.8125rem' }}
              />
              {zipFileName && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={12} />
                  <span>Archive Loaded: {zipFileName}</span>
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
            RepoMedic uses deterministic search and keyword proximity to construct bounded model context (~8k tokens).
          </span>
        </div>

        {/* Submit button */}
        <button
          className="btn-primary"
          onClick={handleStartAnalysis}
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
        >
          {loading ? (
            <span>Ingesting & Diagnosing Repository with NVIDIA Nemotron...</span>
          ) : (
            <>
              <span>Begin Evidence-Driven Diagnosis</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Engineering Workflow Steps */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            Auditable 7-Stage Repair Pipeline
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Every diagnosis follows a deterministic engineering sequence from ingestion to test proof.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 01
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Safe Ingestion & Triage
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Path traversal rejection, file-count and size limit validation, automatic credential and secret redaction.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 02
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Deterministic Static Heuristics
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              AST pattern scans for loop boundary errors, unhandled zero division, type coercion bugs, and loose equality.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 03
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              NVIDIA Nemotron 70B Diagnosis
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Bounded context selection (~8k tokens). Competing hypothesis ranking with plain-English confidence rationale.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 04
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Surgical Patch & Approval
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Unified diff generation with necessity justification. Strict human approval gate blocks unconfirmed writes.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 05
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Isolated Sandbox Execution
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Diff applied inside dedicated temp workspace in <code>os.tmpdir()</code>. Original files are never modified.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 06
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Deterministic Test Proof
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Before-and-after baseline vs patched run comparison. Captures real stdout, exit code, and test counts.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-action)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              STAGE 07
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Engineering Report Export
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Full audit trail with session metadata, diff, evidence graph, and test execution tables as Markdown or JSON.
            </p>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            Engineered for Precision & Transparency
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Purpose-built developer tool designed to eliminate LLM hallucinations in code repair.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <Terminal size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Deterministic Proof</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              A model response never determines whether tests passed. Execution runs in real Node/test subprocesses with real stdout, duration measurement, and exit codes.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <Layers size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Evidence Graph</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Every finding ties symptoms to exact file paths and 1-indexed line ranges. Observed facts are strictly separated from hypotheses and static warnings.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <GitPullRequest size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Human Approval Gate</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              RepoMedic enforces a deliberate confirmation modal. Untrusted code cannot be executed or applied without explicit human authorization.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <ShieldCheck size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Safety Architecture</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              ZIP path traversal protection, secret redaction (AWS, GitHub, PEM tokens), process memory limits (256MB), and test command allowlisting.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <Cpu size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>NVIDIA Nemotron 70B</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Leverages high-throughput open NVIDIA models hosted on Nebius Token Factory with runtime Zod schema validation and exponential backoff retry.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-action)' }}>
              <FileText size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Auditable Report Export</h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Download end-to-end Markdown reports or raw JSON session logs suitable for PR review discussions, compliance audit trails, and post-mortems.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>RepoMedic AI</span>
          <span>— NVIDIA × Nebius Global AI Hackathon</span>
        </div>
        <div>
          <span>Apache-2.0 License • Evidence-Driven Code Repair</span>
        </div>
      </footer>
    </div>
  );
};
