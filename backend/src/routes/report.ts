import { Router } from 'express';
import { sessionStore } from '../services/session-store.js';
import { exportSessionMarkdown, exportSessionJson } from '../services/report-exporter.js';

export const reportRouter = Router();

reportRouter.get('/', (req, res) => {
  const sessions = sessionStore.list().map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    repoIdentifier: s.repoIdentifier,
    sourceType: s.sourceType,
    patchApproved: s.patchApproved,
    hasDiagnosis: Boolean(s.diagnosis),
    hasVerification: Boolean(s.verification),
    outcome: s.verification?.outcome,
    healthMetrics: s.healthMetrics,
  }));

  res.json({ sessions });
});

reportRouter.get('/:sessionId', (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const format = (req.query.format as string) || 'json';

  if (format === 'md') {
    const md = exportSessionMarkdown(session);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="repomedic-report-${session.id.slice(0, 8)}.md"`
    );
    return res.send(md);
  }

  if (format === 'json-download') {
    const jsonStr = exportSessionJson(session);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="repomedic-report-${session.id.slice(0, 8)}.json"`
    );
    return res.send(jsonStr);
  }

  return res.json({
    markdown: exportSessionMarkdown(session),
    session,
  });
});
