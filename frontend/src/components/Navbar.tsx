import React from 'react';
import { ShieldCheck, Cpu, FileText, CheckCircle2, Search, Sliders, History } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  repoIdentifier?: string;
  patchApproved?: boolean;
  hasVerification?: boolean;
  isLiveInference?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  repoIdentifier,
  patchApproved,
  hasVerification,
  isLiveInference,
}) => {
  return (
    <header style={{
      backgroundColor: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div
          onClick={() => setActiveTab('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: 'var(--color-action)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}>
            +
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}>
              RepoMedic <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>AI</span>
            </div>
          </div>
        </div>

        {repoIdentifier && (
          <div style={{
            fontSize: '0.8125rem',
            padding: '0.2rem 0.6rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-secondary)'
          }}>
            {repoIdentifier}
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <button
          className={activeTab === 'landing' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('landing')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          Repo Input
        </button>

        <button
          className={activeTab === 'analysis' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('analysis')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <Search size={14} />
          Analysis
        </button>

        <button
          className={activeTab === 'investigation' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('investigation')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <Cpu size={14} />
          Investigation
        </button>

        <button
          className={activeTab === 'patch' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('patch')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <FileText size={14} />
          Patch Review
          {patchApproved && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />}
        </button>

        <button
          className={activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('verification')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <CheckCircle2 size={14} />
          Verification
          {hasVerification && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />}
        </button>

        <button
          className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('history')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <History size={14} />
          History & Report
        </button>

        <button
          className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('settings')}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <Sliders size={14} />
          Settings
        </button>
      </nav>

      {/* Provider indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: isLiveInference ? 'var(--color-success)' : 'var(--color-warning)'
        }} />
        <span>{isLiveInference ? 'Nebius Live' : 'Nebius Demo'}</span>
      </div>
    </header>
  );
};
