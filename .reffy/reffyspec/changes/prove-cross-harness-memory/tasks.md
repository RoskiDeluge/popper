# Tasks

## 1. Build the explicit experiment

- [ ] 1.1 Verify installed Paseo invocation/log interfaces against the developer
  reply; document grants, model/step budget, and host session-isolation controls.
- [ ] 1.2 Add `examples/cross-harness-memory/` with the schema, remote skill,
  safe immutable record paths, and project-scoped briefing rules.
- [ ] 1.3 Implement the pipe client with validation/redaction, stable logical
  event IDs, per-attempt IDs, bounded calls, and inspectable receipts.
- [ ] 1.4 Implement original-invocation and repository reconciliation for
  duplicates/timeouts; preserve failed and unknown outcomes without blind retries.
- [ ] 1.5 Document explicit use from all three harnesses, setup, isolated fresh
  sessions, independent GitHub verification, and a README link.

## 2. Verify locally

- [ ] 2.1 Add focused offline tests for invalid envelopes/paths, text stdin,
  request identity, duplicate-success/failure lookup, timeout uncertainty,
  and prevention of blind retries.
- [ ] 2.2 Run focused tests and `npm run check` after implementation.
- [ ] 2.3 Review skill/runbook coverage for project scope, conflicting logical
  events, redaction, and credential-free shared files.

## 3. Run live trials when requested

- [ ] 3.1 Configure a fresh disposable actor/repository; verify read/write tools
  and record non-secret versions, configuration, and model/step budget.
- [ ] 3.2 Complete Codex -> Claude Code -> Popper with isolated readers and
  independent marker, attribution, and follow-up verification.
- [ ] 3.3 Complete Claude Code -> Popper -> Codex under the same controls.
- [ ] 3.4 Complete Popper -> Codex -> Claude Code under the same controls.
- [ ] 3.5 Verify second-project isolation, duplicate successful request,
  consumed failed ID, reconciled new-attempt retry, and transport failure.
- [ ] 3.6 Write an indexed Reffy result artifact with the acceptance matrix,
  receipts, commit evidence, durations, failures, and limitations; run
  `reffy reindex` and `reffy validate`.

## 4. Close the milestone

- [ ] 4.1 Run `reffy plan validate prove-cross-harness-memory` after final edits.
- [ ] 4.2 Confirm all acceptance criteria have evidence before declaring completion;
  leave unmet checks open and distinguish implementation from proven behavior.
