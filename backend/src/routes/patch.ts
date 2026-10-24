import { Router } from 'express';
import { sessionStore } from '../services/session-store.js';

export const patchRouter = Router();

patchRouter.get('/:sessionId', (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (!session.patchProposal) {
    return res.status(404).json({ error: 'No patch proposal generated for this session.' });
  }

  res.json({
    patchProposal: session.patchProposal,
    patchApproved: session.patchApproved,
    approvedAt: session.approvedAt,
  });
});

patchRouter.post('/:sessionId/approve', (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (!session.patchProposal) {
    return res.status(400).json({ error: 'Cannot approve session without a patch proposal.' });
  }

  session.patchApproved = true;
  session.approvedAt = new Date().toISOString();
  sessionStore.set(session);

  res.json({
    status: 'approved',
    patchApproved: true,
    approvedAt: session.approvedAt,
    message: 'Patch approved by human reviewer. Workspace is now eligible for isolated verification.',
  });
});
