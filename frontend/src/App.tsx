import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Analysis } from './pages/Analysis';
import { Investigation } from './pages/Investigation';
import { PatchReview } from './pages/PatchReview';
import { Verification } from './pages/Verification';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { getSession } from './lib/api';
import { SessionDetail } from './lib/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const fetchCurrentSession = async (id: string) => {
    setLoadingSession(true);
    try {
      const data = await getSession(id);
      setSession(data);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchCurrentSession(sessionId);
    }
  }, [sessionId]);

  const handleSessionStarted = (newSessionId: string) => {
    setSessionId(newSessionId);
    setActiveTab('analysis');
  };

  const handlePatchApproved = () => {
    if (sessionId) {
      fetchCurrentSession(sessionId);
    }
  };

  const handleVerificationComplete = () => {
    if (sessionId) {
      fetchCurrentSession(sessionId);
    }
  };

  const handleSelectHistoricalSession = (selectedId: string) => {
    setSessionId(selectedId);
    setActiveTab('analysis');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-page)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        repoIdentifier={session?.repoIdentifier}
        patchApproved={session?.patchApproved}
        hasVerification={Boolean(session?.verification)}
        isLiveInference={session?.diagnosis?.modelMetadata?.isLiveInference}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'landing' && (
          <Landing onSessionStarted={handleSessionStarted} />
        )}

        {activeTab === 'analysis' && session && (
          <Analysis
            session={session}
            onNavigateToInvestigation={() => setActiveTab('investigation')}
          />
        )}

        {activeTab === 'analysis' && !session && (
          <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              No active session loaded.
            </p>
            <button className="btn-primary" onClick={() => setActiveTab('landing')}>
              Go to Repository Input
            </button>
          </div>
        )}

        {activeTab === 'investigation' && session && (
          <Investigation
            session={session}
            onNavigateToPatch={() => setActiveTab('patch')}
          />
        )}

        {activeTab === 'patch' && session && (
          <PatchReview
            session={session}
            onPatchApproved={handlePatchApproved}
            onNavigateToVerification={() => setActiveTab('verification')}
          />
        )}

        {activeTab === 'verification' && session && (
          <Verification
            session={session}
            onVerificationComplete={handleVerificationComplete}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <History
            currentSession={session || undefined}
            onSelectSession={handleSelectHistoricalSession}
          />
        )}

        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
};
