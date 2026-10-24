import { Session } from '../schemas/session.schema.js';

export function exportSessionMarkdown(session: Session): string {
  const dateStr = new Date(session.createdAt).toUTCString();
  const provider = session.diagnosis?.modelMetadata.provider || 'Nebius Token Factory';
  const modelId = session.diagnosis?.modelMetadata.modelId || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF';

  let md = `# RepoMedic AI — Engineering & Audit Report
**Session ID:** \`${session.id}\`  
**Generated At:** ${dateStr}  
**Target Repository:** \`${session.repoIdentifier}\`  
**Source Type:** ${session.sourceType}  
**Inference Provider:** ${provider}  
**Model Architecture:** \`${modelId}\`  
**Patch Approval Status:** ${session.patchApproved ? 'APPROVED BY HUMAN' : 'PENDING APPROVAL'}

---

## 1. Executive Summary
${session.diagnosis?.summary || 'No diagnosis generated yet.'}

**Identified Symptom:**  
> ${session.diagnosis?.symptomIdentified || 'N/A'}

**Primary Root Cause:**  
> ${session.diagnosis?.primaryRootCause || 'N/A'}

---

## 2. Evidence Graph & Root-Cause Hypotheses

### Competing Hypotheses
`;

  if (session.diagnosis?.hypotheses && session.diagnosis.hypotheses.length > 0) {
    for (const h of session.diagnosis.hypotheses) {
      md += `
#### Hypothesis: ${h.title}
- **Explanation:** ${h.explanation}
- **Confidence:** \`${h.confidence}\` — ${h.confidenceRationale}
- **Distinguishing Check:** ${h.distinguishingCheck}
- **Supporting Evidence Items:** ${h.supportingEvidenceIds.join(', ') || 'None'}
`;
    }
  } else {
    md += '\n*No hypotheses generated.*\n';
  }

  md += `
### Concrete Evidence Items
`;

  if (session.diagnosis?.evidence && session.diagnosis.evidence.length > 0) {
    for (const ev of session.diagnosis.evidence) {
      md += `
- **ID:** \`${ev.id}\` [${ev.type.toUpperCase()}]
  - **Location:** \`${ev.file}:${ev.startLine}-${ev.endLine}\`
  - **Description:** ${ev.description}
  \`\`\`
  ${ev.snippet}
  \`\`\`
`;
    }
  } else {
    md += '\n*No evidence recorded.*\n';
  }

  md += `
---

## 3. Static Analysis Findings
| # | File | Line | Severity | Category | Message |
|---|------|------|----------|----------|---------|
`;

  if (session.staticFindings && session.staticFindings.length > 0) {
    session.staticFindings.forEach((f, idx) => {
      md += `| ${idx + 1} | \`${f.file}\` | ${f.line} | \`${f.severity.toUpperCase()}\` | ${f.category} | ${f.message.replace(/\|/g, '\\|')} |\n`;
    });
  } else {
    md += '| - | - | - | - | - | Clean - No static issues detected |\n';
  }

  md += `
---

## 4. Proposed Code Patch

**Patch Title:** ${session.patchProposal?.title || 'None'}  
**Risk Level:** \`${(session.patchProposal?.riskLevel || 'N/A').toUpperCase()}\`  
**Requires Human Approval:** Yes  
**Approval Timestamp:** ${session.approvedAt || 'Not approved'}

\`\`\`diff
${session.patchProposal?.unifiedDiff || 'No diff generated.'}
\`\`\`

---

## 5. Deterministic Verification & Test Results
`;

  if (session.verification?.executed) {
    const v = session.verification;
    md += `
**Verification Outcome:** \`${v.outcome}\`  
**Comparison Summary:** ${v.comparisonSummary}

### Test Results Breakdown
- **Pre-existing Failures:** ${v.preExistingFailures}
- **Fixed Failures:** ${v.fixedFailures}
- **New/Regressed Failures:** ${v.newFailures}

#### Baseline Run (Pre-Patch)
- **Command:** \`${v.baseline?.command || 'N/A'}\`
- **Exit Code:** ${v.baseline?.exitCode ?? 'N/A'}
- **Duration:** ${v.baseline?.durationMs || 0}ms
- **Passed:** ${v.baseline?.counts.passed || 0} | **Failed:** ${v.baseline?.counts.failed || 0}

\`\`\`
${v.baseline?.stdout || v.baseline?.stderr || 'No baseline output recorded.'}
\`\`\`

#### Patched Run (Post-Patch)
- **Command:** \`${v.patched?.command || 'N/A'}\`
- **Exit Code:** ${v.patched?.exitCode ?? 'N/A'}
- **Duration:** ${v.patched?.durationMs || 0}ms
- **Passed:** ${v.patched?.counts.passed || 0} | **Failed:** ${v.patched?.counts.failed || 0}

\`\`\`
${v.patched?.stdout || v.patched?.stderr || 'No patched output recorded.'}
\`\`\`
`;
  } else {
    md += `
*Verification was not executed or not available.*
`;
  }

  md += `
---

## 6. Execution & Safety Metadata
- **Live Inference Invoked:** ${session.diagnosis?.modelMetadata.isLiveInference ? 'Yes' : 'Demo Mode'}
- **Inference Latency:** ${session.diagnosis?.modelMetadata.latencyMs || 0}ms
- **Prompt Tokens:** ${session.diagnosis?.modelMetadata.promptTokens || 'N/A'}
- **Completion Tokens:** ${session.diagnosis?.modelMetadata.completionTokens || 'N/A'}
- **Safety Limitations:** Execution performed in isolated temp directory with process limits and token stripping. Network access disabled where advisory runtime controls allow.
`;

  return md;
}

export function exportSessionJson(session: Session): string {
  return JSON.stringify(session, null, 2);
}
