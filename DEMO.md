# RepoMedic AI — Hackathon Judging Demo Script

This document provides a concise 3-minute walkthrough for hackathon judges evaluating **RepoMedic AI**.

---

## 30-Second Overview

- **Core Problem:** Developer tools powered by LLMs hallucinate explanations and proclaim fixes that don't actually work or break existing code.
- **Our Solution:** An evidence-driven repair pipeline: deterministic static analysis, bounded context selection, hypothesis ranking with exact line references, human-approved diffs, and **isolated test execution proving before-and-after results**.
- **Hackathon Stack:** Hosted on **Nebius Token Factory**, running open **NVIDIA Nemotron (`nvidia/Llama-3.1-Nemotron-70B-Instruct-HF`)**.

---

## Step-by-Step Demo Guide

### 1. Launch the Application
In your terminal:
```bash
npm install
npm run dev
```
Navigate to: **http://localhost:5173**

---

### 2. Run the Sample Buggy Repository
1. On the landing page, click the **"Try Sample Project"** button.
2. The bundled `repo-medic/sample-calculator` is pre-selected.
3. Review the symptom: *"The sum function calculates wrong totals on arrays and the divide function crashes on zero."*
4. Click **"Begin Evidence-Driven Diagnosis"**.

---

### 3. Step 1: Deterministic Static Analysis
- Observe the **3-Pane Workspace**:
  - Left: Repository file explorer.
  - Middle: Deterministic static findings (off-by-one loop indexing, unhandled division by zero, type coercion).
  - Right: Source code viewer with exact line highlighting.
- Click any finding card in the middle pane to jump directly to the offending line in `src/calculator.ts`.

---

### 4. Step 2: Investigation & Competing Hypotheses
- Click the **Investigation** tab.
- Review the **Evidence Graph**: each evidence item cites a real file and line range with verbatim snippets.
- Review the **Competing Root-Cause Hypotheses**:
  - Hypothesis #1: Off-by-one initialization bug in `sum()`.
  - Hypothesis #2: Missing boundary validation in `divide()`.
  - Notice the confidence rationale in plain English and distinguishing tests.

---

### 5. Step 3: Minimal Patch Review & Approval Gate
- Click the **Patch Review** tab.
- Inspect the surgical unified diff:
  - Line 14: Loop initialization corrected from `i = 1` to `i = 0`.
  - Line 24: Zero-division guard added to throw an explicit `Error`.
- Review the targeted regression test.
- Notice the **Approval Requirement**: RepoMedic will not execute or touch workspaces without explicit human consent.
- Click **"Approve Patch"** and confirm the authorization modal.

---

### 6. Step 4: Deterministic Verification (The Core Differentiator)
- Click the **Verification** tab.
- Click **"Run Verification Now"**.
- Watch the test runner execute in an isolated temporary workspace:
  - **Baseline Run (Pre-Patch):** Exit code `1`, 2 tests failed (`expected 50 to be 60` and `expected [Function] to throw an error`).
  - **Patched Run (Post-Patch):** Exit code `0`, 5 tests passed, 0 failed.
  - Real duration, stdout/stderr, and exit codes are displayed.

---

### 7. Step 5: Engineering Audit Report
- Click the **History & Report** tab.
- Click **"Download Report (.md)"** to view the full engineering audit report ready for pull request attachment or compliance archiving.

---

## Technical Verification Commands

To verify code quality and tests directly from your terminal:
```bash
# Run 27 automated unit, security, and schema tests
npm test

# Build both backend and frontend bundles
npm run build
```
