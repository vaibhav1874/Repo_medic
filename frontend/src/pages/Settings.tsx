import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../lib/api';
import { ShieldCheck, Cpu, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendHealth()
      .then((data) => setHealth(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          System & Model Configuration
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
          Runtime configuration for Nebius Token Factory and NVIDIA open model inference.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Model Provider Info */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-action)' }}>
            <Cpu size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Inference Provider Settings</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Hosted Provider</span>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Nebius Token Factory</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>API Endpoint</span>
              <code style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                {health?.nebius?.baseUrl || 'https://api.tokenfactory.nebius.com/v1'}
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>NVIDIA Model ID</span>
              <code style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-action)' }}>
                {health?.nebius?.modelId || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF'}
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>API Key Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {health?.nebius?.hasApiKey ? (
                  <>
                    <CheckCircle2 size={14} color="var(--color-success)" />
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Configured on Server</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} color="var(--color-warning)" />
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Not Set (Demo Mode Active)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Sandbox Limits */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-action)' }}>
            <ShieldCheck size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Safety & Sandbox Limits</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Max Repository Files</span>
              <strong style={{ fontSize: '1rem' }}>500 files</strong>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Max Ingestion Size</span>
              <strong style={{ fontSize: '1rem' }}>50 MB</strong>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Test Execution Timeout</span>
              <strong style={{ fontSize: '1rem' }}>60 seconds</strong>
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong>Safety Architecture Guarantees:</strong>
            <p>1. Untrusted repository code never executes in the main application process.</p>
            <p>2. Tests run exclusively inside temporary workspace directories in <code>os.tmpdir()</code>.</p>
            <p>3. Process memory limits (256MB) and strict command allowlists prevent arbitrary shell execution.</p>
            <p>4. Detected secrets and credentials are automatically redacted before model context assembly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
