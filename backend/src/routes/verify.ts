import { Router } from 'express';
import { sessionStore } from '../services/session-store.js';
import { createIsolatedWorkspace, applyPatchToWorkspace } from '../services/patch-applier.js';
import { runIsolatedTests } from '../services/test-runner.js';
import { VerificationResult } from '../schemas/session.schema.js';

export const verifyRouter = Router();

verifyRouter.post('/:sessionId', async (req, res, next) => {
  try {
    const session = sessionStore.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Strict approval requirement
    if (!session.patchApproved) {
      return res.status(403).json({
        error: 'Execution forbidden: Patch requires explicit human approval before running verification in an isolated workspace.',
      });
    }

    if (!session.patchProposal) {
      return res.status(400).json({ error: 'No patch proposal exists to verify.' });
    }

    // Step 1: Create isolated temporary workspace with baseline files
    const baselineWorkspace = await createIsolatedWorkspace(session.id, session.files);
    sessionStore.setWorkspace(session.id, baselineWorkspace);

    // Step 2: Run baseline tests (pre-patch)
    const baselineResult = await runIsolatedTests(baselineWorkspace);

    // Step 3: Apply approved patch to workspace
    await applyPatchToWorkspace(baselineWorkspace, session);

    // Step 4: Run post-patch tests
    const patchedResult = await runIsolatedTests(baselineWorkspace);

    // Step 5: Compare results
    let outcome: VerificationResult['outcome'] = 'SUCCESS';
    let comparisonSummary = '';

    if (!baselineResult.available || !patchedResult.available) {
      outcome = 'UNAVAILABLE';
      comparisonSummary = 'Test runner unavailable or no supported test framework detected in repository.';
    } else {
      const baselineFailed = baselineResult.counts.failed;
      const patchedFailed = patchedResult.counts.failed;

      if (patchedFailed === 0 && baselineFailed > 0) {
        outcome = 'SUCCESS';
        comparisonSummary = `All ${baselineFailed} pre-existing failure(s) were successfully resolved by the patch with zero new regressions.`;
      } else if (patchedFailed > baselineFailed) {
        outcome = 'REGRESSION';
        comparisonSummary = `Patch introduced ${patchedFailed - baselineFailed} new test regression(s). Baseline failed: ${baselineFailed}, Patched failed: ${patchedFailed}.`;
      } else if (patchedFailed > 0 && patchedFailed < baselineFailed) {
        outcome = 'STILL_FAILING';
        comparisonSummary = `Patch partially resolved failures (${baselineFailed - patchedFailed} fixed), but ${patchedFailed} test(s) are still failing.`;
      } else if (patchedFailed > 0 && patchedFailed === baselineFailed) {
        outcome = 'STILL_FAILING';
        comparisonSummary = `Patch did not resolve test failures. ${patchedFailed} test(s) remain failing.`;
      } else {
        outcome = 'SUCCESS';
        comparisonSummary = `All tests passed cleanly (${patchedResult.counts.passed} passing).`;
      }
    }

    const verification: VerificationResult = {
      executed: true,
      baseline: baselineResult,
      patched: patchedResult,
      outcome,
      comparisonSummary,
      preExistingFailures: baselineResult.counts.failed,
      newFailures: Math.max(0, patchedResult.counts.failed - baselineResult.counts.failed),
      fixedFailures: Math.max(0, baselineResult.counts.failed - patchedResult.counts.failed),
    };

    session.verification = verification;
    sessionStore.set(session);

    return res.json({
      sessionId: session.id,
      verification,
    });
  } catch (err: any) {
    next(err);
  }
});
