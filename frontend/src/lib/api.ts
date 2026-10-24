import { SessionDetail, VerificationResult } from './types';

const API_BASE = '/api';

export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to reach backend health endpoint.');
  return res.json();
}

export async function analyzeRepository(payload: {
  sourceType: 'github_url' | 'zip_upload' | 'sample_project';
  target?: string;
  zipBase64?: string;
  issueDescription?: string;
}) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Analysis request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/analyze/${sessionId}`);
  if (!res.ok) throw new Error('Session not found.');
  return res.json();
}

export async function getFileContent(sessionId: string, filePath: string): Promise<{ path: string; content: string; language: string }> {
  const res = await fetch(`${API_BASE}/analyze/${sessionId}/file?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error(`Failed to load content for ${filePath}`);
  return res.json();
}

export async function approvePatch(sessionId: string): Promise<{ status: string; patchApproved: boolean }> {
  const res = await fetch(`${API_BASE}/patch/${sessionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to approve patch.');
  }

  return res.json();
}

export async function verifyPatch(sessionId: string): Promise<{ sessionId: string; verification: VerificationResult }> {
  const res = await fetch(`${API_BASE}/verify/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to execute verification.');
  }

  return res.json();
}

export async function listSessions() {
  const res = await fetch(`${API_BASE}/report`);
  if (!res.ok) throw new Error('Failed to list sessions.');
  return res.json();
}

export function getReportDownloadUrl(sessionId: string, format: 'md' | 'json') {
  return `${API_BASE}/report/${sessionId}?format=${format === 'json' ? 'json-download' : 'md'}`;
}
